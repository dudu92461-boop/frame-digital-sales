import { prisma, type Db } from '../lib/prisma';
import type { NotificationType } from '../domain/enums';

interface NotifyInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  /**
   * Quando informado, a notificacao so e criada se ainda nao existir outra com
   * o mesmo titulo para o mesmo usuario dentro da janela (em dias). Evita
   * repetir avisos de meta e de ranking a cada venda registrada.
   */
  dedupeWindowDays?: number;
}

export async function notify(input: NotifyInput, db: Db = prisma): Promise<void> {
  try {
    if (input.dedupeWindowDays) {
      const since = new Date(Date.now() - input.dedupeWindowDays * 24 * 60 * 60 * 1000);
      const existing = await db.notification.findFirst({
        where: { userId: input.userId, title: input.title, createdAt: { gte: since } },
        select: { id: true },
      });
      if (existing) return;
    }

    await db.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? 'INFO',
        link: input.link ?? null,
      },
    });
  } catch (error) {
    console.error('[notificacao] falha ao criar:', error);
  }
}

/** Resolve o userId a partir do sellerId. */
export async function userIdOfSeller(sellerId: string, db: Db = prisma): Promise<string | null> {
  const seller = await db.seller.findUnique({
    where: { id: sellerId },
    select: { userId: true },
  });
  return seller?.userId ?? null;
}
