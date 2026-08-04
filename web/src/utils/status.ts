import type { CommissionStatus, LeadStatus, SaleStatus } from '@/types';

interface StatusStyle {
  label: string;
  className: string;
}

/**
 * Cores dos status. Neutro para etapas iniciais, azul para acao em andamento,
 * ambar para pendencia, verde para conclusao, vermelho para perda. Tons baixos
 * de saturacao para nao poluir listas longas.
 */
export const LEAD_STATUS: Record<LeadStatus, StatusStyle> = {
  NOVO: { label: 'Novo', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  CONTATO_REALIZADO: {
    label: 'Contato realizado',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  EM_NEGOCIACAO: {
    label: 'Em negociacao',
    className: 'bg-accent-50 text-accent-700 border-accent-200',
  },
  PROPOSTA_ENVIADA: {
    label: 'Proposta enviada',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  AGUARDANDO_PAGAMENTO: {
    label: 'Aguardando pagamento',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  GANHO: { label: 'Ganho', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PERDIDO: { label: 'Perdido', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const SALE_STATUS: Record<SaleStatus, StatusStyle> = {
  PENDENTE: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAGO: { label: 'Pago', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EM_EXECUCAO: { label: 'Em execucao', className: 'bg-accent-50 text-accent-700 border-accent-200' },
  CONCLUIDO: { label: 'Concluido', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  CANCELADO: { label: 'Cancelado', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const COMMISSION_STATUS: Record<CommissionStatus, StatusStyle> = {
  PREVISTA: { label: 'Prevista', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  PENDENTE: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  LIBERADA: { label: 'Liberada', className: 'bg-accent-50 text-accent-700 border-accent-200' },
  PAGA: { label: 'Paga', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELADA: { label: 'Cancelada', className: 'bg-slate-100 text-slate-400 border-slate-200' },
};

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS).map(([value, s]) => ({
  value: value as LeadStatus,
  label: s.label,
}));

export const SALE_STATUS_OPTIONS = Object.entries(SALE_STATUS).map(([value, s]) => ({
  value: value as SaleStatus,
  label: s.label,
}));

export const COMMISSION_STATUS_OPTIONS = Object.entries(COMMISSION_STATUS).map(([value, s]) => ({
  value: value as CommissionStatus,
  label: s.label,
}));

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CARTAO', label: 'Cartao' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
] as const;
