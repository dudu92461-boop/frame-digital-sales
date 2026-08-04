import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { audit } from '../lib/audit';
import { badRequest, notFound } from '../lib/errors';
import { formatBRL } from '../lib/format';

/**
 * Catalogo de servicos. Leitura liberada para todos os autenticados; escrita
 * apenas para ADMIN (garantido nas rotas). O vendedor nunca altera precos.
 */
export async function listServices(req: Request, res: Response) {
  const includeInactive = req.auth!.role === 'ADMIN' && req.query.all === 'true';

  const services = await prisma.service.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ active: 'desc' }, { price: 'asc' }],
    include: { _count: { select: { sales: true } } },
  });

  res.json(services);
}

export async function createService(req: Request, res: Response) {
  const service = await prisma.service.create({ data: req.body });
  await audit(req, {
    action: 'CREATE',
    entity: 'service',
    entityId: service.id,
    detail: `${service.name} ${formatBRL(service.price)}`,
  });
  res.status(201).json(service);
}

export async function updateService(req: Request, res: Response) {
  const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Servico nao encontrado.');

  const service = await prisma.service.update({ where: { id: existing.id }, data: req.body });

  const priceChanged = req.body.price != null && req.body.price !== existing.price;
  await audit(req, {
    action: 'UPDATE',
    entity: 'service',
    entityId: service.id,
    detail: priceChanged
      ? `${service.name}: preco ${formatBRL(existing.price)} -> ${formatBRL(service.price)}`
      : service.name,
  });

  res.json(service);
}

export async function deleteService(req: Request, res: Response) {
  const existing = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { sales: true } } },
  });
  if (!existing) throw notFound('Servico nao encontrado.');

  // Servico com historico de vendas nao pode sumir: o valor vendido depende dele.
  if (existing._count.sales > 0) {
    throw badRequest(
      'Este servico ja possui vendas registradas. Desative-o em vez de excluir para preservar o historico.',
    );
  }

  await prisma.service.delete({ where: { id: existing.id } });
  await audit(req, {
    action: 'DELETE',
    entity: 'service',
    entityId: existing.id,
    detail: existing.name,
  });
  res.json({ ok: true });
}
