import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Rota nao encontrada: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[] | string | undefined) ?? 'campo';
      const field = Array.isArray(target) ? target.join(', ') : target;
      return res.status(409).json({ error: `Ja existe um registro com este ${field}.` });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Registro nao encontrado.' });
    }
    if (error.code === 'P2003') {
      return res
        .status(409)
        .json({ error: 'Existem registros vinculados que impedem esta operacao.' });
    }
  }

  console.error('[erro nao tratado]', error);

  res.status(500).json({
    error: 'Erro interno no servidor.',
    ...(env.isProduction ? {} : { debug: error instanceof Error ? error.message : String(error) }),
  });
}

/** Envolve handlers async para que rejeicoes cheguem ao errorHandler. */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => any>(
  handler: T,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
