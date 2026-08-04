import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { assertOwnership, resolveSellerScope } from '../middlewares/auth';
import { badRequest, forbidden, notFound } from '../lib/errors';
import { audit } from '../lib/audit';
import { pageMeta, paginate, query, searchFilter } from '../lib/query';
import type { ListQuery } from '../schemas';
import { SALE_PAID_STATUSES, type SaleStatus } from '../domain/enums';
import { monthRange } from '../lib/dates';
import { afterSaleChanged } from '../services/commissionService';
import { notify, userIdOfSeller } from '../services/notificationService';
import { formatBRL } from '../lib/format';

const include = {
  client: { select: { id: true, company: true, contactName: true } },
  service: { select: { id: true, name: true, price: true } },
  seller: { select: { id: true, code: true, user: { select: { name: true } } } },
  commission: { select: { id: true, amount: true, rate: true, status: true } },
} as const;

/** `paidAt` e a fonte da verdade de "dinheiro recebido" usada pelo motor de comissao. */
function paidAtFor(status: SaleStatus, current: Date | null): Date | null {
  const isPaid = SALE_PAID_STATUSES.includes(status);
  if (!isPaid) return null;
  return current ?? new Date();
}

function resolveOwner(req: Request, bodySellerId?: string): string {
  if (req.auth!.role === 'SELLER') return req.auth!.sellerId!;
  if (!bodySellerId) throw badRequest('Selecione o vendedor responsavel.');
  return bodySellerId;
}

/**
 * Proximo numero de pedido. Roda dentro da transacao de criacao para que duas
 * vendas simultaneas nao recebam o mesmo numero (o @unique no schema e a rede
 * de seguranca final).
 */
async function nextSaleNumber(tx: {
  sale: { findFirst: (args: any) => Promise<{ number: number } | null> };
}): Promise<number> {
  const last = await tx.sale.findFirst({
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

export async function listSales(req: Request, res: Response) {
  const q = query<ListQuery>(req);
  const sellerId = resolveSellerScope(req, q.sellerId);

  const where = {
    ...(sellerId ? { sellerId } : {}),
    ...(q.status && q.status !== 'all' ? { status: q.status } : {}),
    ...(q.month && q.year ? { soldAt: monthRange({ month: q.month, year: q.year }) } : {}),
    ...(q.search
      ? {
          OR: [
            { client: { company: { contains: q.search } } },
            { client: { contactName: { contains: q.search } } },
            { service: { name: { contains: q.search } } },
            { notes: { contains: q.search } },
          ],
        }
      : {}),
  };

  const [items, total, totals] = await Promise.all([
    prisma.sale.findMany({ where, include, orderBy: { soldAt: 'desc' }, ...paginate(q) }),
    prisma.sale.count({ where }),
    prisma.sale.aggregate({
      where: { ...where, status: { not: 'CANCELADO' } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  res.json({
    items,
    meta: pageMeta(total, q),
    totals: { amount: totals._sum.amount ?? 0, count: totals._count._all },
  });
}

export async function getSale(req: Request, res: Response) {
  const sale = await prisma.sale.findUnique({ where: { id: req.params.id }, include });
  if (!sale) throw notFound('Venda nao encontrada.');
  assertOwnership(req, sale.sellerId);
  res.json(sale);
}

export async function createSale(req: Request, res: Response) {
  const { sellerId: bodySellerId, clientId, serviceId, soldAt, status, ...rest } = req.body;
  const sellerId = resolveOwner(req, bodySellerId);

  const [client, service] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);

  if (!client) throw badRequest('Cliente nao encontrado.');
  if (!service) throw badRequest('Servico nao encontrado.');
  if (!service.active) throw badRequest('Este servico esta inativo e nao pode ser vendido.');
  // Impede registrar venda no cliente de outro vendedor.
  if (client.sellerId !== sellerId) {
    throw badRequest('O cliente selecionado pertence a outro vendedor.');
  }

  const saleDate = soldAt ?? new Date();
  const saleStatus: SaleStatus = status ?? 'PENDENTE';

  const sale = await prisma.$transaction(async (tx) =>
    tx.sale.create({
      data: {
        ...rest,
        number: await nextSaleNumber(tx),
        clientId,
        serviceId,
        sellerId,
        status: saleStatus,
        soldAt: saleDate,
        paidAt: paidAtFor(saleStatus, null),
      },
      include,
    }),
  );

  await afterSaleChanged(sellerId, sale.soldAt);

  await audit(req, {
    action: 'CREATE',
    entity: 'sale',
    entityId: sale.id,
    detail: `#${sale.number} ${client.company} ${formatBRL(sale.amount)}`,
  });

  res.status(201).json(await prisma.sale.findUnique({ where: { id: sale.id }, include }));
}

export async function updateSale(req: Request, res: Response) {
  const existing = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { commission: true },
  });
  if (!existing) throw notFound('Venda nao encontrada.');
  assertOwnership(req, existing.sellerId);

  // Depois que a comissao foi paga, a venda vira registro contabil.
  if (existing.commission?.status === 'PAGA' && req.auth!.role !== 'ADMIN') {
    throw forbidden('A comissao desta venda ja foi paga. Peca ao administrador para ajustar.');
  }
  if (existing.approved && req.auth!.role !== 'ADMIN') {
    throw forbidden('Esta venda ja foi aprovada e nao pode mais ser editada.');
  }

  const { sellerId, clientId, status, soldAt, ...rest } = req.body;
  const targetSeller = req.auth!.role === 'ADMIN' && sellerId ? sellerId : existing.sellerId;

  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw badRequest('Cliente nao encontrado.');
    if (client.sellerId !== targetSeller) {
      throw badRequest('O cliente selecionado pertence a outro vendedor.');
    }
  }

  const nextStatus = (status ?? existing.status) as SaleStatus;

  const sale = await prisma.sale.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(clientId ? { clientId } : {}),
      ...(soldAt ? { soldAt } : {}),
      sellerId: targetSeller,
      status: nextStatus,
      paidAt: paidAtFor(nextStatus, existing.paidAt),
    },
    include,
  });

  await afterSaleChanged(targetSeller, sale.soldAt, existing.soldAt);
  if (targetSeller !== existing.sellerId) {
    // Transferencia entre vendedores muda a faixa de comissao dos dois.
    await afterSaleChanged(existing.sellerId, existing.soldAt);
  }

  await audit(req, {
    action: 'UPDATE',
    entity: 'sale',
    entityId: sale.id,
    detail:
      existing.status !== nextStatus
        ? `#${sale.number} status: ${existing.status} -> ${nextStatus}`
        : `#${sale.number} atualizada`,
  });

  res.json(await prisma.sale.findUnique({ where: { id: sale.id }, include }));
}

/** Atalho usado pela lista de vendas para mudar o status em um clique. */
export async function updateSaleStatus(req: Request, res: Response) {
  const existing = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { commission: true },
  });
  if (!existing) throw notFound('Venda nao encontrada.');
  assertOwnership(req, existing.sellerId);

  if (existing.commission?.status === 'PAGA' && req.auth!.role !== 'ADMIN') {
    throw forbidden('A comissao desta venda ja foi paga. Peca ao administrador para ajustar.');
  }

  const status = req.body.status as SaleStatus;

  const sale = await prisma.sale.update({
    where: { id: existing.id },
    data: { status, paidAt: paidAtFor(status, existing.paidAt) },
    include,
  });

  await afterSaleChanged(sale.sellerId, sale.soldAt);

  await audit(req, {
    action: 'UPDATE',
    entity: 'sale',
    entityId: sale.id,
    detail: `#${sale.number} status: ${existing.status} -> ${status}`,
  });

  res.json(await prisma.sale.findUnique({ where: { id: sale.id }, include }));
}

