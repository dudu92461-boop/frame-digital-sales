import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterSelect, PeriodSelect } from '@/components/Filters';
import {
  Avatar,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  ProgressBar,
  TableWrap,
  cx,
} from '@/components/ui';
import { money, monthLabel } from '@/utils/format';
import type { RankingRow } from '@/types';

interface RankingResponse {
  period: { month: number; year: number };
  sort: 'revenue' | 'count';
  items: RankingRow[];
  me: RankingRow | null;
  totals: { revenue: number; salesCount: number };
}

const MEDALS = ['1o', '2o', '3o'];

/** Destaque do topo do ranking (podio). */
function Podium({ rows, meId }: { rows: RankingRow[]; meId?: string }) {
  const tones = [
    'border-amber-300 bg-amber-50',
    'border-slate-300 bg-slate-50',
    'border-orange-300 bg-orange-50',
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-3 mb-4">
      {rows.map((row, index) => (
        <div
          key={row.sellerId}
          className={cx(
            'panel p-4 border',
            tones[index],
            row.sellerId === meId && 'ring-1 ring-accent-600',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-400 tabular-nums w-7">
              {MEDALS[index]}
            </span>
            <Avatar name={row.name} color={row.avatarColor} photoUrl={row.avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{row.name}</p>
              <p className="font-mono text-2xs text-slate-500">{row.code}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-baseline justify-between">
            <span className="text-lg font-semibold text-slate-900 tabular-nums">
              {money(row.revenue)}
            </span>
            <span className="text-xs text-slate-600">
              {row.salesCount} venda{row.salesCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Ranking() {
  const { user } = useAuth();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [sort, setSort] = useState<'revenue' | 'count'>('revenue');

  const { data, loading, error, reload } = useApi<RankingResponse>('/ranking', {
    month,
    year,
    sort,
  });

  const meId = user?.seller?.id;

  return (
    <>
      <PageHeader
        title="Ranking"
        description={`Classificacao de ${monthLabel(month, year)}.`}
      />

      <div className="panel mb-4">
        <FilterBar>
          <PeriodSelect
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
          />
          <FilterSelect
            value={sort}
            onChange={(v) => setSort(v as 'revenue' | 'count')}
            label="Ordenar por"
            options={[
              { value: 'revenue', label: 'Valor vendido' },
              { value: 'count', label: 'Numero de vendas' },
            ]}
          />
          {data && (
            <p className="ml-auto text-2xs text-slate-500">
              Total da equipe:{' '}
              <strong className="text-slate-800">{money(data.totals.revenue)}</strong> em{' '}
              {data.totals.salesCount} venda(s)
            </p>
          )}
        </FilterBar>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data || data.items.length === 0 ? (
        <div className="panel">
          <EmptyBlock
            title="Sem dados no periodo"
            description="Nenhuma venda foi registrada neste mes."
          />
        </div>
      ) : (
        <>
          {data.items.length >= 3 && <Podium rows={data.items.slice(0, 3)} meId={meId} />}

          {/* Posicao do proprio vendedor, sempre visivel mesmo fora do topo. */}
          {data.me && (
            <div className="panel px-4 py-3 mb-4 border-accent-200 bg-accent-50/40">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-accent-700 tabular-nums w-8">
                  #{data.me.position}
                </span>
                <Avatar name={data.me.name} color={data.me.avatarColor} photoUrl={data.me.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Sua posicao</p>
                  <p className="text-2xs text-slate-600">
                    {data.me.salesCount} venda(s) - {money(data.me.commission)} de comissao
                  </p>
                </div>
                <span className="text-base font-semibold text-slate-900 tabular-nums">
                  {money(data.me.revenue)}
                </span>
              </div>
            </div>
          )}

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Classificacao completa</h2>
            </div>

            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Vendedor</th>
                    <th className="table-numeric">Vendido</th>
                    <th className="table-numeric">Vendas</th>
                    <th className="table-numeric hidden sm:table-cell">Comissao</th>
                    <th className="hidden md:table-cell w-40">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr
                      key={row.sellerId}
                      className={cx(row.sellerId === meId && 'bg-accent-50/50')}
                    >
                      <td className="font-semibold text-slate-500 tabular-nums">{row.position}</td>

                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={row.name} color={row.avatarColor} photoUrl={row.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <span className="block font-medium text-slate-900 truncate">
                              {row.name}
                              {row.sellerId === meId && (
                                <span className="ml-1.5 text-2xs font-normal text-accent-600">
                                  (voce)
                                </span>
                              )}
                            </span>
                            <span className="block font-mono text-2xs text-slate-500">
                              {row.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="table-numeric font-medium">{money(row.revenue)}</td>
                      <td className="table-numeric text-slate-600">{row.salesCount}</td>
                      <td className="table-numeric hidden sm:table-cell text-slate-600">
                        {money(row.commission)}
                      </td>

                      <td className="hidden md:table-cell">
                        {row.goalSales != null ? (
                          <div>
                            <ProgressBar value={row.goalPercent} showLabel />
                            <p className="mt-1 text-2xs text-slate-500 tabular-nums">
                              {row.salesCount} / {row.goalSales}
                            </p>
                          </div>
                        ) : (
                          <span className="text-2xs text-slate-400">sem meta</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>
        </>
      )}
    </>
  );
}
