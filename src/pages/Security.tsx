import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import clsx from 'clsx';
import ActionButton from '../components/ActionButton';
import Badge from '../components/Badge';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { fmtDateTime } from '../lib/format';
import { SecurityEvent } from '../types';

const trustIcons = { ACTIVE: ShieldCheck, BANNED: ShieldX, INACTIVE: ShieldAlert };
const trustColors = { ACTIVE: 'text-green-500', BANNED: 'text-red-500', INACTIVE: 'text-slate-400' };
const severityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function Security() {
  const { currentUser } = useAuth();
  const { securityEvents, devices, resolveSecurityEvents, setDeviceStatus } = useData();
  const toast = useToast();

  const open = securityEvents.filter((e) => !e.resolved);
  const openCritical = open.filter((e) => e.severity === 'CRITICAL');
  const topAlerts = open
    .filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH')
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, 5);

  const resolve = (ids: string[]) => {
    resolveSecurityEvents(ids);
    toast(ids.length === 1 ? 'Alert marked as resolved.' : `${ids.length} alerts marked as resolved.`);
  };

  const columns: Column<SecurityEvent>[] = [
    { key: 'id', header: 'Audit ID', render: (r) => <IdCode id={r.id} /> },
    {
      key: 'user', header: 'User', sortValue: (r) => r.userName,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200">{r.userName}</p>
          <p className="text-xs text-slate-400">{r.ipAddress}</p>
        </div>
      ),
    },
    { key: 'device', header: 'Device', render: (r) => <span className="text-slate-600 dark:text-slate-400">{r.deviceName}</span> },
    { key: 'eventType', header: 'Event Type', sortValue: (r) => r.eventType, render: (r) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{r.eventType}</span> },
    { key: 'severity', header: 'Severity', sortValue: (r) => severityRank[r.severity], render: (r) => <Badge variant={r.severity} /> },
    { key: 'description', header: 'Description', render: (r) => <span className="line-clamp-1 max-w-xs text-xs text-slate-600 dark:text-slate-400">{r.description}</span> },
    { key: 'state', header: 'State', sortValue: (r) => Number(r.resolved), render: (r) => <Badge variant={r.resolved ? 'RESOLVED' : 'OPEN'} /> },
    { key: 'timestamp', header: 'Timestamp', sortValue: (r) => r.timestamp, render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(r.timestamp)}</span> },
    { key: 'actions', header: 'Actions', render: (r) => !r.resolved && <ActionButton tone="success" onClick={() => resolve([r.id])}>Resolve</ActionButton> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Shield} tint="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" title="Security"
        subtitle={`${open.length} open alert${open.length === 1 ? '' : 's'}`}
        actions={open.length > 0 && <button onClick={() => resolve(open.map((e) => e.id))} className="btn-secondary">Resolve all</button>}
      />

      {openCritical.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {openCritical.length} critical security event{openCritical.length > 1 ? 's' : ''} need attention
            </p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">Review each alert below and mark it resolved once handled.</p>
          </div>
          <ActionButton tone="danger" onClick={() => resolve(openCritical.map((e) => e.id))}>Resolve critical</ActionButton>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Open High-Severity Alerts</h3>
          </div>
          {topAlerts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No open high-severity alerts. 🎉</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {topAlerts.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={clsx('mt-2 h-2 w-2 flex-shrink-0 rounded-full', evt.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-400')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{evt.userName}</span>
                      <Badge variant={evt.severity} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{evt.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDistanceToNow(parseISO(evt.timestamp), { addSuffix: true })}</p>
                  </div>
                  <ActionButton tone="success" onClick={() => resolve([evt.id])}>Resolve</ActionButton>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Device Trust Status</h3>
          </div>
          <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700/50">
            {devices.map((device) => {
              const Icon = trustIcons[device.status];
              return (
                <div key={device.id} className="flex items-center gap-3 px-5 py-3">
                  <Icon className={clsx('h-4 w-4 flex-shrink-0', trustColors[device.status])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{device.name}</p>
                    <p className="text-xs text-slate-400">{device.userName} · {device.platform}</p>
                  </div>
                  <Badge variant={device.status} />
                  {currentUser && (
                    <ActionButton
                      tone={device.status === 'BANNED' ? 'success' : 'danger'}
                      onClick={() => {
                        const next = device.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
                        setDeviceStatus(device.id, next, currentUser);
                        toast(`${device.name} is now ${next.toLowerCase()}.`, next === 'BANNED' ? 'error' : 'success');
                      }}
                    >
                      {device.status === 'BANNED' ? 'Unban' : 'Ban'}
                    </ActionButton>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns} data={securityEvents} rowKey={(r) => r.id}
        searchPlaceholder="Search by user or device..."
        searchFilter={(r, q) => r.userName.toLowerCase().includes(q) || r.deviceName.toLowerCase().includes(q) || r.eventType.toLowerCase().includes(q)}
        filters={[
          { key: 'severity', label: 'Severity', options: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => ({ label: s[0] + s.slice(1).toLowerCase(), value: s })), filter: (r, v) => r.severity === v },
          { key: 'state', label: 'State', options: [{ label: 'Open', value: 'open' }, { label: 'Resolved', value: 'resolved' }], filter: (r, v) => (v === 'resolved') === r.resolved },
          {
            key: 'eventType', label: 'Event',
            options: ['AUTH_LOGIN', 'DEVICE_BANNED', 'SECURITY_ALERT', 'TOKEN_CONFLICT', 'UNAUTHORIZED_ACCESS', 'SIGNATURE_MISMATCH'].map((t) => ({ label: t.replace(/_/g, ' '), value: t })),
            filter: (r, v) => r.eventType === v,
          },
        ]}
        exportName="security-events"
        exportRow={(r) => ({ ID: r.id, User: r.userName, Device: r.deviceName, Event: r.eventType, Severity: r.severity, Resolved: r.resolved ? 'yes' : 'no', Timestamp: r.timestamp })}
      />
    </div>
  );
}
