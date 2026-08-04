import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { assertOwnership, resolveSellerScope } from '../middlewares/auth';
import { badRequest, forbidden, notFound } from '../lib/errors';
import { audit } from '../lib/audit';
import { pageMeta, paginate, query, searchFilter } from '../lib/query';
import type { ListQuery } from '../schemas';
import { LEAD_STATUSES } from '../domain/enums';

const SEARCH_FIELDS = ['company', 'contactName', 'email', 'whatsapp', 'city', 'segment'];

const withSeller = {
  seller: { select: { id: true, code: true, user: { select: { name: true } } } },
  client: { select: { id: true, company: true } },
} as const;

/**
 * Define o dono do registro na criacao. Vendedor sempre cria para si mesmo,
 * mesmo que envie outro sellerId no corpo; admin precisa informar explicitamente.
 */
function resolveOwner(req: Request, bodySellerId?: string): string {
  if (req.auth!.role === 'SELLER') return req.auth!.sellerId!;
  if (!bodySellerId) throw badRequest('Selecione o vendedor responsavel.');
  return bodySellerId;
}

export async function listLeads(req: Request, res: Response) {
  const q = query<ListQuery>(req);
  const sellerId = resolveSellerScope(req, q.sellerId);

  const where = {
    ...(sellerId ? { sellerId } : {}),
    ...(q.status && q.status !== 'all' ? { status: q.status } : {}),
    ...searchFilter(SEARCH_FIELDS, q.search),
  };

  const [items, total, statusCounts] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: withSeller,
      orderBy: { createdAt: 'desc' },
      ...paginate(q),
    }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({
      by: ['status'],
      where: sellerId ? { sellerId } : {},
      _count: { _all: true },
    }),
  ]);

  res.json({
    items,
    meta: pageMeta(total, q),
    statusCounts: Object.fromEntries(
      LEAD_STATUSES.map((s) => [
        s,
        statusCounts.find((c) => c.status === s)?._count._all ?? 0,
      ]),
    ),
  });
}

export async function getLead(req: Request, res: Response) {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: withSeller,
  });
  if (!lead) throw notFound('Lead nao encontrado.');
  assertOwnership(req, lead.sellerId);
  res.json(lead);
}

export async function createLead(req: Request, res: Response) {
  const { sellerId: bodySellerId, ...data } = req.body;
  const sellerId = resolveOwner(req, bodySellerId);

  const lead = await prisma.lead.create({
    data: { ...data, sellerId },
    include: withSeller,
  });

  await audit(req, {
    action: 'CREATE',
    entity: 'lead',
    entityId: lead.id,
    detail: lead.company,
  });
  res.status(201).json(lead);
}

export async function updateLead(req: Request, res: Response) {
  const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Lead nao encontrado.');
  assertOwnership(req, existing.sellerId);

  const { sellerId, ...data } = req.body;
  // Apenas o admin pode transferir um lead para outro vendedor.
  const transfer = req.auth!.role === 'ADMIN' && sellerId ? { sellerId } : {};

  const lead = await prisma.lead.update({
    where: { id: existing.id },
    data: { ...data, ...transfer },
    include: withSeller,
  });

  await audit(req, {
    action: 'UPDATE',
    entity: 'lead',
    entityId: lead.id,
    detail: existing.status !== lead.status ? `status: ${existing.status} -> ${lead.status}` : lead.company,
  });
  res.json(lead);
}

export async function deleteLead(req: Request, res: Response) {
  const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Lead nao encontrado.');
  assertOwnership(req, existing.sellerId);

  await prisma.lead.delete({ where: { id: existing.id } });
  await audit(req, {
    action: 'DELETE',
    entity: 'lead',
    entityId: existing.id,
    detail: existing.company,
  });
  res.json({ ok: true });
}

/**
 * Converte um lead em cliente, marcando o lead como GANHO. Roda em transacao
 * para nao deixar um lead marcado como ganho sem o cliente correspondente.
 */
export async function convertLead(req: Request, res: Response) {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) throw notFound('Lead nao encontrado.');
  assertOwnership(req, lead.sellerId);
  if (lead.clientId) throw badRequest('Este lead ja foi convertido em cliente.');

  const { document, notes } = req.body as { document?: string; notes?: string };

  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        company: lead.company,
        contactName: lead.contactName,
        whatsapp: lead.whatsapp,
        email: lead.email,
        instagram: lead.instagram,
        city: lead.city,
        segment: lead.segment,
        document: document ?? null,
        notes: notes ?? lead.notes,
        sellerId: lead.sellerId,
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: { clientId: created.id, status: 'GANHO' },
    });

    return created;
  });

  await audit(req, {
    action: 'CREATE',
    entity: 'client',
    entityId: client.id,
    detail: `convertido do lead ${lead.company}`,
  });
  res.status(201).json(client);
}
