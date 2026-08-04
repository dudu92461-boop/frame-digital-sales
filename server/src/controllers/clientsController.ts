import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { assertOwnership, resolveSellerScope } from '../middlewares/auth';
import { badRequest, notFound } from '../lib/errors';
import { audit } from '../lib/audit';
import { pageMeta, paginate, query, searchFilter } from '../lib/query';
import type { ListQuery } from '../schemas';

const SEARCH_FIELDS = ['company', 'contactName', 'email', 'whatsapp', 'city', 'segment', 'document'];

const withSeller = {
  seller: { select: { id: true, code: true, user: { select: { name: true } } } },
} as const;

function resolveOwner(req: Request, bodySellerId?: string): string {
  if (req.auth!.role === 'SELLER') return req.auth!.sellerId!;
  if (!bodySellerId) throw badRequest('Selecione o vendedor responsavel.');
  return bodySellerId;
}

export async function listClients(req: Request, res: Response) {
  const q = query<ListQuery>(req);
  const sellerId = resolveSellerScope(req, q.sellerId);

  const where = {
    ...(sellerId ? { sellerId } : {}),
    ...(q.status === 'active' ? { active: true } : {}),
    ...(q.status === 'inactive' ? { active: false } : {}),
    ...searchFilter(SEARCH_FIELDS, q.search),
  };

  const [rows, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        ...withSeller,
        sales: {
          select: { id: true, amount: true, status: true, soldAt: true, service: { select: { name: true } } },
          orderBy: { soldAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...paginate(q),
    }),
    prisma.client.count({ where }),
  ]);

  // A lista mostra o resumo comercial de cada cliente sem exigir uma segunda chamada.
  const items = rows.map(({ sales, ...client }) => {
    const valid = sales.filter((s) => s.status !== 'CANCELADO');
    const lastSale = valid[0] ?? null;
    return {
      ...client,
      salesCount: valid.length,
      totalValue: valid.reduce((sum, s) => sum + s.amount, 0),
      lastService: lastSale?.service.name ?? null,
      lastSaleAt: lastSale?.soldAt ?? null,
      lastSaleStatus: lastSale?.status ?? null,
    };
  });

  res.json({ items, meta: pageMeta(total, q) });
}

/** Ficha completa: dados cadastrais, historico de vendas e comissoes geradas. */
export async function getClient(req: Request, res: Response) {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      ...withSeller,
      lead: { select: { id: true, status: true, createdAt: true } },
      sales: {
        include: {
          service: { select: { id: true, name: true } },
          commission: { select: { id: true, amount: true, rate: true, status: true } },
        },
        orderBy: { soldAt: 'desc' },
      },
    },
  });

  if (!client) throw notFound('Cliente nao encontrado.');
  assertOwnership(req, client.sellerId);

  const valid = client.sales.filter((s) => s.status !== 'CANCELADO');
  res.json({
    ...client,
    summary: {
      salesCount: valid.length,
      totalValue: valid.reduce((sum, s) => sum + s.amount, 0),
      paidValue: valid.filter((s) => s.paidAt).reduce((sum, s) => sum + s.amount, 0),
      commissionTotal: valid.reduce((sum, s) => sum + (s.commission?.amount ?? 0), 0),
    },
  });
}

export async function createClient(req: Request, res: Response) {
  const { sellerId: bodySellerId, ...data } = req.body;
  const sellerId = resolveOwner(req, bodySellerId);

  const client = await prisma.client.create({
    data: { ...data, sellerId },
    include: withSeller,
  });

  await audit(req, {
    action: 'CREATE',
    entity: 'client',
    entityId: client.id,
    detail: client.company,
  });
  res.status(201).json(client);
}

export async function updateClient(req: Request, res: Response) {
  const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Cliente nao encontrado.');
  assertOwnership(req, existing.sellerId);

  const { sellerId, ...data } = req.body;
  const transfer = req.auth!.role === 'ADMIN' && sellerId ? { sellerId } : {};

  const client = await prisma.client.update({
    where: { id: existing.id },
    data: { ...data, ...transfer },
    include: withSeller,
  });

  await audit(req, {
    action: 'UPDATE',
    entity: 'client',
    entityId: client.id,
    detail: client.company,
  });
  res.json(client);
}

export async function deleteClient(req: Request, res: Response) {
  const existing = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { sales: true } } },
  });
  if (!existing) throw notFound('Cliente nao encontrado.');
  assertOwnership(req, existing.sellerId);

  if (existing._count.sales > 0) {
    throw badRequest(
      'Este cliente possui vendas registradas. Marque-o como inativo em vez de excluir.',
    );
  }

  await prisma.client.delete({ where: { id: existing.id } });
  await audit(req, {
    action: 'DELETE',
    entity: 'client',
    entityId: existing.id,
    detail: existing.company,
  });
  res.json({ ok: true });
}

/** Lista enxuta para preencher o select de cliente no formulario de venda. */
export async function clientOptions(req: Request, res: Response) {
  const sellerId = resolveSellerScope(req, (req.query.sellerId as string) || undefined);
  const clients = await prisma.client.findMany({
    where: { active: true, ...(sellerId ? { sellerId } : {}) },
    select: { id: true, company: true, contactName: true, sellerId: true },
    orderBy: { company: 'asc' },
  });
  res.json(clients);
}
