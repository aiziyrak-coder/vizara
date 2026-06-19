import cors from 'cors';

function parseOrigins(): string[] | null {
  const raw = process.env.CORS_ORIGIN || process.env.APP_URL || process.env.FRONTEND_URL;
  if (!raw) return null;
  return raw.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
}

export function createCorsMiddleware() {
  const allowed = parseOrigins();
  const isProd = process.env.NODE_ENV === 'production';

  if (!allowed || allowed.length === 0) {
    if (isProd) {
      return cors({
        origin: false,
        credentials: true,
      });
    }
    return cors({ origin: true, credentials: true });
  }

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, '');
      if (allowed.includes(normalized)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS: origin not allowed — ${origin}`));
    },
    credentials: true,
  });
}
