import { Link } from 'react-router-dom';
import { AlertTriangle, Briefcase, ClipboardList, TrendingUp, Users, Wallet } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/PageHeader';
import { SalesChart, ServiceChart } from '@/components/SalesChart';
import {
  Avatar,
  Badge,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Stat,
  TableWrap,
} from '@/components/ui';
import { date, money, monthLabel, percent } from '@/utils/format';
import { COMMISSION_STATUS, SALE_STATUS } from '@/utils/status';
import type { AdminDashboard } from '@/types';

export function AdminDashboardPage() {
  const { data, loading, error, reload } = useApi<AdminDashboard>('/dashboard/admin');

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (!data) return null;

  const { metrics, commissions, ranking, byService, series, recentSales, period } = data;

  return (
    <>
      <PageHeader
        title="Painel administrativo"
        description={`Visao geral da operacao em ${monthLabel(period.month, period.year)}`}
        actions={
          metrics.pendingApproval > 0 ? (
            <Link to="/vendas" className="btn-secondary btn-sm text-amber-700 border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              {metrics.pendingApproval} venda(s) aguardando aprovacao
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat
          label="Faturamento do mes"
          value={money(metrics.revenue)}
          hint={`${metrics.salesCount} venda(s) - ticket medio ${money(metrics.averageTicket)}`}
          tone="brand"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        />
        <Stat
          label="Recebido"
          value={money(metrics.received)}
          hint={`${metrics.paidSalesCount} venda(s) paga(s)`}
          tone="money"
          icon={<Wallet className="w-3.5 h-3.5" />}
        />
        <Stat
          label="Comissoes do mes"
          value={money(metrics.commissionCost)}
          hint={`${money(commissions.aReceber)} a repassar`}
          tone="pending"
          icon={<Wallet className="w-3.5 h-3.5" />}
        />
        <Stat
          label="Lucro estimado"
          value={money(metrics.estimatedProfit)}
          hint="Faturamento menos comissoes"
          tone={metrics.estimatedProfit >= 0 ? 'money' : 'alert'}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat
          label="Vendedores"
          value={`${metrics.activeSellers}`}
          hint={`${metrics.sellersCount} cadastrado(s)`}
          tone="goal"
          icon={<Users className="w-3.5 h-3.5" />}
        />
        <Stat
          label="Leads"
          value={String(metrics.leadsTotal)}
          hint={`${metrics.leadsMonth} novo(s) no mes`}
          tone="neutral"
          icon={<ClipboardList className="w-3.5 h-3.5" />}
        />
        <Stat
          label="Conversao"
          value={percent(metrics.conversion)}
          hint={`${metrics.wonLeads} lead(s) ganho(s)`}
          tone="brand"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        />
        <Stat
          label="Servicos ativos"
          value={String(metrics.servicesCount)}
          tone="neutral"
          icon={<Briefcase className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Faturamento dos ultimos meses</h2>
          </div>
          <div className="p-3 pr-4">
            <SalesChart data={series} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Faturamento por servico</h2>
            <span className="text-2xs text-slate-500">{monthLabel(period.month, period.year)}</span>
          </div>
          <div className="p-3 pr-4">
            <ServiceChart data={byService} />
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Ranking */}
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Ranking do mes</h2>
            <Link to="/ranking" className="text-2xs text-accent-600 hover:underline">
              Ver completo
            </Link>
          </div>

          {ranking.length === 0 ? (
            <EmptyBlock title="Sem vendas no mes" />
          ) : (
            <div className="divide-y divide-slate-100">
              {ranking.slice(0, 6).map((row) => (
                <div key={row.sellerId} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span className="w-5 text-xs font-semibold text-slate-500 tabular-nums">
                    {row.position}
                  </span>
                  <Avatar name={row.name} color={row.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{row.name}</p>
                    <p className="text-2xs text-slate-500">
                      {row.salesCount} venda(s) - comissao {money(row.commission)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-900 tabular-nums">
                    {money(row.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Comissoes por status */}
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Comissoes do mes</h2>
            <Link to="/comissoes" className="text-2xs text-accent-600 hover:underline">
              Gerenciar
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(
              [
                ['Prevista', commissions.prevista, 'Aguardando pagamento do cliente'],
                ['Pendente', commissions.pendente, 'Aguardando sua aprovacao'],
                ['Liberada', commissions.liberada, 'Aprovada, a repassar'],
                ['Paga', commissions.paga, 'Repassada aos vendedores'],
              ] as const
            ).map(([label, bucket, hint]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-xs font-medium text-slate-800">{label}</p>
                  <p className="text-2xs text-slate-500">{hint}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {money(bucket.total)}
                  </p>
                  <p className="text-2xs text-slate-500">{bucket.count} comissao(oes)</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ultimas vendas */}
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Ultimas vendas</h2>
            <Link to="/vendas" className="text-2xs text-accent-600 hover:underline">
              Ver todas
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <EmptyBlock title="Nenhuma venda registrada" />
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th className="table-numeric">Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.slice(0, 6).map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <span className="block font-medium text-slate-900 truncate max-w-[140px]">
                          {sale.client.company}
                        </span>
                        <span className="block text-2xs text-slate-500">
                          {sale.seller?.user.name} - {date(sale.soldAt)}
                        </span>
                      </td>
                      <td className="table-numeric font-medium">{money(sale.amount)}</td>
                      <td>
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge {...SALE_STATUS[sale.status]} />
                          {sale.commission && (
                            <Badge {...COMMISSION_STATUS[sale.commission.status]} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </section>
      </div>
    </>
  );
}
