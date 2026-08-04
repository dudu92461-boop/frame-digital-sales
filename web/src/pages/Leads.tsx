import { useState, type FormEvent } from 'react';
import {
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useApi, useDebounced } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useSellerOptions } from '@/hooks/useOptions';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterSelect, SearchInput } from '@/components/Filters';
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
  TableWrap,
} from '@/components/ui';
import { LEAD_STATUS, LEAD_STATUS_OPTIONS } from '@/utils/status';
import { date, money } from '@/utils/format';
import type { Lead, LeadStatus, Paginated } from '@/types';

type LeadsResponse = Paginated<Lead> & { statusCounts: Record<LeadStatus, number> };

const EMPTY: Partial<Lead> = { status: 'NOVO' };

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

function LeadForm({
  lead,
  onClose,
  onSaved,
}: {
  lead: Partial<Lead> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isAdmin } = useAuth();
  const sellers = useSellerOptions(isAdmin);
  const { toast } = useToast();

  const [form, setForm] = useState<Partial<Lead>>(lead ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(lead?.id);
  const set = (key: keyof Lead, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});

    const payload = {
      company: form.company,
      contactName: form.contactName,
      whatsapp: form.whatsapp || undefined,
      instagram: form.instagram || undefined,
      email: form.email || undefined,
      city: form.city || undefined,
      segment: form.segment || undefined,
      notes: form.notes || undefined,
      status: form.status,
      value: form.value ? Number(form.value) : undefined,
      ...(isAdmin && form.sellerId ? { sellerId: form.sellerId } : {}),
    };

    try {
      if (isEdit) {
        await api.patch(`/leads/${lead!.id}`, payload);
        toast('Lead atualizado.');
      } else {
        await api.post('/leads', payload);
        toast('Lead cadastrado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Nao foi possivel salvar o lead.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar lead' : 'Novo lead'}
      description="Dados da empresa e do responsavel pelo contato."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="lead-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            {isEdit ? 'Salvar alteracoes' : 'Cadastrar lead'}
          </button>
        </>
      }
    >
      <form id="lead-form" onSubmit={submit} className="space-y-3">
        {error && <Alert message={error} />}

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nome da empresa" required error={errors.company}>
            <input
              className="input"
              value={form.company ?? ''}
              onChange={(e) => set('company', e.target.value)}
              required
            />
          </Field>

          <Field label="Nome do responsavel" required error={errors.contactName}>
            <input
              className="input"
              value={form.contactName ?? ''}
              onChange={(e) => set('contactName', e.target.value)}
              required
            />
          </Field>

          <Field label="WhatsApp" error={errors.whatsapp}>
            <input
              className="input"
              value={form.whatsapp ?? ''}
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="(51) 99999-9999"
            />
          </Field>

          <Field label="Instagram" error={errors.instagram}>
            <input
              className="input"
              value={form.instagram ?? ''}
              onChange={(e) => set('instagram', e.target.value)}
              placeholder="@empresa"
            />
          </Field>

          <Field label="E-mail" error={errors.email}>
            <input
              type="email"
              className="input"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>

          <Field label="Cidade" error={errors.city}>
            <input
              className="input"
              value={form.city ?? ''}
              onChange={(e) => set('city', e.target.value)}
            />
          </Field>

          <Field label="Segmento" error={errors.segment}>
            <input
              className="input"
              value={form.segment ?? ''}
              onChange={(e) => set('segment', e.target.value)}
              placeholder="Alimentacao, Saude, Varejo..."
            />
          </Field>

          <Field label="Valor estimado" error={errors.value}>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.value ?? ''}
              onChange={(e) => set('value', e.target.value)}
            />
          </Field>

          <Field label="Status" error={errors.status}>
            <select
              className="select"
              value={form.status ?? 'NOVO'}
              onChange={(e) => set('status', e.target.value)}
            >
              {LEAD_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          {isAdmin && (
            <Field label="Vendedor responsavel" required={!isEdit} error={errors.sellerId}>
              <select
                className="select"
                value={form.sellerId ?? ''}
                onChange={(e) => set('sellerId', e.target.value)}
                required={!isEdit}
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
        </div>

        <Field label="Observacoes" error={errors.notes}>
          <textarea
            className="textarea"
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Historico do contato, objecoes, proximos passos..."
          />
        </Field>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export function Leads() {
  const { isAdmin } = useAuth();
  const sellers = useSellerOptions(isAdmin);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sellerId, setSellerId] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const { data, loading, error, reload } = useApi<LeadsResponse>('/leads', {
    search: debouncedSearch,
    status,
    sellerId: isAdmin ? sellerId : undefined,
    page,
    pageSize: 25,
  });

  const [editing, setEditing] = useState<Partial<Lead> | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [converting, setConverting] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);

  // Qualquer filtro alterado volta para a primeira pagina.
  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const changeStatus = async (lead: Lead, next: LeadStatus) => {
    try {
      await api.patch(`/leads/${lead.id}`, { status: next });
      toast('Status atualizado.');
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha ao atualizar o status.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/leads/${deleting.id}`);
      toast('Lead excluido.');
      setDeleting(null);
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmConvert = async () => {
    if (!converting) return;
    setBusy(true);
    try {
      await api.post(`/leads/${converting.id}/convert`, {});
      toast(`${converting.company} agora e cliente.`);
      setConverting(null);
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha ao converter.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Leads"
        description="Cadastro e acompanhamento das negociacoes em andamento."
        actions={
          <button type="button" className="btn-primary btn-sm" onClick={() => setEditing(EMPTY)}>
            <Plus className="w-3.5 h-3.5" />
            Novo lead
          </button>
        }
      />

      {/* Resumo por etapa do funil. Clicar filtra a lista. */}
      {data && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => changeFilter(() => setStatus('all'))}
            className={`shrink-0 px-3 py-2 rounded border text-left transition-colors ${
              status === 'all'
                ? 'bg-ink-900 border-ink-900 text-white'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="block text-2xs uppercase tracking-wide opacity-70">Todos</span>
            <span className="block text-sm font-semibold tabular-nums">{data.meta.total}</span>
          </button>

          {LEAD_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeFilter(() => setStatus(option.value))}
              className={`shrink-0 px-3 py-2 rounded border text-left transition-colors ${
                status === option.value
                  ? 'bg-ink-900 border-ink-900 text-white'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="block text-2xs uppercase tracking-wide opacity-70 whitespace-nowrap">
                {option.label}
              </span>
              <span className="block text-sm font-semibold tabular-nums">
                {data.statusCounts[option.value] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <section className="panel">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => changeFilter(() => setSearch(v))}
            placeholder="Buscar empresa, responsavel, cidade..."
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
        </FilterBar>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : !data || data.items.length === 0 ? (
          <EmptyBlock
            title="Nenhum lead encontrado"
            description={
              search || status !== 'all'
                ? 'Ajuste os filtros para ver outros resultados.'
                : 'Cadastre o primeiro lead para comecar a acompanhar as negociacoes.'
            }
            action={
              <button type="button" className="btn-primary btn-sm" onClick={() => setEditing(EMPTY)}>
                <Plus className="w-3.5 h-3.5" />
                Novo lead
              </button>
            }
          />
        ) : (
          <>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th className="hidden md:table-cell">Contato</th>
                    <th className="hidden lg:table-cell">Cidade / Segmento</th>
                    <th className="table-numeric hidden sm:table-cell">Valor</th>
                    <th>Status</th>
                    {isAdmin && <th className="hidden lg:table-cell">Vendedor</th>}
                    <th className="hidden xl:table-cell">Cadastro</th>
                    <th className="w-px"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <span className="block font-medium text-slate-900">{lead.company}</span>
                        <span className="block text-2xs text-slate-500">{lead.contactName}</span>
                      </td>

                      <td className="hidden md:table-cell">
                        <div className="flex flex-col gap-0.5 text-2xs text-slate-600">
                          {lead.whatsapp && (
                            <a
                              href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:text-accent-600"
                            >
                              <MessageCircle className="w-3 h-3" />
                              {lead.whatsapp}
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center gap-1 hover:text-accent-600 truncate max-w-[180px]"
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                          )}
                          {lead.instagram && (
                            <span className="inline-flex items-center gap-1">
                              <Instagram className="w-3 h-3" />
                              {lead.instagram}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="hidden lg:table-cell">
                        <span className="block text-2xs text-slate-600">
                          {lead.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {lead.city}
                            </span>
                          )}
                        </span>
                        <span className="block text-2xs text-slate-500">{lead.segment ?? '-'}</span>
                      </td>

                      <td className="table-numeric hidden sm:table-cell">
                        {lead.value ? money(lead.value) : <span className="text-slate-400">-</span>}
                      </td>

                      <td>
                        {/* Select nativo: troca de etapa em um toque, sem abrir modal. */}
                        <select
                          className="text-2xs border border-slate-200 rounded px-1.5 py-1 bg-white hover:border-slate-300 max-w-[150px]"
                          value={lead.status}
                          onChange={(e) => changeStatus(lead, e.target.value as LeadStatus)}
                          aria-label={`Status de ${lead.company}`}
                        >
                          {LEAD_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {isAdmin && (
                        <td className="hidden lg:table-cell text-2xs text-slate-600">
                          {lead.seller?.user.name ?? '-'}
                        </td>
                      )}

                      <td className="hidden xl:table-cell text-2xs text-slate-500">
                        {date(lead.createdAt)}
                      </td>

                      <td>
                        <div className="flex items-center gap-0.5 justify-end">
                          {!lead.clientId && (
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => setConverting(lead)}
                              title="Converter em cliente"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => setEditing(lead)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            onClick={() => setDeleting(lead)}
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
        <LeadForm
          lead={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir lead"
        message={`Excluir o lead "${deleting?.company}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={Boolean(converting)}
        title="Converter em cliente"
        message={`Criar o cliente "${converting?.company}" a partir deste lead? O lead sera marcado como GANHO e voce podera registrar vendas para ele.`}
        confirmLabel="Converter"
        loading={busy}
        onConfirm={confirmConvert}
        onCancel={() => setConverting(null)}
      />
    </>
  );
}
