import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  clearAuthCookie,
  generateResetToken,
  hashPassword,
  hashResetToken,
  setAuthCookie,
  signToken,
  verifyPassword,
} from '../lib/auth';
import { badRequest, forbidden, unauthorized } from '../lib/errors';
import { audit } from '../lib/audit';
import type { Role } from '../domain/enums';

/** Mensagem unica para usuario inexistente e senha errada (evita enumeracao). */
const INVALID_CREDENTIALS = 'E-mail ou senha incorretos.';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({
    where: { email },
    include: { seller: { select: { id: true, code: true } } },
  });

  if (!user) throw unauthorized(INVALID_CREDENTIALS);

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw unauthorized(INVALID_CREDENTIALS);

  if (!user.active) throw forbidden('Seu acesso esta bloqueado. Fale com o administrador.');

  const token = signToken({
    sub: user.id,
    role: user.role as Role,
    sellerId: user.seller?.id ?? null,
  });
  setAuthCookie(res, token);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  req.auth = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    sellerId: user.seller?.id ?? null,
  };
  await audit(req, { action: 'LOGIN', entity: 'user', entityId: user.id });

  res.json({ user: serializeUser(user) });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: { seller: { select: { id: true, code: true, city: true, commissionOverride: true } } },
  });
  if (!user) throw unauthorized();

  const unreadNotifications = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  res.json({ user: serializeUser(user), unreadNotifications });
}

export async function updateProfile(req: Request, res: Response) {
  const { name, phone, avatarColor, avatarUrl } = req.body as {
    name: string;
    phone?: string;
    avatarColor?: string;
    avatarUrl?: string | null;
  };

  const user = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: {
      name,
      phone: phone ?? null,
      ...(avatarColor ? { avatarColor } : {}),
      // Só toca na foto quando o campo veio no corpo (null remove).
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
    include: { seller: { select: { id: true, code: true, city: true, commissionOverride: true } } },
  });

  await audit(req, { action: 'UPDATE', entity: 'user', entityId: user.id, detail: 'perfil' });
  res.json({ user: serializeUser(user) });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) throw unauthorized();

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw badRequest('A senha atual esta incorreta.');

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await audit(req, { action: 'UPDATE', entity: 'user', entityId: user.id, detail: 'senha alterada' });
  res.json({ ok: true });
}

/**
 * Recuperacao de senha. Responde sempre 200 para nao revelar quais e-mails
 * existem. Sem servico de e-mail configurado, o token e devolvido no corpo em
 * ambiente de desenvolvimento para permitir testar o fluxo completo.
 */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    return res.json({ ok: true, message: 'Se o e-mail existir, enviaremos as instrucoes.' });
  }

  const { token, hashed, expiresAt } = generateResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: hashed, resetTokenExp: expiresAt },
  });

  res.json({
    ok: true,
    message: 'Se o e-mail existir, enviaremos as instrucoes.',
    // TODO: substituir por envio de e-mail em producao.
    ...(process.env.NODE_ENV === 'production' ? {} : { devToken: token }),
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body as { token: string; password: string };

  const user = await prisma.user.findUnique({ where: { resetToken: hashResetToken(token) } });
  if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
    throw badRequest('Link de recuperacao invalido ou expirado.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetTokenExp: null,
    },
  });

  res.json({ ok: true });
}

type UserWithSeller = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  phone: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  lastLoginAt: Date | null;
  seller?: { id: string; code: string; city?: string | null; commissionOverride?: number | null } | null;
};

/** Nunca expor passwordHash / resetToken para o cliente. */
function serializeUser(user: UserWithSeller) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    avatarColor: user.avatarColor,
    lastLoginAt: user.lastLoginAt,
    seller: user.seller
      ? {
          id: user.seller.id,
          code: user.seller.code,
          city: user.seller.city ?? null,
          commissionOverride: user.seller.commissionOverride ?? null,
        }
      : null,
  };
}
