import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { resolveSellerScope } from '../middlewares/auth';
import { badRequest } from '../lib/errors';
import { audit } from '../lib/audit';
import { pageMeta, paginate, query } from '../lib/query';
import type { ListQuery } from '../schemas';
import { currentPeriod } from '../lib/dates';
import { commissionSummary } from '../services/commissionService';
import { COMMISSION_TIERS, nextTierProgress, tierForSalesCount } from '../domain/commission';
import { notify, userIdOfSeller } from '../services/notificationService';
import { formatBRL } from '../lib/format';
import { monthRange } from '../lib/dates';

const include = {
  sale: {
    select: {
      id: true,
      number: true,
      amount: true,
      status: true,
      soldAt: true,
      approved: true,
      client: { select: { id: true, company: true } },
      service: { select: { id: true, name: true } },
    },
  },
  seller: { select: { id: true, code: true, user: { select: { name: true } } } },
} as const;

export async function listCommissions(req: Request, res: Response) {
  const q = query<ListQuery>(req);
  const sellerId = resolveSellerScope(req, q.sellerId);
  const period = { month: q.month ?? currentPeriod().month, year: q.year ?? currentPeriod().year };

  const where = {
    ...(sellerId ? { sellerId } : {}),
    ...(q.status && q.status !== 'all' ? { status: q.status } : {}),
    referenceMonth: period.month,
    referenceYear: period.year,
  };

  const [items, total, summary] = await Promise.all([
    prisma.commission.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      ...paginate(q),
    }),
    prisma.commission.count({ where }),
    commissionSummary(sellerId, period),
  ]);

  res.json({ items, meta: pageMeta(total, q), summary, period });
}

/** Faixa de comissao atual do vendedor no mes e quanto falta para a proxima. */
export async function commissionTier(req: Request, res: Response) {
  const q = query<ListQuery>(req);
  const sellerId = resolveSellerScope(req, q.sellerId) ?? req.auth!.sellerId;
  const period = { month: q.month ?? currentPeriod().month, year: q.year ?? currentPeriod().year };

  if (!sellerId) {
    return res.json({ tiers: COMMISSION_TIERS, current: null, next: null, paidSalesCount: 0 });
  }

  const paidSalesCount = await prisma.sale.count({
    where: {
      sellerId,
      soldAt: monthRange(period),
      status: { not: 'CANCELADO' },
      paidAt: { not: null },
    },
  });

  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { commissionOverride: true },
  });

  res.json({
    tiers: COMMISSION_TIERS.map((t) => ({
      ...t,
      max: Number.isFinite(t.max) ? t.max : null,
    })),
    paidSalesCount,
    current: tierForSalesCount(paidSalesCount),
    next: nextTierProgress(paidSalesCount),
    override: seller?.commissionOverride ?? null,
    period,
  });
}

/** Admin aprova comissoes PENDENTES, tornando-as LIBERADAS para pagamento. */
export async function releaseCommissions(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };

  const commissions = await prisma.commission.findMany({
    where: { id: { in: ids } },
    include: { sale: { select: { number: true, approved: true, status: true } } },
  });

  if (commissions.length === 0) throw badRequest('Nenhuma comissao encontrada.');

  const blocked = commissions.filter((c) => c.status !== 'PENDENTE');
  if (blocked.length > 0) {
    throw badRequest(
      'Apenas comissoes com status PENDENTE podem ser liberadas. Verifique se as vendas ja constam como pagas.',
    );
  }

  const notApproved = commissions.filter((c) => !c.sale.approved);
  if (notApproved.length > 0) {
    throw badRequest(
      `Aprove primeiro a(s) venda(s): ${notApproved.map((c) => `#${c.sale.number}`).join(', ')}.`,
    );
  }

  await prisma.commission.updateMany({
    where: { id: { in: ids } },
    data: { status: 'LIBERADA', releasedAt: new Date() },
  });

  // Avisa cada vendedor do total liberado.
  const bySeller = new Map<string, number>();
  for (const c of commissions) {
    bySeller.set(c.sellerId, (bySeller.get(c.sellerId) ?? 0) + c.amount);
  }
  for (const [sellerId, amount] of bySeller) {
    const userId = await userIdOfSeller(sellerId);
    if (userId) {
      await notify({
        userId,
        type: 'COMMISSION',
        title: `Comissao de ${formatBRL(amount)} liberada`,
        message: 'A comissao foi aprovada e entrara no proximo repasse.',
        link: '/comissoes',
      });
    }
  }

  await audit(req, {
    action: 'RELEASE',
    entity: 'commission',
    detail: `${commissions.length} comissao(oes) liberada(s)`,
  });

  res.json({ ok: true, released: commissions.length });
}

/**
 * Registra o repasse ao vendedor: cria um Payment por vendedor e marca as
 * comissoes como PAGA. Tudo em transacao para nao gerar pagamento parcial.
 */
export async function payCommissions(req: Request, res: Response) {
  const { ids, method, notes } = req.body as { ids: string[]; method: string; notes?: string };

  const commissions = await prisma.commission.findMany({ where: { id: { in: ids } } });
  if (commissions.length === 0) throw badRequest('Nenhuma comissao encontrada.');

  const invalid = commissions.filter((c) => c.status !== 'LIBERADA');
  if (invalid.length > 0) {
    throw badRequest('Apenas comissoes LIBERADAS podem ser marcadas como pagas.');
  }

  const bySeller = new Map<string, typeof commissions>();
  for (const c of commissions) {
    const list = bySeller.get(c.sellerId) ?? [];
    list.push(c);
    bySeller.set(c.sellerId, list);
  }

  const payments = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const [sellerId, list] of bySeller) {
      const amount = list.reduce((sum, c) => sum + c.amount, 0);
      const payment = await tx.payment.create({
        data: { sellerId, amount, method, notes: notes ?? null },
      });
      await tx.commission.updateMany({
        where: { id: { in: list.map((c) => c.id) } },
        data: { status: 'PAGA', paidAt: new Date(), paymentId: payment.id },
      });
      created.push(payment);
    }
    return created;
  });

  for (const payment of payments) {
    const userId = await userIdOfSeller(payment.sellerId);
    if (userId) {
      await notify({
        userId,
        type: 'COMMISSION',
        title: `Comissao de ${formatBRL(payment.amount)} paga`,
        message: `Repasse efetuado via ${payment.method}.`,
        link: '/comissoes',
      });
    }
  }

  await audit(req, {
    action: 'PAY',
    entity: 'commission',
    detail: `${commissions.length} comissao(oes), total ${formatBRL(
      commissions.reduce((s, c) => s + c.amount, 0),
    )}`,
  });

  res.json({ ok: true, payments });
}

export async function listPayments(req: Request, res: Response) {
  const q = query<ListQuery>(req);
  const sellerId = resolveSellerScope(req, q.sellerId);

  const where = sellerId ? { sellerId } : {};
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        seller: { select: { id: true, code: true, user: { select: { name: true } } } },
        _count: { select: { commissions: true } },
      },
      orderBy: { paidAt: 'desc' },
      ...paginate(q),
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({ items, meta: pageMeta(total, q) });
}
