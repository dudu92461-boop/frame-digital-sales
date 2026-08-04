import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { badRequest } from '../lib/errors';

type Source = 'body' | 'query' | 'params';

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(raiz)',
    message: issue.message,
  }));
}

/**
 * Valida e NORMALIZA a entrada: o resultado do parse substitui o original, de
 * forma que os controllers recebem dados ja tipados, com defaults aplicados e
 * sem campos extras (os schemas usam strip por padrao).
 */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(badRequest('Dados invalidos.', formatZodError(result.error)));
    }

    if (source === 'query') {
      // req.query e getter-only no Express 4; guardamos a versao validada.
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }

    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }
  }
}
