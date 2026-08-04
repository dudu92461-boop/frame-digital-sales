import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';

export async function listNotifications(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  res.json({ items, unread });
}

export async function markRead(req: Request, res: Response) {
  // O where inclui userId para impedir marcar notificacao de outro usuario.
  const result = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.auth!.userId },
    data: { read: true },
  });

  if (result.count === 0) throw notFound('Notificacao nao encontrada.');
  res.json({ ok: true });
}

export async function markAllRead(req: Request, res: Response) {
  const result = await prisma.notification.updateMany({
    where: { userId: req.auth!.userId, read: false },
    data: { read: true },
  });
  res.json({ ok: true, updated: result.count });
}

export async function deleteNotification(req: Request, res: Response) {
  const result = await prisma.notification.deleteMany({
    where: { id: req.params.id, userId: req.auth!.userId },
  });
  if (result.count === 0) throw notFound('Notificacao nao encontrada.');
  res.json({ ok: true });
}
