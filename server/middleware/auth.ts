import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Autentifikatsiya talab qilinadi' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
    return;
  }

  req.userId = payload.userId;
  next();
}

export async function requireOrgAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  orgId: string
) {
  if (!req.userId) {
    res.status(401).json({ error: 'Autentifikatsiya talab qilinadi' });
    return;
  }

  const org = await prisma.organization.findFirst({
    where: { id: orgId, ownerId: req.userId },
  });

  if (!org) {
    res.status(403).json({ error: 'Tashkilotga kirish huquqi yo\'q' });
    return;
  }

  next();
}
