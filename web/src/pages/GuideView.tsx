import { Fragment, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Lightbulb,
  ListChecks,
  Quote,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { HANDBOOK, chapterBySlug, type Block } from '@/content/handbook';
import { EmptyBlock } from '@/components/ui';

// Negrito inline: **texto** vira <strong>. Mantemos minimo de proposito --
// sem dependencia de markdown para nao inchar o bundle.
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

const CALLOUT_STYLE = {
  dica: { icon: Lightbulb, wrap: 'bg-brand-50 border-brand-200', mark: 'text-brand-600', label: 'Dica' },
  atencao: {
    icon: TriangleAlert,
    wrap: 'bg-pending-50 border-pending-200',
    mark: 'text-pending-600',
    label: 'Atencao',
  },
  exemplo: {
    icon: Info,
    wrap: 'bg-money-50 border-money-200',
    mark: 'text-money-600',
    label: 'Exemplo',
  },
  passo: {
    icon: ListChecks,
    wrap: 'bg-goal-50 border-goal-200',
    mark: 'text-goal-600',
    label: 'Passo a passo',
  },
} as const;

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case 'h':
      return (
        <h2 className="text-base font-semibold text-slate-900 mt-7 mb-2 scroll-mt-20">
          {block.text}
        </h2>
      );

    case 'p':
      return <p className="text-sm text-slate-700 leading-relaxed mb-3">{renderInline(block.text)}</p>;

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-sm text-slate-700 leading-relaxed marker:text-slate-400 marker:font-medium">
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mb-3 space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" aria-hidden />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );

    case 'callout': {
      const style = CALLOUT_STYLE[block.kind];
      const Icon = style.icon;
      const lines = Array.isArray(block.text) ? block.text : [block.text];
      return (
        <div className={`rounded-lg border p-3.5 my-4 ${style.wrap}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon className={`w-4 h-4 ${style.mark}`} />
            <span className={`text-2xs font-semibold uppercase tracking-wide ${style.mark}`}>
              {block.title ?? style.label}
            </span>
          </div>
          <div className="space-y-1">
            {lines.map((line, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed">
                {renderInline(line)}
              </p>
            ))}
          </div>
        </div>
      );
    }

    case 'script':
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 my-4">
          {block.title && (
            <p className="text-2xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {block.title}
            </p>
          )}
          <div className="space-y-2.5">
            {block.lines.map((line, i) => (
              <div key={i}>
                {line.who && (
                  <span className="block text-2xs font-semibold text-slate-500 mb-0.5">
                    {line.who}
                  </span>
                )}
                <p
                  className={`text-sm leading-relaxed ${
                    line.who === 'Voce'
                      ? 'text-slate-800 border-l-2 border-brand-400 pl-3'
                      : 'text-slate-600 border-l-2 border-slate-200 pl-3 italic'
                  }`}
                >
                  {renderInline(line.text)}
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className="my-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th
                    key={i}
                    className="text-left px-3 py-2 bg-slate-50 border-b border-slate-200 text-2xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={`px-3 py-2 border-b border-slate-100 text-slate-700 ${
                        c === 0 ? 'font-medium text-slate-900 whitespace-nowrap' : ''
                      }`}
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="my-4 flex gap-2.5 rounded-lg bg-ink-900 p-4 text-white">
          <Quote className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed italic">{block.text}</p>
        </blockquote>
      );
  }
}

export function GuideView() {
  const { slug } = useParams<{ slug: string }>();
  const chapter = slug ? chapterBySlug(slug) : undefined;

  if (!chapter) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link to="/materiais" className="btn-secondary btn-sm mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar aos materiais
        </Link>
        <div className="panel">
          <EmptyBlock
            title="Guia nao encontrado"
            description="Este material de treinamento nao existe ou foi movido."
          />
        </div>
      </div>
    );
  }

  const index = HANDBOOK.findIndex((c) => c.slug === chapter.slug);
  const prev = index > 0 ? HANDBOOK[index - 1] : null;
  const next = index < HANDBOOK.length - 1 ? HANDBOOK[index + 1] : null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/materiais"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Treinamento comercial
      </Link>

      {/* Cabecalho do capitulo */}
      <header className="mb-6 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-2 text-2xs font-medium text-brand-600 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Capitulo {chapter.order} de {HANDBOOK.length}
          <span className="text-slate-300">|</span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">{chapter.minutes} min de leitura</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{chapter.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{chapter.subtitle}</p>
      </header>

      {/* Conteudo */}
      <article className="pb-2">
        {chapter.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </article>

      {/* Navegacao entre capitulos */}
      <nav className="mt-8 pt-5 border-t border-slate-200 grid sm:grid-cols-2 gap-3">
        {prev ? (
          <Link to={`/materiais/guia/${prev.slug}`} className="panel p-3.5 hover:shadow-raised transition-shadow group">
            <span className="flex items-center gap-1 text-2xs text-slate-500 mb-1">
              <ArrowLeft className="w-3 h-3" />
              Anterior
            </span>
            <span className="text-sm font-medium text-slate-900 group-hover:text-brand-700">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            to={`/materiais/guia/${next.slug}`}
            className="panel p-3.5 hover:shadow-raised transition-shadow group text-right"
          >
            <span className="flex items-center justify-end gap-1 text-2xs text-slate-500 mb-1">
              Proximo
              <ArrowRight className="w-3 h-3" />
            </span>
            <span className="text-sm font-medium text-slate-900 group-hover:text-brand-700">
              {next.title}
            </span>
          </Link>
        ) : (
          <Link
            to="/materiais"
            className="panel p-3.5 hover:shadow-raised transition-shadow group text-right bg-money-50 border-money-200"
          >
            <span className="flex items-center justify-end gap-1 text-2xs text-money-700 mb-1">
              <CheckCircle2 className="w-3 h-3" />
              Voce concluiu o treinamento
            </span>
            <span className="text-sm font-medium text-slate-900">Voltar aos materiais</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
