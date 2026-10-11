import { ClipboardList } from 'lucide-react';
import clsx from 'clsx';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { useData } from '../context/DataContext';
import { fmtDateTime } from '../lib/format';
import { AuditEventType, AuditLog } from '../types';

const blue = 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30';
const green = 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30';
const indigo = 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30';
const purple = 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30';
const red = 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30';
const amber = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30';
const slate = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';

const eventColors: Record<AuditEventType, string> = {
  AUTH_LOGIN: blue, AUTH_LOGOUT: slate, MESSAGE_SENT: indigo, MESSAGE_DELIVERED: green,
  PAYMENT_INITIATED: purple, PAYMENT_ACCEPTED: green, PAYMENT_REJECTED: red,
  SYNC_STARTED: blue, SYNC_COMPLETED: green, SYNC_CONFLICT: amber,
  DEVICE_REGISTERED: indigo, DEVICE_BANNED: red, SECURITY_ALERT: red,
  TOKEN_SPENT: purple, TOKEN_CONFLICT: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30',
  USER_STATUS_CHANGED: amber, MERCHANT_STATUS_CHANGED: amber,
};

const columns: Column<AuditLog>[] = [
  { key: 'id', header: 'Log ID', render: (r) => <IdCode id={r.id} /> },
  {
    key: 'user', header: 'User', sortValue: (r) => r.userName,
    render: (r) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-200">{r.userName}</p>
        <p className="text-xs text-slate-400">{r.deviceName}</p>
      </div>
    ),
  },
  {
    key: 'eventType', header: 'Event Type', sortValue: (r) => r.eventType,
    render: (r) => <span className={clsx('whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-xs font-semibold', eventColors[r.eventType])}>{r.eventType}</span>,
  },
  { key: 'description', header: 'Description', render: (r) => <span className="text-xs text-slate-600 dark:text-slate-400">{r.description}</span> },
  {
    key: 'relatedEntity', header: 'Related Entity',
    render: (r) => (
      <div>
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{r.relatedEntity}</p>
        <IdCode id={r.relatedEntityId} />
      </div>
    ),
  },
  { key: 'timestamp', header: 'Timestamp', sortValue: (r) => r.timestamp, render: (r) => <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(r.timestamp)}</span> },
];

export default function AuditLogs() {
  const { auditLogs } = useData();

  return (
    <div className="space-y-5">
      <PageHeader icon={ClipboardList} tint="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" title="Audit Logs" subtitle={`${auditLogs.length} log entries · Activity trail`} />
      <DataTable
        columns={columns} data={auditLogs} rowKey={(r) => r.id}
        searchPlaceholder="Search by user, device or entity..."
        searchFilter={(r, q) => [r.userName, r.deviceName, r.eventType, r.relatedEntity, r.description].some((v) => v.toLowerCase().includes(q))}
        filters={[{
          key: 'eventType', label: 'Event Type',
          options: (Object.keys(eventColors) as AuditEventType[]).map((t) => ({ label: t.replace(/_/g, ' '), value: t })),
          filter: (r, v) => r.eventType === v,
        }]}
        exportName="audit-logs"
        exportRow={(r) => ({ ID: r.id, User: r.userName, Device: r.deviceName, Event: r.eventType, Description: r.description, Timestamp: r.timestamp })}
      />
    </div>
  );
}
