const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function money(value?: number | null): string {
  return brl.format(value ?? 0);
}

/** Sem centavos: usado em eixos de grafico e indicadores compactos. */
export function moneyShort(value?: number | null): string {
  return brlCompact.format(value ?? 0);
}

export function percent(value?: number | null, digits = 1): string {
  if (value == null) return '-';
  return `${(value * 100).toFixed(digits).replace('.', ',')}%`;
}

export function date(value?: string | Date | null): string {
  if (!value) return '-';
  return dateFmt.format(new Date(value));
}

export function dateTime(value?: string | Date | null): string {
  if (!value) return '-';
  return dateTimeFmt.format(new Date(value));
}

/** "ha 5 min", "ha 2 h", "ha 3 d" - usado na lista de notificacoes. */
export function relativeTime(value: string | Date): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `ha ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `ha ${days} d`;
  return date(value);
}

/** Iniciais para o avatar (ate 2 letras). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Converte "PROPOSTA_ENVIADA" em "Proposta enviada". */
export function humanize(value?: string | null): string {
  if (!value) return '-';
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Data no formato aceito por <input type="date">. */
export function toDateInput(value?: string | Date | null): string {
  const d = value ? new Date(value) : new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function monthLabel(month: number, year: number): string {
  return `${MONTHS[month - 1]} de ${year}`;
}
