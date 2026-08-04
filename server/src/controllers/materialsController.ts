import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { audit } from '../lib/audit';
import { notFound } from '../lib/errors';

/** Biblioteca de materiais de apoio comercial (propostas, portfolio, scripts). */
export async function listMaterials(req: Request, res: Response) {
  const includeInactive = req.auth!.role === 'ADMIN' && req.query.all === 'true';

  const materials = await prisma.material.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });

  res.json(materials);
}

export async function createMaterial(req: Request, res: Response) {
  const material = await prisma.material.create({ data: req.body });
  await audit(req, {
    action: 'CREATE',
    entity: 'material',
    entityId: material.id,
    detail: material.title,
  });
  res.status(201).json(material);
}

export async function updateMaterial(req: Request, res: Response) {
  const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Material nao encontrado.');

  const material = await prisma.material.update({ where: { id: existing.id }, data: req.body });
  await audit(req, {
    action: 'UPDATE',
    entity: 'material',
    entityId: material.id,
    detail: material.title,
  });
  res.json(material);
}

export async function deleteMaterial(req: Request, res: Response) {
  const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Material nao encontrado.');

  await prisma.material.delete({ where: { id: existing.id } });
  await audit(req, {
    action: 'DELETE',
    entity: 'material',
    entityId: existing.id,
    detail: existing.title,
  });
  res.json({ ok: true });
}
