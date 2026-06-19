import { prisma } from './prisma.js';
import { stripe } from './stripe.js';
import { isValidPlanId, getPlanProduct, getDefaultPlanId } from './plans.js';
import { logger } from './logger.js';
import type { PlanId, ProductId } from '../../shared/plans.js';

const ACTIVE_STRIPE_STATUSES = new Set(['active', 'trialing']);

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002';
}

export async function handleStripeWebhook(
  body: Buffer,
  signature: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return { ok: false, status: 400, error: 'Stripe webhook sozlanmagan' };
  }

  let event: import('stripe').Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, status: 400, error: 'Webhook imzosi noto\'g\'ri' };
  }

  try {
    await prisma.stripeWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: true };
    throw err;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as {
        metadata?: { organizationId?: string; planId?: string; product?: string };
        subscription?: string | null;
      };
      const orgId = session.metadata?.organizationId;
      const planId = session.metadata?.planId;
      const product = (session.metadata?.product || 'vizara_ar') as ProductId;
      if (orgId) {
        const validPlan = planId && isValidPlanId(planId) ? (planId as PlanId) : getDefaultPlanId(product);
        const resolvedProduct = getPlanProduct(validPlan);
        await prisma.subscription.upsert({
          where: { organizationId_product: { organizationId: orgId, product: resolvedProduct } },
          create: {
            organizationId: orgId,
            product: resolvedProduct,
            planId: validPlan,
            status: 'active',
            stripeSubscriptionId: session.subscription ?? undefined,
          },
          update: {
            status: 'active',
            stripeSubscriptionId: session.subscription ?? undefined,
            planId: validPlan,
          },
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as {
        id: string;
        status: string;
        current_period_end?: number;
      };
      const isActive = ACTIVE_STRIPE_STATUSES.has(sub.status);
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: isActive ? 'active' : 'inactive',
          ...(sub.current_period_end
            ? { currentPeriodEnd: new Date(sub.current_period_end * 1000) }
            : {}),
        },
      });
      break;
    }
    default:
      logger.debug('Unhandled Stripe event', { type: event.type });
  }

  return { ok: true };
}
