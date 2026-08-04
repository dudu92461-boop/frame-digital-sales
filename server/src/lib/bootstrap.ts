import { prisma } from './prisma';
import { hashPassword } from './auth';
import { env } from '../config/env';

/**
 * Garante que existe um administrador para acessar o sistema.
 *
 * Roda a cada inicializacao, mas so age quando NAO ha nenhum admin -- num banco
 * recem-criado (primeiro deploy). Se ja existe admin, nao faz nada: nunca
 * sobrescreve a senha de quem ja usa o sistema. Isso torna seguro rodar a cada
 * reinicio no Render.
 *
 * As credenciais iniciais vem das variaveis de ambiente ADMIN_EMAIL e
 * ADMIN_PASSWORD (com um padrao apenas para desenvolvimento). Em producao,
 * defina-as no Render e troque a senha no primeiro acesso.
 */
export async function ensureAdmin(): Promise<void> {
  const existing = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (existing > 0) return;

  const email = (env.adminEmail ?? 'admin@framedigital.com.br').toLowerCase();
  const password = env.adminPassword ?? 'frame@2025';
  const name = env.adminName ?? 'Administrador';

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'ADMIN',
      avatarColor: '#0f172a',
      seller: { create: { code: 'FD-000' } },
    },
  });

  console.log(`  [bootstrap] administrador inicial criado: ${email}`);
}
