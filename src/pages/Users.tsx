import { Users as UsersIcon } from 'lucide-react';
import ActionButton from '../components/ActionButton';
import Badge from '../components/Badge';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { AppUser, useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { fmtDate, initials } from '../lib/format';
import { UserStatus } from '../types';

export default function Users() {
  const { users, currentUser, setUserStatus } = useAuth();
  const { logEvent } = useData();
  const toast = useToast();

  const changeStatus = (user: AppUser, status: UserStatus) => {
    if (!currentUser) return;
    setUserStatus(user.id, status);
    logEvent({
      type: 'USER_STATUS_CHANGED', actor: currentUser, entity: 'User', entityId: user.id,
      description: `${currentUser.name} set ${user.name} to ${status.toLowerCase()}`,
    });
    toast(`${user.name} is now ${status.toLowerCase()}.`);
  };

  const columns: Column<AppUser>[] = [
    {
      key: 'name', header: 'Name', sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{initials(r.name)}</span>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{r.name}</p>
            <p className="text-xs text-slate-400">{r.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortValue: (r) => r.email, render: (r) => <span className="text-slate-600 dark:text-slate-400">{r.email}</span> },
    { key: 'role', header: 'Role', sortValue: (r) => r.role, render: (r) => <Badge variant={r.role} /> },
    { key: 'publicKey', header: 'Public Key', render: (r) => <IdCode id={r.publicKey} short={false} /> },
    { key: 'registeredAt', header: 'Registered', sortValue: (r) => r.registeredAt, render: (r) => <span className="text-slate-500 dark:text-slate-400">{fmtDate(r.registeredAt)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge variant={r.status} /> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => {
        const isSelf = r.id === currentUser?.id;
        return r.status === 'ACTIVE' ? (
          <ActionButton tone="danger" disabled={isSelf} title={isSelf ? "You can't suspend yourself" : undefined} onClick={() => changeStatus(r, 'SUSPENDED')}>Suspend</ActionButton>
        ) : (
          <ActionButton tone="success" onClick={() => changeStatus(r, 'ACTIVE')}>Activate</ActionButton>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={UsersIcon} tint="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" title="Users" subtitle={`${users.length} registered users`} />
      <DataTable
        columns={columns} data={users} rowKey={(r) => r.id}
        searchPlaceholder="Search by name or email..."
        searchFilter={(r, q) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)}
        filters={[
          { key: 'role', label: 'Role', options: [{ label: 'User', value: 'USER' }, { label: 'Merchant', value: 'MERCHANT' }, { label: 'Admin', value: 'ADMIN' }], filter: (r, v) => r.role === v },
          { key: 'status', label: 'Status', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }, { label: 'Suspended', value: 'SUSPENDED' }], filter: (r, v) => r.status === v },
        ]}
        exportName="users"
        exportRow={(r) => ({ Name: r.name, Email: r.email, Phone: r.phone, Role: r.role, Status: r.status, Registered: fmtDate(r.registeredAt) })}
      />
    </div>
  );
}
