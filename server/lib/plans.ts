export {
  PLANS,
  PLAN_LIST,
  getPlan,
  isValidPlanId,
  formatLimit,
  getPlanFeatureList,
  type Plan,
  type PlanId,
  type PlanFeatures,
} from '../../shared/plans.js';

import { getPlan, type PlanId } from '../../shared/plans.js';
import { prisma } from './prisma.js';

export async function getOrgPlan(organizationId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { organizationId },
  });
  return getPlan(sub?.planId);
}

export function getStripePriceIdForPlan(planId: PlanId): string | null {
  const plan = getPlan(planId);
  const priceId = process.env[plan.stripePriceEnvKey];
  return priceId || null;
}

export function isAnyStripePlanConfigured(): boolean {
  return [
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_BUSINESS',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_ENTERPRISE',
  ].some((key) => Boolean(process.env[key]));
}
