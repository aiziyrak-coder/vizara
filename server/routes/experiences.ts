import { Router } from 'express';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/auth.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
  hasActiveSubscription,
  checkExperienceLimit,
  checkExperienceType,
} from '../middleware/subscription.js';
import { getOrgPlan } from '../lib/plans.js';
import { getAppUrl } from '../lib/app-url.js';

import { QR_DIR } from '../lib/paths.js';
import { publicArRateLimit } from '../middleware/rate-limit.js';
import { clampString } from '../lib/validate.js';
import { isSafeSlug, resolveQrFilePath } from '../lib/file-validation.js';

const VALID_EXPERIENCE_TYPES = new Set(['model_ar', 'photo_zone']);
const MAX_CONFIG_BYTES = 16_384;

const router = Router();

const qrDir = QR_DIR;

async function getOrgForUser(orgId: string, userId: string) {
  return prisma.organization.findFirst({
    where: { id: orgId, ownerId: userId },
  });
}

router.get('/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const experiences = await prisma.experience.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(experiences);
  } catch (err) {
    res.status(500).json({ error: 'Tajribalarni olishda xatolik' });
  }
});

router.post('/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const active = await hasActiveSubscription(org.id);
    if (!active) {
      res.status(402).json({
        error: 'Faol obuna talab qilinadi. Tarif rejasini tanlang.',
        code: 'SUBSCRIPTION_REQUIRED',
      });
      return;
    }

    const name = clampString(req.body.name, 120);
    const type = String(req.body.type || 'model_ar');
    const { modelId, config } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Tajriba nomi kiritilishi shart' });
      return;
    }

    if (!VALID_EXPERIENCE_TYPES.has(type)) {
      res.status(400).json({ error: 'Noto\'g\'ri tajriba turi' });
      return;
    }

    if (config !== undefined && config !== null) {
      const configStr = JSON.stringify(config);
      if (configStr.length > MAX_CONFIG_BYTES) {
        res.status(400).json({ error: 'Config hajmi juda katta' });
        return;
      }
    }

    const typeCheck = await checkExperienceType(org.id, type);
    if (!typeCheck.ok) {
      res.status(403).json({ error: typeCheck.message, code: 'PLAN_FEATURE' });
      return;
    }

    const limitCheck = await checkExperienceLimit(org.id);
    if (!limitCheck.ok) {
      res.status(403).json({ error: limitCheck.message, code: 'PLAN_LIMIT' });
      return;
    }

    if (type === 'model_ar' && !modelId) {
      res.status(400).json({ error: '3D model tanlanishi shart' });
      return;
    }

    if (modelId) {
      const model = await prisma.model3D.findFirst({
        where: { id: modelId, organizationId: org.id },
      });
      if (!model) {
        res.status(400).json({ error: 'Model topilmadi' });
        return;
      }
    }

    let slug = slugify(name);
    const slugExists = await prisma.experience.findFirst({
      where: { organizationId: org.id, slug },
    });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const experience = await prisma.experience.create({
      data: {
        name,
        slug,
        type,
        modelId: modelId || null,
        organizationId: org.id,
        config: config ? JSON.stringify(config) : null,
      },
    });

    try {
      const arUrl = `${getAppUrl(req)}/ar/${org.slug}/${experience.slug}`;
      const qrFilename = `qr-${experience.id}.png`;
      const qrPath = path.join(qrDir, qrFilename);
      await QRCode.toFile(qrPath, arUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      const updated = await prisma.experience.update({
        where: { id: experience.id },
        data: { qrCodeUrl: `/uploads/qr/${qrFilename}` },
      });

      res.status(201).json({ ...updated, arUrl });
    } catch (qrErr) {
      await prisma.experience.delete({ where: { id: experience.id } }).catch(() => {});
      throw qrErr;
    }
  } catch (err) {
    console.error('Experience create error:', err);
    res.status(500).json({ error: 'Tajriba yaratishda xatolik' });
  }
});

router.post('/:orgId/:expId/regenerate-qr', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const experience = await prisma.experience.findFirst({
      where: { id: req.params.expId, organizationId: org.id },
    });

    if (!experience) {
      res.status(404).json({ error: 'Tajriba topilmadi' });
      return;
    }

    const arUrl = `${getAppUrl(req)}/ar/${org.slug}/${experience.slug}`;
    const qrFilename = `qr-${experience.id}.png`;
    const qrPath = path.join(qrDir, qrFilename);
    await QRCode.toFile(qrPath, arUrl, { width: 512, margin: 2 });

    const updated = await prisma.experience.update({
      where: { id: experience.id },
      data: { qrCodeUrl: `/uploads/qr/${qrFilename}` },
    });

    res.json({ ...updated, arUrl });
  } catch (err) {
    res.status(500).json({ error: 'QR qayta yaratishda xatolik' });
  }
});

router.delete('/:orgId/:expId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const experience = await prisma.experience.findFirst({
      where: { id: req.params.expId, organizationId: org.id },
    });

    if (!experience) {
      res.status(404).json({ error: 'Tajriba topilmadi' });
      return;
    }

    if (experience.qrCodeUrl) {
      const qrPath = resolveQrFilePath(experience.qrCodeUrl);
      if (qrPath && fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
    }

    await prisma.experience.delete({ where: { id: experience.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Tajribani o\'chirishda xatolik' });
  }
});

// Public endpoint — no auth
router.get('/public/:orgSlug/:expSlug', publicArRateLimit, async (req, res) => {
  try {
    const { orgSlug, expSlug } = req.params;
    if (!isSafeSlug(orgSlug) || !isSafeSlug(expSlug)) {
      res.status(400).json({ error: 'Noto\'g\'ri havola formati' });
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const active = await hasActiveSubscription(org.id);
    if (!active) {
      res.status(403).json({ error: 'Bu tajriba hozircha faol emas. Tashkilot obunasi tugagan.' });
      return;
    }

    const experience = await prisma.experience.findFirst({
      where: {
        organizationId: org.id,
        slug: expSlug,
        isActive: true,
      },
    });

    if (!experience) {
      res.status(404).json({ error: 'Tajriba topilmadi' });
      return;
    }

    let model = null;
    if (experience.modelId) {
      model = await prisma.model3D.findUnique({ where: { id: experience.modelId } });
    }

    const plan = await getOrgPlan(org.id);

    let config: Record<string, unknown> | null = null;
    if (experience.config) {
      try {
        config = JSON.parse(experience.config);
      } catch {
        config = null;
      }
    }

    res.json({
      experience: {
        id: experience.id,
        name: experience.name,
        type: experience.type,
        config,
      },
      organization: {
        name: org.name,
        slug: org.slug,
        brandColor: org.brandColor,
        logoUrl: org.logoUrl,
        website: org.website,
      },
      model,
      plan: {
        id: plan.id,
        name: plan.nameUz,
        whiteLabel: plan.features.whiteLabel,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Tajribani yuklashda xatolik' });
  }
});

export default router;
