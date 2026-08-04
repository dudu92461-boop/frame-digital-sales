import { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react';
import { initials } from '@/utils/format';
import type { PageMeta } from '@/types';

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Estados de tela
// ---------------------------------------------------------------------------

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('animate-spin', className ?? 'w-4 h-4')} />;
}

export function LoadingBlock({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <Spinner />
      {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
      <AlertCircle className="w-6 h-6 text-red-500" />
      <p className="text-sm text-slate-600 max-w-md">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
      <Inbox className="w-6 h-6 text-slate-300" />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Identidade visual de dados
// ---------------------------------------------------------------------------

export function Badge({ label, className }: { label: string; className: string }) {
  return <span className={cx('badge', className)}>{label}</span>;
}

export function Avatar({
  name,
  color = '#2563eb',
  size = 'md',
}: {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'w-6 h-6 text-2xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-11 h-11 text-sm',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0',
        sizes[size],
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/** Barra de progresso simples. Fica ambar abaixo de 50% e verde ao bater 100%. */
export function ProgressBar({
  value,
  className,
  showLabel = false,
}: {
  value: number | null;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, value ?? 0));
  const width = `${pct * 100}%`;
  const tone =
    pct >= 1 ? 'bg-emerald-600' : pct >= 0.5 ? 'bg-accent-600' : 'bg-amber-500';

  return (
    <div className={cx('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={cx('h-full rounded-full transition-all', tone)} style={{ width }} />
      </div>
      {showLabel && (
        <span className="text-2xs font-medium text-slate-600 tabular-nums w-10 text-right">
          {Math.round(pct * 100)}%
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------------

/**
 * Indicador numerico compacto. Deliberadamente pequeno e denso: o painel precisa
 * caber varias informacoes na primeira dobra, sem cards gigantes.
 */
export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'muted';
}) {
  const tones = {
    default: 'text-slate-900',
    positive: 'text-emerald-700',
    warning: 'text-amber-700',
    muted: 'text-slate-500',
  };

  return (
    <div className="panel px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
      </div>
      <p className={cx('mt-1.5 text-xl font-semibold tabular-nums leading-none', tones[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-2xs text-slate-500 leading-tight">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navegacao de listas
// ---------------------------------------------------------------------------

export function Pagination({
  meta,
  onChange,
}: {
  meta: PageMeta;
  onChange: (page: number) => void;
}) {
  if (meta.total === 0) return null;

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200">
      <p className="text-xs text-slate-500">
        {from}-{to} de {meta.total}
      </p>
      {meta.pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={meta.page <= 1}
            onClick={() => onChange(meta.page - 1)}
            aria-label="Pagina anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs text-slate-600 tabular-nums">
            {meta.page} / {meta.pageCount}
          </span>
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={meta.page >= meta.pageCount}
            onClick={() => onChange(meta.page + 1)}
            aria-label="Proxima pagina"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Contorno de tabela com rolagem horizontal propria (nao empurra o layout). */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc fecha, e o scroll do fundo fica travado enquanto o modal esta aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-2xl', lg: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative w-full bg-white shadow-pop flex flex-col',
          // No celular abre como folha inferior; no desktop, modal centralizado.
          'rounded-t-lg sm:rounded-md max-h-[92vh] sm:max-h-[88vh]',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost btn-sm -mr-1 -mt-0.5 shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-2xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** Aviso de erro no topo de formularios e telas. */
export function Alert({
  message,
  tone = 'error',
}: {
  message: string;
  tone?: 'error' | 'warning' | 'info';
}) {
  const tones = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-accent-50 border-accent-200 text-accent-700',
  };
  return (
    <div className={cx('flex items-start gap-2 px-3 py-2 border rounded text-xs', tones[tone])}>
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
