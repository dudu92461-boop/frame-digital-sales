import type { Request } from 'express';
import type { ListQuery } from '../schemas';

/**
 * Monta um OR de `contains` para busca textual.
 *
 * Atencao na migracao para PostgreSQL: no SQLite o operador LIKE ja e
 * case-insensitive para ASCII, entao `mode` nao e usado. No PostgreSQL sera
 * necessario acrescentar `mode: 'insensitive'` em cada clausula.
 */
export function searchFilter(fields: string[], term?: string) {
  const value = term?.trim();
  if (!value) return undefined;
  return { OR: fields.map((field) => ({ [field]: { contains: value } })) };
}

export function paginate({ page, pageSize }: Pick<ListQuery, 'page' | 'pageSize'>) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function pageMeta(total: number, { page, pageSize }: Pick<ListQuery, 'page' | 'pageSize'>) {
  return {
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Query ja validada pelo middleware `validate(schema, 'query')`. */
export function query<T = ListQuery>(req: Request): T {
  return (req.validatedQuery ?? req.query) as T;
}
