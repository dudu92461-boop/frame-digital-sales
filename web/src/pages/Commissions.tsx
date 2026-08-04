import { useState } from 'react';
import { BadgeCheck, Wallet } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useSellerOptions } from '@/hooks/useOptions';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterSelect, PeriodSelect } from '@/components/Filters';
import {
  Badge,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Pagination,
  Stat,
  TableWrap,
} from '@/components/ui';
import { COMMISSION_STATUS, COMMISSION_STATUS_OPTIONS } from '@/utils/status';
import { date, money, monthLabel, percent } from '@/utils/format';
import type { Commission, CommissionSummary, Paginated } from '@/types';

type Response = Paginated<Commission> & { summary: CommissionSummary };

export function Commissions() {
  const { isAdmin } = useAuth();
  const sellers = useSellerOptions(isAdmin);
  const { toast } = useToast();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [status, setStatus] = useState('all');
  const [sellerId, setSellerId] = useState('all');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useApi<Response>('/commissions', {
    month,
    year,
    status,
    sellerId: isAdmin ? sellerId : undefined,
    page,
    pageSize: 50,
  });

  // Selecao em massa (apenas admin, para liberar e pagar em lote).
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<'release' | 'pay' | null>(null);
  const [busy, setBusy] = useState(false);

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
    setSelected([]);
  };

  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((i) => i !== id) : [...list, id]));

  // Cada acao so vale para um status: liberar exige PENDENTE, pagar exige LIBERADA.
  const selectableFor = (target: 'release' | 'pay') =>
    (data?.items ?? []).filter((c) => c.status === (target === 'release' ? 'PENDENTE' : 'LIBERADA'));

  const selectedValid = (target: 'release' | 'pay') => {
    const ids = new Set(selectableFor(target).map((c) => c.id));
    return selected.filter((id) => ids.has(id));
  };

  const runAction = async () => {
    if (!action) return;
    const ids = selectedValid(action);
    if (ids.length === 0) return;

    setBusy(true);
    try {
      if (action === 'release') {
        await api.post('/commissions/release', { ids });
        toast(`${ids.length} comissao(oes) liberada(s).`);
      } else {
        await api.post('/commissions/pay', { ids, method: 'PIX' });
        toast(`${ids.length} comissao(oes) marcada(s) como paga(s).`);
      }
      setSelected([]);
      setAction(null);
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha na operacao.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const summary = data?.summary;

  return (
    <>
      <PageHeader
        title="Comissoes"
        description={`Apuracao de ${monthLabel(month, year)}.`}
        actions={
          isAdmin && selected.length > 0 ? (
            <>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setAction('release')}
                disabled={selectedValid('release').length === 0}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                Liberar ({selectedValid('release').length})
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => setAction('pay')}
                disabled={selectedValid('pay').length === 0}
              >
                <Wallet className="w-3.5 h-3.5" />
                Marcar como paga ({selectedValid('pay').length})
              </button>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat
          label="Prevista"
          value={money(summary?.prevista.total)}
          hint={`${summary?.prevista.count ?? 0} venda(s) ainda nao paga(s)`}
          tone="muted"
        />
        <Stat
          label="Pendente"
          value={money(summary?.pendente.total)}
          hint="Aguardando aprovacao do administrador"
          tone="warning"
        />
        <Stat
          label="Liberada"
          value={money(summary?.liberada.total)}
          hint="Aprovada, aguardando repasse"
        />
        <Stat
          label="Paga"
          value={money(summary?.paga.total)}
          hint={`${summary?.paga.count ?? 0} comissao(oes) repassada(s)`}
          tone="positive"
        />
      </div>

      <section className="panel">
        <FilterBar>
          <PeriodSelect
            month={month}
            year={year}
            onChange={(m, y) =>
              changeFilter(() => {
                setMonth(m);
                setYear(y);
              })
            }
          />
          <FilterSelect
            value={status}
            onChange={(v) => changeFilter(() => setStatus(v))}
            allLabel="Todos os status"
            label="Status"
            options={COMMISSION_STATUS_OPTIONS}
          />
          {isAdmin && (
            <FilterSelect
              value={sellerId}
              onChange={(v) => changeFilter(() => setSellerId(v))}
              allLabel="Todos os vendedores"
              label="Vendedor"
              options={sellers.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
            />
          )}
          <p className="ml-auto text-2xs text-slate-500">
            Total a receber:{' '}
            <strong className="text-slate-800">{money(summary?.aReceber)}</strong>
          </p>
        </FilterBar>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : !data || data.items.length === 0 ? (
          <EmptyBlock
            title="Nenhuma comissao no periodo"
            description="As comissoes sao geradas automaticamente ao registrar vendas."
          />
        ) : (
          <>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    {isAdmin && <th className="w-8"></th>}
                    <th className="w-14">Venda</th>
                    <th>Cliente</th>
                    <th className="hidden md:table-cell">Servico</th>
                    <th className="table-numeric hidden sm:table-cell">Valor da venda</th>
                    <th className="table-numeric">Taxa</th>
                    <th className="table-numeric">Comissao</th>
                    <th>Status</th>
                    {isAdmin && <th className="hidden lg:table-cell">Vendedor</th>}
                    <th className="hidden xl:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => {
                    const actionable = c.status === 'PENDENTE' || c.status === 'LIBERADA';
                    return (
                      <tr key={c.id}>
                        {isAdmin && (
                          <td>
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={selected.includes(c.id)}
                              onChange={() => toggle(c.id)}
                              disabled={!actionable}
                              aria-label={`Selecionar comissao da venda ${c.sale.number}`}
                            />
                          </td>
                        )}

                        <td className="font-mono text-2xs text-slate-500">{c.sale.number}</td>

                        <td>
                          <span className="block font-medium text-slate-900 truncate max-w-[170px]">
                            {c.sale.client.company}
                          </span>
                          <span className="md:hidden block text-2xs text-slate-500">
                            {c.sale.service.name}
                          </span>
                        </td>

                        <td className="hidden md:table-cell text-slate-600">{c.sale.service.name}</td>

                        <td className="table-numeric hidden sm:table-cell text-slate-600">
                          {money(c.sale.amount)}
                        </td>

                        <td className="table-numeric text-slate-600">{percent(c.rate, 0)}</td>

                        <td className="table-numeric font-medium text-slate-900">
                          {money(c.amount)}
                        </td>

                        <td>
                          <div className="flex flex-col gap-0.5 items-start">
                            <Badge {...COMMISSION_STATUS[c.status]} />
                            {c.status === 'PENDENTE' && !c.sale.approved && (
                              <span className="text-[10px] text-amber-600">venda nao aprovada</span>
                            )}
                          </div>
                        </td>

                        {isAdmin && (
                          <td className="hidden lg:table-cell text-2xs text-slate-600">
                            {c.seller?.user.name ?? '-'}
                          </td>
                        )}

                        <td className="hidden xl:table-cell text-2xs text-slate-500">
                          {date(c.sale.soldAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>

            <Pagination meta={data.meta} onChange={setPage} />
          </>
        )}
      </section>

      {!isAdmin && (
        <p className="mt-3 text-2xs text-slate-500 leading-relaxed">
          A comissao fica <strong>prevista</strong> ate o cliente pagar, vira{' '}
          <strong>pendente</strong> quando a venda e marcada como paga, e e{' '}
          <strong>liberada</strong> apos a aprovacao do administrador. O repasse marca a comissao
          como <strong>paga</strong>.
        </p>
      )}

      <ConfirmDialog
        open={action !== null}
        title={action === 'release' ? 'Liberar comissoes' : 'Registrar pagamento'}
        message={
          action === 'release'
            ? `Liberar ${selectedValid('release').length} comissao(oes)? Os vendedores serao notificados. As vendas precisam estar aprovadas.`
            : `Registrar o repasse de ${money(
                data?.items
                  .filter((c) => selectedValid('pay').includes(c.id))
                  .reduce((sum, c) => sum + c.amount, 0),
              )}? Comissoes pagas nao podem mais ser alteradas.`
        }
        confirmLabel={action === 'release' ? 'Liberar' : 'Confirmar pagamento'}
        loading={busy}
        onConfirm={runAction}
        onCancel={() => setAction(null)}
      />
    </>
  );
}
