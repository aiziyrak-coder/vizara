import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/auth.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getOrgPlanForProduct } from '../lib/plans.js';
import { isValidHexColor, clampString, isValidHttpUrl } from '../lib/validate.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: { ownerId: req.userId },
      include: {
        subscriptions: true,
        _count: { select: { models: true, experiences: true } },
      },
    });
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: 'Tashkilotlarni olishda xatolik' });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { id: req.params.id, ownerId: req.userId },
      include: { subscription: true },
    });

    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    res.json(org);
  } catch (err) {
    res.status(500).json({ error: 'Tashkilotni olishda xatolik' });
  }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const name = clampString(req.body.name, 120);
    const description = req.body.description !== undefined ? clampString(req.body.description, 500) : undefined;
    const brandColor = req.body.brandColor;
    const website = req.body.website !== undefined ? clampString(req.body.website, 255) : undefined;
    const logoUrl = req.body.logoUrl !== undefined ? clampString(req.body.logoUrl, 2048) : undefined;

    const existing = await prisma.organization.findFirst({
      where: { id: req.params.id, ownerId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const arPlan = await getOrgPlanForProduct(existing.id, 'vizara_ar');
    const tourPlan = await getOrgPlanForProduct(existing.id, 'vizara_tour');
    const data: {
      name?: string;
      description?: string | null;
      website?: string | null;
      brandColor?: string;
      logoUrl?: string | null;
    } = {};

    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (website !== undefined) data.website = website;

    if (website !== undefined && website && !isValidHttpUrl(website)) {
      res.status(400).json({ error: 'Veb-sayt manzili noto\'g\'ri' });
      return;
    }

    if (logoUrl !== undefined && logoUrl && !isValidHttpUrl(logoUrl)) {
      res.status(400).json({ error: 'Logo URL noto\'g\'ri' });
      return;
    }

    if (brandColor !== undefined) {
      if (!arPlan.features.customBranding && !tourPlan.features.customBranding) {
        res.status(403).json({
          error: 'Brend rangi hozirgi tarifda mavjud emas. Business+ tarifga o\'ting.',
          code: 'PLAN_FEATURE',
        });
        return;
      }
      if (!isValidHexColor(brandColor)) {
        res.status(400).json({ error: 'Brend rangi #RRGGBB formatida bo\'lishi kerak' });
        return;
      }
      data.brandColor = brandColor;
    }

    if (logoUrl !== undefined) {
      if (!arPlan.features.customLogo && !tourPlan.features.customLogo) {
        res.status(403).json({
          error: 'Logo yuklash hozirgi tarifda mavjud emas. Pro+ tarifga o\'ting.',
          code: 'PLAN_FEATURE',
        });
        return;
      }
      data.logoUrl = logoUrl;
    }

    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data,
    });

    res.json(org);
  } catch (err) {
    res.status(500).json({ error: 'Tashkilotni yangilashda xatolik' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const name = clampString(req.body.name, 120);
    const description = clampString(req.body.description, 500);
    const brandColor = req.body.brandColor;
    const website = clampString(req.body.website, 255);

    if (!name) {
      res.status(400).json({ error: 'Tashkilot nomi kiritilishi shart' });
      return;
    }

    if (website && !isValidHttpUrl(website)) {
      res.status(400).json({ error: 'Veb-sayt manzili noto\'g\'ri' });
      return;
    }

    const color = brandColor && isValidHexColor(brandColor) ? brandColor : '#0d9488';

    let slug = slugify(name);
    const slugExists = await prisma.organization.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        brandColor: color,
        website,
        ownerId: req.userId!,
        subscriptions: {
          create: [
            { product: 'vizara_ar', planId: 'ar_starter', status: 'inactive' },
            { product: 'vizara_tour', planId: 'tour_starter', status: 'inactive' },
          ],
        },
      },
      include: { subscriptions: true },
    });

    res.status(201).json(org);
  } catch (err) {
    res.status(500).json({ error: 'Tashkilot yaratishda xatolik' });
  }
});

export default router;
