/**
 * Enumeracoes do dominio.
 *
 * O SQLite nao suporta enums nativos no Prisma, entao os campos sao String e a
 * validacao acontece aqui + nos schemas Zod. Ao migrar para PostgreSQL estes
 * valores podem virar enums do banco sem alterar a camada de aplicacao.
 */

export const ROLES = ['ADMIN', 'SELLER'] as const;
export type Role = (typeof ROLES)[number];

export const LEAD_STATUSES = [
  'NOVO',
  'CONTATO_REALIZADO',
  'EM_NEGOCIACAO',
  'PROPOSTA_ENVIADA',
  'AGUARDANDO_PAGAMENTO',
  'GANHO',
  'PERDIDO',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Status que representam uma negociacao encerrada. */
export const LEAD_CLOSED_STATUSES: LeadStatus[] = ['GANHO', 'PERDIDO'];

export const SALE_STATUSES = [
  'PENDENTE',
  'PAGO',
  'CANCELADO',
  'EM_EXECUCAO',
  'CONCLUIDO',
] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

/** Vendas que ainda contam para o funil (nao canceladas). */
export const SALE_ACTIVE_STATUSES: SaleStatus[] = [
  'PENDENTE',
  'PAGO',
  'EM_EXECUCAO',
  'CONCLUIDO',
];

/** Vendas que ja tiveram o dinheiro recebido pela Frame Digital. */
export const SALE_PAID_STATUSES: SaleStatus[] = ['PAGO', 'CONCLUIDO'];

export const PAYMENT_METHODS = [
  'PIX',
  'BOLETO',
  'CARTAO',
  'TRANSFERENCIA',
  'DINHEIRO',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const COMMISSION_STATUSES = [
  'PREVISTA', // venda registrada, ainda nao paga pelo cliente
  'PENDENTE', // venda paga, aguardando aprovacao do admin
  'LIBERADA', // aprovada pelo admin, a pagar ao vendedor
  'PAGA', // repassada ao vendedor
  'CANCELADA',
] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  'INFO',
  'SUCCESS',
  'WARNING',
  'GOAL',
  'RANKING',
  'COMMISSION',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const MATERIAL_CATEGORIES = ['GERAL', 'COMERCIAL', 'TECNICO', 'MIDIA'] as const;
export const MATERIAL_FILE_TYPES = ['LINK', 'PDF', 'DOC', 'IMAGE', 'VIDEO'] as const;

export const AUDIT_ACTIONS = [
  'LOGIN',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'RELEASE',
  'PAY',
  'BLOCK',
  'UNBLOCK',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
