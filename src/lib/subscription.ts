import type { Subscription } from './api';

/** Mirrors server `hasActiveSubscription` — status + period end. */
export function isSubscriptionActive(sub?: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== 'active' && sub.status !== 'trialing') return false;
  if (sub.currentPeriodEnd) {
    return new Date(sub.currentPeriodEnd) >= new Date();
  }
  return true;
}
