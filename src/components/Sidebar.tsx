import { ElementType } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart2, ClipboardList, CreditCard, LayoutDashboard, MessageSquare, RefreshCw,
  RotateCcw, Shield, Smartphone, Store, Users, Wifi, X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from './Toast';
import { UserRole } from '../types';

interface NavItem { label: string; path: string; icon: ElementType; badge?: 'security' | 'sync' }

const navByRole: Record<UserRole, { subtitle: string; items: NavItem[] }> = {
  ADMIN: {
    subtitle: 'Admin Console',
    items: [
      { label: 'Overview', path: '/', icon: LayoutDashboard },
      { label: 'Users', path: '/users', icon: Users },
      { label: 'Devices', path: '/devices', icon: Smartphone },
      { label: 'Messages', path: '/messages', icon: MessageSquare },
      { label: 'Transactions', path: '/transactions', icon: CreditCard },
      { label: 'Merchants', path: '/merchants', icon: Store },
      { label: 'Synchronization', path: '/synchronization', icon: RefreshCw, badge: 'sync' },
      { label: 'Security', path: '/security', icon: Shield, badge: 'security' },
      { label: 'Analytics', path: '/analytics', icon: BarChart2 },
      { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
    ],
  },
  MERCHANT: {
    subtitle: 'Merchant Portal',
    items: [
      { label: 'Merchant Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Payments', path: '/transactions', icon: CreditCard },
      { label: 'Store Profile', path: '/merchants', icon: Store },
    ],
  },
  USER: {
    subtitle: 'Personal Wallet',
    items: [
      { label: 'My Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Transactions', path: '/transactions', icon: CreditCard },
    ],
  },
};

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { currentUser } = useAuth();
  const { securityEvents, syncEvents, resetData } = useData();
  const toast = useToast();

  if (!currentUser) return null;
  const nav = navByRole[currentUser.role];

  const badges = {
    security: securityEvents.filter((e) => !e.resolved && (e.severity === 'HIGH' || e.severity === 'CRITICAL')).length,
    sync: syncEvents.filter((e) => e.status === 'PENDING' || e.status === 'PROCESSING').length,
  };

  const handleReset = () => {
    if (window.confirm('Reset devices, payments, sync and security data back to the demo defaults? Accounts are kept.')) {
      resetData();
      toast('Demo data reset.', 'info');
    }
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md">
            <Wifi className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Sthānika</span>
            <p className="-mt-0.5 text-xs text-slate-400 dark:text-slate-500">{nav.subtitle}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close menu" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Main Menu</p>
        {nav.items.map(({ label, path, icon: Icon, badge }) => (
          <NavLink key={path} to={path} end={path === '/'} onClick={onClose} className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
            {badge && badges[badge] > 0 && (
              <span className="ml-auto rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{badges[badge]}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-shrink-0 space-y-2 border-t border-slate-200 px-3 py-4 dark:border-slate-700/80">
        <button onClick={handleReset} className="sidebar-link w-full">
          <RotateCcw className="h-4 w-4" />
          <span>Reset demo data</span>
        </button>
        <div className="flex items-center gap-2 px-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">System online · v1.1.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700/80 dark:bg-slate-900 lg:flex">
        {content}
      </aside>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          'fixed bottom-0 left-0 top-0 z-50 flex w-72 transform flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-700/80 dark:bg-slate-900 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {content}
      </aside>
    </>
  );
}
