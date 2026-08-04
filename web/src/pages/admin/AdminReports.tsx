import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, PeriodSelect } from '@/components/Filters';
import { Badge, EmptyBlock, ErrorBlock, LoadingBlock, TableWrap } from '@/components/ui';
import { money, monthLabel, percent } from '@/utils/format';
import { LEAD_STATUS } from '@/utils/status';
import type { LeadStatus } from '@/types';

interface ReportResponse {
  period: { month: number; year: number };
  monthly: {
    label: string;
    month: number;
    year: number;
    revenue: number;
    received: number;
    salesCount: number;
    commission: number;
    profit: number;
  }[];
  bySeller: {
    sellerId: string;
    code: string;
    name: string;
    active: boolean;
    revenue: number;
    salesCount: number;
    leads: number;
    commission: number;
    averageTicket: number;
    conversion: number;
  }[];
  funnel: { status: string; count: number }[];
}

export function AdminReports() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data, loading, error, reload } = useApi<ReportResponse>('/reports', { month, year });

  return (
    <>
      <PageHeader
        title="Relatorios"
        description="Faturamento, comissoes e desempenho da equipe."
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
          <p className="ml-auto text-2xs text-slate-500">
            O desempenho por vendedor e o funil consideram {monthLabel(month, year)}.
          </p>
        </FilterBar>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data ? null : (
        <div className="space-y-4">
          {/* Fechamento mensal */}
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Fechamento mensal (ultimos 12 meses)</h2>
            </div>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th className="table-numeric">Faturado</th>
                    <th className="table-numeric hidden sm:table-cell">Recebido</th>
                    <th className="table-numeric">Vendas</th>
                    <th className="table-numeric">Comissoes</th>
                    <th className="table-numeric">Lucro estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly.map((row) => {
                    const isCurrent = row.month === month && row.year === year;
                    return (
                      <tr key={row.label} className={isCurrent ? 'bg-accent-50/50' : ''}>
                        <td className="font-medium text-slate-900">
                          {row.label}
                          {isCurrent && (
                            <span className="ml-1.5 text-2xs font-normal text-accent-600">
                              selecionado
                            </span>
                          )}
                        </td>
                        <td className="table-numeric font-medium">{money(row.revenue)}</td>
                        <td className="table-numeric hidden sm:table-cell text-slate-600">
                          {money(row.received)}
                        </td>
                        <td className="table-numeric text-slate-600">{row.salesCount}</td>
                        <td className="table-numeric text-slate-600">{money(row.commission)}</td>
                        <td
                          className={`table-numeric font-medium ${
                            row.profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {money(row.profit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </section>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Desempenho por vendedor */}
            <section className="panel lg:col-span-2">
              <div className="panel-header">
                <h2 className="panel-title">Desempenho por vendedor</h2>
                <span className="text-2xs text-slate-500">{monthLabel(month, year)}</span>
              </div>

              {data.bySeller.length === 0 ? (
                <EmptyBlock title="Nenhum vendedor cadastrado" />
              ) : (
                <TableWrap>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Vendedor</th>
                        <th className="table-numeric">Faturado</th>
                        <th className="table-numeric">Vendas</th>
                        <th className="table-numeric hidden sm:table-cell">Ticket medio</th>
                        <th className="table-numeric hidden md:table-cell">Leads no mes</th>
                        <th className="table-numeric hidden md:table-cell">Conversao</th>
                        <th className="table-numeric">Comissao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bySeller.map((row) => (
                        <tr key={row.sellerId} className={row.active ? '' : 'opacity-60'}>
                          <td>
                            <span className="block font-medium text-slate-900">{row.name}</span>
                            <span className="block font-mono text-2xs text-slate-500">
                              {row.code}
                              {!row.active && ' (bloqueado)'}
                            </span>
                          </td>
                          <td className="table-numeric font-medium">{money(row.revenue)}</td>
                          <td className="table-numeric text-slate-600">{row.salesCount}</td>
                          <td className="table-numeric hidden sm:table-cell text-slate-600">
                            {money(row.averageTicket)}
                          </td>
                          <td className="table-numeric hidden md:table-cell text-slate-600">
                            {row.leads}
                          </td>
                          <td className="table-numeric hidden md:table-cell text-slate-600">
                            {percent(row.conversion)}
                          </td>
                          <td className="table-numeric text-slate-600">{money(row.commission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </section>

            {/* Funil de leads */}
            <section className="panel h-fit">
              <div className="panel-header">
                <h2 className="panel-title">Funil de leads</h2>
                <span className="text-2xs text-slate-500">acumulado</span>
              </div>

              {data.funnel.length === 0 ? (
                <EmptyBlock title="Nenhum lead cadastrado" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {(Object.keys(LEAD_STATUS) as LeadStatus[]).map((status) => {
                    const row = data.funnel.find((f) => f.status === status);
                    if (!row) return null;
                    return (
                      <div key={status} className="flex items-center justify-between px-4 py-2.5">
                        <Badge {...LEAD_STATUS[status]} />
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {row.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
