import { prisma, type Db } from '../lib/prisma';
import { commissionAmount, rateForSeller } from '../domain/commission';
import { monthRange, periodOf, type Period } from '../lib/dates';
import type { CommissionStatus } from '../domain/enums';
import { notify, userIdOfSeller } from './notificationService';
import { formatBRL } from '../lib/format';

/**
 * Recalcula TODAS as comissoes de um vendedor em um mes.
 *
 * O percentual e fixo (25%, ou o individual do vendedor), entao em tese so a
 * venda alterada mudaria. Ainda assim o recalculo e do mes inteiro: e barato,
 * e garante que uma alteracao no percentual individual do vendedor se propague
 * para todas as vendas em aberto do periodo sem precisar de rotina separada.
 *
 * Comissoes com status PAGA sao congeladas: o dinheiro ja saiu, entao valor e
 * percentual nao mudam mais.
 */
export async function recalcSellerMonth(
  sellerId: string,
  period: Period,
  db: Db = prisma,
): Promise<void> {
  const seller = await db.seller.findUnique({
    where: { id: sellerId },
    select: { id: true, commissionOverride: true },
  });
  if (!seller) return;

  const sales = await db.sale.findMany({
    where: { sellerId, soldAt: monthRange(period) },
    include: { commission: true },
    orderBy: { soldAt: 'asc' },
  });

  const rate = rateForSeller(seller.commissionOverride);

  for (const sale of sales) {
    const existing = sale.commission;

    // Comissao ja repassada ao vendedor nao e mais alterada.
    if (existing?.status === 'PAGA') continue;

    if (sale.status === 'CANCELADO') {
      if (existing) {
        await db.commission.update({
          where: { id: existing.id },
          data: { status: 'CANCELADA', amount: 0 },
        });
      }
      continue;
    }

    const isPaid = sale.paidAt !== null;
    let status: CommissionStatus;
    if (!isPaid) {
      status = 'PREVISTA';
    } else if (existing?.status === 'LIBERADA') {
      status = 'LIBERADA'; // ja aprovada pelo admin, mantem
    } else {
      status = 'PENDENTE'; // aguardando aprovacao do admin
    }

    const amount = commissionAmount(sale.amount, rate);

    if (existing) {
      await db.commission.update({
        where: { id: existing.id },
        data: {
          rate,
          amount,
          status,
          sellerId,
          referenceMonth: period.month,
          referenceYear: period.year,
        },
      });
    } else {
      await db.commission.create({
        data: {
          saleId: sale.id,
          sellerId,
          rate,
          amount,
          status,
          referenceMonth: period.month,
          referenceYear: period.year,
        },
      });
    }
  }
}

/**
 * Recalcula o mes afetado por uma venda. Quando a data da venda muda de mes,
 * os dois meses precisam ser recalculados.
 */
export async function recalcForSale(
  sellerId: string,
  soldAt: Date,
  previousSoldAt?: Date | null,
  db: Db = prisma,
): Promise<void> {
  const period = periodOf(soldAt);
  await recalcSellerMonth(sellerId, period, db);

  if (previousSoldAt) {
    const prev = periodOf(previousSoldAt);
    if (prev.month !== period.month || prev.year !== period.year) {
      await recalcSellerMonth(sellerId, prev, db);
    }
  }
}

/** Totais de comissao de um vendedor em um periodo, agrupados por status. */
export async function commissionSummary(
  sellerId: string | undefined,
  period: Period,
  db: Db = prisma,
) {
  const rows = await db.commission.groupBy({
    by: ['status'],
    where: {
      ...(sellerId ? { sellerId } : {}),
      referenceMonth: period.month,
      referenceYear: period.year,
    },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const bucket = (status: CommissionStatus) => {
    const row = rows.find((r) => r.status === status);
    return { total: row?._sum.amount ?? 0, count: row?._count._all ?? 0 };
  };

  const prevista = bucket('PREVISTA');
  const pendente = bucket('PENDENTE');
  const liberada = bucket('LIBERADA');
  const paga = bucket('PAGA');

  return {
    prevista,
    pendente,
    liberada,
    paga,
    // "Prevista" no dashboard = tudo que o vendedor ainda pode receber do mes.
    totalPrevisto: prevista.total + pendente.total + liberada.total + paga.total,
    aReceber: pendente.total + liberada.total,
  };
}

/** Avisa o vendedor quando cruza marcos da meta do mes (50%, 70%, 100%). */
export async function checkGoalMilestones(
  sellerId: string,
  period: Period,
  db: Db = prisma,
): Promise<void> {
  const goal = await db.goal.findUnique({
    where: { sellerId_month_year: { sellerId, month: period.month, year: period.year } },
  });
  if (!goal || goal.salesTarget <= 0) return;

  const salesCount = await db.sale.count({
    where: { sellerId, soldAt: monthRange(period), status: { not: 'CANCELADO' } },
  });

  const percent = Math.floor((salesCount / goal.salesTarget) * 100);
  const milestone = [100, 70, 50].find((m) => percent >= m);
  if (!milestone) return;

  const userId = await userIdOfSeller(sellerId, db);
  if (!userId) return;

  await notify(
    {
      userId,
      type: 'GOAL',
      title:
        milestone === 100
          ? `Meta de ${period.month}/${period.year} atingida`
          : `Voce atingiu ${milestone}% da sua meta`,
      message:
        milestone === 100
          ? `Parabens! Voce bateu a meta do mes com ${salesCount} de ${goal.salesTarget} vendas.`
          : `Voce esta com ${salesCount} de ${goal.salesTarget} vendas no mes.`,
      link: '/metas',
      dedupeWindowDays: 31,
    },
    db,
  );
}

/** Avisa o vendedor quando ele assume uma das tres primeiras posicoes do mes. */
export async function checkRankingPosition(
  sellerId: string,
  period: Period,
  db: Db = prisma,
): Promise<void> {
  const grouped = await db.sale.groupBy({
    by: ['sellerId'],
    where: { soldAt: monthRange(period), status: { not: 'CANCELADO' } },
    _sum: { amount: true },
  });

  const ordered = grouped
    .map((g) => ({ sellerId: g.sellerId, revenue: g._sum.amount ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const index = ordered.findIndex((r) => r.sellerId === sellerId);
  if (index < 0 || index > 2) return;

  const position = index + 1;
  const userId = await userIdOfSeller(sellerId, db);
  if (!userId) return;

  const medals = ['1o', '2o', '3o'];
  await notify(
    {
      userId,
      type: 'RANKING',
      title: `Voce esta em ${medals[index]} lugar no ranking`,
      message: `Com ${formatBRL(ordered[index].revenue)} vendidos em ${period.month}/${period.year}.`,
      link: '/ranking',
      dedupeWindowDays: 7,
    },
    db,
  );
}

/**
 * Efeitos colaterais disparados apos qualquer mudanca em vendas.
 * Isolado em uma funcao para que os controllers nao esquecam nenhuma etapa.
 */
export async function afterSaleChanged(
  sellerId: string,
  soldAt: Date,
  previousSoldAt?: Date | null,
  db: Db = prisma,
): Promise<void> {
  await recalcForSale(sellerId, soldAt, previousSoldAt, db);
  const period = periodOf(soldAt);
  await checkGoalMilestones(sellerId, period, db);
  await checkRankingPosition(sellerId, period, db);
}
