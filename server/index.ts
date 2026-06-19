import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import authRoutes from './routes/auth.js';
import orgRoutes from './routes/organizations.js';
import modelRoutes from './routes/models.js';
import experienceRoutes from './routes/experiences.js';
import tourRoutes from './routes/tours.js';
import billingRoutes, { stripeWebhookHandler } from './routes/billing.js';
import { validateStartupEnv } from './lib/validate.js';
import { createCorsMiddleware } from './middleware/cors-config.js';
import { connectDatabase, disconnectDatabase, pingDatabase } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { DIST_DIR, MODELS_DIR, PANORAMAS_DIR, TOUR_MEDIA_DIR, QR_DIR, UPLOADS_DIR } from './lib/paths.js';
import { globalApiRateLimit } from './middleware/rate-limit.js';
import { ensureUploadsWritable } from './lib/file-validation.js';

validateStartupEnv();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';
const useHttps = process.env.APP_URL?.startsWith('https://') ?? false;

if (isProd) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
  app.disable('x-powered-by');
}

[UPLOADS_DIR, MODELS_DIR, PANORAMAS_DIR, TOUR_MEDIA_DIR, QR_DIR].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

app.use(createCorsMiddleware());
app.use(compression());

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  if (isProd && useHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/health')) return;
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
});

app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) });
});

app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json', limit: '1mb' }),
  stripeWebhookHandler
);

app.use(express.json({ limit: '2mb' }));

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Noto\'g\'ri JSON format' });
    return;
  }
  next(err);
});

app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  const corsOrigin = process.env.CORS_ORIGIN || process.env.APP_URL || process.env.FRONTEND_URL;
  const allowed = corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
    : [];

  if (origin) {
    const normalized = origin.replace(/\/$/, '');
    if (!isProd || allowed.length === 0 || allowed.includes(normalized)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  } else if (!isProd) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  next();
});

app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: isProd ? '7d' : 0,
  dotfiles: 'deny',
  index: false,
}));

app.use('/api', globalApiRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/billing', billingRoutes);

app.get('/api/health', async (_req, res) => {
  const dbOk = await pingDatabase();
  const uploadsOk = ensureUploadsWritable();
  const healthy = dbOk && uploadsOk;

  const payload = {
    status: healthy ? 'ok' : 'degraded',
    platform: 'Vizara',
    version: process.env.npm_package_version || '1.0.0',
    db: dbOk ? 'connected' : 'disconnected',
    uploads: uploadsOk ? 'writable' : 'readonly',
    uptime: Math.floor(process.uptime()),
  };

  res.status(healthy ? 200 : 503).json(payload);
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: isProd ? '1d' : 0, index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Topilmadi' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message.startsWith('CORS:')) {
    res.status(403).json({ error: 'CORS rad etildi' });
    return;
  }
  logger.error('Unhandled error', { message: err.message, stack: isProd ? undefined : err.stack });
  res.status(500).json({ error: 'Server xatoligi' });
});

async function start() {
  await connectDatabase();

  if (!ensureUploadsWritable()) {
    logger.warn('Uploads directory is not writable');
  }

  const server = app.listen(PORT, HOST, () => {
    logger.info('Vizara server started', {
      url: `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`,
      env: process.env.NODE_ENV || 'development',
      spa: fs.existsSync(DIST_DIR),
    });
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const shutdown = async (signal: string) => {
    logger.info('Shutting down', { signal });
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Failed to start server', { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
