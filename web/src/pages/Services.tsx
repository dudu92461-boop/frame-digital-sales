import { useState, type FormEvent } from 'react';
import { Lock, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import {
  Alert,
  Badge,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Modal,
  Spinner,
  TableWrap,
} from '@/components/ui';
import { money } from '@/utils/format';
import type { Service } from '@/types';

function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: Partial<Service> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Service>>(
    service ?? { active: true, recurring: false, price: 0 },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(service?.id);
  const set = (key: keyof Service, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});

    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      recurring: Boolean(form.recurring),
      active: form.active ?? true,
    };

    try {
      if (isEdit) {
        await api.patch(`/services/${service!.id}`, payload);
        toast('Servico atualizado.');
      } else {
        await api.post('/services', payload);
        toast('Servico criado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Nao foi possivel salvar o servico.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={isEdit ? 'Editar servico' : 'Novo servico'}
      description="Alterar o preco nao muda o valor de vendas ja registradas."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="service-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            Salvar
          </button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} className="space-y-3">
        {error && <Alert message={error} />}

        <Field label="Nome do servico" required error={errors.name}>
          <input
            className="input"
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </Field>

        <Field label="Descricao" error={errors.description}>
          <textarea
            className="textarea"
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="O que esta incluso no servico."
          />
        </Field>

        <Field label="Preco" required error={errors.price}>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={form.price ?? ''}
            onChange={(e) => set('price', e.target.value)}
            required
          />
        </Field>

        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={Boolean(form.recurring)}
              onChange={(e) => set('recurring', e.target.checked)}
            />
            Servico recorrente (cobranca mensal)
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={form.active !== false}
              onChange={(e) => set('active', e.target.checked)}
            />
            Ativo (disponivel para venda)
          </label>
        </div>
      </form>
    </Modal>
  );
}

export function Services() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [showInactive, setShowInactive] = useState(false);

  const { data, loading, error, reload } = useApi<Service[]>(
    '/services',
    isAdmin && showInactive ? { all: true } : undefined,
  );

  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/services/${deleting.id}`);
      toast('Servico excluido.');
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
        title="Servicos"
        description="Catalogo oficial da Frame Digital com os precos praticados."
        actions={
          isAdmin ? (
            <button type="button" className="btn-primary btn-sm" onClick={() => setEditing({})}>
              <Plus className="w-3.5 h-3.5" />
              Novo servico
            </button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <div className="flex items-start gap-2 px-3 py-2.5 mb-3 bg-white border border-slate-200 rounded text-xs text-slate-600">
          <Lock className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
          <span className="leading-relaxed">
            Os precos sao definidos pela administracao. Ao registrar uma venda, o valor e preenchido
            automaticamente e pode ser ajustado se voce negociou uma condicao diferente.
          </span>
        </div>
      )}

      <section className="panel">
        {isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50/60">
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Mostrar servicos inativos
            </label>
          </div>
        )}

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyBlock title="Nenhum servico cadastrado" />
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Servico</th>
                  <th className="hidden md:table-cell">Descricao</th>
                  <th className="table-numeric">Preco</th>
                  <th className="hidden sm:table-cell">Tipo</th>
                  {isAdmin && <th className="table-numeric hidden lg:table-cell">Vendas</th>}
                  {isAdmin && <th className="w-px"></th>}
                </tr>
              </thead>
              <tbody>
                {data.map((service) => (
                  <tr key={service.id} className={service.active ? '' : 'opacity-60'}>
                    <td>
                      <span className="block font-medium text-slate-900">{service.name}</span>
                      <span className="md:hidden block text-2xs text-slate-500 line-clamp-2">
                        {service.description}
                      </span>
                      {!service.active && (
                        <span className="text-2xs text-slate-500">(inativo)</span>
                      )}
                    </td>

                    <td className="hidden md:table-cell text-slate-600 max-w-md">
                      <span className="line-clamp-2">{service.description ?? '-'}</span>
                    </td>

                    <td className="table-numeric font-medium text-slate-900">
                      {money(service.price)}
                      {service.recurring && (
                        <span className="text-slate-400 font-normal">/mes</span>
                      )}
                    </td>

                    <td className="hidden sm:table-cell">
                      {service.recurring ? (
                        <Badge
                          label="Recorrente"
                          className="bg-accent-50 text-accent-700 border-accent-200"
                        />
                      ) : (
                        <Badge
                          label="Pontual"
                          className="bg-slate-100 text-slate-600 border-slate-200"
                        />
                      )}
                    </td>

                    {isAdmin && (
                      <td className="table-numeric hidden lg:table-cell text-slate-600">
                        {service._count?.sales ?? 0}
                      </td>
                    )}

                    {isAdmin && (
                      <td>
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => setEditing(service)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            onClick={() => setDeleting(service)}
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>

      {editing && (
        <ServiceForm
          service={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir servico"
        message={`Excluir "${deleting?.name}"? Servicos com vendas registradas nao podem ser excluidos - desative-os para preservar o historico.`}
        confirmLabel="Excluir"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
