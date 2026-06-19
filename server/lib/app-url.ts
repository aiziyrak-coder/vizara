import type { Request } from 'express';

/** Public frontend URL for QR codes and Stripe redirects */
export function getAppUrl(req: Pick<Request, 'protocol' | 'get'>): string {
  const envUrl = process.env.APP_URL || process.env.FRONTEND_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const origin = req.get('origin');
  if (origin && !origin.includes(':3001')) return origin.replace(/\/$/, '');

  const referer = req.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      if (!url.host.includes(':3001')) return url.origin;
    } catch {
      /* ignore */
    }
  }

  const host = req.get('host');
  if (host?.includes(':3001')) return 'http://localhost:3000';
  return `${req.protocol}://${host}`;
}
