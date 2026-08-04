/**
 * Testes das regras de negocio. Rodam sem framework externo:
 *   npm --prefix server run test
 *
 * Cobrem as funcoes puras de comissao e um teste de integracao que exercita o
 * motor contra o banco de desenvolvimento (criando e removendo dados proprios).
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  COMMISSION_TIERS,
  commissionAmount,
  nextTierProgress,
  rateForSalesCount,
  round2,
  tierForSalesCount,
} from '../domain/commission';
import { lastPeriods, monthRange, periodOf, shiftPeriod } from '../lib/dates';
import { recalcSellerMonth } from '../services/commissionService';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, extra?: string) {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.error(`  FALHOU ${name}${extra ? ` -> ${extra}` : ''}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown) {
  check(name, Object.is(actual, expected), `esperado ${expected}, recebido ${actual}`);
}

// ---------------------------------------------------------------------------
// Funcoes puras
// ---------------------------------------------------------------------------

function testTiers() {
  console.log('\nFaixas de comissao');

  eq('0 vendas -> 15%', rateForSalesCount(0), 0.15);
  eq('2 vendas -> 15%', rateForSalesCount(2), 0.15);
  eq('3 vendas -> 20%', rateForSalesCount(3), 0.2);
  eq('5 vendas -> 20%', rateForSalesCount(5), 0.2);
  eq('6 vendas -> 25%', rateForSalesCount(6), 0.25);
  eq('9 vendas -> 25%', rateForSalesCount(9), 0.25);
  eq('10 vendas -> 30%', rateForSalesCount(10), 0.3);
  eq('40 vendas -> 30%', rateForSalesCount(40), 0.3);
  eq('negativo trata como 0', rateForSalesCount(-3), 0.15);

  eq('override do admin prevalece', rateForSalesCount(1, 0.4), 0.4);
  eq('override invalido e ignorado', rateForSalesCount(1, 0), 0.15);
  eq('override nulo e ignorado', rateForSalesCount(7, null), 0.25);

  eq('faixa de 7 vendas', tierForSalesCount(7).rate, 0.25);
  eq('proxima faixa de 7 vendas exige 3', nextTierProgress(7)?.salesRemaining, 3);
  eq('sem proxima faixa em 10+', nextTierProgress(12), null);

  check('as faixas cobrem 0..50 sem lacuna', Array.from({ length: 51 }, (_, i) => i).every((n) =>
    COMMISSION_TIERS.some((t) => n >= t.min && n <= t.max),
  ));

  console.log('\nCalculo do valor');
  eq('exemplo da especificacao: 7 x R$500 a 25%', commissionAmount(3500, 0.25), 875);
  eq('uma venda de R$500 a 25%', commissionAmount(500, 0.25), 125);
  eq('arredonda 2 casas', commissionAmount(333.33, 0.15), 50);
  eq('round2 corrige ponto flutuante', round2(0.1 + 0.2), 0.3);
}

function testDates() {
  console.log('\nPeriodos');

  const jan = { month: 1, year: 2025 };
  eq('mes anterior a jan/2025 e dez/2024', shiftPeriod(jan, -1).month, 12);
  eq('ano do mes anterior a jan/2025', shiftPeriod(jan, -1).year, 2024);
  eq('lastPeriods devolve a quantidade pedida', lastPeriods(6, jan).length, 6);
  eq('lastPeriods termina no periodo informado', lastPeriods(6, jan)[5].month, 1);

  const range = monthRange(jan);
  check('range comeca no dia 1', range.gte.getDate() === 1 && range.gte.getMonth() === 0);
  check('range termina no 1o de fevereiro', range.lt.getMonth() === 1 && range.lt.getDate() === 1);

  const d = new Date(2025, 6, 15);
  eq('periodOf devolve mes 1-based', periodOf(d).month, 7);
}

// ---------------------------------------------------------------------------
// Integracao: motor de comissao contra o banco
// ---------------------------------------------------------------------------

async function testCommissionEngine() {
  console.log('\nMotor de comissao (integracao)');

  const stamp = Date.now();
  const period = { month: 6, year: 2099 }; // periodo isolado, nao colide com o seed

  const user = await prisma.user.create({
    data: {
      name: 'Teste Automatizado',
      email: `teste-${stamp}@framedigital.test`,
      passwordHash: await bcrypt.hash('teste12345', 4),
      role: 'SELLER',
      seller: { create: { code: `TST-${stamp % 100000}` } },
    },
    include: { seller: true },
  });
  const sellerId = user.seller!.id;

  const service = await prisma.service.create({
    data: { name: `Servico de teste ${stamp}`, price: 500 },
  });

  const client = await prisma.client.create({
    data: { company: 'Cliente de Teste', contactName: 'Fulano', sellerId },
  });

  let saleNumber = 900000; // faixa propria, nao colide com os dados reais
  const makeSale = (day: number, status: string, amount = 500) =>
    prisma.sale.create({
      data: {
        number: ++saleNumber,
        clientId: client.id,
        serviceId: service.id,
        sellerId,
        amount,
        status,
        soldAt: new Date(period.year, period.month - 1, day),
        paidAt:
          status === 'PAGO' || status === 'CONCLUIDO'
            ? new Date(period.year, period.month - 1, day)
            : null,
      },
    });

  try {
    // 2 vendas pagas -> faixa de 15%
    await makeSale(1, 'PAGO');
    await makeSale(2, 'PAGO');
    await recalcSellerMonth(sellerId, period, prisma);

    let commissions = await prisma.commission.findMany({
      where: { sellerId, referenceMonth: period.month, referenceYear: period.year },
    });
    eq('2 vendas geram 2 comissoes', commissions.length, 2);
    eq('faixa aplicada e 15%', commissions[0].rate, 0.15);
    eq('valor por venda R$75', commissions[0].amount, 75);
    eq('status inicial PENDENTE (venda paga)', commissions[0].status, 'PENDENTE');

    // Sobe para 7 vendas pagas -> TODAS as comissoes do mes viram 25%
    for (let day = 3; day <= 7; day++) await makeSale(day, 'PAGO');
    await recalcSellerMonth(sellerId, period, prisma);

    commissions = await prisma.commission.findMany({
      where: { sellerId, referenceMonth: period.month, referenceYear: period.year },
    });
    eq('7 vendas geram 7 comissoes', commissions.length, 7);
    check(
      'todas as comissoes do mes foram reajustadas para 25%',
      commissions.every((c) => c.rate === 0.25),
      commissions.map((c) => c.rate).join(','),
    );
    eq(
      'total do mes bate com o exemplo (R$875)',
      round2(commissions.reduce((s, c) => s + c.amount, 0)),
      875,
    );

    // Venda nao paga entra como PREVISTA e nao conta para a faixa
    const pending = await makeSale(8, 'PENDENTE');
    await recalcSellerMonth(sellerId, period, prisma);
    const previstaCommission = await prisma.commission.findUnique({
      where: { saleId: pending.id },
    });
    eq('venda pendente gera comissao PREVISTA', previstaCommission?.status, 'PREVISTA');
    check(
      'venda pendente nao muda a faixa',
      (await prisma.commission.findFirst({ where: { sellerId } }))?.rate === 0.25,
    );

    // Comissao PAGA e congelada: nao muda mesmo com nova venda
    const frozen = commissions[0];
    await prisma.commission.update({
      where: { id: frozen.id },
      data: { status: 'PAGA', amount: 75, rate: 0.15, paidAt: new Date() },
    });
    await makeSale(9, 'PAGO');
    await makeSale(10, 'PAGO');
    await makeSale(11, 'PAGO'); // chega a 10 pagas -> faixa de 30%
    await recalcSellerMonth(sellerId, period, prisma);

    const afterFreeze = await prisma.commission.findUnique({ where: { id: frozen.id } });
    eq('comissao PAGA mantem o valor', afterFreeze?.amount, 75);
    eq('comissao PAGA mantem o percentual', afterFreeze?.rate, 0.15);

    const others = await prisma.commission.findMany({
      where: { sellerId, status: { in: ['PENDENTE', 'LIBERADA'] } },
    });
    check(
      'demais comissoes sobem para 30%',
      others.length > 0 && others.every((c) => c.rate === 0.3),
      others.map((c) => c.rate).join(','),
    );

    // Cancelamento zera a comissao e derruba a faixa
    const sales = await prisma.sale.findMany({
      where: { sellerId, status: 'PAGO' },
      orderBy: { soldAt: 'desc' },
      take: 1,
    });
    await prisma.sale.update({
      where: { id: sales[0].id },
      data: { status: 'CANCELADO', paidAt: null },
    });
    await recalcSellerMonth(sellerId, period, prisma);

    const cancelled = await prisma.commission.findUnique({ where: { saleId: sales[0].id } });
    eq('venda cancelada zera a comissao', cancelled?.amount, 0);
    eq('venda cancelada marca comissao CANCELADA', cancelled?.status, 'CANCELADA');
  } finally {
    // Limpa tudo que o teste criou.
    await prisma.commission.deleteMany({ where: { sellerId } });
    await prisma.sale.deleteMany({ where: { sellerId } });
    await prisma.client.deleteMany({ where: { sellerId } });
    await prisma.service.delete({ where: { id: service.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
}

async function main() {
  console.log('FRAME DIGITAL SALES - testes de regras de negocio');

  testTiers();
  testDates();
  await testCommissionEngine();

  console.log(`\n${passed} passaram, ${failed} falharam\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error('Erro ao executar os testes:', error);
  await prisma.$disconnect();
  process.exit(1);
});
