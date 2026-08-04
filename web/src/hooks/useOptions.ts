import { useApi } from './useApi';
import type { Service } from '@/types';

export interface SellerOption {
  id: string;
  code: string;
  name: string;
}

export interface ClientOption {
  id: string;
  company: string;
  contactName: string;
  sellerId: string;
}

/** Vendedores ativos, para os selects do admin. */
export function useSellerOptions(enabled = true) {
  const { data } = useApi<SellerOption[]>(enabled ? '/sellers/options' : null);
  return data ?? [];
}

/**
 * Clientes disponiveis para venda. O admin pode restringir a um vendedor,
 * ja que uma venda so pode apontar para um cliente do proprio vendedor.
 */
export function useClientOptions(sellerId?: string) {
  const { data } = useApi<ClientOption[]>('/clients/options', { sellerId });
  return data ?? [];
}

/** Servicos ativos do catalogo. */
export function useServiceOptions() {
  const { data } = useApi<Service[]>('/services');
  return data ?? [];
}
