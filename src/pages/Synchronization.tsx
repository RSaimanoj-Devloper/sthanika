import { AlertTriangle, CheckCircle, Clock, RefreshCw, XCircle } from 'lucide-react';
import ActionButton from '../components/ActionButton';
import Badge from '../components/Badge';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { fmtDateTime } from '../lib/format';
import { SyncEvent } from '../types';

export default function Synchronization() {
  const { currentUser } = useAuth();
  const { syncEvents, processSyncQueue, retrySync } = useData();
  const toast = useToast();

  const count = (...statuses: SyncEvent['status'][]) => syncEvents.filter((e) => statuses.includes(e.status)).length;
  const pending = count('PENDING', 'PROCESSING');

  const handleProcess = () => {
    if (!currentUser) return;
    const processed = processSyncQueue(currentUser);
    toast(processed ? `Synced ${processed} queued item${processed === 1 ? '' : 's'}.` : 'The sync queue is already empty.', processed ? 'success' : 'info');
  };

  const handleRetry = (event: SyncEvent) => {
    if (!currentUser) return;
    retrySync(event.id, currentUser);
    toast(`Retried sync from ${event.deviceName}.`);
  };

  const columns: Column<SyncEvent>[] = [
    { key: 'id', header: 'Event ID', render: (r) => <IdCode id={r.id} /> },
    { key: 'device', header: 'Device', sortValue: (r) => r.deviceName, render: (r) => <span className="font-medium text-slate-800 dark:text-slate-200">{r.deviceName}</span> },
    { key: 'entityType', header: 'Entity Type', sortValue: (r) => r.entityType, render: (r) => <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{r.entityType}</span> },
    { key: 'operation', header: 'Operation', render: (r) => <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">{r.operation}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge variant={r.status} /> },
    {
      key: 'attempts', header: 'Attempts', sortValue: (r) => r.attempts,
      render: (r) => (
        <div className="flex items-center gap-1">
          <span className={`text-sm font-semibold ${r.attempts >= 3 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{r.attempts}</span>
          <span className="text-xs text-slate-400">/ 5</span>
        </div>
      ),
    },
    { key: 'timestamp', header: 'Timestamp', sortValue: (r) => r.timestamp, render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(r.timestamp)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (r.status === 'FAILED' || r.status === 'CONFLICT') && <ActionButton onClick={() => handleRetry(r)}>{r.status === 'CONFLICT' ? 'Resolve' : 'Retry'}</ActionButton>,
    },
  ];

  const summary = [
    { label: 'Total Events', value: syncEvents.length, icon: null, border: '', text: 'text-slate-900 dark:text-white' },
    { label: 'Pending', value: pending, icon: Clock, border: 'border-l-amber-400', text: 'text-amber-600 dark:text-amber-400', iconColor: 'text-amber-500' },
    { label: 'Success', value: count('SUCCESS'), icon: CheckCircle, border: 'border-l-green-400', text: 'text-green-600 dark:text-green-400', iconColor: 'text-green-500' },
    { label: 'Failed', value: count('FAILED'), icon: XCircle, border: 'border-l-red-400', text: 'text-red-600 dark:text-red-400', iconColor: 'text-red-500' },
    { label: 'Conflicts', value: count('CONFLICT'), icon: AlertTriangle, border: 'border-l-orange-400', text: 'text-orange-600 dark:text-orange-400', iconColor: 'text-orange-500' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={RefreshCw} tint="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" title="Synchronization" subtitle="Mesh sync queue & event monitor"
        actions={
          <button onClick={handleProcess} className="btn-primary" disabled={pending === 0}>
            <RefreshCw className="h-4 w-4" />
            Process queue{pending > 0 && ` (${pending})`}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summary.map(({ label, value, icon: Icon, border, text, iconColor }) => (
          <div key={label} className={`card flex flex-col gap-1 p-4 ${border && `border-l-4 ${border}`}`}>
            <div className="flex items-center gap-1.5">
              {Icon && <Icon className={`h-3.5 w-3.5 ${iconColor}`} />}
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns} data={syncEvents} rowKey={(r) => r.id}
        searchPlaceholder="Search by device..."
        searchFilter={(r, q) => r.deviceName.toLowerCase().includes(q) || r.entityType.toLowerCase().includes(q)}
        filters={[
          { key: 'status', label: 'Status', options: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CONFLICT'].map((s) => ({ label: s[0] + s.slice(1).toLowerCase(), value: s })), filter: (r, v) => r.status === v },
          { key: 'entityType', label: 'Entity', options: ['USER', 'DEVICE', 'MESSAGE', 'TRANSACTION', 'MERCHANT', 'TOKEN'].map((s) => ({ label: s[0] + s.slice(1).toLowerCase(), value: s })), filter: (r, v) => r.entityType === v },
        ]}
        exportName="sync-events"
        exportRow={(r) => ({ ID: r.id, Device: r.deviceName, Entity: r.entityType, Operation: r.operation, Status: r.status, Attempts: r.attempts, Timestamp: r.timestamp })}
      />
    </div>
  );
}
