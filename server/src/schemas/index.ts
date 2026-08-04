import { z } from 'zod';
import {
  COMMISSION_STATUSES,
  LEAD_STATUSES,
  MATERIAL_CATEGORIES,
  MATERIAL_FILE_TYPES,
  PAYMENT_METHODS,
  ROLES,
  SALE_STATUSES,
} from '../domain/enums';

// ---------------------------------------------------------------------------
// Primitivos reutilizaveis
// ---------------------------------------------------------------------------

const nonEmpty = (label: string, max = 180) =>
  z
    .string({ required_error: `${label} e obrigatorio.` })
    .trim()
    .min(1, `${label} e obrigatorio.`)
    .max(max, `${label} deve ter no maximo ${max} caracteres.`);

/** Campo opcional de texto: '' vira undefined para nao gravar string vazia. */
const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Deve ter no maximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalEmail = z
  .string()
  .trim()
  .max(180)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || z.string().email().safeParse(v).success, {
    message: 'E-mail invalido.',
  });

const money = z
  .coerce
  .number({ invalid_type_error: 'Informe um valor numerico.' })
  .min(0, 'O valor nao pode ser negativo.')
  .max(10_000_000, 'Valor acima do limite permitido.');

const isoDate = z.coerce.date({ invalid_type_error: 'Data invalida.' });

export const idParam = z.object({ id: z.string().min(1) });

export const periodQuery = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  sellerId: z.string().optional(),
});

export const listQuery = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  sellerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  sort: z.string().trim().optional(),
});
export type ListQuery = z.infer<typeof listQuery>;

// ---------------------------------------------------------------------------
// Autenticacao
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail invalido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail invalido.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token invalido.'),
  password: z.string().min(8, 'A senha deve ter no minimo 8 caracteres.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z.string().min(8, 'A nova senha deve ter no minimo 8 caracteres.'),
});

/**
 * Foto de perfil recebida como data URL.
 *
 * Nunca confiar no redimensionamento feito no navegador: o cliente pode enviar
 * qualquer coisa. Aqui checamos o formato, restringimos os tipos de imagem
 * aceitos e limitamos o tamanho. String vazia ou null significam "remover a
 * foto" e sao normalizadas para null.
 */
const MAX_AVATAR_BYTES = 400 * 1024; // ~400 KB de data URL

export const avatarUrlField = z
  .string()
  .nullable()
  .optional()
  // Tres estados distintos, e a diferenca importa: `undefined` = campo nao veio
  // no corpo (mantem a foto atual), `null`/'' = remover a foto, string = nova
  // foto. Colapsar undefined em null apagaria a foto a cada salvamento de perfil.
  .transform((v) => (v === undefined ? undefined : v || null))
  .refine(
    (v) => v == null || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
    { message: 'Envie uma imagem PNG, JPEG ou WebP.' },
  )
  .refine((v) => v == null || v.length <= MAX_AVATAR_BYTES, {
    message: 'A imagem e muito grande. Use uma foto menor.',
  });

