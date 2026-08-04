export type Role = 'ADMIN' | 'SELLER';

export type LeadStatus =
  | 'NOVO'
  | 'CONTATO_REALIZADO'
  | 'EM_NEGOCIACAO'
  | 'PROPOSTA_ENVIADA'
  | 'AGUARDANDO_PAGAMENTO'
  | 'GANHO'
  | 'PERDIDO';

export type SaleStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'EM_EXECUCAO' | 'CONCLUIDO';

export type CommissionStatus = 'PREVISTA' | 'PENDENTE' | 'LIBERADA' | 'PAGA' | 'CANCELADA';

export type PaymentMethod = 'PIX' | 'BOLETO' | 'CARTAO' | 'TRANSFERENCIA' | 'DINHEIRO';

export interface SellerRef {
  id: string;
  code: string;
  user: { name: string };
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  phone: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  lastLoginAt: string | null;
  seller: { id: string; code: string; city: string | null; commissionOverride: number | null } | null;
}

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  city: string | null;
  segment: string | null;
  notes: string | null;
  status: LeadStatus;
  value: number | null;
  sellerId: string;
  clientId: string | null;
  lastContactAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: SellerRef;
  client?: { id: string; company: string } | null;
}

export interface Client {
  id: string;
  company: string;
  contactName: string;
  document: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  city: string | null;
  segment: string | null;
  notes: string | null;
  active: boolean;
  sellerId: string;
  createdAt: string;
  seller?: SellerRef;
  salesCount?: number;
  totalValue?: number;
  lastService?: string | null;
  lastSaleAt?: string | null;
  lastSaleStatus?: SaleStatus | null;
}

export interface ClientDetail extends Client {
  lead: { id: string; status: LeadStatus; createdAt: string } | null;
  sales: Sale[];
  summary: {
    salesCount: number;
    totalValue: number;
    paidValue: number;
    commissionTotal: number;
  };
}

export interface Sale {
  id: string;
  number: number;
  clientId: string;
  serviceId: string;
  sellerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string | null;
  approved: boolean;
  approvedAt: string | null;
  soldAt: string;
  paidAt: string | null;
  createdAt: string;
  client: { id: string; company: string; contactName?: string };
  service: { id: string; name: string; price?: number };
  seller?: SellerRef;
  commission: { id?: string; amount: number; rate: number; status: CommissionStatus } | null;
}

export interface Commission {
  id: string;
  saleId: string;
  sellerId: string;
  rate: number;
  amount: number;
  status: CommissionStatus;
  referenceMonth: number;
  referenceYear: number;
  releasedAt: string | null;
  paidAt: string | null;
  sale: {
    id: string;
    number: number;
    amount: number;
    status: SaleStatus;
    soldAt: string;
    approved: boolean;
    client: { id: string; company: string };
    service: { id: string; name: string };
  };
  seller?: SellerRef;
}

export interface CommissionSummary {
  prevista: { total: number; count: number };
  pendente: { total: number; count: number };
  liberada: { total: number; count: number };
  paga: { total: number; count: number };
  totalPrevisto: number;
  aReceber: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  recurring: boolean;
  active: boolean;
  _count?: { sales: number };
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  category: 'GERAL' | 'COMERCIAL' | 'TECNICO' | 'MIDIA';
  url: string;
  fileType: 'LINK' | 'PDF' | 'DOC' | 'IMAGE' | 'VIDEO';
  active: boolean;
}

export interface RankingRow {
  sellerId: string;
  code: string;
  name: string;
  avatarUrl: string | null;
  avatarColor: string;
  revenue: number;
  salesCount: number;
  commission: number;
  goalSales: number | null;
  goalPercent: number | null;
  position: number;
}

export interface GoalRow {
  sellerId: string;
  code: string;
  name: string;
  avatarUrl: string | null;
  avatarColor: string;
  goalId: string | null;
  salesTarget: number | null;
  revenueTarget: number | null;
  salesDone: number;
  revenueDone: number;
  salesPercent: number | null;
  revenuePercent: number | null;
}

export interface CommissionTier {
  min: number;
  max: number | null;
  rate: number;
  label: string;
}

export interface SellerAdmin {
  id: string;
  code: string;
  city: string | null;
  commissionOverride: number | null;
  hiredAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    active: boolean;
    avatarUrl: string | null;
    avatarColor: string;
    lastLoginAt: string | null;
  };
  _count: { leads: number; clients: number; sales: number };
  monthRevenue: number;
  monthSales: number;
  monthCommission: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'GOAL' | 'RANKING' | 'COMMISSION';
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  ip: string | null;
  createdAt: string;
}

export interface SeriesPoint {
  label: string;
  month: number;
  year: number;
  revenue: number;
  count: number;
  commission: number;
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface SellerDashboard {
  period: { month: number; year: number };
  seller: { id: string; code: string; user: { name: string } } | null;
  metrics: {
    revenue: number;
    salesCount: number;
    paidSalesCount: number;
    leadsTotal: number;
    leadsMonth: number;
    wonLeads: number;
    conversion: number;
  };
  commissions: CommissionSummary;
  tier: {
    current: { rate: number; label: string };
    next: { tier: { rate: number; label: string }; salesRemaining: number } | null;
    override: number | null;
  };
  goal: {
    salesTarget: number;
    revenueTarget: number;
    salesDone: number;
    revenueDone: number;
    salesPercent: number;
    revenuePercent: number;
  } | null;
  ranking: { position: number | null; total: number; top: RankingRow[] };
  recentSales: Sale[];
  series: SeriesPoint[];
}

export interface AdminDashboard {
  period: { month: number; year: number };
  metrics: {
    revenue: number;
    received: number;
    salesCount: number;
    paidSalesCount: number;
    sellersCount: number;
    activeSellers: number;
    leadsTotal: number;
    leadsMonth: number;
    wonLeads: number;
    conversion: number;
    servicesCount: number;
    pendingApproval: number;
    commissionCost: number;
    estimatedProfit: number;
    averageTicket: number;
  };
  commissions: CommissionSummary;
  ranking: RankingRow[];
  byService: { serviceId: string; name: string; revenue: number; count: number }[];
  series: SeriesPoint[];
  recentSales: Sale[];
}
