import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Handshake,
  MessageCircle,
  MonitorSmartphone,
  Package,
  Rocket,
  Search,
  ShieldQuestion,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { HANDBOOK } from '@/content/handbook';

// Os capitulos referenciam icones pelo nome; mapeamos aqui para nao carregar
// toda a biblioteca de icones dentro do modulo de conteudo.
const ICONS: Record<string, LucideIcon> = {
  Rocket,
  Package,
  Search,
  MessageCircle,
  Handshake,
  ShieldQuestion,
  CheckCircle2,
  Star,
  MonitorSmartphone,
  Trophy,
};

export function TrainingSection() {
  const totalMinutes = HANDBOOK.reduce((sum, c) => sum + c.minutes, 0);

  return (
    <section className="mb-5">
      <div className="rounded-lg border border-slate-200 bg-ink-depth text-white p-4 sm:p-5 mb-3">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-600 shadow-raised shrink-0">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Manual de vendas da Frame Digital</h2>
            <p className="mt-0.5 text-sm text-slate-300 leading-relaxed">
              Tudo que voce precisa para vender, do primeiro contato a comissao. Leia na ordem —
              sao {HANDBOOK.length} capitulos, cerca de {totalMinutes} minutos no total.
            </p>
            <Link
              to={`/materiais/guia/${HANDBOOK[0].slug}`}
              className="inline-flex items-center gap-1.5 mt-3 h-8 px-3.5 rounded-md bg-white text-ink-900 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Comecar o treinamento
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {HANDBOOK.map((chapter) => {
          const Icon = ICONS[chapter.icon] ?? Rocket;
          return (
            <Link
              key={chapter.slug}
              to={`/materiais/guia/${chapter.slug}`}
              className="panel p-4 flex items-start gap-3 hover:shadow-raised hover:border-brand-200 transition-all group"
            >
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-50 text-brand-600 shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-0.5">
                  <span className="font-semibold text-slate-500">
                    Cap. {chapter.order}
                  </span>
                  <span>|</span>
                  <Clock className="w-3 h-3" />
                  {chapter.minutes} min
                </div>
                <p className="text-sm font-medium text-slate-900 leading-snug group-hover:text-brand-700">
                  {chapter.title}
                </p>
                <p className="mt-0.5 text-2xs text-slate-500 leading-relaxed line-clamp-2">
                  {chapter.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
