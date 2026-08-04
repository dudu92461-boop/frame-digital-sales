import { Link } from 'react-router-dom';
import {
  Briefcase,
  ClipboardList,
  Percent,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { SalesChart } from '@/components/SalesChart';
import {
  Avatar,
  Badge,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  ProgressBar,
  Stat,
  TableWrap,
} from '@/components/ui';
import { money, percent, date, monthLabel } from '@/utils/format';
import { SALE_STATUS, COMMISSION_STATUS } from '@/utils/status';
import type { SellerDashboard } from '@/types';

export function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi<SellerDashboard>('/dashboard');

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (!data) return null;

  const { metrics, commissions, goal, tier, ranking, recentSales, series, period } = data;

  return (
    <>
      <PageHeader
        title={`Ola, ${user?.name.split(' ')[0]}`}
        description={`Resumo de ${monthLabel(period.month, period.year)}`}
        actions={
          <Link to="/vendas" className="btn-primary btn-sm">
            <Briefcase className="w-3.5 h-3.5" />
            Registrar venda
          </Link>
        }
      />

      {/* Indicadores principais. No celular ficam 2 por linha. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        <Stat
          label="Vendas do mes"
          value={money(metrics.revenue)}
          hint={`${metrics.salesCount} venda${metrics.salesCount === 1 ? '' : 's'} registrada${
            metrics.salesCount === 1 ? '' : 's'
          }`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <Stat
          label="Comissao prevista"
          value={money(commissions.totalPrevisto)}
          hint={`Faixa atual: ${percent(tier.current.rate, 0)}`}
          icon={<Percent className="w-4 h-4" />}
        />
        <Stat
          label="A receber"
          value={money(commissions.aReceber)}
          hint={`${money(commissions.liberada.total)} ja liberado`}
          tone="warning"
          icon={<Wallet className="w-4 h-4" />}
        />
        <Stat
          label="Comissao paga"
          value={money(commissions.paga.total)}
          hint={`${commissions.paga.count} comissao(oes) no mes`}
          tone="positive"
        />
        <Stat
          label="Leads"
          value={String(metrics.leadsTotal)}
          hint={`${metrics.leadsMonth} cadastrado(s) no mes`}
          icon={<ClipboardList className="w-4 h-4" />}
        />
        <Stat
          label="Conversao"
          value={percent(metrics.conversion)}
          hint={`${metrics.wonLeads} lead(s) ganho(s)`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Grafico ocupa 2/3 no desktop e a largura toda no celular. */}
        <section className="panel lg:col-span-2">
          <div className="panel-header">
            <h2 className="panel-title">Vendas dos ultimos meses</h2>
            <span className="text-2xs text-slate-500">Faturamento x comissao</span>
          </div>
          <div className="p-3 pr-4">
            <SalesChart data={series} />
          </div>
        </section>

        <div className="space-y-4">
          {/* Meta do mes */}
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Meta do mes
              </h2>
              <Link to="/metas" className="text-2xs text-accent-600 hover:underline">
                Detalhes
              </Link>
            </div>

            {goal ? (
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-slate-600">Vendas</span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      {goal.salesDone} / {goal.salesTarget}
                    </span>
                  </div>
                  <ProgressBar value={goal.salesPercent} showLabel />
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-slate-600">Faturamento</span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      {money(goal.revenueDone)}
                    </span>
                  </div>
                  <ProgressBar value={goal.revenuePercent} showLabel />
                  <p className="mt-1 text-2xs text-slate-500">Meta: {money(goal.revenueTarget)}</p>
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-slate-500">
                  Nenhuma meta definida para este mes. O administrador define as metas.
                </p>
              </div>
            )}
          </section>

          {/* Faixa de comissao */}
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Faixa de comissao</h2>
            </div>
            <div className="p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900 tabular-nums leading-none">
                  {percent(tier.current.rate, 0)}
                </span>
                <span className="text-xs text-slate-500">{tier.current.label}</span>
              </div>

              {tier.override != null ? (
                <p className="mt-2 text-2xs text-slate-500 leading-relaxed">
                  Percentual fixo definido pelo administrador.
                </p>
              ) : tier.next ? (
                <p className="mt-2 text-2xs text-slate-500 leading-relaxed">
                  Faltam <strong className="text-slate-700">{tier.next.salesRemaining}</strong> venda
                  {tier.next.salesRemaining === 1 ? '' : 's'} paga
                  {tier.next.salesRemaining === 1 ? '' : 's'} para subir a{' '}
                  <strong className="text-slate-700">{percent(tier.next.tier.rate, 0)}</strong>.
                </p>
              ) : (
                <p className="mt-2 text-2xs text-emerald-700 leading-relaxed">
                  Voce esta na faixa maxima do mes.
                </p>
              )}

              <p className="mt-3 pt-3 border-t border-slate-100 text-2xs text-slate-500">
                {metrics.paidSalesCount} venda(s) paga(s) no mes
              </p>
            </div>
          </section>

          {/* Ranking */}
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-slate-400" />
                Ranking do mes
              </h2>
              <Link to="/ranking" className="text-2xs text-accent-600 hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {ranking.top.map((row) => (
                <div key={row.sellerId} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span className="w-5 text-xs font-semibold text-slate-500 tabular-nums">
                    {row.position}
                  </span>
                  <Avatar name={row.name} color={row.avatarColor} size="sm" />
                  <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">{row.name}</span>
                  <span className="text-xs font-medium text-slate-900 tabular-nums">
                    {money(row.revenue)}
                  </span>
                </div>
              ))}
            </div>

            {ranking.position && (
              <p className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-2xs text-slate-600">
                Sua posicao:{' '}
                <strong className="text-slate-900">
                  {ranking.position}o de {ranking.total}
                </strong>
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Ultimas vendas */}
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Ultimas vendas</h2>
          <Link to="/vendas" className="text-2xs text-accent-600 hover:underline">
            Ver todas
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <EmptyBlock
            title="Nenhuma venda registrada"
            description="Registre a sua primeira venda para acompanhar a comissao."
            action={
              <Link to="/vendas" className="btn-primary btn-sm">
                Registrar venda
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th className="w-14">#</th>
                  <th>Cliente</th>
                  <th className="hidden sm:table-cell">Servico</th>
                  <th className="table-numeric">Valor</th>
                  <th>Status</th>
                  <th className="table-numeric">Comissao</th>
                  <th className="hidden md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-mono text-2xs text-slate-500">{sale.number}</td>
                    <td className="font-medium text-slate-900">
                      <span className="block truncate max-w-[180px]">{sale.client.company}</span>
                      <span className="sm:hidden block text-2xs text-slate-500 truncate max-w-[180px]">
                        {sale.service.name}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell text-slate-600">{sale.service.name}</td>
                    <td className="table-numeric font-medium">{money(sale.amount)}</td>
                    <td>
                      <Badge {...SALE_STATUS[sale.status]} />
                    </td>
                    <td className="table-numeric">
                      {sale.commission ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-medium">{money(sale.commission.amount)}</span>
                          <Badge {...COMMISSION_STATUS[sale.commission.status]} />
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell text-slate-500">{date(sale.soldAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>
    </>
  );
}
