/** Utilitarios de periodo. Todo o sistema trabalha com mes/ano de referencia. */

export interface Period {
  month: number; // 1-12
  year: number;
}

export function currentPeriod(reference = new Date()): Period {
  return { month: reference.getMonth() + 1, year: reference.getFullYear() };
}

export function periodOf(date: Date): Period {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

/** Primeiro instante do mes. */
export function startOfMonth({ month, year }: Period): Date {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

/** Primeiro instante do mes seguinte (limite exclusivo para filtros `lt`). */
export function startOfNextMonth({ month, year }: Period): Date {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

/** Filtro Prisma pronto para um campo de data dentro do periodo. */
export function monthRange(period: Period) {
  return { gte: startOfMonth(period), lt: startOfNextMonth(period) };
}

/** Desloca um periodo em N meses (negativo para tras). */
export function shiftPeriod({ month, year }: Period, offset: number): Period {
  const base = new Date(year, month - 1 + offset, 1);
  return { month: base.getMonth() + 1, year: base.getFullYear() };
}

/** Ultimos N periodos terminando no periodo informado (mais antigo primeiro). */
export function lastPeriods(count: number, end = currentPeriod()): Period[] {
  return Array.from({ length: count }, (_, i) => shiftPeriod(end, -(count - 1 - i)));
}

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function periodLabel({ month, year }: Period): string {
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
}

export function samePeriod(a: Period, b: Period): boolean {
  return a.month === b.month && a.year === b.year;
}
