import type { Subscription, Organization } from './api';
import type { ProductId } from './plans';

/** Mirrors server subscription active check — status + period end. */
export function isSubscriptionActive(sub?: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== 'active' && sub.status !== 'trialing') return false;
  if (sub.currentPeriodEnd) {
    return new Date(sub.currentPeriodEnd) >= new Date();
  }
  return true;
}

export function getProductSubscription(
  org: Organization | null | undefined,
  product: ProductId
): Subscription | undefined {
  return org?.subscriptions?.find((s) => s.product === product);
}

export function isProductActive(org: Organization | null | undefined, product: ProductId): boolean {
  return isSubscriptionActive(getProductSubscription(org, product));
}

export function hasAnyActiveProduct(org: Organization | null | undefined): boolean {
  return isProductActive(org, 'vizara_ar') || isProductActive(org, 'vizara_tour');
}
