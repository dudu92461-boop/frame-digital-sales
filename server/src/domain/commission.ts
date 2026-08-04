/**
 * Regras de comissao da Frame Digital (funcoes puras, sem banco).
 *
 * A faixa e progressiva por MES e por VENDEDOR: conta-se quantas vendas do mes
 * ja foram pagas e essa quantidade define o percentual aplicado a TODAS as
 * vendas daquele mes.
 *
 *   0-2 vendas .... 15%
 *   3-5 vendas .... 20%
 *   6-9 vendas .... 25%
 *   10+ vendas .... 30%
 *
 * Exemplo: 7 vendas de R$ 500,00 = R$ 3.500,00 -> faixa de 25% -> R$ 875,00.
 */

export interface CommissionTier {
  min: number;
  max: number;
  rate: number;
  label: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { min: 0, max: 2, rate: 0.15, label: '0 a 2 vendas' },
  { min: 3, max: 5, rate: 0.2, label: '3 a 5 vendas' },
  { min: 6, max: 9, rate: 0.25, label: '6 a 9 vendas' },
  { min: 10, max: Number.POSITIVE_INFINITY, rate: 0.3, label: '10 ou mais vendas' },
];

/** Arredonda para 2 casas evitando erros de ponto flutuante (0.1 + 0.2). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Percentual da faixa para uma quantidade de vendas pagas no mes.
 * `override` (0 < x <= 1) definido pelo admin substitui a tabela progressiva.
 */
export function rateForSalesCount(paidSalesCount: number, override?: number | null): number {
  if (override != null && override > 0 && override <= 1) return override;

  const count = Math.max(0, Math.floor(paidSalesCount));
  const tier = COMMISSION_TIERS.find((t) => count >= t.min && count <= t.max);
  return tier ? tier.rate : COMMISSION_TIERS[0].rate;
}

/** Faixa atual completa (para exibir na interface). */
export function tierForSalesCount(paidSalesCount: number): CommissionTier {
  const count = Math.max(0, Math.floor(paidSalesCount));
  return (
    COMMISSION_TIERS.find((t) => count >= t.min && count <= t.max) ?? COMMISSION_TIERS[0]
  );
}

/**
 * Proxima faixa e quantas vendas faltam para alcanca-la.
 * Retorna null quando o vendedor ja esta na faixa maxima.
 */
export function nextTierProgress(
  paidSalesCount: number,
): { tier: CommissionTier; salesRemaining: number } | null {
  const count = Math.max(0, Math.floor(paidSalesCount));
  const next = COMMISSION_TIERS.find((t) => t.min > count);
  if (!next) return null;
  return { tier: next, salesRemaining: next.min - count };
}

/** Valor da comissao de uma venda. */
export function commissionAmount(saleAmount: number, rate: number): number {
  return round2(saleAmount * rate);
}
