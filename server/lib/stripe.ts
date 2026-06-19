import Stripe from 'stripe';
import { isAnyStripePlanConfigured, getStripePriceIdForPlan } from './plans.js';
import type { PlanId } from '../../shared/plans.js';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

export const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET) : null;

export function isStripeConfigured(): boolean {
  return Boolean(stripe && isAnyStripePlanConfigured());
}

export function getPriceIdForPlan(planId: PlanId): string {
  const priceId = getStripePriceIdForPlan(planId);
  if (!priceId) {
    throw new Error(`Stripe price ID for plan "${planId}" is not configured`);
  }
  return priceId;
}
