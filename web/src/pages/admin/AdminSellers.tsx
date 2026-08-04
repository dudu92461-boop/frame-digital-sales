import { useState, type FormEvent } from 'react';
import { Ban, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApi, useDebounced } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterSelect, SearchInput } from '@/components/Filters';
import {
  Alert,
  Avatar,
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
import { AvatarPicker } from '@/components/AvatarPicker';
import { dateTime, money, percent } from '@/utils/format';
import type { Paginated, SellerAdmin } from '@/types';

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

function SellerForm({
  seller,
  onClose,
  onSaved,
}: {
  seller: SellerAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: seller?.user.name ?? '',
    email: seller?.user.email ?? '',
    password: '',
    code: seller?.code ?? '',
    phone: seller?.user.phone ?? '',
    city: seller?.city ?? '',
    role: seller?.user.role ?? 'SELLER',
    commissionOverride:
      seller?.commissionOverride != null ? String(seller.commissionOverride * 100) : '',
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(seller?.user.avatarUrl ?? null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(seller);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});

    const override =
      form.commissionOverride.trim() === '' ? null : Number(form.commissionOverride) / 100;

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      city: form.city || undefined,
      role: form.role,
      avatarUrl, // null remove a foto
      commissionOverride: override,
      ...(form.code ? { code: form.code } : {}),
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (isEdit) {
        await api.patch(`/sellers/${seller!.id}`, payload);
        toast('Vendedor atualizado.');
      } else {
        if (!form.password) {
          setError('Defina a senha inicial do vendedor.');
          setSaving(false);
          return;
        }
        await api.post('/sellers', payload);
        toast('Vendedor criado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Nao foi possivel salvar o vendedor.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Editar ${seller!.user.name}` : 'Novo vendedor'}
      description={
        isEdit
          ? 'Deixe a senha em branco para nao altera-la.'
          : 'O vendedor recebera o codigo automaticamente se o campo ficar vazio.'
      }
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="seller-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            {isEdit ? 'Salvar alteracoes' : 'Criar vendedor'}
          </button>
        </>
      }
    >
      <form id="seller-form" onSubmit={submit} className="space-y-4">
        {error && <Alert message={error} />}

        <AvatarPicker
          name={form.name}
          photoUrl={avatarUrl}
          color={seller?.user.avatarColor ?? '#2563eb'}
          onPhotoChange={setAvatarUrl}
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nome" required error={errors.name}>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </Field>

          <Field label="E-mail" required error={errors.email}>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </Field>

          <Field
            label={isEdit ? 'Nova senha' : 'Senha inicial'}
            required={!isEdit}
            error={errors.password}
            hint="Minimo de 8 caracteres."
          >
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              minLength={8}
              required={!isEdit}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Codigo" error={errors.code} hint="Ex.: FD-006. Vazio = automatico.">
            <input
              className="input font-mono"
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="FD-006"
            />
          </Field>

          <Field label="Telefone" error={errors.phone}>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>

          <Field label="Cidade" error={errors.city}>
            <input
              className="input"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </Field>

          <Field label="Nivel de acesso" error={errors.role}>
            <select
              className="select"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            >
              <option value="SELLER">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </Field>

          <Field
            label="Comissao fixa (%)"
            error={errors.commissionOverride}
            hint="Vazio usa o percentual padrao da equipe (25%)."
          >
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className="input"
              value={form.commissionOverride}
              onChange={(e) => set('commissionOverride', e.target.value)}
              placeholder="Padrao (25%)"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export function AdminSellers() {
  const { user: me } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const { data, loading, error, reload } = useApi<Paginated<SellerAdmin>>('/sellers', {
    search: debouncedSearch,
    status,
    page,
    pageSize: 25,
  });

  const [editing, setEditing] = useState<SellerAdmin | null | 'new'>(null);
  const [blocking, setBlocking] = useState<SellerAdmin | null>(null);
  const [deleting, setDeleting] = useState<SellerAdmin | null>(null);
  const [busy, setBusy] = useState(false);

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const confirmBlock = async () => {
    if (!blocking) return;
    setBusy(true);
    try {
      await api.patch(`/sellers/${blocking.id}`, { active: !blocking.user.active });
      toast(blocking.user.active ? 'Acesso bloqueado.' : 'Acesso desbloqueado.');
      setBlocking(null);
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Falha na operacao.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/sellers/${deleting.id}`);
      toast('Vendedor excluido.');
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
        title="Vendedores"
        description="Cadastro, acesso e comissionamento da equipe."
        actions={
          <button type="button" className="btn-primary btn-sm" onClick={() => setEditing('new')}>
            <Plus className="w-3.5 h-3.5" />
            Novo vendedor
          </button>
        }
      />

      <section className="panel">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => changeFilter(() => setSearch(v))}
            placeholder="Buscar nome, e-mail, codigo..."
          />
          <FilterSelect
            value={status}
            onChange={(v) => changeFilter(() => setStatus(v))}
            allLabel="Todos"
            label="Situacao"
            options={[
              { value: 'active', label: 'Ativos' },
              { value: 'blocked', label: 'Bloqueados' },
            ]}
          />
        </FilterBar>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : !data || data.items.length === 0 ? (
          <EmptyBlock title="Nenhum vendedor encontrado" />
        ) : (
          <>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th className="hidden md:table-cell">Contato</th>
                    <th className="table-numeric">Mes atual</th>
                    <th className="table-numeric hidden sm:table-cell">Comissao</th>
                    <th className="hidden lg:table-cell">Carteira</th>
                    <th className="hidden xl:table-cell">Regra de comissao</th>
                    <th>Situacao</th>
                    <th className="w-px"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((seller) => {
                    const isSelf = seller.user.id === me?.id;
                    return (
                      <tr key={seller.id} className={seller.user.active ? '' : 'opacity-60'}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={seller.user.name} color={seller.user.avatarColor} photoUrl={seller.user.avatarUrl} size="sm" />
                            <div className="min-w-0">
                              <span className="block font-medium text-slate-900 truncate">
                                {seller.user.name}
                                {seller.user.role === 'ADMIN' && (
                                  <span className="ml-1.5 text-2xs font-normal text-accent-600">
                                    admin
                                  </span>
                                )}
                              </span>
                              <span className="block font-mono text-2xs text-slate-500">
                                {seller.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="hidden md:table-cell text-2xs text-slate-600">
                          <span className="block truncate max-w-[180px]">{seller.user.email}</span>
                          <span className="block text-slate-500">
                            {seller.user.lastLoginAt
                              ? `Acesso ${dateTime(seller.user.lastLoginAt)}`
                              : 'Nunca acessou'}
                          </span>
                        </td>

                        <td className="table-numeric">
                          <span className="block font-medium">{money(seller.monthRevenue)}</span>
                          <span className="block text-2xs text-slate-500">
                            {seller.monthSales} venda(s)
                          </span>
                        </td>

                        <td className="table-numeric hidden sm:table-cell text-slate-600">
                          {money(seller.monthCommission)}
                        </td>

                        <td className="hidden lg:table-cell text-2xs text-slate-600">
                          {seller._count.leads} leads - {seller._count.clients} clientes -{' '}
                          {seller._count.sales} vendas
                        </td>

                        <td className="hidden xl:table-cell text-2xs text-slate-600">
                          {seller.commissionOverride != null
                            ? `Fixa em ${percent(seller.commissionOverride, 1)}`
                            : 'Padrao da equipe (25%)'}
                        </td>

                        <td>
                          {seller.user.active ? (
                            <Badge
                              label="Ativo"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            />
                          ) : (
                            <Badge
                              label="Bloqueado"
                              className="bg-red-50 text-red-700 border-red-200"
                            />
                          )}
                        </td>

                        <td>
                          <div className="flex items-center gap-0.5 justify-end">
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => setEditing(seller)}
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  className="btn-ghost btn-sm"
                                  onClick={() => setBlocking(seller)}
                                  title={seller.user.active ? 'Bloquear acesso' : 'Desbloquear'}
                                >
                                  {seller.user.active ? (
                                    <Ban className="w-3.5 h-3.5 text-amber-600" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleting(seller)}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
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

      {editing && (
        <SellerForm
          seller={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(blocking)}
        title={blocking?.user.active ? 'Bloquear acesso' : 'Desbloquear acesso'}
        message={
          blocking?.user.active
            ? `Bloquear o acesso de ${blocking?.user.name}? A sessao atual dele deixa de funcionar imediatamente. Os dados e o historico sao preservados.`
            : `Desbloquear o acesso de ${blocking?.user.name}?`
        }
        confirmLabel={blocking?.user.active ? 'Bloquear' : 'Desbloquear'}
        danger={blocking?.user.active}
        loading={busy}
        onConfirm={confirmBlock}
        onCancel={() => setBlocking(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir vendedor"
        message={`Excluir ${deleting?.user.name}? So e possivel excluir vendedores sem vendas registradas - caso contrario, bloqueie o acesso.`}
        confirmLabel="Excluir"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
