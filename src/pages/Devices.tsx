import { Smartphone } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import ActionButton from '../components/ActionButton';
import Badge from '../components/Badge';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { fmtDate } from '../lib/format';
import { Device, DeviceStatus } from '../types';

export default function Devices() {
  const { currentUser } = useAuth();
  const { devices, setDeviceStatus } = useData();
  const toast = useToast();

  const change = (device: Device, status: DeviceStatus) => {
    if (!currentUser) return;
    setDeviceStatus(device.id, status, currentUser);
    toast(`${device.name} is now ${status.toLowerCase()}.`, status === 'BANNED' ? 'error' : 'success');
  };

  const columns: Column<Device>[] = [
    {
      key: 'name', header: 'Device Name', sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
            <Smartphone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{r.name}</p>
            <p className="text-xs text-slate-400">{r.platform}</p>
          </div>
        </div>
      ),
    },
    { key: 'userName', header: 'User', sortValue: (r) => r.userName, render: (r) => <span className="text-slate-700 dark:text-slate-300">{r.userName}</span> },
    { key: 'publicKey', header: 'Public Key', render: (r) => <IdCode id={r.publicKey} short={false} /> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge variant={r.status} /> },
    { key: 'lastSeen', header: 'Last Seen', sortValue: (r) => r.lastSeen, render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{formatDistanceToNow(parseISO(r.lastSeen), { addSuffix: true })}</span> },
    { key: 'registeredAt', header: 'Registered', sortValue: (r) => r.registeredAt, render: (r) => <span className="text-slate-500 dark:text-slate-400">{fmtDate(r.registeredAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex gap-1.5">
          {r.status === 'ACTIVE' && <ActionButton tone="danger" onClick={() => change(r, 'BANNED')}>Ban</ActionButton>}
          {r.status === 'BANNED' && <ActionButton tone="success" onClick={() => change(r, 'ACTIVE')}>Unban</ActionButton>}
          {r.status === 'INACTIVE' && (
            <>
              <ActionButton tone="success" onClick={() => change(r, 'ACTIVE')}>Activate</ActionButton>
              <ActionButton tone="danger" onClick={() => change(r, 'BANNED')}>Ban</ActionButton>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={Smartphone} tint="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" title="Devices" subtitle={`${devices.length} registered devices`} />
      <DataTable
        columns={columns} data={devices} rowKey={(r) => r.id}
        searchPlaceholder="Search by device or user..."
        searchFilter={(r, q) => r.name.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q)}
        filters={[
          { key: 'status', label: 'Status', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }, { label: 'Banned', value: 'BANNED' }], filter: (r, v) => r.status === v },
          { key: 'platform', label: 'Platform', options: ['Android', 'iOS', 'Linux', 'Web'].map((p) => ({ label: p, value: p })), filter: (r, v) => r.platform === v },
        ]}
        exportName="devices"
        exportRow={(r) => ({ Device: r.name, User: r.userName, Platform: r.platform, Status: r.status, 'Last seen': r.lastSeen })}
      />
    </div>
  );
}
