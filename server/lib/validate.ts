const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEAK_JWT_SECRETS = new Set([
  '',
  'vizara-change-this-secret-in-production',
  'vizara-dev-secret-change-in-production',
]);

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function clampString(value: unknown, maxLen: number): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.slice(0, maxLen);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isStripeProductionReady(): boolean {
  const hasSecret = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasPrices = [
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_BUSINESS',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_ENTERPRISE',
  ].some((k) => Boolean(process.env[k]));
  const hasWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  return hasSecret && hasPrices && hasWebhook;
}

export function validateStartupEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const jwt = process.env.JWT_SECRET || '';

  if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL is required.');
    process.exit(1);
  }

  if (isProd) {
    if (!jwt || WEAK_JWT_SECRETS.has(jwt) || jwt.includes('change-this') || jwt.length < 32) {
      console.error('FATAL: JWT_SECRET must be a strong random string (min 32 chars) in production.');
      process.exit(1);
    }

    if (!process.env.APP_URL) {
      console.error('FATAL: APP_URL must be set in production (QR codes, Stripe redirects).');
      process.exit(1);
    }

    if (process.env.DEMO_MODE === 'true' && process.env.ALLOW_DEMO_IN_PRODUCTION !== 'true') {
      console.error('FATAL: DEMO_MODE=true is blocked in production. Set ALLOW_DEMO_IN_PRODUCTION=true to override (not recommended).');
      process.exit(1);
    }

    const demoAllowed = process.env.DEMO_MODE === 'true' && process.env.ALLOW_DEMO_IN_PRODUCTION === 'true';
    if (!demoAllowed && !isStripeProductionReady()) {
      console.error('FATAL: Production requires Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*) or explicit demo override.');
      process.exit(1);
    }
  } else if (!jwt) {
    console.warn('WARN: JWT_SECRET not set — using insecure default for development only.');
    process.env.JWT_SECRET = 'vizara-dev-secret-change-in-production';
  }
}
