import { prisma } from './prisma';
import { hashPassword } from './auth';
import { env } from '../config/env';

/**
 * Catalogo inicial de servicos. Criado apenas num banco vazio (primeiro
 * deploy), para o sistema ja subir pronto para registrar vendas. Depois disso,
 * o administrador edita precos, adiciona e remove servicos pela tela Servicos --
 * estes valores sao so um ponto de partida.
 */
const DEFAULT_SERVICES = [
  { name: 'Site basico', description: 'Site institucional de ate 5 paginas, responsivo, com formulario de contato.', price: 500, recurring: false },
  { name: 'Site profissional', description: 'Site completo com blog, SEO tecnico, integracoes e painel de edicao.', price: 1000, recurring: false },
  { name: 'Identidade visual', description: 'Logotipo, paleta, tipografia e manual de aplicacao da marca.', price: 600, recurring: false },
  { name: 'Social Media', description: 'Gestao de redes sociais: 12 artes e legendas por mes.', price: 800, recurring: true },
  { name: 'Landing page', description: 'Pagina unica focada em conversao, com integracao de leads.', price: 350, recurring: false },
  { name: 'Loja virtual', description: 'E-commerce com meios de pagamento, frete e gestao de pedidos.', price: 2500, recurring: false },
  { name: 'Manutencao mensal', description: 'Backup, atualizacoes de seguranca e pequenos ajustes.', price: 150, recurring: true },
];

/**
 * Prepara um banco recem-criado: garante o administrador e o catalogo de
 * servicos. Idempotente e seguro para rodar a cada inicializacao.
 */
export async function bootstrap(): Promise<void> {
  await ensureAdmin();
  await ensureCatalog();
}

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

/**
 * Cria o catalogo inicial de servicos apenas quando ainda nao ha nenhum
 * cadastrado. Nunca mexe num catalogo ja existente.
 */
export async function ensureCatalog(): Promise<void> {
  const existing = await prisma.service.count();
  if (existing > 0) return;

  await prisma.service.createMany({ data: DEFAULT_SERVICES });
  console.log(`  [bootstrap] catalogo inicial criado: ${DEFAULT_SERVICES.length} servicos`);
}
