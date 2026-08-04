import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money, moneyShort } from '@/utils/format';
import type { SeriesPoint } from '@/types';

const AXIS = { fontSize: 11, fill: '#64748b' };

/** Caixa de detalhe do grafico, no mesmo estilo dos demais popovers. */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded shadow-pop px-2.5 py-2">
      <p className="text-2xs font-semibold text-slate-900 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-2xs text-slate-600 flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
            aria-hidden
          />
          {entry.name}:{' '}
          <span className="font-medium text-slate-900 tabular-nums">
            {entry.dataKey === 'count' ? entry.value : money(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

/**
 * Faturamento por mes com a comissao sobreposta. Barras para o valor vendido
 * (grandeza principal) e linha para a comissao, que anda em outra escala.
 */
export function SalesChart({ data, height = 240 }: { data: SeriesPoint[]; height?: number }) {
  const hasData = data.some((d) => d.revenue > 0);

  if (!hasData) {
    return (
      <div className="grid place-items-center text-xs text-slate-400" style={{ height }}>
        Nenhuma venda registrada no periodo.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => moneyShort(v).replace('R$', '').trim()}
          width={56}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="square" iconSize={8} />
        <Bar dataKey="revenue" name="Faturamento" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={42} />
        <Line
          type="monotone"
          dataKey="commission"
          name="Comissao"
          stroke="#0f766e"
          strokeWidth={2}
          dot={{ r: 2.5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Ranking de servicos por faturamento (barras horizontais). */
export function ServiceChart({
  data,
  height = 240,
}: {
  data: { name: string; revenue: number }[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="grid place-items-center text-xs text-slate-400" style={{ height }}>
        Nenhuma venda registrada no periodo.
      </div>
    );
  }

  const palette = ['#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#0369a1', '#4d7c0f'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => moneyShort(v).replace('R$', '').trim()}
        />
        <YAxis type="category" dataKey="name" tick={AXIS} axisLine={false} tickLine={false} width={110} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="revenue" name="Faturamento" radius={[0, 2, 2, 0]} maxBarSize={22}>
          {data.map((_, index) => (
            <Cell key={index} fill={palette[index % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
