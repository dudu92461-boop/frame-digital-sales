import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useApi, useDebounced } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useClientOptions, useSellerOptions, useServiceOptions } from '@/hooks/useOptions';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterSelect, PeriodSelect, SearchInput } from '@/components/Filters';
import {
  Alert,
  Badge,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Modal,
  Pagination,
  Spinner,
  Stat,
  TableWrap,
} from '@/components/ui';
import { COMMISSION_STATUS, PAYMENT_METHOD_OPTIONS, SALE_STATUS, SALE_STATUS_OPTIONS } from '@/utils/status';
import { date, money, percent, toDateInput } from '@/utils/format';
import type { Paginated, Sale, SaleStatus } from '@/types';

type SalesResponse = Paginated<Sale> & { totals: { amount: number; count: number } };

/** Percentual vigente do vendedor, vindo do backend (fonte unica da regra). */
interface RateInfo {
  rate: number;
  defaultRate: number;
  source: 'PADRAO' | 'INDIVIDUAL';
  override: number | null;
  paidSalesCount: number;
}

// ---------------------------------------------------------------------------
// Formulario de venda
// ---------------------------------------------------------------------------

function SaleForm({
  sale,
  onClose,
  onSaved,
}: {
  sale: Sale | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isAdmin, user } = useAuth();
  const sellers = useSellerOptions(isAdmin);
  const services = useServiceOptions();
  const { toast } = useToast();

  const [sellerId, setSellerId] = useState(sale?.sellerId ?? (isAdmin ? '' : user?.seller?.id ?? ''));
  const clients = useClientOptions(sellerId || undefined);

  // O percentual e sempre o do vendedor da venda -- nao o de quem esta
  // preenchendo. Sem isso, o admin veria o proprio ao lancar por outro.
  const { data: rateInfo } = useApi<RateInfo>(sellerId ? '/commissions/rate' : null, {
    sellerId: isAdmin ? sellerId : undefined,
  });

  const [form, setForm] = useState({
    clientId: sale?.clientId ?? '',
    serviceId: sale?.serviceId ?? '',
    amount: sale?.amount != null ? String(sale.amount) : '',
    paymentMethod: sale?.paymentMethod ?? 'PIX',
    status: (sale?.status ?? 'PENDENTE') as SaleStatus,
    soldAt: toDateInput(sale?.soldAt),
    notes: sale?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(sale?.id);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Escolher o servico preenche o valor com o preco de tabela (ainda editavel:
  // o vendedor pode ter negociado um desconto).
  const selectService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setForm((f) => ({
      ...f,
      serviceId,
      amount: service && !isEdit ? String(service.price) : f.amount,
    }));
  };

  // Trocar de vendedor invalida o cliente escolhido (clientes sao por vendedor).
  useEffect(() => {
    if (!sellerId) return;
    setForm((f) =>
      clients.some((c) => c.id === f.clientId) ? f : { ...f, clientId: '' },
    );
  }, [sellerId, clients]);

  /**
   * Previsao da comissao desta venda. Com percentual fixo, basta aplicar o do
   * vendedor sobre o valor -- a quantidade de vendas do mes nao interfere.
   */
  const preview = useMemo(() => {
    const amount = Number(form.amount) || 0;
    if (!rateInfo || amount <= 0) return null;

    const willBePaid = form.status === 'PAGO' || form.status === 'CONCLUIDO';
    const rate = rateInfo.rate;

    return { rate, amount: Math.round(amount * rate * 100) / 100, willBePaid };
  }, [form.amount, form.status, rateInfo]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});

    const payload = {
      clientId: form.clientId,
      serviceId: form.serviceId,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      status: form.status,
      soldAt: form.soldAt,
      notes: form.notes || undefined,
      ...(isAdmin && sellerId ? { sellerId } : {}),
    };

    try {
      if (isEdit) {
        await api.patch(`/sales/${sale!.id}`, payload);
        toast('Venda atualizada.');
      } else {
        await api.post('/sales', payload);
        toast('Venda registrada. A comissao foi calculada automaticamente.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Nao foi possivel salvar a venda.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Editar venda #${sale!.number}` : 'Registrar venda'}
      description="A comissao e calculada automaticamente sobre o valor da venda."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="sale-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            {isEdit ? 'Salvar alteracoes' : 'Registrar venda'}
          </button>
        </>
      }
    >
      <form id="sale-form" onSubmit={submit} className="space-y-3">
        {error && <Alert message={error} />}

        <div className="grid sm:grid-cols-2 gap-3">
          {isAdmin && (
            <Field label="Vendedor" required error={errors.sellerId} className="sm:col-span-2">
              <select
                className="select"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field
            label="Cliente"
            required
            error={errors.clientId}
            hint={
              isAdmin && !sellerId
                ? 'Selecione o vendedor para listar os clientes dele.'
                : clients.length === 0
                  ? 'Nenhum cliente cadastrado. Converta um lead primeiro.'
                  : undefined
            }
          >
            <select
              className="select"
              value={form.clientId}
              onChange={(e) => set('clientId', e.target.value)}
              required
              disabled={isAdmin && !sellerId}
            >
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Servico" required error={errors.serviceId}>
            <select
              className="select"
              value={form.serviceId}
              onChange={(e) => selectService(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {money(s.price)}
                  {s.recurring ? '/mes' : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Valor" required error={errors.amount}>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              required
            />
          </Field>

          <Field label="Forma de pagamento" error={errors.paymentMethod}>
            <select
              className="select"
              value={form.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value)}
            >
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Data da venda" error={errors.soldAt}>
            <input
              type="date"
              className="input"
              value={form.soldAt}
              onChange={(e) => set('soldAt', e.target.value)}
            />
          </Field>

          <Field label="Status" error={errors.status}>
            <select
              className="select"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {SALE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {preview && (
          <div className="flex items-start justify-between gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded">
            <div>
              <p className="text-2xs uppercase tracking-wide text-slate-500">Comissao estimada</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums leading-none">
                {money(preview.amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xs text-slate-500">Percentual aplicado</p>
              <p className="text-sm font-medium text-slate-900">{percent(preview.rate, 0)}</p>
              <p className="text-2xs text-slate-500 mt-0.5">
                {preview.willBePaid
                  ? 'Venda paga entra no calculo do mes.'
                  : 'Prevista ate a venda ser paga.'}
              </p>
            </div>
          </div>
        )}

        <Field label="Observacoes" error={errors.notes}>
          <textarea
            className="textarea"
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export function Sales() {
  const { isAdmin } = useAuth();
  const sellers = useSellerOptions(isAdmin);
  const { toast } = useToast();

  const today = new Date();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sellerId, setSellerId] = useState('all');
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [filterPeriod, setFilterPeriod] = useState(true);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const { data, loading, error, reload } = useApi<SalesResponse>('/sales', {
    search: debouncedSearch,
    status,
    sellerId: isAdmin ? sellerId : undefined,
    month: filterPeriod ? month : undefined,
    year: filterPeriod ? year : undefined,
    page,
    pageSize: 25,
  });

  const { data: rateInfo, reload: reloadRate } = useApi<RateInfo>('/commissions/rate', {
    sellerId: isAdmin && sellerId !== 'all' ? sellerId : undefined,
    month,
    year,
  });

  const [editing, setEditing] = useState<Sale | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);

  // O percentual so e exibido quando a tela representa um unico vendedor.
  const showRate = !isAdmin || sellerId !== 'all';
  const pendingApproval = (data?.items ?? []).filter(
    (s) => !s.approved && s.status !== 'CANCELADO',
  ).length;

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const refreshAll = () => {
    reload();
    reloadRate();
  };

  const changeStatus = async (sale: Sale, next: SaleStatus) => {
    try {
      await api.patch(`/sales/${sale.id}/status`, { status: next });
      toast(
        next === 'PAGO'
          ? 'Venda marcada como paga. Comissao recalculada.'
          : 'Status atualizado.',
      );
      refreshAll();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha ao atualizar o status.', 'error');
    }
  };

  const toggleApproval = async (sale: Sale) => {
    try {
      await api.post(`/sales/${sale.id}/${sale.approved ? 'unapprove' : 'approve'}`);
      toast(sale.approved ? 'Aprovacao revertida.' : 'Venda aprovada.');
      refreshAll();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha na operacao.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/sales/${deleting.id}`);
      toast('Venda excluida.');
      setDeleting(null);
      refreshAll();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Registro de vendas e calculo automatico de comissao."
        actions={
          <button type="button" className="btn-primary btn-sm" onClick={() => setEditing('new')}>
            <Plus className="w-3.5 h-3.5" />
            Registrar venda
          </button>
        }
      />

      {/*
        O percentual de comissao e sempre de UM vendedor (o padrao vale para
        todos, mas o admin pode definir um individual). Na visao consolidada
        trocamos esses cartoes por indicadores da operacao inteira.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat
          label="Total no filtro"
          value={money(data?.totals.amount)}
          hint={`${data?.totals.count ?? 0} venda(s)`}
          tone="brand"
        />

        {showRate ? (
          <>
            <Stat
              label="Vendas pagas no mes"
              value={String(rateInfo?.paidSalesCount ?? 0)}
              hint="Vendas com pagamento confirmado"
              tone="money"
            />
            <Stat
              label="Comissao"
              value={rateInfo ? percent(rateInfo.rate, 0) : '-'}
              hint={
                rateInfo?.source === 'INDIVIDUAL'
                  ? 'Percentual individual do vendedor'
                  : 'Percentual padrao da equipe'
              }
              tone="goal"
            />
            <Stat
              label="Comissao gerada"
              value={money(
                (data?.items ?? []).reduce((sum, s) => sum + (s.commission?.amount ?? 0), 0),
              )}
              hint="Somatorio das vendas listadas"
              tone="neutral"
            />
          </>
        ) : (
          <>
            <Stat
              label="Aguardando aprovacao"
              value={String(pendingApproval)}
              hint="Vendas nesta pagina ainda nao aprovadas"
              tone={pendingApproval > 0 ? 'pending' : 'neutral'}
            />
            <Stat
              label="Ticket medio"
              value={money(
                data && data.totals.count > 0 ? data.totals.amount / data.totals.count : 0,
              )}
              hint="Valor medio por venda no filtro"
              tone="money"
            />
            <Stat
              label="Comissao gerada"
              value={money(
                (data?.items ?? []).reduce((sum, s) => sum + (s.commission?.amount ?? 0), 0),
              )}
              hint="Somatorio das vendas listadas"
              tone="goal"
            />
          </>
        )}
      </div>

      <section className="panel">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => changeFilter(() => setSearch(v))}
            placeholder="Buscar cliente ou servico..."
          />
          <FilterSelect
            value={status}
            onChange={(v) => changeFilter(() => setStatus(v))}
            allLabel="Todos os status"
            label="Status"
            options={SALE_STATUS_OPTIONS}
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

          <label className="flex items-center gap-1.5 text-xs text-slate-600 ml-auto">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filterPeriod}
              onChange={(e) => changeFilter(() => setFilterPeriod(e.target.checked))}
            />
            Filtrar por mes
          </label>
          {filterPeriod && (
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
          )}
        </FilterBar>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : !data || data.items.length === 0 ? (
          <EmptyBlock
            title="Nenhuma venda encontrada"
            description="Registre uma venda para calcular a comissao automaticamente."
            action={
              <button type="button" className="btn-primary btn-sm" onClick={() => setEditing('new')}>
                <Plus className="w-3.5 h-3.5" />
                Registrar venda
              </button>
            }
          />
        ) : (
          <>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-14">#</th>
                    <th>Cliente</th>
                    <th className="hidden md:table-cell">Servico</th>
                    <th className="table-numeric">Valor</th>
                    <th>Status</th>
                    <th className="table-numeric">Comissao</th>
                    {isAdmin && <th className="hidden lg:table-cell">Vendedor</th>}
                    <th className="hidden lg:table-cell">Data</th>
                    {isAdmin && <th className="hidden sm:table-cell">Aprovada</th>}
                    <th className="w-px"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-mono text-2xs text-slate-500">{sale.number}</td>

                      <td>
                        <span className="block font-medium text-slate-900 truncate max-w-[180px]">
                          {sale.client.company}
                        </span>
                        <span className="md:hidden block text-2xs text-slate-500 truncate max-w-[180px]">
                          {sale.service.name}
                        </span>
                      </td>

                      <td className="hidden md:table-cell text-slate-600">{sale.service.name}</td>

                      <td className="table-numeric font-medium">{money(sale.amount)}</td>

                      <td>
                        <select
                          className="text-2xs border border-slate-200 rounded px-1.5 py-1 bg-white hover:border-slate-300"
                          value={sale.status}
                          onChange={(e) => changeStatus(sale, e.target.value as SaleStatus)}
                          aria-label={`Status da venda ${sale.number}`}
                        >
                          {SALE_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="table-numeric">
                        {sale.commission ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-medium">
                              {money(sale.commission.amount)}
                              <span className="text-slate-400 ml-1 font-normal">
                                {percent(sale.commission.rate, 0)}
                              </span>
                            </span>
                            <Badge {...COMMISSION_STATUS[sale.commission.status]} />
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="hidden lg:table-cell text-2xs text-slate-600">
                          {sale.seller?.user.name ?? '-'}
                        </td>
                      )}

                      <td className="hidden lg:table-cell text-2xs text-slate-500">
                        {date(sale.soldAt)}
                      </td>

                      {isAdmin && (
                        <td className="hidden sm:table-cell">
                          <button
                            type="button"
                            onClick={() => toggleApproval(sale)}
                            className={
                              sale.approved
                                ? 'btn btn-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'btn-secondary btn-sm'
                            }
                            title={sale.approved ? 'Reverter aprovacao' : 'Aprovar venda'}
                          >
                            {sale.approved ? (
                              <>
                                <Check className="w-3 h-3" />
                                Sim
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" />
                                Nao
                              </>
                            )}
                          </button>
                        </td>
                      )}

                      <td>
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => setEditing(sale)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            onClick={() => setDeleting(sale)}
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>

            <Pagination meta={data.meta} onChange={setPage} />
          </>
        )}
      </section>

      {editing && (
        <SaleForm
          sale={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={refreshAll}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir venda"
        message={`Excluir a venda #${deleting?.number} de ${deleting?.client.company}? A comissao do mes sera recalculada.`}
        confirmLabel="Excluir"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
