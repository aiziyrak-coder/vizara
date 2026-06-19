export {
  ALL_PLANS,
  AR_PLANS,
  TOUR_PLANS,
  AR_PLAN_LIST,
  TOUR_PLAN_LIST,
  PLAN_LIST,
  PLANS,
  PRODUCTS,
  getPlan,
  getArPlan,
  getTourPlan,
  getPlansForProduct,
  getPlanProduct,
  getDefaultPlanId,
  isValidPlanId,
  isArPlanId,
  isTourPlanId,
  normalizePlanId,
  formatLimit,
  getPlanFeatureList,
  getArPlanFeatureList,
  getTourPlanFeatureList,
  type Plan,
  type PlanId,
  type ArPlanId,
  type TourPlanId,
  type ProductId,
  type ArPlan,
  type TourPlan,
  type ArPlanFeatures,
  type TourPlanFeatures,
} from '../../shared/plans.js';

import {
  getArPlan,
  getTourPlan,
  getPlan,
  type ProductId,
  type PlanId,
} from '../../shared/plans.js';
import { prisma } from './prisma.js';

export async function getOrgSubscription(organizationId: string, product: ProductId) {
  return prisma.subscription.findUnique({
    where: { organizationId_product: { organizationId, product } },
  });
}

export async function getOrgPlanForProduct(organizationId: string, product: ProductId) {
  const sub = await getOrgSubscription(organizationId, product);
  return product === 'vizara_ar'
    ? getArPlan(sub?.planId)
    : getTourPlan(sub?.planId);
}

/** @deprecated use getOrgPlanForProduct */
export async function getOrgPlan(organizationId: string) {
  return getOrgPlanForProduct(organizationId, 'vizara_ar');
}

export function getStripePriceIdForPlan(planId: PlanId): string | null {
  const plan = getPlan(planId);
  const keys = [
    plan.stripePriceEnvKey,
    // Legacy env fallbacks
    planId.replace('ar_', 'STRIPE_PRICE_').toUpperCase(),
    planId.replace('tour_', 'STRIPE_PRICE_TOUR_').replace('TOUR_TOUR', 'TOUR_'),
  ];
  const legacyMap: Record<string, string> = {
    ar_starter: 'STRIPE_PRICE_STARTER',
    ar_business: 'STRIPE_PRICE_BUSINESS',
    ar_pro: 'STRIPE_PRICE_PRO',
    ar_enterprise: 'STRIPE_PRICE_ENTERPRISE',
  };
  if (planId in legacyMap) keys.push(legacyMap[planId as keyof typeof legacyMap]);

  for (const key of keys) {
    const priceId = process.env[key];
    if (priceId) return priceId;
  }
  return null;
}

export function isAnyStripePlanConfigured(): boolean {
  const keys = [
    'STRIPE_PRICE_AR_STARTER', 'STRIPE_PRICE_AR_BUSINESS', 'STRIPE_PRICE_AR_PRO', 'STRIPE_PRICE_AR_ENTERPRISE',
    'STRIPE_PRICE_TOUR_STARTER', 'STRIPE_PRICE_TOUR_BUSINESS', 'STRIPE_PRICE_TOUR_PRO', 'STRIPE_PRICE_TOUR_ENTERPRISE',
    'STRIPE_PRICE_STARTER', 'STRIPE_PRICE_BUSINESS', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE',
  ];
  return keys.some((key) => Boolean(process.env[key]));
}

export async function getStripeCustomerId(organizationId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({
    where: { organizationId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });
  return sub?.stripeCustomerId ?? null;
}