export const updateProfileSchema = z.object({
  name: nonEmpty('Nome'),
  phone: optionalText(40),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor invalida.')
    .optional(),
  avatarUrl: avatarUrlField,
});

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const createLeadSchema = z.object({
  company: nonEmpty('Nome da empresa'),
  contactName: nonEmpty('Nome do responsavel'),
  whatsapp: optionalText(40),
  instagram: optionalText(80),
  email: optionalEmail,
  city: optionalText(80),
  segment: optionalText(80),
  notes: optionalText(2000),
  status: z.enum(LEAD_STATUSES).default('NOVO'),
  value: money.optional(),
  lastContactAt: isoDate.optional(),
  // Somente o admin pode informar; ignorado para vendedores.
  sellerId: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  document: optionalText(30),
  notes: optionalText(2000),
});

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export const createClientSchema = z.object({
  company: nonEmpty('Nome da empresa'),
  contactName: nonEmpty('Nome do responsavel'),
  document: optionalText(30),
  whatsapp: optionalText(40),
  email: optionalEmail,
  instagram: optionalText(80),
  city: optionalText(80),
  segment: optionalText(80),
  notes: optionalText(2000),
  active: z.boolean().optional(),
  sellerId: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// ---------------------------------------------------------------------------
// Vendas
// ---------------------------------------------------------------------------

export const createSaleSchema = z.object({
  clientId: nonEmpty('Cliente'),
  serviceId: nonEmpty('Servico'),
  amount: money.refine((v) => v > 0, 'O valor da venda deve ser maior que zero.'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('PIX'),
  status: z.enum(SALE_STATUSES).default('PENDENTE'),
  soldAt: isoDate.optional(),
  notes: optionalText(2000),
  sellerId: z.string().optional(),
});

export const updateSaleSchema = createSaleSchema.partial();

export const saleStatusSchema = z.object({
  status: z.enum(SALE_STATUSES),
});

// ---------------------------------------------------------------------------
// Servicos e materiais (admin)
// ---------------------------------------------------------------------------

export const createServiceSchema = z.object({
  name: nonEmpty('Nome do servico'),
  description: optionalText(1000),
  price: money,
  recurring: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createMaterialSchema = z.object({
  title: nonEmpty('Titulo'),
  description: optionalText(1000),
  category: z.enum(MATERIAL_CATEGORIES).default('GERAL'),
  url: z.string().trim().url('Informe uma URL valida.'),
  fileType: z.enum(MATERIAL_FILE_TYPES).default('LINK'),
  active: z.boolean().default(true),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// ---------------------------------------------------------------------------
// Metas
// ---------------------------------------------------------------------------

export const upsertGoalSchema = z.object({
  sellerId: nonEmpty('Vendedor'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  salesTarget: z.coerce.number().int().min(0).max(1000),
  revenueTarget: money,
});

// ---------------------------------------------------------------------------
// Vendedores (admin)
// ---------------------------------------------------------------------------

export const createSellerSchema = z.object({
  name: nonEmpty('Nome'),
  email: z.string().trim().toLowerCase().email('E-mail invalido.'),
  password: z.string().min(8, 'A senha deve ter no minimo 8 caracteres.'),
  code: z
    .string()
    .trim()
    .min(2, 'Codigo obrigatorio.')
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Use apenas letras, numeros e hifen.')
    .optional(),
  phone: optionalText(40),
  city: optionalText(80),
  role: z.enum(ROLES).default('SELLER'),
  avatarUrl: avatarUrlField,
  commissionOverride: z
    .coerce
    .number()
    .min(0)
    .max(1)
    .optional()
    .nullable()
    .describe('Percentual fixo (0.25 = 25%). Vazio usa a tabela progressiva.'),
});

export const updateSellerSchema = z.object({
  name: nonEmpty('Nome').optional(),
  email: z.string().trim().toLowerCase().email('E-mail invalido.').optional(),
  password: z.string().min(8, 'A senha deve ter no minimo 8 caracteres.').optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Use apenas letras, numeros e hifen.')
    .optional(),
  phone: optionalText(40),
  city: optionalText(80),
  active: z.boolean().optional(),
  role: z.enum(ROLES).optional(),
  avatarUrl: avatarUrlField,
  commissionOverride: z.coerce.number().min(0).max(1).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Comissoes (admin)
// ---------------------------------------------------------------------------

export const commissionActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Selecione ao menos uma comissao.'),
});

export const payCommissionsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Selecione ao menos uma comissao.'),
  method: z.enum(PAYMENT_METHODS).default('PIX'),
  notes: optionalText(500),
});

export const commissionListQuery = listQuery.extend({
  // 'all' e o valor que o seletor da interface usa para "sem filtro".
  status: z.union([z.enum(COMMISSION_STATUSES), z.literal('all')]).optional(),
});
