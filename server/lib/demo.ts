import { isStripeConfigured } from './stripe.js';

/** Demo billing: dev/local only, or when explicitly enabled (not recommended in production). */
export function isDemoBillingAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DEMO_MODE === 'true';
  }
  if (process.env.DEMO_MODE === 'true') return true;
  return !isStripeConfigured();
}
