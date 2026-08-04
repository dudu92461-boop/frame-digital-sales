/**
 * Dados de demonstracao do FRAME DIGITAL SALES.
 *
 * Gera uma operacao completa e coerente: 1 admin, 5 vendedores, 20 leads,
 * 10 clientes, 15 vendas distribuidas em 4 meses, metas, servicos e materiais.
 * As comissoes NAO sao escritas a mao: sao produzidas pelo mesmo motor usado em
 * producao (recalcSellerMonth), entao os valores exibidos no sistema conferem
 * com as regras de faixa progressiva.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { recalcSellerMonth } from '../src/services/commissionService';
import { shiftPeriod, currentPeriod, type Period } from '../src/lib/dates';

const prisma = new PrismaClient();

const PASSWORD = 'frame@2025';

/** Data dentro do periodo informado, no dia pedido. */
function dayIn(period: Period, day: number): Date {
  return new Date(period.year, period.month - 1, Math.min(day, 28), 10, 0, 0);
}

async function main() {
  console.log('Limpando base...');
  // Ordem importa: filhos antes dos pais.
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.service.deleteMany();
  await prisma.material.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // -------------------------------------------------------------------------
  // Usuarios
  // -------------------------------------------------------------------------
  console.log('Criando usuarios...');

  const admin = await prisma.user.create({
    data: {
      name: 'Eduardo Rocha',
      email: 'admin@framedigital.com.br',
      passwordHash,
      role: 'ADMIN',
      phone: '(51) 99000-0000',
      avatarColor: '#0f172a',
      seller: { create: { code: 'FD-000', city: 'Porto Alegre' } },
    },
    include: { seller: true },
  });

  const sellerSeeds = [
    { name: 'Joao Almeida', email: 'joao@framedigital.com.br', code: 'FD-001', city: 'Porto Alegre', color: '#2563eb' },
    { name: 'Pedro Carvalho', email: 'pedro@framedigital.com.br', code: 'FD-002', city: 'Canoas', color: '#0f766e' },
    { name: 'Lucas Ferreira', email: 'lucas@framedigital.com.br', code: 'FD-003', city: 'Gravatai', color: '#b45309' },
    { name: 'Mariana Souza', email: 'mariana@framedigital.com.br', code: 'FD-004', city: 'Novo Hamburgo', color: '#7c3aed' },
    { name: 'Rafael Lima', email: 'rafael@framedigital.com.br', code: 'FD-005', city: 'Sao Leopoldo', color: '#be123c' },
  ];

  const sellers = [];
  for (const s of sellerSeeds) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: 'SELLER',
        phone: '(51) 98' + Math.floor(100000 + Math.random() * 899999),
        avatarColor: s.color,
        seller: { create: { code: s.code, city: s.city } },
      },
      include: { seller: true },
    });
    sellers.push({ ...s, userId: user.id, sellerId: user.seller!.id });
  }

  // -------------------------------------------------------------------------
  // Catalogo de servicos
  // -------------------------------------------------------------------------
  console.log('Criando servicos...');

  const serviceSeeds = [
    { name: 'Site basico', description: 'Site institucional de ate 5 paginas, responsivo, com formulario de contato.', price: 500, recurring: false },
    { name: 'Site profissional', description: 'Site completo com blog, SEO tecnico, integracoes e painel de edicao.', price: 1000, recurring: false },
    { name: 'Identidade visual', description: 'Logotipo, paleta, tipografia e manual de aplicacao da marca.', price: 600, recurring: false },
    { name: 'Social Media', description: 'Gestao de redes sociais: 12 artes e legendas por mes.', price: 800, recurring: true },
    { name: 'Landing page', description: 'Pagina unica focada em conversao, com integracao de leads.', price: 350, recurring: false },
    { name: 'Loja virtual', description: 'E-commerce com meios de pagamento, frete e gestao de pedidos.', price: 2500, recurring: false },
    { name: 'Manutencao mensal', description: 'Backup, atualizacoes de seguranca e pequenos ajustes.', price: 150, recurring: true },
  ];

  const services: Awaited<ReturnType<typeof prisma.service.create>>[] = [];
  for (const s of serviceSeeds) {
    services.push(await prisma.service.create({ data: s }));
  }
  const byService = (name: string) => services.find((s) => s.name === name)!;

  // -------------------------------------------------------------------------
  // Materiais de apoio
  // -------------------------------------------------------------------------
  console.log('Criando materiais...');

  await prisma.material.createMany({
    data: [
      { title: 'Tabela de precos 2025', description: 'Valores oficiais e condicoes de parcelamento.', category: 'COMERCIAL', url: 'https://framedigital.com.br/materiais/tabela-precos', fileType: 'PDF' },
      { title: 'Modelo de proposta comercial', description: 'Documento editavel para envio ao cliente.', category: 'COMERCIAL', url: 'https://framedigital.com.br/materiais/proposta', fileType: 'DOC' },
      { title: 'Portfolio de sites', description: 'Projetos entregues, por segmento.', category: 'MIDIA', url: 'https://framedigital.com.br/portfolio', fileType: 'LINK' },
      { title: 'Script de abordagem no WhatsApp', description: 'Roteiro de primeiro contato e quebra de objecoes.', category: 'COMERCIAL', url: 'https://framedigital.com.br/materiais/script-whatsapp', fileType: 'PDF' },
      { title: 'Checklist de briefing', description: 'O que levantar antes de passar o projeto para producao.', category: 'TECNICO', url: 'https://framedigital.com.br/materiais/briefing', fileType: 'PDF' },
      { title: 'Politica de comissionamento', description: 'Faixas, prazos de liberacao e datas de repasse.', category: 'GERAL', url: 'https://framedigital.com.br/materiais/comissoes', fileType: 'PDF' },
    ],
  });

  // -------------------------------------------------------------------------
  // Leads (20)
  // -------------------------------------------------------------------------
  console.log('Criando leads...');

  const now = currentPeriod();
  const m1 = shiftPeriod(now, -1);
  const m2 = shiftPeriod(now, -2);
  const m3 = shiftPeriod(now, -3);

  const leadSeeds = [
    { company: 'Pizzaria Rocha', contactName: 'Marcos Rocha', segment: 'Alimentacao', city: 'Porto Alegre', status: 'GANHO', seller: 0, value: 500 },
    { company: 'Auto Center Silva', contactName: 'Jorge Silva', segment: 'Automotivo', city: 'Canoas', status: 'GANHO', seller: 1, value: 1000 },
    { company: 'Studio Bella Estetica', contactName: 'Bruna Martins', segment: 'Beleza', city: 'Porto Alegre', status: 'GANHO', seller: 0, value: 800 },
    { company: 'Clinica OdontoVida', contactName: 'Dra. Helena Reis', segment: 'Saude', city: 'Gravatai', status: 'GANHO', seller: 2, value: 1000 },
    { company: 'Mercado Bom Preco', contactName: 'Antonio Prado', segment: 'Varejo', city: 'Canoas', status: 'GANHO', seller: 1, value: 600 },
    { company: 'Academia Corpo Ativo', contactName: 'Diego Nunes', segment: 'Fitness', city: 'Novo Hamburgo', status: 'GANHO', seller: 3, value: 800 },
    { company: 'Petshop Amigo Fiel', contactName: 'Carla Beteli', segment: 'Pet', city: 'Sao Leopoldo', status: 'GANHO', seller: 4, value: 500 },
    { company: 'Advocacia Menezes', contactName: 'Dr. Paulo Menezes', segment: 'Juridico', city: 'Porto Alegre', status: 'GANHO', seller: 0, value: 1000 },
    { company: 'Padaria Trigo de Ouro', contactName: 'Ines Prado', segment: 'Alimentacao', city: 'Gravatai', status: 'GANHO', seller: 2, value: 500 },
    { company: 'Construtora Horizonte', contactName: 'Eng. Ricardo Alves', segment: 'Construcao', city: 'Porto Alegre', status: 'GANHO', seller: 3, value: 2500 },

    { company: 'Barbearia Navalha', contactName: 'Tiago Moraes', segment: 'Beleza', city: 'Canoas', status: 'PROPOSTA_ENVIADA', seller: 1, value: 500 },
    { company: 'Restaurante Sabor Gaucho', contactName: 'Vera Machado', segment: 'Alimentacao', city: 'Porto Alegre', status: 'EM_NEGOCIACAO', seller: 0, value: 1000 },
    { company: 'Otica Visao Clara', contactName: 'Sergio Bastos', segment: 'Saude', city: 'Sao Leopoldo', status: 'AGUARDANDO_PAGAMENTO', seller: 4, value: 600 },
    { company: 'Escola Infantil Pequeno Mundo', contactName: 'Adriana Costa', segment: 'Educacao', city: 'Novo Hamburgo', status: 'EM_NEGOCIACAO', seller: 3, value: 1000 },
    { company: 'Floricultura Jardim', contactName: 'Lucia Ramos', segment: 'Varejo', city: 'Gravatai', status: 'CONTATO_REALIZADO', seller: 2, value: 350 },
    { company: 'Transportes Rapidos LTDA', contactName: 'Fabio Teixeira', segment: 'Logistica', city: 'Canoas', status: 'CONTATO_REALIZADO', seller: 1, value: 1000 },
    { company: 'Imobiliaria Novo Lar', contactName: 'Renata Fogaca', segment: 'Imobiliario', city: 'Porto Alegre', status: 'NOVO', seller: 0, value: 2500 },
    { company: 'Marcenaria Arte em Madeira', contactName: 'Osvaldo Kunz', segment: 'Industria', city: 'Sao Leopoldo', status: 'NOVO', seller: 4, value: 600 },
    { company: 'Doceria Doce Encanto', contactName: 'Patricia Lemos', segment: 'Alimentacao', city: 'Novo Hamburgo', status: 'PERDIDO', seller: 3, value: 500 },
    { company: 'Oficina Motor Forte', contactName: 'Cleber Duarte', segment: 'Automotivo', city: 'Gravatai', status: 'PERDIDO', seller: 2, value: 800 },
  ];

  const leads = [];
  for (const [i, l] of leadSeeds.entries()) {
    const period = i < 10 ? [m3, m2, m1, now][i % 4] : now;
    const lead = await prisma.lead.create({
      data: {
        company: l.company,
        contactName: l.contactName,
        whatsapp: `(51) 9${8000 + i}-${1000 + i * 7}`,
        instagram: '@' + l.company.toLowerCase().replace(/[^a-z0-9]+/g, ''),
        email: `contato@${l.company.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com.br`,
        city: l.city,
        segment: l.segment,
        status: l.status,
        value: l.value,
        notes:
          l.status === 'PERDIDO'
            ? 'Cliente optou por um concorrente com preco menor.'
            : 'Contato inicial feito pelo Instagram.',
        sellerId: sellers[l.seller].sellerId,
        createdAt: dayIn(period, 3 + (i % 20)),
        lastContactAt: dayIn(period, 5 + (i % 20)),
      },
    });
    leads.push({ ...lead, sellerIndex: l.seller });
  }

  // -------------------------------------------------------------------------
  // Clientes (10) - convertidos dos 10 primeiros leads GANHO
  // -------------------------------------------------------------------------
  console.log('Criando clientes...');

  const clients = [];
  for (const lead of leads.slice(0, 10)) {
    const client = await prisma.client.create({
      data: {
        company: lead.company,
        contactName: lead.contactName,
        whatsapp: lead.whatsapp,
        email: lead.email,
        instagram: lead.instagram,
        city: lead.city,
        segment: lead.segment,
        notes: 'Cliente ativo. Convertido a partir do lead.',
        sellerId: lead.sellerId,
        createdAt: lead.createdAt,
      },
    });
    await prisma.lead.update({ where: { id: lead.id }, data: { clientId: client.id } });
    clients.push({ ...client, sellerIndex: lead.sellerIndex });
  }

  // -------------------------------------------------------------------------
  // Vendas (15)
  // -------------------------------------------------------------------------
  console.log('Criando vendas...');

  // Joao (indice 0) fecha 7 vendas pagas no mes corrente para exercitar a faixa
  // de 25% descrita na especificacao: 7 x R$ 500 = R$ 3.500 -> comissao R$ 875.
  const saleSeeds: Array<{
    client: number;
    service: string;
    amount: number;
    status: string;
    period: Period;
    day: number;
    method: string;
    approved: boolean;
  }> = [
    // --- Mes corrente: Joao (cliente 0, 2, 7 sao dele) ---
    { client: 0, service: 'Site basico', amount: 500, status: 'PAGO', period: now, day: 3, method: 'PIX', approved: true },
    { client: 0, service: 'Site basico', amount: 500, status: 'PAGO', period: now, day: 5, method: 'PIX', approved: true },
    { client: 2, service: 'Site basico', amount: 500, status: 'PAGO', period: now, day: 7, method: 'PIX', approved: true },
    { client: 2, service: 'Site basico', amount: 500, status: 'CONCLUIDO', period: now, day: 9, method: 'CARTAO', approved: true },
    { client: 7, service: 'Site basico', amount: 500, status: 'PAGO', period: now, day: 11, method: 'PIX', approved: true },
    { client: 7, service: 'Site basico', amount: 500, status: 'PAGO', period: now, day: 13, method: 'BOLETO', approved: false },
    { client: 0, service: 'Site basico', amount: 500, status: 'CONCLUIDO', period: now, day: 15, method: 'PIX', approved: false },

    // --- Mes corrente: outros vendedores ---
    { client: 1, service: 'Site profissional', amount: 1000, status: 'PAGO', period: now, day: 4, method: 'PIX', approved: true },
    { client: 4, service: 'Identidade visual', amount: 600, status: 'PAGO', period: now, day: 8, method: 'CARTAO', approved: true },
    { client: 3, service: 'Site profissional', amount: 1000, status: 'EM_EXECUCAO', period: now, day: 6, method: 'BOLETO', approved: false },
    { client: 5, service: 'Social Media', amount: 800, status: 'PAGO', period: now, day: 10, method: 'PIX', approved: true },
    { client: 9, service: 'Loja virtual', amount: 2500, status: 'PENDENTE', period: now, day: 12, method: 'TRANSFERENCIA', approved: false },

    // --- Meses anteriores (historico do grafico) ---
    { client: 6, service: 'Site basico', amount: 500, status: 'CONCLUIDO', period: m1, day: 14, method: 'PIX', approved: true },
    { client: 8, service: 'Site basico', amount: 500, status: 'CONCLUIDO', period: m1, day: 18, method: 'PIX', approved: true },
    { client: 1, service: 'Landing page', amount: 350, status: 'CANCELADO', period: m2, day: 9, method: 'PIX', approved: false },
  ];

  let saleNumber = 0;
  for (const s of saleSeeds) {
    const client = clients[s.client];
    const soldAt = dayIn(s.period, s.day);
    const isPaid = s.status === 'PAGO' || s.status === 'CONCLUIDO';

    await prisma.sale.create({
      data: {
        number: ++saleNumber,
        clientId: client.id,
        serviceId: byService(s.service).id,
        sellerId: client.sellerId,
        amount: s.amount,
        paymentMethod: s.method,
        status: s.status,
        soldAt,
        paidAt: isPaid ? soldAt : null,
        approved: s.approved,
        approvedAt: s.approved ? soldAt : null,
        approvedById: s.approved ? admin.id : null,
        notes: s.status === 'CANCELADO' ? 'Cliente desistiu antes do inicio do projeto.' : null,
        createdAt: soldAt,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Metas
  // -------------------------------------------------------------------------
  console.log('Criando metas...');

  const goalTargets = [
    { salesTarget: 10, revenueTarget: 5000 },
    { salesTarget: 8, revenueTarget: 6000 },
    { salesTarget: 6, revenueTarget: 4000 },
    { salesTarget: 8, revenueTarget: 5000 },
    { salesTarget: 6, revenueTarget: 3500 },
  ];

  for (const [i, seller] of sellers.entries()) {
    for (const period of [m1, now]) {
      await prisma.goal.create({
        data: {
          sellerId: seller.sellerId,
          month: period.month,
          year: period.year,
          ...goalTargets[i],
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Comissoes - geradas pelo motor real
  // -------------------------------------------------------------------------
  console.log('Calculando comissoes...');

  for (const seller of sellers) {
    for (const period of [m3, m2, m1, now]) {
      await recalcSellerMonth(seller.sellerId, period, prisma);
    }
  }

  // Libera as comissoes do mes anterior e marca como pagas, para que o painel
  // mostre os quatro estados (prevista, pendente, liberada, paga) desde o inicio.
  const lastMonthCommissions = await prisma.commission.findMany({
    where: { referenceMonth: m1.month, referenceYear: m1.year, status: 'PENDENTE' },
  });

  if (lastMonthCommissions.length > 0) {
    const bySeller = new Map<string, typeof lastMonthCommissions>();
    for (const c of lastMonthCommissions) {
      const list = bySeller.get(c.sellerId) ?? [];
      list.push(c);
      bySeller.set(c.sellerId, list);
    }
    for (const [sellerId, list] of bySeller) {
      const payment = await prisma.payment.create({
        data: {
          sellerId,
          amount: list.reduce((sum, c) => sum + c.amount, 0),
          method: 'PIX',
          notes: `Repasse referente a ${String(m1.month).padStart(2, '0')}/${m1.year}`,
          paidAt: dayIn(now, 5),
        },
      });
      await prisma.commission.updateMany({
        where: { id: { in: list.map((c) => c.id) } },
        data: { status: 'PAGA', releasedAt: dayIn(now, 4), paidAt: dayIn(now, 5), paymentId: payment.id },
      });
    }
  }

  // Uma comissao do mes corrente ja liberada, aguardando repasse.
  const toRelease = await prisma.commission.findFirst({
    where: {
      sellerId: sellers[0].sellerId,
      referenceMonth: now.month,
      referenceYear: now.year,
      status: 'PENDENTE',
    },
  });
  if (toRelease) {
    await prisma.commission.update({
      where: { id: toRelease.id },
      data: { status: 'LIBERADA', releasedAt: new Date() },
    });
  }

  // -------------------------------------------------------------------------
  // Notificacoes iniciais
  // -------------------------------------------------------------------------
  console.log('Criando notificacoes...');

  await prisma.notification.createMany({
    data: [
      { userId: sellers[0].userId, type: 'COMMISSION', title: 'Comissao liberada', message: 'Sua comissao foi aprovada e entrara no proximo repasse.', link: '/comissoes' },
      { userId: sellers[0].userId, type: 'GOAL', title: 'Voce atingiu 70% da sua meta', message: 'Voce esta com 7 de 10 vendas no mes.', link: '/metas' },
      { userId: sellers[0].userId, type: 'RANKING', title: 'Voce esta em 1o lugar no ranking', message: 'Continue assim para fechar o mes na lideranca.', link: '/ranking' },
      { userId: sellers[1].userId, type: 'SUCCESS', title: 'Venda aprovada', message: 'A venda para Auto Center Silva foi aprovada.', link: '/vendas' },
      { userId: sellers[2].userId, type: 'INFO', title: 'Nova tabela de precos', message: 'A tabela de precos 2025 esta disponivel em Materiais.', link: '/materiais' },
      { userId: admin.id, type: 'WARNING', title: 'Vendas aguardando aprovacao', message: 'Existem vendas pendentes de aprovacao no painel administrativo.', link: '/admin/vendas' },
    ],
  });

  // -------------------------------------------------------------------------
  // Resumo
  // -------------------------------------------------------------------------
  const counts = {
    usuarios: await prisma.user.count(),
    vendedores: await prisma.seller.count(),
    leads: await prisma.lead.count(),
    clientes: await prisma.client.count(),
    vendas: await prisma.sale.count(),
    comissoes: await prisma.commission.count(),
    servicos: await prisma.service.count(),
    metas: await prisma.goal.count(),
  };

  // Conferencia final. Se a API estiver rodando durante o seed, a disputa pelo
  // arquivo SQLite pode interromper a carga no meio e deixar a base incoerente
  // (por exemplo, clientes sem os leads que os originaram). Falhar aqui, alto e
  // claro, e melhor do que entregar uma base pela metade parecendo bem-sucedida.
  const expected: Record<string, number> = {
    usuarios: 1 + sellerSeeds.length,
    vendedores: 1 + sellerSeeds.length,
    leads: leadSeeds.length,
    clientes: 10,
    vendas: saleSeeds.length,
    servicos: serviceSeeds.length,
  };

  const wrong = Object.entries(expected).filter(([key, value]) => counts[key as keyof typeof counts] !== value);
  if (wrong.length > 0) {
    console.error('\n  Base incompleta:', counts);
    console.error('  Esperado:', expected);
    throw new Error(
      'O seed terminou com dados faltando. Pare a API (o SQLite nao aceita duas escritas ' +
        'concorrentes) e rode novamente: npm run db:reset',
    );
  }

  console.log('\n  Base populada:', counts);
  console.log('\n  Acessos (senha para todos: ' + PASSWORD + ')');
  console.log('  ADMIN     admin@framedigital.com.br');
  for (const s of sellerSeeds) console.log(`  VENDEDOR  ${s.email}`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('Falha ao popular a base:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
