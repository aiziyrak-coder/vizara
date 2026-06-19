import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rate-limit.js';
import { clampString } from '../lib/validate.js';
import { prisma } from '../lib/prisma.js';
import {
  isAiEnabled,
  isValidAiTask,
  chatWithAi,
  generateAiContent,
  type AiTask,
} from '../lib/openai.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.use(requireAuth);
router.use(aiRateLimit);

function aiUnavailable(res: Response) {
  res.status(503).json({ error: 'AI xizmati hozircha mavjud emas', code: 'AI_NOT_CONFIGURED' });
}

function handleAiError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (message === 'AI_NOT_CONFIGURED') {
    aiUnavailable(res);
    return;
  }
  if (message.includes('rate_limit') || message.includes('429')) {
    res.status(429).json({ error: 'AI limitiga yetildi. Biroz kuting.', code: 'AI_RATE_LIMIT' });
    return;
  }
  logger.error('AI request failed', { message });
  res.status(500).json({ error: 'AI javob berolmadi. Qayta urinib ko\'ring.', code: 'AI_ERROR' });
}

router.get('/status', (_req, res) => {
  res.json({
    enabled: isAiEnabled(),
    model: process.env.AI_MODEL || 'gpt-4o',
  });
});

router.post('/chat', async (req: AuthRequest, res: Response) => {
  if (!isAiEnabled()) {
    aiUnavailable(res);
    return;
  }

  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Xabarlar talab qilinadi' });
    return;
  }

  const sanitized = messages
    .slice(-20)
    .map((m: { role?: string; content?: string }) => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: clampString(m.content, 4000) || '',
    }))
    .filter((m) => m.content);

  if (sanitized.length === 0) {
    res.status(400).json({ error: 'Bo\'sh xabar yuborilmaydi' });
    return;
  }

  const locale = clampString(req.body?.locale, 12) || 'uz';
  const orgId = clampString(req.body?.orgId, 64);
  let orgName: string | undefined;

  if (orgId && req.userId) {
    const org = await prisma.organization.findFirst({
      where: { id: orgId, ownerId: req.userId },
      select: { name: true },
    });
    orgName = org?.name;
  }

  const pageContext = clampString(req.body?.pageContext, 500);

  try {
    const systemContext = pageContext
      ? [{ role: 'system' as const, content: `Current page context: ${pageContext}` }]
      : [];

    const reply = await chatWithAi([...systemContext, ...sanitized], {
      orgName,
      locale,
      fast: sanitized.length > 6,
    });

    res.json({ reply });
  } catch (err) {
    handleAiError(res, err);
  }
});

router.post('/generate', async (req: AuthRequest, res: Response) => {
  if (!isAiEnabled()) {
    aiUnavailable(res);
    return;
  }

  const task = clampString(req.body?.task, 32);
  if (!task || !isValidAiTask(task)) {
    res.status(400).json({ error: 'Noto\'g\'ri AI vazifasi' });
    return;
  }

  const locale = clampString(req.body?.locale, 12) || 'uz';
  const context = req.body?.context;
  if (!context || typeof context !== 'object') {
    res.status(400).json({ error: 'Kontekst talab qilinadi' });
    return;
  }

  const orgId = clampString((context as Record<string, unknown>).orgId, 64)
    || clampString(req.body?.orgId, 64);

  if (orgId && req.userId) {
    const org = await prisma.organization.findFirst({
      where: { id: orgId, ownerId: req.userId },
      select: { name: true, description: true, website: true },
    });
    if (!org) {
      res.status(403).json({ error: 'Tashkilotga kirish huquqi yo\'q' });
      return;
    }
    (context as Record<string, unknown>).organization = org;
  }

  try {
    const result = await generateAiContent(task as AiTask, context as Record<string, unknown>, locale);
    res.json({ result, task });
  } catch (err) {
    handleAiError(res, err);
  }
});

export default router;
