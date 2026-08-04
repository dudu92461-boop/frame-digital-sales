import { useState } from 'react';
import { useApi, useDebounced } from '@/hooks/useApi';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterSelect, SearchInput } from '@/components/Filters';
import {
  Badge,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Pagination,
  TableWrap,
} from '@/components/ui';
import { dateTime } from '@/utils/format';
import type { AuditLog, Paginated } from '@/types';

const ACTION_STYLE: Record<string, { label: string; className: string }> = {
  LOGIN: { label: 'Login', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  CREATE: { label: 'Criacao', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  UPDATE: { label: 'Alteracao', className: 'bg-accent-50 text-accent-700 border-accent-200' },
  DELETE: { label: 'Exclusao', className: 'bg-red-50 text-red-700 border-red-200' },
  APPROVE: { label: 'Aprovacao', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  RELEASE: { label: 'Liberacao', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PAY: { label: 'Pagamento', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  BLOCK: { label: 'Bloqueio', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  UNBLOCK: { label: 'Desbloqueio', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const ENTITY_LABEL: Record<string, string> = {
  user: 'Usuario',
  seller: 'Vendedor',
  lead: 'Lead',
  client: 'Cliente',
  sale: 'Venda',
  commission: 'Comissao',
  service: 'Servico',
  material: 'Material',
  goal: 'Meta',
};

export function AdminAudit() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const { data, loading, error, reload } = useApi<Paginated<AuditLog>>('/audit-logs', {
    search: debouncedSearch,
    status: action, // o backend usa `status` como filtro de acao nesta rota
    page,
    pageSize: 50,
  });

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Trilha de acoes administrativas e comerciais do sistema."
      />

      <section className="panel">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => changeFilter(() => setSearch(v))}
            placeholder="Buscar por autor, entidade ou detalhe..."
          />
          <FilterSelect
            value={action}
            onChange={(v) => changeFilter(() => setAction(v))}
            allLabel="Todas as acoes"
            label="Acao"
            options={Object.entries(ACTION_STYLE).map(([value, s]) => ({
              value,
              label: s.label,
            }))}
          />
        </FilterBar>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : !data || data.items.length === 0 ? (
          <EmptyBlock
            title="Nenhum registro encontrado"
            description="As acoes do sistema aparecem aqui automaticamente."
          />
        ) : (
          <>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Data e hora</th>
                    <th>Autor</th>
                    <th>Acao</th>
                    <th className="hidden sm:table-cell">Entidade</th>
                    <th className="hidden md:table-cell">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((log) => {
                    const style = ACTION_STYLE[log.action] ?? {
                      label: log.action,
                      className: 'bg-slate-100 text-slate-600 border-slate-200',
                    };
                    return (
                      <tr key={log.id}>
                        <td className="text-2xs text-slate-500 whitespace-nowrap tabular-nums">
                          {dateTime(log.createdAt)}
                        </td>
                        <td className="font-medium text-slate-800">{log.actorName}</td>
                        <td>
                          <Badge {...style} />
                        </td>
                        <td className="hidden sm:table-cell text-slate-600">
                          {ENTITY_LABEL[log.entity] ?? log.entity}
                        </td>
                        <td className="hidden md:table-cell text-2xs text-slate-600 max-w-md">
                          <span className="line-clamp-2">{log.detail ?? '-'}</span>
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
    </>
  );
}
