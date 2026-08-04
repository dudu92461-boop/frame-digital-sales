import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  ScrollText,
  Settings,
  Target,
  Trophy,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: ClipboardList },
  { to: '/clientes', label: 'Clientes', icon: UserRound },
  { to: '/vendas', label: 'Vendas', icon: Briefcase },
  { to: '/comissoes', label: 'Comissoes', icon: Wallet },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/servicos', label: 'Servicos', icon: Package },
  { to: '/materiais', label: 'Materiais', icon: FileText },
  { to: '/configuracoes', label: 'Configuracoes', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Painel geral', icon: BarChart3 },
  { to: '/admin/vendedores', label: 'Vendedores', icon: Users },
  { to: '/admin/relatorios', label: 'Relatorios', icon: BarChart3 },
  { to: '/admin/auditoria', label: 'Auditoria', icon: ScrollText },
];

function NavSection({ title, items, onNavigate }: { title?: string; items: NavItem[]; onNavigate?: () => void }) {
  return (
    <div className="px-2">
      {title && (
        <p className="flex items-center gap-2 px-3 pt-5 pb-2 text-2xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
          <span className="flex-1 h-px bg-white/[0.07]" aria-hidden />
        </p>
      )}
      <nav className="flex flex-col gap-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                // Alvo de toque maior no celular do que no desktop.
                'group relative flex items-center gap-2.5 pl-3 pr-2.5 h-10 lg:h-9 rounded-lg',
                'text-sm lg:text-[13px] transition-all duration-150',
                isActive
                  ? 'bg-brand-600 text-white font-medium shadow-raised'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cx(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-400',
                  )}
                />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAdmin } = useAuth();

  // Para o admin, "Painel geral" ja cumpre o papel do Dashboard: manter os dois
  // deixaria duas entradas levando ao mesmo lugar.
  const mainNav = isAdmin ? MAIN_NAV.filter((item) => item.to !== '/') : MAIN_NAV;

  return (
    <>
      {/* Fundo escuro apenas no celular, quando o menu esta aberto. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-ink-depth flex flex-col shadow-sidebar',
          'transition-transform duration-200 lg:translate-x-0 lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="grid place-items-center w-8 h-8 rounded-lg bg-brand-600 shadow-raised shrink-0"
              aria-hidden
            >
              <span className="w-2.5 h-2.5 bg-white rounded-sm" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-white leading-tight truncate">
                Frame Digital
              </span>
              <span className="block text-2xs uppercase tracking-[0.18em] text-brand-400 leading-tight">
                Sales
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 -mr-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <NavSection items={mainNav} onNavigate={onClose} />
          {isAdmin && <NavSection title="Administracao" items={ADMIN_NAV} onNavigate={onClose} />}
        </div>

        <div className="px-4 py-3 border-t border-white/[0.07] shrink-0">
          <p className="text-2xs text-slate-500">Frame Digital Sales v1.0</p>
        </div>
      </aside>
    </>
  );
}
