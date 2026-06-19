import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/auth.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
  hasActiveSubscription,
  checkTourLimit,
} from '../middleware/subscription.js';
import { getOrgPlanForProduct } from '../lib/plans.js';
import { getAppUrl } from '../lib/app-url.js';
import { PANORAMAS_DIR, TOUR_MEDIA_DIR, QR_DIR, MAX_UPLOAD_BYTES } from '../lib/paths.js';
import {
  cleanupTourMedia,
  detectMediaType,
  isAllowedTourMedia,
  normalizeHotspotType,
  resolveTourMediaPath,
  serializeHotspot,
  serializeScene,
} from '../lib/tour-helpers.js';
import { publicArRateLimit } from '../middleware/rate-limit.js';
import { clampString } from '../lib/validate.js';
import { isSafeSlug, resolveQrFilePath } from '../lib/file-validation.js';
import { uploadRateLimit } from '../middleware/rate-limit.js';

const router = Router();
const qrDir = QR_DIR;
const ALLOWED_PANO_EXT = ['.jpg', '.jpeg', '.png', '.webp'] as const;

const panoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PANORAMAS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_PANO_EXT.includes(ext as typeof ALLOWED_PANO_EXT[number]) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
  },
});

const panoUpload = multer({
  storage: panoStorage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_PANO_EXT.includes(ext as typeof ALLOWED_PANO_EXT[number])) {
      cb(null, true);
    } else {
      cb(new Error('Faqat JPG, PNG yoki WebP panorama qabul qilinadi'));
    }
  },
});

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TOUR_MEDIA_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = isAllowedTourMedia(file.originalname) ? ext : '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
  },
});

const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (isAllowedTourMedia(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Rasm, video, audio yoki GIF format qabul qilinadi'));
    }
  },
});

function cleanupFile(filePath: string | undefined | null) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
}

function resolvePanoramaPath(panoramaUrl: string): string | null {
  if (!panoramaUrl.startsWith('/uploads/panoramas/')) return null;
  const filename = path.basename(panoramaUrl);
  const resolved = path.join(PANORAMAS_DIR, filename);
  if (!resolved.startsWith(PANORAMAS_DIR)) return null;
  return resolved;
}

async function getOrgForUser(orgId: string, userId: string) {
  return prisma.organization.findFirst({
    where: { id: orgId, ownerId: userId },
  });
}

async function getTourForOrg(tourId: string, orgId: string) {
  return prisma.virtualTour.findFirst({
    where: { id: tourId, organizationId: orgId },
    include: {
      scenes: {
        orderBy: { order: 'asc' },
        include: { hotspots: true },
      },
    },
  });
}

router.get('/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const tours = await prisma.virtualTour.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { scenes: true } } },
    });

    res.json(tours);
  } catch {
    res.status(500).json({ error: 'Virtual turlarni olishda xatolik' });
  }
});

router.post('/:orgId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const active = await hasActiveSubscription(org.id, 'vizara_tour');
    if (!active) {
      res.status(402).json({ error: 'Faol obuna talab qilinadi.', code: 'SUBSCRIPTION_REQUIRED' });
      return;
    }

    const limitCheck = await checkTourLimit(org.id);
    if (!limitCheck.ok) {
      res.status(403).json({ error: limitCheck.message, code: 'PLAN_LIMIT' });
      return;
    }

    const name = clampString(req.body.name, 120);
    const description = req.body.description ? clampString(String(req.body.description), 500) : null;

    if (!name) {
      res.status(400).json({ error: 'Tur nomi kiritilishi shart' });
      return;
    }

    let slug = slugify(name);
    const slugExists = await prisma.virtualTour.findFirst({
      where: { organizationId: org.id, slug },
    });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const tour = await prisma.virtualTour.create({
      data: {
        name,
        slug,
        description,
        organizationId: org.id,
      },
    });

    try {
      const tourUrl = `${getAppUrl(req)}/tour/${org.slug}/${tour.slug}`;
      const qrFilename = `qr-tour-${tour.id}.png`;
      const qrPath = path.join(qrDir, qrFilename);
      await QRCode.toFile(qrPath, tourUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      const updated = await prisma.virtualTour.update({
        where: { id: tour.id },
        data: { qrCodeUrl: `/uploads/qr/${qrFilename}` },
      });

      res.status(201).json({ ...updated, tourUrl });
    } catch {
      await prisma.virtualTour.delete({ where: { id: tour.id } }).catch(() => {});
      res.status(500).json({ error: 'QR yaratishda xatolik' });
    }
  } catch {
    res.status(500).json({ error: 'Virtual tur yaratishda xatolik' });
  }
});

