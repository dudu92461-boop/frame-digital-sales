import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { query, paginate, pageMeta } from '../lib/query';
import { currentPeriod, lastPeriods, monthRange, periodLabel } from '../lib/dates';
import type { ListQuery } from '../schemas';

/** Relatorio consolidado do admin: faturamento, comissoes e desempenho. */
export async function operationReport(req: Request, res: Response) {
  const q = query<{ month?: number; year?: number }>(req);
  const now = currentPeriod();
  const period = { month: q.month ?? now.month, year: q.year ?? now.year };

  const periods = lastPeriods(12, period);

  const monthly = await Promise.all(
    periods.map(async (p) => {
      const [sales, received, commissions] = await Promise.all([
        prisma.sale.aggregate({
          where: { soldAt: monthRange(p), status: { not: 'CANCELADO' } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        prisma.sale.aggregate({
          where: { soldAt: monthRange(p), status: { not: 'CANCELADO' }, paidAt: { not: null } },
          _sum: { amount: true },
        }),
        prisma.commission.aggregate({
          where: { referenceMonth: p.month, referenceYear: p.year, status: { not: 'CANCELADA' } },
          _sum: { amount: true },
        }),
      ]);

      const revenue = sales._sum.amount ?? 0;
      const commission = commissions._sum.amount ?? 0;

      return {
        label: periodLabel(p),
        month: p.month,
        year: p.year,
        revenue,
        received: received._sum.amount ?? 0,
        salesCount: sales._count._all,
        commission,
        profit: revenue - commission,
      };
    }),
  );

  // Desempenho por vendedor no periodo selecionado.
  const sellers = await prisma.seller.findMany({
    include: { user: { select: { name: true, active: true } } },
  });

  const [salesBySeller, commissionsBySeller, leadsBySeller] = await Promise.all([
    prisma.sale.groupBy({
      by: ['sellerId'],
      where: { soldAt: monthRange(period), status: { not: 'CANCELADO' } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.commission.groupBy({
      by: ['sellerId'],
      where: {
        referenceMonth: period.month,
        referenceYear: period.year,
        status: { not: 'CANCELADA' },
      },
      _sum: { amount: true },
    }),
    prisma.lead.groupBy({
      by: ['sellerId'],
      where: { createdAt: monthRange(period) },
      _count: { _all: true },
    }),
  ]);

  const bySeller = sellers.map((seller) => {
    const sales = salesBySeller.find((s) => s.sellerId === seller.id);
    const salesCount = sales?._count._all ?? 0;
    const leads = leadsBySeller.find((l) => l.sellerId === seller.id)?._count._all ?? 0;
    const revenue = sales?._sum.amount ?? 0;

    return {
      sellerId: seller.id,
      code: seller.code,
      name: seller.user.name,
      active: seller.user.active,
      revenue,
      salesCount,
      leads,
      commission: commissionsBySeller.find((c) => c.sellerId === seller.id)?._sum.amount ?? 0,
      averageTicket: salesCount > 0 ? revenue / salesCount : 0,
      conversion: leads > 0 ? salesCount / leads : 0,
    };
  });

  // Funil de leads: quantos estao em cada etapa.
  const funnel = await prisma.lead.groupBy({
    by: ['status'],
    where: { createdAt: { lt: monthRange(period).lt } },
    _count: { _all: true },
  });

  res.json({
    period,
    monthly,
    bySeller: bySeller.sort((a, b) => b.revenue - a.revenue),
    funnel: funnel.map((f) => ({ status: f.status, count: f._count._all })),
  });
}

/** Trilha de auditoria das acoes administrativas. */
export async function listAuditLogs(req: Request, res: Response) {
  const q = query<ListQuery>(req);

  const where = {
    ...(q.status && q.status !== 'all' ? { action: q.status } : {}),
    ...(q.search
      ? {
          OR: [
            { actorName: { contains: q.search } },
            { entity: { contains: q.search } },
            { detail: { contains: q.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate(q) }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ items, meta: pageMeta(total, q) });
}
