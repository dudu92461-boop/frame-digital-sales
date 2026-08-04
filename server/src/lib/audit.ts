import type { Request } from 'express';
import { prisma, type Db } from './prisma';
import type { AuditAction } from '../domain/enums';

interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  detail?: string;
}

/**
 * Registra uma acao no log de auditoria. Nunca lanca: uma falha de log nao pode
 * derrubar a operacao de negocio que a originou.
 */
export async function audit(req: Request, input: AuditInput, db: Db = prisma): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: req.auth?.userId ?? null,
        actorName: req.auth?.name ?? 'sistema',
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
        ip: req.ip ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] falha ao registrar log:', error);
  }
}
