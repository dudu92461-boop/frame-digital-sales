import { useState, type FormEvent } from 'react';
import { Pencil, Target } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, PeriodSelect } from '@/components/Filters';
import {
  Alert,
  Avatar,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Modal,
  ProgressBar,
  Spinner,
  Stat,
} from '@/components/ui';
import { money, monthLabel, percent } from '@/utils/format';
import type { GoalRow } from '@/types';

interface GoalsResponse {
  period: { month: number; year: number };
  items: GoalRow[];
}

function GoalForm({
  row,
  month,
  year,
  onClose,
  onSaved,
}: {
  row: GoalRow;
  month: number;
  year: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [salesTarget, setSalesTarget] = useState(String(row.salesTarget ?? 10));
  const [revenueTarget, setRevenueTarget] = useState(String(row.revenueTarget ?? 5000));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/goals', {
        sellerId: row.sellerId,
        month,
        year,
        salesTarget: Number(salesTarget),
        revenueTarget: Number(revenueTarget),
      });
      toast('Meta salva.');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar a meta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Meta de ${row.name}`}
      description={monthLabel(month, year)}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="goal-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            Salvar meta
          </button>
        </>
      }
    >
      <form id="goal-form" onSubmit={submit} className="space-y-3">
        {error && <Alert message={error} />}

        <Field label="Meta de vendas" required hint="Quantidade de vendas no mes.">
          <input
            type="number"
            min="0"
            className="input"
            value={salesTarget}
            onChange={(e) => setSalesTarget(e.target.value)}
            required
          />
        </Field>

        <Field label="Meta financeira" required hint="Valor a ser vendido no mes.">
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={revenueTarget}
            onChange={(e) => setRevenueTarget(e.target.value)}
            required
          />
        </Field>
      </form>
    </Modal>
  );
}

/** Cartao de meta usado tanto pelo vendedor quanto pelo admin. */
function GoalCard({
  row,
  canEdit,
  onEdit,
}: {
  row: GoalRow;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const hasGoal = row.salesTarget != null;

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={row.name} color={row.avatarColor} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{row.name}</p>
            <p className="font-mono text-2xs text-slate-500">{row.code}</p>
          </div>
        </div>
        {canEdit && (
          <button type="button" className="btn-ghost btn-sm shrink-0" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
            {hasGoal ? 'Editar' : 'Definir'}
          </button>
        )}
      </div>

      {hasGoal ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs text-slate-600">Vendas</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {row.salesDone} / {row.salesTarget}
              </span>
            </div>
            <ProgressBar value={row.salesPercent} showLabel />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs text-slate-600">Faturamento</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {money(row.revenueDone)}
              </span>
            </div>
            <ProgressBar value={row.revenuePercent} showLabel />
            <p className="mt-1 text-2xs text-slate-500">Meta: {money(row.revenueTarget)}</p>
          </div>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-slate-500">
          Nenhuma meta definida para este mes.
        </p>
      )}
    </div>
  );
}

export function Goals() {
  const { isAdmin } = useAuth();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [editing, setEditing] = useState<GoalRow | null>(null);

  const { data, loading, error, reload } = useApi<GoalsResponse>('/goals', { month, year });

  const items = data?.items ?? [];
  const withGoal = items.filter((i) => i.salesTarget != null);
  const achieved = withGoal.filter((i) => (i.salesPercent ?? 0) >= 1).length;
  const totalTarget = withGoal.reduce((sum, i) => sum + (i.revenueTarget ?? 0), 0);
  const totalDone = withGoal.reduce((sum, i) => sum + i.revenueDone, 0);

  return (
    <>
      <PageHeader
        title="Metas"
        description={`Acompanhamento de ${monthLabel(month, year)}.`}
      />

      {isAdmin && withGoal.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Stat label="Vendedores com meta" value={String(withGoal.length)} tone="neutral" />
          <Stat
            label="Bateram a meta"
            value={String(achieved)}
            tone={achieved > 0 ? 'money' : 'pending'}
          />
          <Stat label="Meta total" value={money(totalTarget)} tone="goal" />
          <Stat
            label="Realizado"
            value={money(totalDone)}
            hint={totalTarget > 0 ? percent(totalDone / totalTarget) + ' da meta' : undefined}
            tone="brand"
          />
        </div>
      )}

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
          {isAdmin && (
            <p className="text-2xs text-slate-500 ml-auto">
              Como administrador, voce define a meta de cada vendedor.
            </p>
          )}
        </FilterBar>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <div className="panel">
          <EmptyBlock
            title="Nenhum vendedor encontrado"
            description="Cadastre vendedores para definir metas."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((row) => (
            <GoalCard
              key={row.sellerId}
              row={row}
              canEdit={isAdmin}
              onEdit={() => setEditing(row)}
            />
          ))}
        </div>
      )}

      {!isAdmin && items.length > 0 && (
        <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded text-xs text-slate-600">
          <Target className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
          <span className="leading-relaxed">
            As metas sao definidas pelo administrador. O progresso considera todas as vendas do mes,
            exceto as canceladas.
          </span>
        </div>
      )}

      {editing && (
        <GoalForm
          row={editing}
          month={month}
          year={year}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </>
  );
}
