import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { initials } from '../lib/format';
import { useClickOutside } from '../lib/useClickOutside';
import { visibleTransactions, merchantsOwnedBy } from '../lib/selectors';
import Badge from './Badge';

interface Alert { id: string; title: string; sub: string; to: string; severity: string }
interface SearchHit { group: string; label: string; sub: string; to: string }

const iconButton = 'rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800';

export default function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, users, logout } = useAuth();
  const { devices, merchants, transactions, securityEvents, syncEvents, logEvent } = useData();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchRef, () => { setSearchOpen(false); setMobileSearch(false); }, searchOpen || mobileSearch);
  useClickOutside(bellRef, () => setBellOpen(false), bellOpen);

  const isAdmin = currentUser?.role === 'ADMIN';

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !currentUser) return [];
    const link = (path: string, term: string) => `${path}?q=${encodeURIComponent(term)}`;
    const out: SearchHit[] = [];
    if (isAdmin) {
      users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 3)
        .forEach((u) => out.push({ group: 'Users', label: u.name, sub: u.email, to: link('/users', u.name) }));
      devices.filter((d) => d.name.toLowerCase().includes(q) || d.userName.toLowerCase().includes(q)).slice(0, 3)
        .forEach((d) => out.push({ group: 'Devices', label: d.name, sub: d.userName, to: link('/devices', d.name) }));
    }
    const ownMerchants = isAdmin ? merchants : currentUser.role === 'MERCHANT' ? merchantsOwnedBy(merchants, currentUser) : [];
    ownMerchants.filter((m) => m.businessName.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)).slice(0, 3)
      .forEach((m) => out.push({ group: 'Merchants', label: m.businessName, sub: m.code, to: link('/merchants', m.businessName) }));
    visibleTransactions(transactions, merchants, currentUser)
      .filter((t) => [t.senderName, t.receiverName, t.merchantName].some((v) => v.toLowerCase().includes(q))).slice(0, 3)
      .forEach((t) => out.push({ group: 'Transactions', label: `${t.senderName} → ${t.merchantName}`, sub: `₹${t.amount.toLocaleString('en-IN')} · ${t.status}`, to: link('/transactions', t.merchantName) }));
    return out;
  }, [query, currentUser, isAdmin, users, devices, merchants, transactions]);

  const alerts = useMemo<Alert[]>(() => {
    if (!currentUser) return [];
    if (isAdmin) {
      const open = securityEvents.filter((e) => !e.resolved && (e.severity === 'HIGH' || e.severity === 'CRITICAL'));
      const queued = syncEvents.filter((e) => e.status === 'PENDING' || e.status === 'PROCESSING').length;
      const items: Alert[] = open.slice(0, 4).map((e) => ({ id: e.id, title: e.description, sub: `${e.userName} · ${e.severity}`, to: '/security', severity: e.severity }));
      if (queued) items.push({ id: 'queue', title: `${queued} item${queued === 1 ? '' : 's'} waiting to sync`, sub: 'Synchronization queue', to: '/synchronization', severity: 'PENDING' });
      return items;
    }
    return visibleTransactions(transactions, merchants, currentUser)
      .filter((t) => t.status === 'PENDING')
      .map((t) => ({ id: t.id, title: `₹${t.amount.toLocaleString('en-IN')} awaiting sync`, sub: t.merchantName, to: '/transactions', severity: 'PENDING' }));
  }, [currentUser, isAdmin, securityEvents, syncEvents, transactions, merchants]);

  if (!currentUser) return null;

  const go = (to: string) => {
    setSearchOpen(false);
    setMobileSearch(false);
    setBellOpen(false);
    setQuery('');
    navigate(to);
  };

  const handleLogout = () => {
    logEvent({ type: 'AUTH_LOGOUT', actor: currentUser, entity: 'User', entityId: currentUser.id, description: `${currentUser.name} signed out` });
    logout();
  };

  const groups = [...new Set(hits.map((h) => h.group))];
  const results = searchOpen && query.trim().length >= 2 && (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
      {hits.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">No matches for “{query.trim()}”</p>
      ) : groups.map((group) => (
        <div key={group}>
          <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group}</p>
          {hits.filter((h) => h.group === group).map((h) => (
            <button key={`${h.to}-${h.label}`} type="button" onClick={() => go(h.to)} className="block w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60">
              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{h.label}</span>
              <span className="block truncate text-xs text-slate-400">{h.sub}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  const searchInput = (
    <div className="relative" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
        onFocus={() => setSearchOpen(true)}
        placeholder="Search users, devices, payments…"
        className="input-field h-9 pl-9"
        autoFocus={mobileSearch}
      />
      {results}
    </div>
  );

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700/80 dark:bg-slate-900">
      <button onClick={onMenuToggle} className={`lg:hidden ${iconButton}`} aria-label="Toggle menu">
        <Menu className="h-5 w-5" />
      </button>

      {mobileSearch ? (
        <div className="flex-1 sm:hidden">{searchInput}</div>
      ) : (
        <div className="hidden max-w-sm flex-1 sm:block">{searchInput}</div>
      )}

      <div className="ml-auto flex items-center gap-1">
        {!mobileSearch && (
          <button className={`sm:hidden ${iconButton}`} aria-label="Search" onClick={() => { setMobileSearch(true); setSearchOpen(true); }}>
            <Search className="h-5 w-5" />
          </button>
        )}

        <div className="relative" ref={bellRef}>
          <button className={`relative ${iconButton}`} aria-label="Notifications" onClick={() => setBellOpen((v) => !v)}>
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                {alerts.length}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">Notifications</p>
              {alerts.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">You're all caught up.</p>
              ) : (
                <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700/60">
                  {alerts.map((a) => (
                    <button key={a.id} type="button" onClick={() => go(a.to)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60">
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-800 dark:text-slate-100">{a.title}</span>
                        <span className="block truncate text-xs text-slate-400">{a.sub}</span>
                      </span>
                      <Badge variant={a.severity} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={toggleTheme} className={iconButton} aria-label="Toggle theme">
          {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        <Link to="/" className="ml-1 flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600">
            <span className="text-xs font-bold text-white">{initials(currentUser.name)}</span>
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{currentUser.name}</p>
            <p className="text-xs text-slate-400">{currentUser.role}</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="ml-1 flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
