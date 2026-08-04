import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { audit } from '../lib/audit';
import { badRequest, conflict, notFound } from '../lib/errors';
import { pageMeta, paginate, query, searchFilter } from '../lib/query';
import type { ListQuery } from '../schemas';
import { currentPeriod, monthRange } from '../lib/dates';

const PALETTE = ['#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#0369a1'];

/** Gera o proximo codigo livre no formato FD-001. */
async function nextSellerCode(): Promise<string> {
  const sellers = await prisma.seller.findMany({ select: { code: true } });
  const numbers = sellers
    .map((s) => Number(s.code.replace(/\D/g, '')))
    .filter((n) => Number.isFinite(n));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `FD-${String(next).padStart(3, '0')}`;
}

export async function listSellers(req: Request, res: Response) {
  const q = query<ListQuery>(req);
  const period = currentPeriod();

  const where = {
    ...(q.status === 'active' ? { user: { active: true } } : {}),
    ...(q.status === 'blocked' ? { user: { active: false } } : {}),
    ...(q.search
      ? {
          OR: [
            { code: { contains: q.search } },
            { city: { contains: q.search } },
            { user: { name: { contains: q.search } } },
            { user: { email: { contains: q.search } } },
          ],
        }
      : {}),
  };

  const [sellers, total, sales, commissions] = await Promise.all([
    prisma.seller.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            active: true,
            avatarUrl: true,
            avatarColor: true,
            lastLoginAt: true,
          },
        },
        _count: { select: { leads: true, clients: true, sales: true } },
      },
      orderBy: { code: 'asc' },
      ...paginate(q),
    }),
    prisma.seller.count({ where }),
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
  ]);

  const items = sellers.map((seller) => {
    const row = sales.find((s) => s.sellerId === seller.id);
    return {
      ...seller,
      monthRevenue: row?._sum.amount ?? 0,
      monthSales: row?._count._all ?? 0,
      monthCommission: commissions.find((c) => c.sellerId === seller.id)?._sum.amount ?? 0,
    };
  });

  res.json({ items, meta: pageMeta(total, q), period });
}

export async function getSeller(req: Request, res: Response) {
  const seller = await prisma.seller.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          avatarUrl: true,
          avatarColor: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      _count: { select: { leads: true, clients: true, sales: true } },
      goals: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
    },
  });

  if (!seller) throw notFound('Vendedor nao encontrado.');
  res.json(seller);
}

export async function createSeller(req: Request, res: Response) {
  const { name, email, password, code, phone, city, role, avatarUrl, commissionOverride } =
    req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('Ja existe um usuario com este e-mail.');

  const sellerCode = code ?? (await nextSellerCode());
  const codeTaken = await prisma.seller.findUnique({ where: { code: sellerCode } });
  if (codeTaken) throw conflict(`O codigo ${sellerCode} ja esta em uso.`);

  const count = await prisma.user.count();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      role: role ?? 'SELLER',
      passwordHash: await hashPassword(password),
      avatarUrl: avatarUrl ?? null,
      avatarColor: PALETTE[count % PALETTE.length],
      seller: {
        create: {
          code: sellerCode,
          city: city ?? null,
          commissionOverride: commissionOverride ?? null,
        },
      },
    },
    include: { seller: true },
  });

  await audit(req, {
    action: 'CREATE',
    entity: 'seller',
    entityId: user.seller!.id,
    detail: `${sellerCode} ${name}`,
  });

  res.status(201).json({ id: user.seller!.id, code: sellerCode, name: user.name, email });
}

export async function updateSeller(req: Request, res: Response) {
  const seller = await prisma.seller.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!seller) throw notFound('Vendedor nao encontrado.');

  const { name, email, password, code, phone, city, active, role, avatarUrl, commissionOverride } =
    req.body;

  // Impede que o admin remova o proprio acesso por engano.
  if (seller.userId === req.auth!.userId) {
    if (active === false) throw badRequest('Voce nao pode bloquear a propria conta.');
    if (role && role !== seller.user.role) {
      throw badRequest('Voce nao pode alterar o proprio nivel de acesso.');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: seller.userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone: phone ?? null } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });

    return tx.seller.update({
      where: { id: seller.id },
      data: {
        ...(code !== undefined ? { code } : {}),
        ...(city !== undefined ? { city: city ?? null } : {}),
        ...(commissionOverride !== undefined ? { commissionOverride } : {}),
      },
      include: { user: { select: { id: true, name: true, email: true, active: true, role: true } } },
    });
  });

  const changes: string[] = [];
  if (active !== undefined && active !== seller.user.active) {
    changes.push(active ? 'desbloqueado' : 'bloqueado');
  }
  if (password) changes.push('senha redefinida');
  if (commissionOverride !== undefined) changes.push('comissao ajustada');

  await audit(req, {
    action: active === false ? 'BLOCK' : active === true ? 'UNBLOCK' : 'UPDATE',
    entity: 'seller',
    entityId: seller.id,
    detail: `${seller.code} ${changes.join(', ') || 'dados atualizados'}`,
  });

  res.json(updated);
}

export async function deleteSeller(req: Request, res: Response) {
  const seller = await prisma.seller.findUnique({
    where: { id: req.params.id },
    include: { user: true, _count: { select: { sales: true, clients: true, leads: true } } },
  });
  if (!seller) throw notFound('Vendedor nao encontrado.');

  if (seller.userId === req.auth!.userId) {
    throw badRequest('Voce nao pode excluir a propria conta.');
  }

  // Excluir arrastaria vendas e comissoes junto; bloquear preserva o historico.
  if (seller._count.sales > 0) {
    throw badRequest(
      `Este vendedor possui ${seller._count.sales} venda(s) registrada(s). Bloqueie o acesso em vez de excluir para nao perder o historico comercial.`,
    );
  }

  await prisma.user.delete({ where: { id: seller.userId } }); // cascade -> seller

  await audit(req, {
    action: 'DELETE',
    entity: 'seller',
    entityId: seller.id,
    detail: `${seller.code} ${seller.user.name}`,
  });

  res.json({ ok: true });
}

/** Lista enxuta para selects de vendedor no painel admin. */
export async function sellerOptions(_req: Request, res: Response) {
  const sellers = await prisma.seller.findMany({
    where: { user: { active: true } },
    select: { id: true, code: true, user: { select: { name: true } } },
    orderBy: { code: 'asc' },
  });
  res.json(sellers.map((s) => ({ id: s.id, code: s.code, name: s.user.name })));
}
