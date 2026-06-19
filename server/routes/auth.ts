import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken, slugify } from '../lib/auth.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { normalizeEmail, isValidEmail, clampString } from '../lib/validate.js';
import { authRateLimit } from '../middleware/rate-limit.js';

const router = Router();

router.post('/register', authRateLimit, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || '');
    const password = String(req.body.password || '');
    const name = clampString(req.body.name, 120);
    const organizationName = clampString(req.body.organizationName, 120);

    if (!email || !password || !name || !organizationName) {
      res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Email formati noto\'g\'ri' });
      return;
    }

    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
      return;
    }

    const hashed = await hashPassword(password);
    let slug = slugify(organizationName);
    const slugExists = await prisma.organization.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        organizations: {
          create: {
            name: organizationName,
            slug,
            subscription: { create: { status: 'inactive' } },
          },
        },
      },
      include: { organizations: true },
    });

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      organization: user.organizations[0],
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ro\'yxatdan o\'tishda xatolik' });
  }
});

router.post('/login', authRateLimit, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || '');
    const { password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email va parol kiritilishi shart' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organizations: { include: { subscription: true } } },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
      return;
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      organizations: user.organizations,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Kirishda xatolik' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        organizations: {
          include: {
            subscription: true,
            _count: { select: { models: true, experiences: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      return;
    }

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      organizations: user.organizations,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Ma\'lumotlarni olishda xatolik' });
  }
});

export default router;
