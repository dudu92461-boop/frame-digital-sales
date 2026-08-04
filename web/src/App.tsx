import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { LoadingBlock } from '@/components/ui';

import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Leads } from '@/pages/Leads';
import { Clients } from '@/pages/Clients';
import { ClientDetailPage } from '@/pages/ClientDetail';
import { Sales } from '@/pages/Sales';
import { Commissions } from '@/pages/Commissions';
import { Goals } from '@/pages/Goals';
import { Ranking } from '@/pages/Ranking';
import { Services } from '@/pages/Services';
import { Materials } from '@/pages/Materials';
import { SettingsPage } from '@/pages/Settings';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboard';
import { AdminSellers } from '@/pages/admin/AdminSellers';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminAudit } from '@/pages/admin/AdminAudit';

import type { ReactNode } from 'react';

/**
 * A rota "/" leva cada perfil ao painel que interessa a ele: o vendedor ao
 * proprio desempenho, o administrador a visao consolidada da operacao.
 */
function Home() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />;
}

/** Bloqueia rotas para quem nao esta autenticado. */
function Protected({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <LoadingBlock />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  // Sem permissao volta para a home em vez de mostrar tela de erro.
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/clientes/:id" element={<ClientDetailPage />} />
        <Route path="/vendas" element={<Sales />} />
        <Route path="/comissoes" element={<Commissions />} />
        <Route path="/metas" element={<Goals />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/servicos" element={<Services />} />
        <Route path="/materiais" element={<Materials />} />
        <Route path="/configuracoes" element={<SettingsPage />} />

        <Route
          path="/admin"
          element={
            <Protected adminOnly>
              <AdminDashboardPage />
            </Protected>
          }
        />
        <Route
          path="/admin/vendedores"
          element={
            <Protected adminOnly>
              <AdminSellers />
            </Protected>
          }
        />
        <Route
          path="/admin/relatorios"
          element={
            <Protected adminOnly>
              <AdminReports />
            </Protected>
          }
        />
        <Route
          path="/admin/auditoria"
          element={
            <Protected adminOnly>
              <AdminAudit />
            </Protected>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
