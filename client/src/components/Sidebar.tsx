import type { ReactNode } from 'react';
import type { User } from '../models';

export type NavItem = {
  id: string;
  lbl: string;
  ic: string;
  badge?: number;
};

type SidebarProps = {
  user: User;
  activePage: string;
  navItems: NavItem[];
  icons: Record<string, ReactNode>;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ user, activePage, navItems, icons, onNavigate, onLogout, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/30 transition-opacity duration-200 md:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-white border-r border-gray-200 transition-transform duration-200 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white text-lg font-semibold">T</div>
              <div>
                <div className="text-lg font-semibold">TaskLuck</div>
                <div className="text-sm text-gray-500">シフト管理 / タスク管理</div>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-3xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">{user.name}</div>
            <div className="mt-1 text-xs text-slate-500">{user.role === 'manager' ? '店長' : user.role === 'staff' ? '社員' : 'アルバイト'}</div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={
                  `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${activePage === item.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                }
              >
                <span className="flex h-5 w-5 items-center justify-center text-slate-500">{icons[item.ic]}</span>
                <span className="truncate">{item.lbl}</span>
                {item.badge ? <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">{item.badge}</span> : null}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
              onClick={onLogout}
            >
              ログアウト
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
