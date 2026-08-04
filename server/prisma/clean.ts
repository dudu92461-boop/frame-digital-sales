/**
 * Zera a operacao, deixando o sistema pronto para uso real.
 *
 * MANTEM:  a conta de administrador e o catalogo de servicos.
 * APAGA:   vendedores, leads, clientes, vendas, comissoes, pagamentos, metas,
 *          notificacoes e o log de auditoria.
 *
 * Uso:  npm run db:clean       (a partir da raiz do projeto)
 *
 * Pare a API antes de rodar: o SQLite nao aceita duas escritas concorrentes.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@framedigital.com.br';
const ADMIN_NAME = 'Eduardo Rocha';
const ADMIN_PASSWORD = 'frame@2025';

async function main() {
  console.log('Limpando a base...\n');

  // Ordem: filhos antes dos pais, para nao esbarrar em chaves estrangeiras.
  const removed = {
    comissoes: (await prisma.commission.deleteMany()).count,
    pagamentos: (await prisma.payment.deleteMany()).count,
    vendas: (await prisma.sale.deleteMany()).count,
    leads: (await prisma.lead.deleteMany()).count,
    clientes: (await prisma.client.deleteMany()).count,
    metas: (await prisma.goal.deleteMany()).count,
    notificacoes: (await prisma.notification.deleteMany()).count,
    auditoria: (await prisma.auditLog.deleteMany()).count,
  };

  // Remove todos os usuarios que nao sao o administrador (cascata apaga o
  // cadastro de vendedor vinculado).
  const usersRemoved = await prisma.user.deleteMany({
    where: { email: { not: ADMIN_EMAIL } },
  });

  for (const [label, count] of Object.entries(removed)) {
    console.log(`  ${label.padEnd(14)} ${count} removido(s)`);
  }
  console.log(`  ${'usuarios'.padEnd(14)} ${usersRemoved.count} removido(s)`);

  // Garante que sobrou um administrador com acesso; se nao havia, cria.
  let admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { seller: true },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
        role: 'ADMIN',
        avatarColor: '#0f172a',
        seller: { create: { code: 'FD-000' } },
      },
      include: { seller: true },
    });
    console.log('\n  Administrador recriado (senha: ' + ADMIN_PASSWORD + ').');
  } else if (admin.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN', active: true } });
  }

  const services = await prisma.service.count();
  const materials = await prisma.material.count();

  console.log('\n  Mantido:');
  console.log(`    administrador  ${admin.email}`);
  console.log(`    servicos       ${services}`);
  console.log(`    materiais      ${materials}`);

  console.log('\n  Sistema zerado. Entre como administrador e cadastre os vendedores');
  console.log('  em Administracao > Vendedores.\n');
}

main()
  .catch((error) => {
    console.error('Falha ao limpar a base:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
