import { FormEvent, useState } from 'react';
import { IndianRupee, Store } from 'lucide-react';
import ActionButton from '../components/ActionButton';
import Badge from '../components/Badge';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { fmtDate } from '../lib/format';
import { merchantsOwnedBy, merchantStats } from '../lib/selectors';
import { Merchant, MerchantStatus } from '../types';

export default function Merchants() {
  const { currentUser } = useAuth();
  const { merchants, transactions, setMerchantStatus, registerMerchant } = useData();
  const toast = useToast();
  const [storeName, setStoreName] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const rows = isAdmin ? merchants : merchantsOwnedBy(merchants, currentUser);

  const change = (merchant: Merchant, status: MerchantStatus) => {
    if (!currentUser) return;
    setMerchantStatus(merchant.id, status, currentUser);
    toast(`${merchant.businessName} is now ${status.toLowerCase()}.`);
  };

  const handleRegister = (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser || !storeName.trim()) return;
    registerMerchant(currentUser, storeName);
    setStoreName('');
    toast('Store registered. It will go live once an admin approves it.');
  };

  const columns: Column<Merchant>[] = [
    {
      key: 'businessName', header: 'Business Name', sortValue: (r) => r.businessName,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <Store className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{r.businessName}</p>
            <p className="text-xs text-slate-400">{r.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'owner', header: 'Owner', sortValue: (r) => r.userName, render: (r) => <span className="text-slate-700 dark:text-slate-300">{r.userName}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge variant={r.status} /> },
    { key: 'qrId', header: 'QR ID', render: (r) => <IdCode id={r.qrId} short={false} /> },
    {
      key: 'transactions', header: 'Transactions', sortValue: (r) => merchantStats(r.id, transactions).count,
      render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-200">{merchantStats(r.id, transactions).count}</span>,
    },
    {
      key: 'volume', header: 'Volume', sortValue: (r) => merchantStats(r.id, transactions).volume,
      render: (r) => (
        <div className="flex items-center gap-0.5 font-semibold text-slate-900 dark:text-slate-100">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>{merchantStats(r.id, transactions).volume.toLocaleString('en-IN')}</span>
        </div>
      ),
    },
    { key: 'createdAt', header: 'Created', sortValue: (r) => r.createdAt, render: (r) => <span className="text-slate-500 dark:text-slate-400">{fmtDate(r.createdAt)}</span> },
    ...(isAdmin ? [{
      key: 'actions', header: 'Actions',
      render: (r: Merchant) => (
        <div className="flex gap-1.5">
          {r.status === 'PENDING' && <ActionButton tone="success" onClick={() => change(r, 'ACTIVE')}>Approve</ActionButton>}
          {r.status === 'ACTIVE' && <ActionButton tone="danger" onClick={() => change(r, 'SUSPENDED')}>Suspend</ActionButton>}
          {r.status === 'SUSPENDED' && <ActionButton tone="success" onClick={() => change(r, 'ACTIVE')}>Reactivate</ActionButton>}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Store} tint="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" title={isAdmin ? 'Merchants' : 'Store Profile'}
        subtitle={isAdmin ? `${rows.length} registered merchants` : 'Your store profile'}
      />

      {currentUser?.role === 'MERCHANT' && rows.length === 0 && (
        <form onSubmit={handleRegister} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Register your store</span>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store name" className="input-field" required />
          </label>
          <button type="submit" className="btn-primary justify-center">Register store</button>
        </form>
      )}

      <DataTable
        columns={columns} data={rows} rowKey={(r) => r.id}
        searchPlaceholder="Search by business name or code..."
        searchFilter={(r, q) => r.businessName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q)}
        filters={[{ key: 'status', label: 'Status', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Suspended', value: 'SUSPENDED' }, { label: 'Pending', value: 'PENDING' }], filter: (r, v) => r.status === v }]}
        emptyMessage={currentUser?.role === 'MERCHANT' ? 'You have no store yet — register one above.' : 'No merchants found.'}
        exportName={isAdmin ? 'merchants' : undefined}
        exportRow={(r) => ({ Business: r.businessName, Code: r.code, Owner: r.userName, Status: r.status, ...merchantStats(r.id, transactions) })}
      />
    </div>
  );
}
