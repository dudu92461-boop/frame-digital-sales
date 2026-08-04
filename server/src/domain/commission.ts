/**
 * Regras de comissao da Frame Digital (funcoes puras, sem banco).
 *
 * A comissao e um percentual unico de 25% sobre o valor da venda, igual para
 * todos os vendedores e para qualquer quantidade de vendas no mes.
 *
 *   Exemplo: 7 vendas de R$ 500,00 = R$ 3.500,00 -> 25% -> R$ 875,00.
 *
 * O administrador pode definir um percentual individual para um vendedor
 * especifico (Seller.commissionOverride); quando preenchido, ele substitui o
 * padrao. E a excecao, nao a regra.
 *
 * Historico: ate 08/2026 o percentual era progressivo por faixa de vendas no
 * mes (15/20/25/30%). A regra foi unificada em 25% a pedido da direcao. As
 * comissoes ja PAGAS nao foram reprocessadas -- dinheiro repassado nao se
 * recalcula.
 */

/** Percentual aplicado a todas as vendas, salvo percentual individual. */
export const DEFAULT_COMMISSION_RATE = 0.25;

/** Arredonda para 2 casas evitando erros de ponto flutuante (0.1 + 0.2). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Percentual efetivo de um vendedor.
 * `override` (0 < x <= 1) definido pelo admin substitui o padrao; valores fora
 * dessa faixa sao ignorados para que um dado invalido nunca zere a comissao.
 */
export function rateForSeller(override?: number | null): number {
  if (override != null && override > 0 && override <= 1) return override;
  return DEFAULT_COMMISSION_RATE;
}

/** De onde veio o percentual — a interface mostra isso ao vendedor. */
export function rateSource(override?: number | null): 'PADRAO' | 'INDIVIDUAL' {
  return override != null && override > 0 && override <= 1 ? 'INDIVIDUAL' : 'PADRAO';
}

/** Valor da comissao de uma venda. */
export function commissionAmount(saleAmount: number, rate: number): number {
  return round2(saleAmount * rate);
}