router.get('/:orgId/:tourId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const tour = await getTourForOrg(req.params.tourId, org.id);
    if (!tour) {
      res.status(404).json({ error: 'Virtual tur topilmadi' });
      return;
    }

    const tourUrl = `${getAppUrl(req)}/tour/${org.slug}/${tour.slug}`;
    res.json({ ...tour, tourUrl });
  } catch {
    res.status(500).json({ error: 'Virtual turni olishda xatolik' });
  }
});

router.patch('/:orgId/:tourId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const tour = await prisma.virtualTour.findFirst({
      where: { id: req.params.tourId, organizationId: org.id },
    });
    if (!tour) {
      res.status(404).json({ error: 'Virtual tur topilmadi' });
      return;
    }

    const data: {
      name?: string;
      description?: string | null;
      startSceneId?: string | null;
      isActive?: boolean;
      settings?: string | null;
    } = {};

    if (req.body.name !== undefined) {
      const name = clampString(String(req.body.name), 120);
      if (!name) {
        res.status(400).json({ error: 'Tur nomi bo\'sh bo\'lmasligi kerak' });
        return;
      }
      data.name = name;
    }

    if (req.body.description !== undefined) {
      data.description = req.body.description ? clampString(String(req.body.description), 500) : null;
    }

    if (req.body.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }

    if (req.body.settings !== undefined) {
      if (req.body.settings === null || req.body.settings === '') {
        data.settings = null;
      } else if (typeof req.body.settings === 'string') {
        data.settings = req.body.settings;
      } else {
        data.settings = JSON.stringify(req.body.settings);
      }
    }

    if (req.body.startSceneId !== undefined) {
      const sceneId = req.body.startSceneId as string | null;
      if (sceneId) {
        const scene = await prisma.tourScene.findFirst({
          where: { id: sceneId, tourId: tour.id },
        });
        if (!scene) {
          res.status(400).json({ error: 'Boshlang\'ich sahna topilmadi' });
          return;
        }
      }
      data.startSceneId = sceneId;
    }

    const updated = await prisma.virtualTour.update({
      where: { id: tour.id },
      data,
      include: {
        scenes: {
          orderBy: { order: 'asc' },
          include: { hotspots: true },
        },
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Virtual turni yangilashda xatolik' });
  }
});

router.post('/:orgId/:tourId/regenerate-qr', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const tour = await prisma.virtualTour.findFirst({
      where: { id: req.params.tourId, organizationId: org.id },
    });
    if (!tour) {
      res.status(404).json({ error: 'Virtual tur topilmadi' });
      return;
    }

    const tourUrl = `${getAppUrl(req)}/tour/${org.slug}/${tour.slug}`;
    const qrFilename = `qr-tour-${tour.id}.png`;
    const qrPath = path.join(qrDir, qrFilename);
    await QRCode.toFile(qrPath, tourUrl, { width: 512, margin: 2 });

    const updated = await prisma.virtualTour.update({
      where: { id: tour.id },
      data: { qrCodeUrl: `/uploads/qr/${qrFilename}` },
    });

    res.json({ ...updated, tourUrl });
  } catch {
    res.status(500).json({ error: 'QR qayta yaratishda xatolik' });
  }
});

router.delete('/:orgId/:tourId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const tour = await getTourForOrg(req.params.tourId, org.id);
    if (!tour) {
      res.status(404).json({ error: 'Virtual tur topilmadi' });
      return;
    }

    if (tour.qrCodeUrl) {
      const qrPath = resolveQrFilePath(tour.qrCodeUrl);
      if (qrPath && fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
    }

    for (const scene of tour.scenes) {
      const panoPath = resolvePanoramaPath(scene.panoramaUrl);
      if (panoPath && fs.existsSync(panoPath)) fs.unlinkSync(panoPath);
      for (const h of scene.hotspots) {
        cleanupTourMedia(h.mediaUrl);
      }
      cleanupTourMedia(scene.ambientAudioUrl);
    }

    await prisma.virtualTour.delete({ where: { id: tour.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Virtual turni o\'chirishda xatolik' });
  }
});