export async function deleteSale(req: Request, res: Response) {
  const existing = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { commission: true },
  });
  if (!existing) throw notFound('Venda nao encontrada.');
  assertOwnership(req, existing.sellerId);

  if (existing.commission?.status === 'PAGA') {
    throw badRequest('Nao e possivel excluir uma venda com comissao ja paga.');
  }
  if (existing.approved && req.auth!.role !== 'ADMIN') {
    throw forbidden('Esta venda ja foi aprovada. Peca a exclusao ao administrador.');
  }

  await prisma.sale.delete({ where: { id: existing.id } });
  await afterSaleChanged(existing.sellerId, existing.soldAt);

  await audit(req, {
    action: 'DELETE',
    entity: 'sale',
    entityId: existing.id,
    detail: `#${existing.number} ${formatBRL(existing.amount)}`,
  });

  res.json({ ok: true });
}

/** Aprovacao da venda pelo admin: libera a comissao para ser paga. */
export async function approveSale(req: Request, res: Response) {
  const existing = await prisma.sale.findUnique({ where: { id: req.params.id }, include });
  if (!existing) throw notFound('Venda nao encontrada.');
  if (existing.status === 'CANCELADO') throw badRequest('Venda cancelada nao pode ser aprovada.');

  const sale = await prisma.sale.update({
    where: { id: existing.id },
    data: { approved: true, approvedAt: new Date(), approvedById: req.auth!.userId },
    include,
  });

  const userId = await userIdOfSeller(sale.sellerId);
  if (userId) {
    await notify({
      userId,
      type: 'SUCCESS',
      title: 'Venda aprovada',
      message: `A venda #${sale.number} (${sale.client.company}) de ${formatBRL(sale.amount)} foi aprovada.`,
      link: '/vendas',
    });
  }

  await audit(req, {
    action: 'APPROVE',
    entity: 'sale',
    entityId: sale.id,
    detail: `#${sale.number} ${formatBRL(sale.amount)}`,
  });

  res.json(sale);
}

export async function unapproveSale(req: Request, res: Response) {
  const sale = await prisma.sale.update({
    where: { id: req.params.id },
    data: { approved: false, approvedAt: null, approvedById: null },
    include,
  });

  await audit(req, {
    action: 'UPDATE',
    entity: 'sale',
    entityId: sale.id,
    detail: `#${sale.number} aprovacao revertida`,
  });

  res.json(sale);
}
