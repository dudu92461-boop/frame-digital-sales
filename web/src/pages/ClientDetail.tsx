import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Instagram, Mail, MapPin, MessageCircle, Tag } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import {
  Badge,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Stat,
  TableWrap,
} from '@/components/ui';
import { COMMISSION_STATUS, LEAD_STATUS, SALE_STATUS } from '@/utils/status';
import { date, money, percent } from '@/utils/format';
import type { ClientDetail } from '@/types';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-2xs text-slate-500">{label}</p>
        <p className="text-xs text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useApi<ClientDetail>(id ? `/clients/${id}` : null);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <>
      <Link
        to="/clientes"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para clientes
      </Link>

      <PageHeader
        title={data.company}
        description={`${data.contactName}${data.segment ? ` - ${data.segment}` : ''}`}
        actions={
          !data.active ? (
            <Badge label="Inativo" className="bg-slate-100 text-slate-500 border-slate-200" />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Total vendido" value={money(data.summary.totalValue)} tone="brand" />
        <Stat label="Ja recebido" value={money(data.summary.paidValue)} tone="money" />
        <Stat label="Vendas" value={String(data.summary.salesCount)} tone="neutral" />
        <Stat label="Comissao gerada" value={money(data.summary.commissionTotal)} tone="goal" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Ficha cadastral */}
        <section className="panel lg:col-span-1 h-fit">
          <div className="panel-header">
            <h2 className="panel-title">Ficha do cliente</h2>
          </div>
          <div className="px-4 py-3 divide-y divide-slate-100">
            <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Empresa" value={data.company} />
            <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="CNPJ / CPF" value={data.document} />
            <InfoRow
              icon={<MessageCircle className="w-3.5 h-3.5" />}
              label="WhatsApp"
              value={data.whatsapp}
            />
            <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="E-mail" value={data.email} />
            <InfoRow
              icon={<Instagram className="w-3.5 h-3.5" />}
              label="Instagram"
              value={data.instagram}
            />
            <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Cidade" value={data.city} />
            <InfoRow
              icon={<Tag className="w-3.5 h-3.5" />}
              label="Segmento"
              value={data.segment}
            />
            {isAdmin && (
              <InfoRow
                icon={<Tag className="w-3.5 h-3.5" />}
                label="Vendedor responsavel"
                value={data.seller ? `${data.seller.code} - ${data.seller.user.name}` : null}
              />
            )}
            <InfoRow
              icon={<Tag className="w-3.5 h-3.5" />}
              label="Cliente desde"
              value={date(data.createdAt)}
            />
          </div>

          {data.lead && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-2xs text-slate-500 mb-1">Origem</p>
              <p className="text-xs text-slate-700">
                Convertido de um lead cadastrado em {date(data.lead.createdAt)}{' '}
                <Badge {...LEAD_STATUS[data.lead.status]} />
              </p>
            </div>
          )}

          {data.notes && (
            <div className="px-4 py-3 border-t border-slate-200">
              <p className="text-2xs text-slate-500 mb-1">Observacoes</p>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {data.notes}
              </p>
            </div>
          )}
        </section>

        {/* Historico de vendas */}
        <section className="panel lg:col-span-2">
          <div className="panel-header">
            <h2 className="panel-title">Historico de vendas</h2>
            <Link to="/vendas" className="text-2xs text-accent-600 hover:underline">
              Registrar venda
            </Link>
          </div>

          {data.sales.length === 0 ? (
            <EmptyBlock
              title="Nenhuma venda registrada"
              description="Registre a primeira venda para este cliente."
            />
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-14">#</th>
                    <th>Servico</th>
                    <th className="table-numeric">Valor</th>
                    <th>Status</th>
                    <th className="table-numeric hidden sm:table-cell">Comissao</th>
                    <th className="hidden md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-mono text-2xs text-slate-500">{sale.number}</td>
                      <td className="font-medium text-slate-900">{sale.service.name}</td>
                      <td className="table-numeric font-medium">{money(sale.amount)}</td>
                      <td>
                        <Badge {...SALE_STATUS[sale.status]} />
                      </td>
                      <td className="table-numeric hidden sm:table-cell">
                        {sale.commission ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span>
                              {money(sale.commission.amount)}
                              <span className="text-slate-400 ml-1">
                                ({percent(sale.commission.rate, 0)})
                              </span>
                            </span>
                            <Badge {...COMMISSION_STATUS[sale.commission.status]} />
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell text-slate-500">{date(sale.soldAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </section>
      </div>
    </>
  );
}
