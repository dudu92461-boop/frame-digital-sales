import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Trocar de pagina no celular deve fechar o menu lateral.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1600px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
