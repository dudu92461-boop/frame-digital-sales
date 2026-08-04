/**
 * Reprocessa as comissoes de todos os vendedores em todos os meses que tenham
 * vendas registradas:
 *
 *   npm --prefix server run recalc
 *
 * Use depois de mudar a regra de comissao ou o percentual individual de alguem.
 * Comissoes com status PAGA sao preservadas pelo proprio motor -- dinheiro ja
 * repassado nao e recalculado.
 */

import { PrismaClient } from '@prisma/client';
import { recalcSellerMonth } from '../src/services/commissionService';
import { periodOf } from '../src/lib/dates';

const prisma = new PrismaClient();

async function main() {
  const sales = await prisma.sale.findMany({
    select: { sellerId: true, soldAt: true },
  });

  if (sales.length === 0) {
    console.log('Nenhuma venda registrada. Nada a reprocessar.');
    return;
  }

  // Combinacoes distintas de vendedor + mes.
  const keys = new Map<string, { sellerId: string; month: number; year: number }>();
  for (const sale of sales) {
    const period = periodOf(sale.soldAt);
    const key = `${sale.sellerId}:${period.year}-${period.month}`;
    if (!keys.has(key)) keys.set(key, { sellerId: sale.sellerId, ...period });
  }

  const before = await prisma.commission.aggregate({ _sum: { amount: true }, _count: { _all: true } });

  for (const { sellerId, month, year } of keys.values()) {
    await recalcSellerMonth(sellerId, { month, year }, prisma);
  }

  const after = await prisma.commission.aggregate({ _sum: { amount: true }, _count: { _all: true } });
  const frozen = await prisma.commission.count({ where: { status: 'PAGA' } });

  console.log(`Periodos reprocessados: ${keys.size}`);
  console.log(`Comissoes: ${before._count._all} -> ${after._count._all}`);
  console.log(
    `Total: R$ ${(before._sum.amount ?? 0).toFixed(2)} -> R$ ${(after._sum.amount ?? 0).toFixed(2)}`,
  );
  console.log(`Preservadas por ja estarem pagas: ${frozen}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
