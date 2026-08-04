import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { resolveSellerScope } from '../middlewares/auth';
import { query } from '../lib/query';
import { currentPeriod, lastPeriods, monthRange, periodLabel } from '../lib/dates';
import { commissionSummary } from '../services/commissionService';
import { nextTierProgress, tierForSalesCount } from '../domain/commission';
import { forbidden } from '../lib/errors';

interface DashQuery {
  month?: number;
  year?: number;
  sellerId?: string;
}

function periodFrom(q: DashQuery) {
  const now = currentPeriod();
  return { month: q.month ?? now.month, year: q.year ?? now.year };
}

/** Serie dos ultimos 6 meses para o grafico de vendas. */
async function salesSeries(sellerId: string | undefined, months = 6) {
  const periods = lastPeriods(months);
  return Promise.all(
    periods.map(async (period) => {
      const [agg, commissions] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            ...(sellerId ? { sellerId } : {}),
            soldAt: monthRange(period),
            status: { not: 'CANCELADO' },
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        prisma.commission.aggregate({
          where: {
            ...(sellerId ? { sellerId } : {}),
            referenceMonth: period.month,
            referenceYear: period.year,
            status: { not: 'CANCELADA' },
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        label: periodLabel(period),
        month: period.month,
        year: period.year,
        revenue: agg._sum.amount ?? 0,
        count: agg._count._all,
        commission: commissions._sum.amount ?? 0,
      };
    }),
  );
}

/** Painel do vendedor (o admin tambem pode abrir informando ?sellerId=). */
export async function sellerDashboard(req: Request, res: Response) {
  const q = query<DashQuery>(req);
  const period = periodFrom(q);
  const sellerId = resolveSellerScope(req, q.sellerId) ?? req.auth!.sellerId;

  if (!sellerId) {
    throw forbidden('Selecione um vendedor para visualizar este painel.');
  }

  const range = monthRange(period);

  const [
    monthSales,
    paidSalesCount,
    leadsTotal,
    leadsMonth,
    wonLeads,
    goal,
    commissions,
    recentSales,
    series,
    seller,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { sellerId, soldAt: range, status: { not: 'CANCELADO' } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.sale.count({
      where: { sellerId, soldAt: range, status: { not: 'CANCELADO' }, paidAt: { not: null } },
    }),
    prisma.lead.count({ where: { sellerId } }),
    prisma.lead.count({ where: { sellerId, createdAt: range } }),
    prisma.lead.count({ where: { sellerId, status: 'GANHO' } }),
    prisma.goal.findUnique({
      where: { sellerId_month_year: { sellerId, month: period.month, year: period.year } },
    }),
    commissionSummary(sellerId, period),
    prisma.sale.findMany({
      where: { sellerId },
      include: {
        client: { select: { id: true, company: true } },
        service: { select: { id: true, name: true } },
        commission: { select: { amount: true, rate: true, status: true } },
      },
      orderBy: { soldAt: 'desc' },
      take: 8,
    }),
    salesSeries(sellerId),
    prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, code: true, commissionOverride: true, user: { select: { name: true } } },
    }),
  ]);

  const revenue = monthSales._sum.amount ?? 0;
  const salesCount = monthSales._count._all;

  // Conversao = leads ganhos sobre o total de leads cadastrados.
  const conversion = leadsTotal > 0 ? wonLeads / leadsTotal : 0;

  const ranking = await rankingRows(period);
  const position = ranking.findIndex((r) => r.sellerId === sellerId);

  res.json({
    period,
    seller,
    metrics: {
      revenue,
      salesCount,
      paidSalesCount,
      leadsTotal,
      leadsMonth,
      wonLeads,
      conversion,
    },
    commissions,
    tier: {
      current: tierForSalesCount(paidSalesCount),
      next: nextTierProgress(paidSalesCount),
      override: seller?.commissionOverride ?? null,
    },
    goal: goal
      ? {
          salesTarget: goal.salesTarget,
          revenueTarget: goal.revenueTarget,
          salesDone: salesCount,
          revenueDone: revenue,
          salesPercent: goal.salesTarget > 0 ? salesCount / goal.salesTarget : 0,
          revenuePercent: goal.revenueTarget > 0 ? revenue / goal.revenueTarget : 0,
        }
      : null,
    ranking: {
      position: position >= 0 ? position + 1 : null,
      total: ranking.length,
      top: ranking.slice(0, 3),
    },
    recentSales,
    series,
  });
}

