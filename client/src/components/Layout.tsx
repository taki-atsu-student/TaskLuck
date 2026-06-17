import { useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../models';
import type { NavItem } from './Sidebar';
import Sidebar from './Sidebar';

type LayoutProps = {
  user: User;
  activePage: string;
  navItems: NavItem[];
  icons: Record<string, ReactNode>;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
};

export default function Layout({ user, activePage, navItems, icons, onNavigate, onLogout, children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">TaskLuck</div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            メニュー
          </button>
        </div>
      </div>

      <div className="flex">
        <Sidebar
          user={user}
          activePage={activePage}
          navItems={navItems}
          icons={icons}
          onNavigate={onNavigate}
          onLogout={onLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 min-h-screen px-4 py-6 md:ml-72 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
