import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { resolveSellerScope } from '../middlewares/auth';
import { audit } from '../lib/audit';
import { query } from '../lib/query';
import { currentPeriod, monthRange } from '../lib/dates';
import { notify, userIdOfSeller } from '../services/notificationService';
import { formatBRL } from '../lib/format';
import { notFound } from '../lib/errors';

/**
 * Metas do periodo com o progresso ja calculado. O admin recebe todos os
 * vendedores (inclusive quem ainda nao tem meta definida, com goal = null),
 * o vendedor recebe apenas a propria.
 */
export async function listGoals(req: Request, res: Response) {
  const q = query<{ month?: number; year?: number; sellerId?: string }>(req);
  const now = currentPeriod();
  const period = { month: q.month ?? now.month, year: q.year ?? now.year };
  const scope = resolveSellerScope(req, q.sellerId);

  const sellers = await prisma.seller.findMany({
    where: { ...(scope ? { id: scope } : {}), user: { active: true } },
    include: { user: { select: { name: true, avatarUrl: true, avatarColor: true } } },
    orderBy: { code: 'asc' },
  });

  const [goals, sales] = await Promise.all([
    prisma.goal.findMany({ where: { month: period.month, year: period.year } }),
    prisma.sale.groupBy({
      by: ['sellerId'],
      where: { soldAt: monthRange(period), status: { not: 'CANCELADO' } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const items = sellers.map((seller) => {
    const goal = goals.find((g) => g.sellerId === seller.id) ?? null;
    const row = sales.find((s) => s.sellerId === seller.id);
    const salesDone = row?._count._all ?? 0;
    const revenueDone = row?._sum.amount ?? 0;

    return {
      sellerId: seller.id,
      code: seller.code,
      name: seller.user.name,
      avatarUrl: seller.user.avatarUrl,
      avatarColor: seller.user.avatarColor,
      goalId: goal?.id ?? null,
      salesTarget: goal?.salesTarget ?? null,
      revenueTarget: goal?.revenueTarget ?? null,
      salesDone,
      revenueDone,
      salesPercent: goal && goal.salesTarget > 0 ? salesDone / goal.salesTarget : null,
      revenuePercent: goal && goal.revenueTarget > 0 ? revenueDone / goal.revenueTarget : null,
    };
  });

  res.json({ period, items });
}

/** Cria ou atualiza a meta de um vendedor no mes (admin). */
export async function upsertGoal(req: Request, res: Response) {
  const { sellerId, month, year, salesTarget, revenueTarget } = req.body;

  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (!seller) throw notFound('Vendedor nao encontrado.');

  const goal = await prisma.goal.upsert({
    where: { sellerId_month_year: { sellerId, month, year } },
    create: { sellerId, month, year, salesTarget, revenueTarget },
    update: { salesTarget, revenueTarget },
  });

  const userId = await userIdOfSeller(sellerId);
  if (userId) {
    await notify({
      userId,
      type: 'GOAL',
      title: `Meta de ${String(month).padStart(2, '0')}/${year} definida`,
      message: `${salesTarget} vendas e ${formatBRL(revenueTarget)} em faturamento.`,
      link: '/metas',
    });
  }

  await audit(req, {
    action: 'UPDATE',
    entity: 'goal',
    entityId: goal.id,
    detail: `${seller.code} ${month}/${year}: ${salesTarget} vendas / ${formatBRL(revenueTarget)}`,
  });

  res.json(goal);
}

export async function deleteGoal(req: Request, res: Response) {
  const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
  if (!goal) throw notFound('Meta nao encontrada.');

  await prisma.goal.delete({ where: { id: goal.id } });
  await audit(req, { action: 'DELETE', entity: 'goal', entityId: goal.id });
  res.json({ ok: true });
}
