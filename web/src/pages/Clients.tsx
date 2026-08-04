import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { SALE_STATUS } from '@/utils/status';
import { date, money } from '@/utils/format';
import type { Client, Paginated } from '@/types';

function ClientForm({
  client,
  onClose,
  onSaved,
}: {
  client: Partial<Client> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isAdmin } = useAuth();
  const sellers = useSellerOptions(isAdmin);
  const { toast } = useToast();

  const [form, setForm] = useState<Partial<Client>>(client ?? { active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(client?.id);
  const set = (key: keyof Client, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});

    const payload = {
      company: form.company,
      contactName: form.contactName,
      document: form.document || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      instagram: form.instagram || undefined,
      city: form.city || undefined,
      segment: form.segment || undefined,
      notes: form.notes || undefined,
      active: form.active ?? true,
      ...(isAdmin && form.sellerId ? { sellerId: form.sellerId } : {}),
    };

    try {
      if (isEdit) {
        await api.patch(`/clients/${client!.id}`, payload);
        toast('Cliente atualizado.');
      } else {
        await api.post('/clients', payload);
        toast('Cliente cadastrado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Nao foi possivel salvar o cliente.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar cliente' : 'Novo cliente'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="client-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            {isEdit ? 'Salvar alteracoes' : 'Cadastrar cliente'}
          </button>
        </>
      }
    >
      <form id="client-form" onSubmit={submit} className="space-y-3">
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

          <Field label="CNPJ / CPF" error={errors.document}>
            <input
              className="input"
              value={form.document ?? ''}
              onChange={(e) => set('document', e.target.value)}
            />
          </Field>

          <Field label="WhatsApp" error={errors.whatsapp}>
            <input
              className="input"
              value={form.whatsapp ?? ''}
              onChange={(e) => set('whatsapp', e.target.value)}
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

          <Field label="Instagram" error={errors.instagram}>
            <input
              className="input"
              value={form.instagram ?? ''}
              onChange={(e) => set('instagram', e.target.value)}
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
            />
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

          <Field label="Situacao">
            <select
              className="select"
              value={form.active === false ? 'false' : 'true'}
              onChange={(e) => set('active', e.target.value === 'true')}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </Field>
        </div>

        <Field label="Observacoes" error={errors.notes}>
          <textarea
            className="textarea"
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}

export function Clients() {
  const { isAdmin } = useAuth();
  const sellers = useSellerOptions(isAdmin);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sellerId, setSellerId] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const { data, loading, error, reload } = useApi<Paginated<Client>>('/clients', {
    search: debouncedSearch,
    status,
    sellerId: isAdmin ? sellerId : undefined,
    page,
    pageSize: 25,
  });

  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [busy, setBusy] = useState(false);

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/clients/${deleting.id}`);
      toast('Cliente excluido.');
      setDeleting(null);
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Empresas que ja fecharam negocio com a Frame Digital."
        actions={
          <button type="button" className="btn-primary btn-sm" onClick={() => setEditing({})}>
            <Plus className="w-3.5 h-3.5" />
            Novo cliente
          </button>
        }
      />

      <section className="panel">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => changeFilter(() => setSearch(v))}
            placeholder="Buscar empresa, responsavel, documento..."
          />
          <FilterSelect
            value={status}
            onChange={(v) => changeFilter(() => setStatus(v))}
            allLabel="Todos"
            label="Situacao"
            options={[
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' },
            ]}
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
            title="Nenhum cliente encontrado"
            description="Converta um lead ganho ou cadastre um cliente diretamente."
            action={
              <Link to="/leads" className="btn-secondary btn-sm">
                Ver leads
              </Link>
            }
          />
        ) : (
          <>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th className="hidden lg:table-cell">Contato</th>
                    <th className="hidden md:table-cell">Ultimo servico</th>
                    <th className="table-numeric">Total</th>
                    <th className="table-numeric hidden sm:table-cell">Vendas</th>
                    <th className="hidden lg:table-cell">Ultima venda</th>
                    {isAdmin && <th className="hidden xl:table-cell">Vendedor</th>}
                    <th className="w-px"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <Link
                          to={`/clientes/${client.id}`}
                          className="font-medium text-slate-900 hover:text-accent-600 inline-flex items-center gap-1"
                        >
                          {client.company}
                          <ExternalLink className="w-3 h-3 opacity-40" />
                        </Link>
                        <span className="block text-2xs text-slate-500">
                          {client.contactName}
                          {!client.active && (
                            <span className="ml-1.5 text-slate-400">(inativo)</span>
                          )}
                        </span>
                      </td>

                      <td className="hidden lg:table-cell text-2xs text-slate-600">
                        <span className="block">{client.whatsapp ?? '-'}</span>
                        <span className="block text-slate-500 truncate max-w-[180px]">
                          {client.city ?? ''}
                        </span>
                      </td>

                      <td className="hidden md:table-cell text-slate-600">
                        {client.lastService ?? <span className="text-slate-400">-</span>}
                      </td>

                      <td className="table-numeric font-medium">{money(client.totalValue)}</td>

                      <td className="table-numeric hidden sm:table-cell text-slate-600">
                        {client.salesCount ?? 0}
                      </td>

                      <td className="hidden lg:table-cell">
                        {client.lastSaleAt ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-2xs text-slate-500">
                              {date(client.lastSaleAt)}
                            </span>
                            {client.lastSaleStatus && (
                              <Badge {...SALE_STATUS[client.lastSaleStatus]} />
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="hidden xl:table-cell text-2xs text-slate-600">
                          {client.seller?.user.name ?? '-'}
                        </td>
                      )}

                      <td>
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => setEditing(client)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            onClick={() => setDeleting(client)}
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
        <ClientForm
          client={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir cliente"
        message={`Excluir "${deleting?.company}"? Clientes com vendas registradas nao podem ser excluidos - marque como inativo.`}
        confirmLabel="Excluir"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