router.post('/:orgId/:tourId/scenes', requireAuth, uploadRateLimit, (req: AuthRequest, res, next) => {
  panoUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Fayl hajmi juda katta' });
        return;
      }
      res.status(400).json({ error: err.message || 'Panorama yuklashda xatolik' });
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

    const tour = await prisma.virtualTour.findFirst({
      where: { id: req.params.tourId, organizationId: org.id },
      include: { _count: { select: { scenes: true } } },
    });
    if (!tour) {
      cleanupFile(uploadedPath);
      res.status(404).json({ error: 'Virtual tur topilmadi' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Panorama fayli yuklanishi shart' });
      return;
    }

    const name = clampString(req.body.name, 120) || `Sahna ${tour._count.scenes + 1}`;
    const panoramaUrl = `/uploads/panoramas/${req.file.filename}`;

    const scene = await prisma.tourScene.create({
      data: {
        name,
        panoramaUrl,
        tourId: tour.id,
        order: tour._count.scenes,
      },
      include: { hotspots: true },
    });

    if (!tour.startSceneId) {
      await prisma.virtualTour.update({
        where: { id: tour.id },
        data: { startSceneId: scene.id, coverUrl: panoramaUrl },
      });
    }

    res.status(201).json(scene);
  } catch {
    cleanupFile(uploadedPath);
    res.status(500).json({ error: 'Sahna yaratishda xatolik' });
  }
});

router.patch('/:orgId/:tourId/scenes/:sceneId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const scene = await prisma.tourScene.findFirst({
      where: { id: req.params.sceneId, tour: { id: req.params.tourId, organizationId: org.id } },
    });
    if (!scene) {
      res.status(404).json({ error: 'Sahna topilmadi' });
      return;
    }

    const data: {
      name?: string;
      description?: string | null;
      pitch?: number;
      yaw?: number;
      hfov?: number;
      order?: number;
      ambientAudioUrl?: string | null;
    } = {};
    if (req.body.name !== undefined) data.name = clampString(String(req.body.name), 120) || scene.name;
    if (req.body.description !== undefined) {
      data.description = req.body.description ? clampString(String(req.body.description), 2000) : null;
    }
    if (req.body.pitch !== undefined) data.pitch = Number(req.body.pitch);
    if (req.body.yaw !== undefined) data.yaw = Number(req.body.yaw);
    if (req.body.hfov !== undefined) data.hfov = Number(req.body.hfov);
    if (req.body.order !== undefined) data.order = Number(req.body.order);
    if (req.body.ambientAudioUrl !== undefined) data.ambientAudioUrl = req.body.ambientAudioUrl || null;

    const updated = await prisma.tourScene.update({
      where: { id: scene.id },
      data,
      include: { hotspots: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Sahna yangilashda xatolik' });
  }
});

router.delete('/:orgId/:tourId/scenes/:sceneId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const tour = await prisma.virtualTour.findFirst({
      where: { id: req.params.tourId, organizationId: org.id },
    });
    if (!tour) {
      res.status(404).json({ error: 'Virtual tur topilmadi' });
      return;
    }

    const scene = await prisma.tourScene.findFirst({
      where: { id: req.params.sceneId, tourId: tour.id },
    });
    if (!scene) {
      res.status(404).json({ error: 'Sahna topilmadi' });
      return;
    }

    const panoPath = resolvePanoramaPath(scene.panoramaUrl);
    if (panoPath && fs.existsSync(panoPath)) fs.unlinkSync(panoPath);

    const hotspots = await prisma.tourHotspot.findMany({ where: { sceneId: scene.id } });
    for (const h of hotspots) cleanupTourMedia(h.mediaUrl);
    cleanupTourMedia(scene.ambientAudioUrl);

    await prisma.tourScene.delete({ where: { id: scene.id } });

    if (tour.startSceneId === scene.id) {
      const nextScene = await prisma.tourScene.findFirst({
        where: { tourId: tour.id },
        orderBy: { order: 'asc' },
      });
      await prisma.virtualTour.update({
        where: { id: tour.id },
        data: {
          startSceneId: nextScene?.id ?? null,
          coverUrl: nextScene?.panoramaUrl ?? null,
        },
      });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Sahna o\'chirishda xatolik' });
  }
});

