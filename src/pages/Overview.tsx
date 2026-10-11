import { Activity, CreditCard, IndianRupee, MessageSquare, RefreshCw, Smartphone, Store, Users } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import StatCard from '../components/StatCard';
import AreaChart from '../components/charts/AreaChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import Badge from '../components/Badge';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { dailyMetrics, mockMessages, weeklySyncMetrics } from '../data/mock';
import { inr } from '../lib/format';
import { buildKpis, transactionStatusPie } from '../lib/stats';
import { AuditEventType } from '../types';

const activityIcons: Partial<Record<AuditEventType, string>> = {
  PAYMENT_INITIATED: '🧾', PAYMENT_ACCEPTED: '💳', PAYMENT_REJECTED: '❌', DEVICE_REGISTERED: '📱',
  DEVICE_BANNED: '⛔', SYNC_STARTED: '🔄', SYNC_COMPLETED: '🔄', SECURITY_ALERT: '🚨',
  MESSAGE_SENT: '✉️', MESSAGE_DELIVERED: '✉️', TOKEN_CONFLICT: '⚠️', SYNC_CONFLICT: '⚡',
  TOKEN_SPENT: '🪙', AUTH_LOGIN: '🔑', AUTH_LOGOUT: '🚪', USER_STATUS_CHANGED: '👤', MERCHANT_STATUS_CHANGED: '🏪',
};

const activityBadges: Partial<Record<AuditEventType, string>> = {
  PAYMENT_ACCEPTED: 'ACCEPTED', PAYMENT_REJECTED: 'REJECTED', DEVICE_BANNED: 'BANNED',
  SYNC_COMPLETED: 'SUCCESS', SECURITY_ALERT: 'CRITICAL', MESSAGE_DELIVERED: 'DELIVERED',
  TOKEN_CONFLICT: 'CONFLICT', SYNC_CONFLICT: 'CONFLICT',
};

export default function Overview() {
  const { currentUser, users } = useAuth();
  const { devices, merchants, transactions, syncEvents, auditLogs, processSyncQueue } = useData();
  const toast = useToast();

  const kpi = buildKpis(users, devices, mockMessages, transactions, syncEvents, merchants.filter((m) => m.status === 'ACTIVE').length);

  const handleSync = () => {
    if (!currentUser) return;
    const count = processSyncQueue(currentUser);
    toast(count ? `Synced ${count} queued item${count === 1 ? '' : 's'}.` : 'The sync queue is already empty.', count ? 'success' : 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Live metrics for the Sthānika mesh platform</p>
        </div>
        <button onClick={handleSync} className="btn-primary justify-center">
          <RefreshCw className="h-4 w-4" />
          Process sync queue{kpi.pendingSyncs > 0 && ` (${kpi.pendingSyncs})`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Users" value={kpi.totalUsers} subtitle={`${kpi.activeUsers} active`} icon={Users} tint="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        <StatCard title="Active Devices" value={kpi.activeDevices} subtitle={`${kpi.onlineDevices} online now`} icon={Smartphone} tint="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
        <StatCard title="Messages" value={kpi.totalMessages} subtitle={`${kpi.messagesDelivered} delivered`} icon={MessageSquare} />
        <StatCard title="Transactions" value={kpi.totalTransactions} icon={CreditCard} tint="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
        <StatCard title="Merchants" value={merchants.length} subtitle={`${kpi.activeMerchants} active`} icon={Store} tint="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
        <StatCard title="Pending Syncs" value={kpi.pendingSyncs} icon={RefreshCw} tint="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4 p-5">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"><IndianRupee className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Settled Transaction Volume</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">{inr(kpi.totalVolume)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="rounded-xl bg-green-50 p-3 text-green-600 dark:bg-green-950 dark:text-green-400"><Activity className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Online Devices Right Now</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
              {kpi.onlineDevices}
              <span className="ml-1 text-sm font-normal text-slate-400">/ {kpi.activeDevices} active</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AreaChart
            data={dailyMetrics} xKey="date" title="Daily Messages & Transactions (Last 30 Days)" height={260}
            series={[{ key: 'messages', label: 'Messages', color: '#6366f1' }, { key: 'transactions', label: 'Transactions', color: '#22c55e' }]}
          />
        </div>
        <PieChart data={transactionStatusPie(transactions)} title="Transaction Status Distribution" height={260} innerRadius={55} outerRadius={95} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BarChart
          data={weeklySyncMetrics} xKey="week" title="Weekly Sync Events — Success vs Failed vs Conflict" height={240}
          series={[{ key: 'success', label: 'Success', color: '#22c55e' }, { key: 'failed', label: 'Failed', color: '#ef4444' }, { key: 'conflict', label: 'Conflict', color: '#f59e0b' }]}
        />

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">
                  {activityIcons[log.eventType] ?? '📋'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-slate-700 dark:text-slate-300">{log.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span>{formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true })}</span>
                    {activityBadges[log.eventType] && <Badge variant={activityBadges[log.eventType]!} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
