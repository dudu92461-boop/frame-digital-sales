import { useMemo, useState, type FormEvent } from 'react';
import { ExternalLink, FileText, Film, Image, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { TrainingSection } from '@/components/TrainingSection';
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
} from '@/components/ui';
import type { Material } from '@/types';

const CATEGORY_LABEL: Record<Material['category'], string> = {
  GERAL: 'Geral',
  COMERCIAL: 'Comercial',
  TECNICO: 'Tecnico',
  MIDIA: 'Midia',
};

const FILE_ICON: Record<Material['fileType'], typeof FileText> = {
  LINK: Link2,
  PDF: FileText,
  DOC: FileText,
  IMAGE: Image,
  VIDEO: Film,
};

function MaterialForm({
  material,
  onClose,
  onSaved,
}: {
  material: Partial<Material> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Material>>(
    material ?? { category: 'GERAL', fileType: 'LINK', active: true },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(material?.id);
  const set = (key: keyof Material, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});

    const payload = {
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      url: form.url,
      fileType: form.fileType,
      active: form.active ?? true,
    };

    try {
      if (isEdit) {
        await api.patch(`/materials/${material!.id}`, payload);
        toast('Material atualizado.');
      } else {
        await api.post('/materials', payload);
        toast('Material adicionado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Nao foi possivel salvar o material.');
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
      title={isEdit ? 'Editar material' : 'Novo material'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="material-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            Salvar
          </button>
        </>
      }
    >
      <form id="material-form" onSubmit={submit} className="space-y-3">
        {error && <Alert message={error} />}

        <Field label="Titulo" required error={errors.title}>
          <input
            className="input"
            value={form.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </Field>

        <Field label="Descricao" error={errors.description}>
          <textarea
            className="textarea"
            rows={2}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <Field label="URL" required error={errors.url} hint="Link do arquivo ou pagina.">
          <input
            type="url"
            className="input"
            value={form.url ?? ''}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://..."
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria" error={errors.category}>
            <select
              className="select"
              value={form.category ?? 'GERAL'}
              onChange={(e) => set('category', e.target.value)}
            >
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tipo" error={errors.fileType}>
            <select
              className="select"
              value={form.fileType ?? 'LINK'}
              onChange={(e) => set('fileType', e.target.value)}
            >
              {Object.keys(FILE_ICON).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            className="rounded border-slate-300"
            checked={form.active !== false}
            onChange={(e) => set('active', e.target.checked)}
          />
          Visivel para os vendedores
        </label>
      </form>
    </Modal>
  );
}

export function Materials() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState('all');

  const { data, loading, error, reload } = useApi<Material[]>(
    '/materials',
    isAdmin ? { all: true } : undefined,
  );

  const [editing, setEditing] = useState<Partial<Material> | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => (data ?? []).filter((m) => category === 'all' || m.category === category),
    [data, category],
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/materials/${deleting.id}`);
      toast('Material excluido.');
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
        title="Materiais"
        description="Treinamento de vendas e apoios comerciais para a equipe."
        actions={
          isAdmin ? (
            <button type="button" className="btn-primary btn-sm" onClick={() => setEditing({})}>
              <Plus className="w-3.5 h-3.5" />
              Novo material
            </button>
          ) : undefined
        }
      />

      <TrainingSection />

      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Apoios de venda</h2>
        <span className="text-2xs text-slate-500">
          propostas, portfolio, scripts e tabelas
        </span>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {['all', ...Object.keys(CATEGORY_LABEL)].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`shrink-0 px-3 h-8 rounded border text-xs font-medium transition-colors ${
              category === value
                ? 'bg-ink-900 border-ink-900 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {value === 'all' ? 'Todos' : CATEGORY_LABEL[value as Material['category']]}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyBlock
            title="Nenhum apoio de venda nesta categoria"
            description={
              isAdmin
                ? 'Adicione propostas, portfolio ou scripts para a equipe. O treinamento acima ja esta sempre disponivel.'
                : 'Por enquanto, use o treinamento de vendas acima. Novos apoios aparecem aqui quando a Frame publicar.'
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((material) => {
            const Icon = FILE_ICON[material.fileType];
            return (
              <div
                key={material.id}
                className={`panel p-4 flex flex-col ${material.active ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="grid place-items-center w-9 h-9 rounded bg-slate-100 text-slate-500 shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {material.title}
                      {!material.active && (
                        <span className="ml-1.5 text-2xs font-normal text-slate-500">
                          (oculto)
                        </span>
                      )}
                    </p>
                    {material.description && (
                      <p className="mt-0.5 text-2xs text-slate-500 leading-relaxed line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge
                        label={CATEGORY_LABEL[material.category]}
                        className="bg-slate-100 text-slate-600 border-slate-200"
                      />
                      <Badge
                        label={material.fileType}
                        className="bg-white text-slate-500 border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent-600 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir material
                  </a>

                  {isAdmin && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setEditing(material)}
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                        onClick={() => setDeleting(material)}
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <MaterialForm
          material={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir material"
        message={`Excluir "${deleting?.title}"?`}
        confirmLabel="Excluir"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
