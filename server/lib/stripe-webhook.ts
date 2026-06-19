import { prisma } from './prisma.js';
import { stripe } from './stripe.js';
import { isValidPlanId } from './plans.js';
import { logger } from './logger.js';
import type { PlanId } from '../../shared/plans.js';

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
        metadata?: { organizationId?: string; planId?: string };
        subscription?: string | null;
      };
      const orgId = session.metadata?.organizationId;
      const planId = session.metadata?.planId;
      if (orgId) {
        const validPlan = planId && isValidPlanId(planId) ? (planId as PlanId) : 'starter';
        await prisma.subscription.upsert({
          where: { organizationId: orgId },
          create: {
            organizationId: orgId,
            planId: validPlan,
            status: 'active',
            stripeSubscriptionId: session.subscription ?? undefined,
          },
          update: {
            status: 'active',
            stripeSubscriptionId: session.subscription ?? undefined,
            ...(planId && isValidPlanId(planId) ? { planId: planId as PlanId } : {}),
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
