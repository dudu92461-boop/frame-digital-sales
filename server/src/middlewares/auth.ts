import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyToken } from '../lib/auth';
import { forbidden, unauthorized } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { Role } from '../domain/enums';

/**
 * Valida o cookie de sessao e recarrega o usuario do banco a cada requisicao.
 * Recarregar e proposital: se o admin bloquear ou excluir um vendedor, a sessao
 * dele deixa de funcionar imediatamente, sem esperar o token expirar.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.tokenName];
    if (!token) throw unauthorized('Faca login para continuar.');

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw unauthorized('Sessao expirada. Faca login novamente.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { seller: { select: { id: true } } },
    });

    if (!user) throw unauthorized('Usuario nao encontrado.');
    if (!user.active) throw forbidden('Seu acesso foi bloqueado. Fale com o administrador.');

    req.auth = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      sellerId: user.seller?.id ?? null,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== 'ADMIN') {
    return next(forbidden('Acao restrita a administradores.'));
  }
  next();
}

/** Garante que o usuario tem um cadastro de vendedor vinculado. */
export function requireSeller(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth?.sellerId) {
    return next(forbidden('Este usuario nao possui cadastro de vendedor.'));
  }
  next();
}

/**
 * Resolve qual vendedor o usuario esta autorizado a consultar.
 *
 * - VENDEDOR: sempre o proprio id, ignorando qualquer `sellerId` da query.
 * - ADMIN: o `sellerId` pedido, ou `undefined` (= todos) quando nao informado.
 *
 * Este helper e a unica fonte de escopo por vendedor no sistema: todo controller
 * que lista dados deve passar por aqui.
 */
export function resolveSellerScope(req: Request, requested?: string): string | undefined {
  if (req.auth?.role === 'ADMIN') {
    return requested && requested !== 'all' ? requested : undefined;
  }
  return req.auth?.sellerId ?? '__sem_vendedor__';
}

/** Lanca se um vendedor tentar acessar registro de outro vendedor. */
export function assertOwnership(req: Request, ownerSellerId: string): void {
  if (req.auth?.role === 'ADMIN') return;
  if (req.auth?.sellerId !== ownerSellerId) {
    throw forbidden('Este registro pertence a outro vendedor.');
  }
}
