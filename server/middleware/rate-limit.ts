import type { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();

function clientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = 'rl', message = 'Juda ko\'p so\'rov. Biroz kuting.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${clientKey(req)}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.status(429).json({ error: message, code: 'RATE_LIMIT' });
      return;
    }

    next();
  };
}

export const authRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 30, keyPrefix: 'auth' });
export const uploadRateLimit = rateLimit({ windowMs: 60 * 60_000, max: 40, keyPrefix: 'upload' });
export const publicArRateLimit = rateLimit({ windowMs: 60_000, max: 120, keyPrefix: 'public-ar' });
export const globalApiRateLimit = rateLimit({ windowMs: 60_000, max: 300, keyPrefix: 'api' });
export const aiRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 40,
  keyPrefix: 'ai',
  message: 'AI so\'rovlari limiti. Biroz kuting.',
});
