import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
  checkModelLimit,
  getMaxFileSizeBytes,
} from '../middleware/subscription.js';
import { MODELS_DIR, MAX_UPLOAD_BYTES } from '../lib/paths.js';
import { uploadRateLimit } from '../middleware/rate-limit.js';
import { clampString } from '../lib/validate.js';
import { isValidModelBuffer, resolveModelFilePath } from '../lib/file-validation.js';
import { logger } from '../lib/logger.js';

const router = Router();
const ALLOWED_EXT = ['.glb', '.gltf'] as const;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODELS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXT.includes(ext as typeof ALLOWED_EXT[number]) ? ext : '.glb';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext as typeof ALLOWED_EXT[number])) {
      cb(null, true);
    } else {
      cb(new Error('Faqat .glb va .gltf fayllar qabul qilinadi'));
    }
  },
});

function cleanupFile(filePath: string | undefined | null) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
}

async function getOrgForUser(orgId: string, userId: string) {
  return prisma.organization.findFirst({
    where: { id: orgId, ownerId: userId },
    include: { subscriptions: true },
  });
}

router.get('/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const models = await prisma.model3D.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(models);
  } catch (err) {
    res.status(500).json({ error: 'Modellarni olishda xatolik' });
  }
});

router.post('/:orgId', requireAuth, uploadRateLimit, (req: AuthRequest, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Fayl hajmi juda katta' });
        return;
      }
      res.status(400).json({ error: err.message || 'Fayl yuklashda xatolik' });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  let uploadedPath: string | null = req.file?.path ?? null;
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      cleanupFile(uploadedPath);
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: '3D model fayli yuklanishi shart' });
      return;
    }

    const ext = path.extname(req.file.filename).toLowerCase();
    const fileBuffer = fs.readFileSync(req.file.path);
    if (!isValidModelBuffer(fileBuffer, ext)) {
      cleanupFile(uploadedPath);
      res.status(400).json({ error: 'Fayl haqiqiy GLB/GLTF formatida emas' });
      return;
    }

    const limitCheck = await checkModelLimit(org.id);
    if (!limitCheck.ok) {
      cleanupFile(uploadedPath);
      res.status(limitCheck.message?.includes('obuna') ? 402 : 403).json({
        error: limitCheck.message,
        code: limitCheck.message?.includes('obuna') ? 'SUBSCRIPTION_REQUIRED' : 'PLAN_LIMIT',
      });
      return;
    }

    const maxBytes = await getMaxFileSizeBytes(org.id, 'vizara_ar');
    if (Number.isFinite(maxBytes) && req.file.size > maxBytes) {
      cleanupFile(uploadedPath);
      res.status(400).json({
        error: `Fayl hajmi tarif limitingizdan oshib ketdi (maks. ${Math.round(maxBytes / 1024 / 1024)} MB)`,
      });
      return;
    }

    const name = clampString(req.body.name, 120);
    if (!name) {
      cleanupFile(uploadedPath);
      res.status(400).json({ error: 'Model nomi kiritilishi shart' });
      return;
    }

    const mimeType = ext === '.glb' ? 'model/gltf-binary' : 'model/gltf+json';

    const model = await prisma.model3D.create({
      data: {
        name,
        fileUrl: `/uploads/models/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType,
        organizationId: org.id,
      },
    });

    res.status(201).json(model);
    uploadedPath = null;
  } catch (err) {
    cleanupFile(uploadedPath);
    logger.error('Upload error', { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ error: 'Model yuklashda xatolik' });
  }
});

router.delete('/:orgId/:modelId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const model = await prisma.model3D.findFirst({
      where: { id: req.params.modelId, organizationId: org.id },
    });

    if (!model) {
      res.status(404).json({ error: 'Model topilmadi' });
      return;
    }

    const usedBy = await prisma.experience.count({
      where: { organizationId: org.id, modelId: model.id },
    });
    if (usedBy > 0) {
      res.status(409).json({
        error: `Bu model ${usedBy} ta tajribada ishlatilmoqda. Avval tajribalarni o'chiring yoki boshqa model tanlang.`,
        code: 'MODEL_IN_USE',
      });
      return;
    }

    const filePath = resolveModelFilePath(model.fileUrl);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.model3D.delete({ where: { id: model.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Modelni o\'chirishda xatolik' });
  }
});

export default router;
