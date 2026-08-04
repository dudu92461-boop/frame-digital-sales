import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Settings, ShieldCheck } from 'lucide-react';
import { Avatar, cx, Spinner } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { relativeTime } from '@/utils/format';
import type { Notification } from '@/types';

/** Fecha o painel ao clicar fora dele. */
function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Notification[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<{ items: Notification[] }>('/notifications', { limit: 20 })
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  const openNotification = async (item: Notification) => {
    if (!item.read) {
      await api.patch(`/notifications/${item.id}/read`).catch(() => {});
      setItems((list) => list?.map((n) => (n.id === item.id ? { ...n, read: true } : n)) ?? null);
    }
    if (item.link) {
      onClose();
      navigate(item.link);
    }
  };

  const markAll = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    setItems((list) => list?.map((n) => ({ ...n, read: true })) ?? null);
  };

  return (
    <div className="absolute right-0 top-full mt-1 w-[min(22rem,calc(100vw-2rem))] bg-white border border-slate-200 rounded-md shadow-pop z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-900">Notificacoes</p>
        <button type="button" className="text-2xs text-accent-600 hover:underline" onClick={markAll}>
          Marcar todas como lidas
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {items === null ? (
          <div className="flex justify-center py-6">
            <Spinner className="w-4 h-4 text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-500">Nenhuma notificacao.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openNotification(item)}
              className={cx(
                'w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50',
                !item.read && 'bg-accent-50/40',
              )}
            >
              <div className="flex items-start gap-2">
                {!item.read && (
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-600 shrink-0" aria-hidden />
                )}
                <div className={cx('min-w-0 flex-1', item.read && 'pl-3.5')}>
                  <p className="text-xs font-medium text-slate-900 leading-snug">{item.title}</p>
                  <p className="mt-0.5 text-2xs text-slate-600 leading-relaxed">{item.message}</p>
                  <p className="mt-1 text-2xs text-slate-400">{relativeTime(item.createdAt)}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [unread, setUnread] = useState(0);

  const notificationsRef = useClickOutside<HTMLDivElement>(() => setShowNotifications(false));
  const accountRef = useClickOutside<HTMLDivElement>(() => setShowAccount(false));

  // Recarrega o contador ao abrir/fechar o painel para refletir o que foi lido.
  useEffect(() => {
    api
      .get<{ unread: number }>('/notifications', { limit: 1 })
      .then((data) => setUnread(data.unread))
      .catch(() => {});
  }, [showNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center gap-2 px-3 sm:px-4 shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden btn-ghost btn-sm -ml-1"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
          {user.seller && (
            <span className="hidden sm:inline font-mono text-2xs text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
              {user.seller.code}
            </span>
          )}
          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-2xs font-medium text-accent-700 bg-accent-50 border border-accent-200 rounded px-1.5 py-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span className="hidden sm:inline">Administrador</span>
            </span>
          )}
        </div>
      </div>

      <div className="relative" ref={notificationsRef}>
        <button
          type="button"
          onClick={() => setShowNotifications((v) => !v)}
          className="btn-ghost btn-sm relative"
          aria-label={`Notificacoes${unread > 0 ? ` (${unread} nao lidas)` : ''}`}
        >
          <Bell className="w-4.5 h-4.5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-accent-600 text-white text-[10px] font-semibold tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      </div>

      <div className="relative" ref={accountRef}>
        <button
          type="button"
          onClick={() => setShowAccount((v) => !v)}
          className="flex items-center gap-1.5 h-9 pl-1 pr-1.5 rounded hover:bg-slate-100"
          aria-label="Menu da conta"
        >
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {showAccount && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-pop z-50 py-1">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-2xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAccount(false);
                navigate('/configuracoes');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              Configuracoes
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