router.post('/:orgId/:tourId/media', requireAuth, uploadRateLimit, (req: AuthRequest, res, next) => {
  mediaUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Fayl hajmi juda katta' });
        return;
      }
      res.status(400).json({ error: err.message || 'Media yuklashda xatolik' });
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

    const tour = await prisma.virtualTour.findFirst({
      where: { id: req.params.tourId, organizationId: org.id },
    });
    if (!tour) {
      cleanupFile(uploadedPath);
      res.status(404).json({ error: 'Virtual tur topilmadi' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Media fayli yuklanishi shart' });
      return;
    }

    const mediaUrl = `/uploads/tour-media/${req.file.filename}`;
    const mediaType = detectMediaType(req.file.originalname, req.file.mimetype);

    res.status(201).json({ mediaUrl, mediaType });
  } catch {
    cleanupFile(uploadedPath);
    res.status(500).json({ error: 'Media yuklashda xatolik' });
  }
});

router.post('/:orgId/:tourId/scenes/:sceneId/hotspots', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const scene = await prisma.tourScene.findFirst({
      where: { id: req.params.sceneId, tour: { id: req.params.tourId, organizationId: org.id } },
      include: { _count: { select: { hotspots: true } } },
    });
    if (!scene) {
      res.status(404).json({ error: 'Sahna topilmadi' });
      return;
    }

    const type = normalizeHotspotType(String(req.body.type || 'info'));
    const pitch = Number(req.body.pitch ?? 0);
    const yaw = Number(req.body.yaw ?? 0);
    const title = req.body.title ? clampString(String(req.body.title), 120) : null;
    const text = req.body.text ? clampString(String(req.body.text), 200) : null;
    const body = req.body.body ? clampString(String(req.body.body), 4000) : null;
    const mediaUrl = req.body.mediaUrl ? String(req.body.mediaUrl) : null;
    const mediaType = req.body.mediaType ? String(req.body.mediaType) : null;
    const linkUrl = req.body.linkUrl ? clampString(String(req.body.linkUrl), 500) : null;
    const targetSceneId = req.body.targetSceneId as string | undefined;

    if (type === 'scene' && !targetSceneId) {
      res.status(400).json({ error: 'Manzil sahna tanlanishi shart' });
      return;
    }

    if (type === 'link' && !linkUrl && !mediaUrl) {
      res.status(400).json({ error: 'Havola yoki media kerak' });
      return;
    }

    if (targetSceneId) {
      const target = await prisma.tourScene.findFirst({
        where: { id: targetSceneId, tourId: scene.tourId },
      });
      if (!target) {
        res.status(400).json({ error: 'Manzil sahna topilmadi' });
        return;
      }
    }

    if (mediaUrl && !mediaUrl.startsWith('/uploads/tour-media/')) {
      res.status(400).json({ error: 'Noto\'g\'ri media manzili' });
      return;
    }

    const hotspot = await prisma.tourHotspot.create({
      data: {
        sceneId: scene.id,
        type,
        pitch,
        yaw,
        title,
        text,
        body,
        mediaUrl,
        mediaType,
        linkUrl,
        targetSceneId: type === 'scene' ? (targetSceneId || null) : null,
        order: scene._count.hotspots,
      },
    });

    res.status(201).json(serializeHotspot(hotspot));
  } catch {
    res.status(500).json({ error: 'Hotspot yaratishda xatolik' });
  }
});

