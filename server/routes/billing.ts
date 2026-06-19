import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { stripe, isStripeConfigured, getPriceIdForPlan } from '../lib/stripe.js';
import { PLAN_LIST, getPlan, isValidPlanId, getPlanFeatureList } from '../lib/plans.js';
import type { PlanId } from '../../shared/plans.js';
import { getAppUrl } from '../lib/app-url.js';
import { isDemoBillingAllowed } from '../lib/demo.js';
import { hasActiveSubscription } from '../middleware/subscription.js';
import { handleStripeWebhook } from '../lib/stripe-webhook.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.get('/plans', (_req, res) => {
  res.json(
    PLAN_LIST.map((plan) => ({
      ...plan,
      featureList: getPlanFeatureList(plan),
    }))
  );
});

router.get('/status/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { id: req.params.orgId, ownerId: req.userId },
      include: { subscription: true },
    });

    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const plan = getPlan(org.subscription?.planId);
    const modelCount = await prisma.model3D.count({ where: { organizationId: org.id } });
    const experienceCount = await prisma.experience.count({ where: { organizationId: org.id } });
    const tourCount = await prisma.virtualTour.count({ where: { organizationId: org.id } });
    const subscriptionActive = await hasActiveSubscription(org.id);

    res.json({
      subscription: org.subscription,
      subscriptionActive,
      plan: {
        ...plan,
        featureList: getPlanFeatureList(plan),
      },
      usage: { models: modelCount, experiences: experienceCount, tours: tourCount },
      stripeConfigured: isStripeConfigured(),
      demoMode: isDemoBillingAllowed(),
    });
  } catch (err) {
    logger.error('Billing status error', { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ error: 'Obuna holatini olishda xatolik' });
  }
});

router.post('/checkout/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { planId: rawPlanId } = req.body as { planId?: string };
    if (!rawPlanId || !isValidPlanId(rawPlanId)) {
      res.status(400).json({ error: 'Yaroqli tarif rejasi tanlanishi shart' });
      return;
    }
    const planId = rawPlanId as PlanId;
    const plan = getPlan(planId);

    const org = await prisma.organization.findFirst({
      where: { id: req.params.orgId, ownerId: req.userId },
      include: { subscription: true },
    });

    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    if (!isStripeConfigured()) {
      if (!isDemoBillingAllowed()) {
        res.status(503).json({ error: 'To\'lov tizimi sozlanmagan. Administrator bilan bog\'laning.' });
        return;
      }

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const sub = await prisma.subscription.upsert({
        where: { organizationId: org.id },
        create: {
          organizationId: org.id,
          planId,
          status: 'active',
          currentPeriodEnd: periodEnd,
        },
        update: {
          planId,
          status: 'active',
          currentPeriodEnd: periodEnd,
        },
      });

      res.json({
        demo: true,
        message: `${plan.nameUz} tarifi demo rejimida faollashtirildi`,
        subscription: sub,
        plan,
      });
      return;
    }

    let priceId: string;
    try {
      priceId = getPriceIdForPlan(planId);
    } catch {
      res.status(503).json({ error: `Stripe price ID sozlanmagan: ${planId}` });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      return;
    }

    let customerId = org.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe!.customers.create({
        email: user.email,
        name: user.name,
        metadata: { organizationId: org.id, userId: user.id },
      });
      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { organizationId: org.id },
        create: { organizationId: org.id, stripeCustomerId: customerId, planId },
        update: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe!.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getAppUrl(req)}/dashboard/billing?success=true&org=${org.id}&plan=${planId}`,
      cancel_url: `${getAppUrl(req)}/dashboard/billing?canceled=true&org=${org.id}`,
      metadata: { organizationId: org.id, planId },
    });

    res.json({ url: session.url, plan });
  } catch (err) {
    logger.error('Checkout error', { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ error: 'To\'lov sahifasini yaratishda xatolik' });
  }
});

router.post('/activate-demo/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!isDemoBillingAllowed()) {
      res.status(403).json({ error: 'Demo faollashtirish mavjud emas' });
      return;
    }

    const { planId: rawPlanId } = req.body as { planId?: string };
    const planId = rawPlanId && isValidPlanId(rawPlanId) ? rawPlanId : 'starter';
    const plan = getPlan(planId);

    const org = await prisma.organization.findFirst({
      where: { id: req.params.orgId, ownerId: req.userId },
    });

    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const sub = await prisma.subscription.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        planId,
        status: 'active',
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId,
        status: 'active',
        currentPeriodEnd: periodEnd,
      },
    });

    res.json({ subscription: sub, plan });
  } catch (err) {
    res.status(500).json({ error: 'Demo obunani faollashtirishda xatolik' });
  }
});

export async function stripeWebhookHandler(req: import('express').Request, res: import('express').Response) {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) {
    res.status(400).json({ error: 'Stripe-Signature header yo\'q' });
    return;
  }

  const result = await handleStripeWebhook(req.body as Buffer, sig);
  if (result.ok === false) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json({ received: true });
}

export default router;
