import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { stripe, isStripeConfigured, getPriceIdForPlan } from '../lib/stripe.js';
import {
  AR_PLAN_LIST,
  TOUR_PLAN_LIST,
  getPlan,
  isValidPlanId,
  getPlanFeatureList,
  getPlanProduct,
  getDefaultPlanId,
  type PlanId,
  type ProductId,
} from '../lib/plans.js';
import { getAppUrl } from '../lib/app-url.js';
import { isDemoBillingAllowed } from '../lib/demo.js';
import { hasActiveSubscription } from '../middleware/subscription.js';
import { handleStripeWebhook } from '../lib/stripe-webhook.js';
import { getStripeCustomerId } from '../lib/plans.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.get('/plans', (req, res) => {
  const product = String(req.query.product || '');
  const list = product === 'vizara_tour' ? TOUR_PLAN_LIST
    : product === 'vizara_ar' ? AR_PLAN_LIST
    : [...AR_PLAN_LIST, ...TOUR_PLAN_LIST];

  res.json(
    list.map((plan) => ({
      ...plan,
      featureList: getPlanFeatureList(plan),
    }))
  );
});

router.get('/status/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { id: req.params.orgId, ownerId: req.userId },
      include: { subscriptions: true },
    });

    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const arSub = org.subscriptions.find((s) => s.product === 'vizara_ar');
    const tourSub = org.subscriptions.find((s) => s.product === 'vizara_tour');
    const arPlan = getPlan(arSub?.planId);
    const tourPlan = getPlan(tourSub?.planId);

    const modelCount = await prisma.model3D.count({ where: { organizationId: org.id } });
    const experienceCount = await prisma.experience.count({ where: { organizationId: org.id } });
    const tourCount = await prisma.virtualTour.count({ where: { organizationId: org.id } });

    const arActive = await hasActiveSubscription(org.id, 'vizara_ar');
    const tourActive = await hasActiveSubscription(org.id, 'vizara_tour');

    res.json({
      ar: {
        subscription: arSub ?? null,
        subscriptionActive: arActive,
        plan: { ...arPlan, featureList: getPlanFeatureList(arPlan) },
        usage: { models: modelCount, experiences: experienceCount },
      },
      tour: {
        subscription: tourSub ?? null,
        subscriptionActive: tourActive,
        plan: { ...tourPlan, featureList: getPlanFeatureList(tourPlan) },
        usage: { tours: tourCount },
      },
      stripeConfigured: isStripeConfigured(),
      demoMode: isDemoBillingAllowed(),
    });
  } catch (err) {
    logger.error('Billing status error', { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ error: 'Obuna holatini olishda xatolik' });
  }
});

async function upsertProductSubscription(
  orgId: string,
  product: ProductId,
  planId: PlanId,
  data: { status: string; currentPeriodEnd?: Date; stripeSubscriptionId?: string | null }
) {
  return prisma.subscription.upsert({
    where: { organizationId_product: { organizationId: orgId, product } },
    create: {
      organizationId: orgId,
      product,
      planId,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      stripeSubscriptionId: data.stripeSubscriptionId ?? undefined,
    },
    update: {
      planId,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      ...(data.stripeSubscriptionId !== undefined ? { stripeSubscriptionId: data.stripeSubscriptionId } : {}),
    },
  });
}

router.post('/checkout/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { planId: rawPlanId, product: rawProduct } = req.body as { planId?: string; product?: string };
    if (!rawPlanId || !isValidPlanId(rawPlanId)) {
      res.status(400).json({ error: 'Yaroqli tarif rejasi tanlanishi shart' });
      return;
    }
    const planId = rawPlanId as PlanId;
    const product = (rawProduct || getPlanProduct(planId)) as ProductId;
    if (getPlanProduct(planId) !== product) {
      res.status(400).json({ error: 'Tarif va mahsulot mos kelmaydi' });
      return;
    }
    const plan = getPlan(planId);

    const org = await prisma.organization.findFirst({
      where: { id: req.params.orgId, ownerId: req.userId },
      include: { subscriptions: true },
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

      const sub = await upsertProductSubscription(org.id, product, planId, {
        status: 'active',
        currentPeriodEnd: periodEnd,
      });

      res.json({
        demo: true,
        message: `${plan.nameUz} (${product === 'vizara_ar' ? 'VizaraAR' : 'VizaraTour'}) demo rejimida faollashtirildi`,
        subscription: sub,
        plan,
        product,
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

    let customerId = await getStripeCustomerId(org.id);

    if (!customerId) {
      const customer = await stripe!.customers.create({
        email: user.email,
        name: user.name,
        metadata: { organizationId: org.id, userId: user.id },
      });
      customerId = customer.id;
      await prisma.subscription.updateMany({
        where: { organizationId: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe!.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getAppUrl(req)}/dashboard/billing?success=true&org=${org.id}&plan=${planId}&product=${product}`,
      cancel_url: `${getAppUrl(req)}/dashboard/billing?canceled=true&org=${org.id}&product=${product}`,
      metadata: { organizationId: org.id, planId, product },
    });

    res.json({ url: session.url, plan, product });
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

    const { planId: rawPlanId, product: rawProduct } = req.body as { planId?: string; product?: ProductId };
    const product: ProductId = rawProduct === 'vizara_tour' ? 'vizara_tour' : 'vizara_ar';
    const defaultId = getDefaultPlanId(product);
    const planId = rawPlanId && isValidPlanId(rawPlanId) && getPlanProduct(rawPlanId) === product
      ? (rawPlanId as PlanId)
      : defaultId;
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

    const sub = await upsertProductSubscription(org.id, product, planId, {
      status: 'active',
      currentPeriodEnd: periodEnd,
    });

    res.json({ subscription: sub, plan, product });
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