router.patch('/:orgId/:tourId/hotspots/:hotspotId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const hotspot = await prisma.tourHotspot.findFirst({
      where: {
        id: req.params.hotspotId,
        scene: { tour: { id: req.params.tourId, organizationId: org.id } },
      },
    });
    if (!hotspot) {
      res.status(404).json({ error: 'Hotspot topilmadi' });
      return;
    }

    const data: Record<string, unknown> = {};
    if (req.body.type !== undefined) data.type = normalizeHotspotType(String(req.body.type));
    if (req.body.pitch !== undefined) data.pitch = Number(req.body.pitch);
    if (req.body.yaw !== undefined) data.yaw = Number(req.body.yaw);
    if (req.body.title !== undefined) data.title = req.body.title ? clampString(String(req.body.title), 120) : null;
    if (req.body.text !== undefined) data.text = req.body.text ? clampString(String(req.body.text), 200) : null;
    if (req.body.body !== undefined) data.body = req.body.body ? clampString(String(req.body.body), 4000) : null;
    if (req.body.linkUrl !== undefined) data.linkUrl = req.body.linkUrl ? clampString(String(req.body.linkUrl), 500) : null;
    if (req.body.order !== undefined) data.order = Number(req.body.order);
    if (req.body.targetSceneId !== undefined) data.targetSceneId = req.body.targetSceneId || null;

    if (req.body.mediaUrl !== undefined) {
      const nextUrl = req.body.mediaUrl || null;
      if (nextUrl && !String(nextUrl).startsWith('/uploads/tour-media/')) {
        res.status(400).json({ error: 'Noto\'g\'ri media manzili' });
        return;
      }
      if (hotspot.mediaUrl && hotspot.mediaUrl !== nextUrl) {
        cleanupTourMedia(hotspot.mediaUrl);
      }
      data.mediaUrl = nextUrl;
    }

    if (req.body.mediaType !== undefined) {
      data.mediaType = req.body.mediaType || null;
    }

    const updated = await prisma.tourHotspot.update({
      where: { id: hotspot.id },
      data,
    });

    res.json(serializeHotspot(updated));
  } catch {
    res.status(500).json({ error: 'Hotspot yangilashda xatolik' });
  }
});

router.delete('/:orgId/:tourId/hotspots/:hotspotId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const org = await getOrgForUser(req.params.orgId, req.userId!);
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const hotspot = await prisma.tourHotspot.findFirst({
      where: {
        id: req.params.hotspotId,
        scene: { tour: { id: req.params.tourId, organizationId: org.id } },
      },
    });
    if (!hotspot) {
      res.status(404).json({ error: 'Hotspot topilmadi' });
      return;
    }

    cleanupTourMedia(hotspot.mediaUrl);
    await prisma.tourHotspot.delete({ where: { id: hotspot.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Hotspot o\'chirishda xatolik' });
  }
});

router.get('/public/:orgSlug/:tourSlug', publicArRateLimit, async (req, res) => {
  try {
    const orgSlug = String(req.params.orgSlug || '');
    const tourSlug = String(req.params.tourSlug || '');

    if (!isSafeSlug(orgSlug) || !isSafeSlug(tourSlug)) {
      res.status(400).json({ error: 'Noto\'g\'ri manzil' });
      return;
    }

    const org = await prisma.organization.findFirst({ where: { slug: orgSlug } });
    if (!org) {
      res.status(404).json({ error: 'Tashkilot topilmadi' });
      return;
    }

    const active = await hasActiveSubscription(org.id, 'vizara_tour');
    if (!active) {
      res.status(403).json({ error: 'Bu virtual tur hozircha faol emas.' });
      return;
    }

    const tour = await prisma.virtualTour.findFirst({
      where: { organizationId: org.id, slug: tourSlug, isActive: true },
      include: {
        scenes: {
          orderBy: { order: 'asc' },
          include: { hotspots: true },
        },
      },
    });

    if (!tour || tour.scenes.length === 0) {
      res.status(404).json({ error: 'Virtual tur topilmadi yoki sahna yo\'q' });
      return;
    }

    const startSceneId = tour.startSceneId && tour.scenes.some((s) => s.id === tour.startSceneId)
      ? tour.startSceneId
      : tour.scenes[0].id;

    const plan = await getOrgPlanForProduct(org.id, 'vizara_tour');

    res.json({
      tour: {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        startSceneId,
        settings: tour.settings,
      },
      organization: {
        name: org.name,
        slug: org.slug,
        brandColor: org.brandColor,
        logoUrl: org.logoUrl,
        website: org.website,
      },
      scenes: tour.scenes.map(serializeScene),
      plan: { id: plan.id, name: plan.name, whiteLabel: plan.features.whiteLabel },
    });
  } catch {
    res.status(500).json({ error: 'Virtual turni yuklashda xatolik' });
  }
});

export default router;