/** Painel administrativo: visao consolidada da operacao. */
export async function adminDashboard(req: Request, res: Response) {
  const q = query<DashQuery>(req);
  const period = periodFrom(q);
  const range = monthRange(period);

  const [
    monthSales,
    paidSales,
    sellersCount,
    activeSellers,
    leadsTotal,
    leadsMonth,
    wonLeads,
    commissions,
    pendingApproval,
    servicesCount,
    series,
    recentSales,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { soldAt: range, status: { not: 'CANCELADO' } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.sale.aggregate({
      where: { soldAt: range, status: { not: 'CANCELADO' }, paidAt: { not: null } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.seller.count(),
    prisma.seller.count({ where: { user: { active: true } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: range } }),
    prisma.lead.count({ where: { status: 'GANHO' } }),
    commissionSummary(undefined, period),
    prisma.sale.count({ where: { approved: false, status: { not: 'CANCELADO' } } }),
    prisma.service.count({ where: { active: true } }),
    salesSeries(undefined),
    prisma.sale.findMany({
      include: {
        client: { select: { id: true, company: true } },
        service: { select: { id: true, name: true } },
        seller: { select: { id: true, code: true, user: { select: { name: true } } } },
        commission: { select: { amount: true, rate: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  const revenue = monthSales._sum.amount ?? 0;
  const received = paidSales._sum.amount ?? 0;
  const commissionCost = commissions.totalPrevisto;

  const ranking = await rankingRows(period);

  // Receita por servico alimenta o grafico de composicao do faturamento.
  const byService = await prisma.sale.groupBy({
    by: ['serviceId'],
    where: { soldAt: range, status: { not: 'CANCELADO' } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const serviceNames = await prisma.service.findMany({
    where: { id: { in: byService.map((s) => s.serviceId) } },
    select: { id: true, name: true },
  });

  res.json({
    period,
    metrics: {
      revenue,
      received,
      salesCount: monthSales._count._all,
      paidSalesCount: paidSales._count._all,
      sellersCount,
      activeSellers,
      leadsTotal,
      leadsMonth,
      wonLeads,
      conversion: leadsTotal > 0 ? wonLeads / leadsTotal : 0,
      servicesCount,
      pendingApproval,
      commissionCost,
      // Lucro estimado = faturamento do mes menos as comissoes geradas por ele.
      estimatedProfit: revenue - commissionCost,
      averageTicket: monthSales._count._all > 0 ? revenue / monthSales._count._all : 0,
    },
    commissions,
    ranking: ranking.slice(0, 10),
    byService: byService
      .map((row) => ({
        serviceId: row.serviceId,
        name: serviceNames.find((s) => s.id === row.serviceId)?.name ?? 'Servico',
        revenue: row._sum.amount ?? 0,
        count: row._count._all,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    series,
    recentSales,
  });
}

/**
 * Linhas do ranking do mes. Exportado para reuso pelo controller de ranking e
 * pelos dashboards, garantindo que os tres usem exatamente o mesmo criterio.
 */
export async function rankingRows(period: { month: number; year: number }) {
  const range = monthRange(period);

  const grouped = await prisma.sale.groupBy({
    by: ['sellerId'],
    where: { soldAt: range, status: { not: 'CANCELADO' } },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const sellers = await prisma.seller.findMany({
    include: { user: { select: { name: true, active: true, avatarColor: true } } },
  });

  const commissions = await prisma.commission.groupBy({
    by: ['sellerId'],
    where: { referenceMonth: period.month, referenceYear: period.year, status: { not: 'CANCELADA' } },
    _sum: { amount: true },
  });

  const goals = await prisma.goal.findMany({
    where: { month: period.month, year: period.year },
  });

  return sellers
    .filter((s) => s.user.active)
    .map((seller) => {
      const row = grouped.find((g) => g.sellerId === seller.id);
      const goal = goals.find((g) => g.sellerId === seller.id);
      const revenue = row?._sum.amount ?? 0;
      const salesCount = row?._count._all ?? 0;
      return {
        sellerId: seller.id,
        code: seller.code,
        name: seller.user.name,
        avatarColor: seller.user.avatarColor,
        revenue,
        salesCount,
        commission: commissions.find((c) => c.sellerId === seller.id)?._sum.amount ?? 0,
        goalSales: goal?.salesTarget ?? null,
        goalPercent: goal && goal.salesTarget > 0 ? salesCount / goal.salesTarget : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.salesCount - a.salesCount)
    .map((row, index) => ({ ...row, position: index + 1 }));
}
