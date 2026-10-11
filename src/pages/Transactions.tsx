import { FormEvent, useState } from 'react';
import { CreditCard, IndianRupee, Plus, RefreshCw } from 'lucide-react';
import Badge from '../components/Badge';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { fmtDateTime, inr } from '../lib/format';
import { isSettled } from '../lib/stats';
import { visibleTransactions } from '../lib/selectors';
import { Transaction } from '../types';

const columns: Column<Transaction>[] = [
  { key: 'id', header: 'Tx ID', render: (r) => <IdCode id={r.id} /> },
  { key: 'sender', header: 'Sender', sortValue: (r) => r.senderName, render: (r) => <span className="font-medium text-slate-800 dark:text-slate-200">{r.senderName}</span> },
  { key: 'receiver', header: 'Receiver', sortValue: (r) => r.receiverName, render: (r) => <span className="text-slate-700 dark:text-slate-300">{r.receiverName}</span> },
  { key: 'merchant', header: 'Merchant', sortValue: (r) => r.merchantName, render: (r) => <span className="text-slate-600 dark:text-slate-400">{r.merchantName}</span> },
  {
    key: 'amount', header: 'Amount', sortValue: (r) => r.amount,
    render: (r) => (
      <div className="flex items-center gap-0.5 font-semibold text-slate-900 dark:text-slate-100">
        <IndianRupee className="h-3.5 w-3.5" />
        <span>{r.amount.toLocaleString('en-IN')}</span>
      </div>
    ),
  },
  { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge variant={r.status} /> },
  { key: 'syncStatus', header: 'Sync', sortValue: (r) => r.syncStatus, render: (r) => <Badge variant={r.syncStatus} /> },
  { key: 'timestamp', header: 'Timestamp', sortValue: (r) => r.timestamp, render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(r.timestamp)}</span> },
];

export default function Transactions() {
  const { currentUser } = useAuth();
  const { merchants, transactions, createTransaction, processSyncQueue } = useData();
  const toast = useToast();
  const [merchantId, setMerchantId] = useState('');
  const [amount, setAmount] = useState('100');
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const rows = visibleTransactions(transactions, merchants, currentUser);
  const pending = rows.filter((tx) => tx.status === 'PENDING');
  const payable = merchants.filter((m) => m.status === 'ACTIVE' && m.userId !== currentUser?.id);
  const selectedMerchant = merchantId || payable[0]?.id || '';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    try {
      const tx = createTransaction(currentUser, selectedMerchant, Number(amount));
      setError('');
      setAmount('100');
      toast(`${inr(tx.amount)} payment to ${tx.merchantName} queued for sync.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the payment.');
    }
  };

  const handleSync = () => {
    if (!currentUser) return;
    const ids = new Set(rows.map((tx) => tx.id));
    const count = processSyncQueue(currentUser, isAdmin ? undefined : (tx) => ids.has(tx.id));
    toast(count ? `Synced ${count} payment${count === 1 ? '' : 's'}.` : 'Nothing to sync.', count ? 'success' : 'info');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CreditCard} tint="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        title={currentUser?.role === 'MERCHANT' ? 'Payments' : 'Transactions'}
        subtitle={`${rows.length} ${isAdmin ? 'total transactions' : 'transactions for your account'}`}
        actions={
          <>
            <div className="card flex items-center gap-2 px-4 py-2.5">
              <IndianRupee className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Settled volume:</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{inr(rows.filter(isSettled).reduce((s, tx) => s + tx.amount, 0))}</span>
            </div>
            <button onClick={handleSync} disabled={pending.length === 0} className="btn-secondary h-full disabled:opacity-50">
              <RefreshCw className="h-4 w-4" />
              Sync now{pending.length > 0 && ` (${pending.length})`}
            </button>
          </>
        }
      />

      {currentUser?.role !== 'MERCHANT' && (
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><Plus className="h-4 w-4" /></div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New payment</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Pay merchant</span>
              <select value={selectedMerchant} onChange={(e) => setMerchantId(e.target.value)} className="select-field w-full" required>
                {payable.map((m) => <option key={m.id} value={m.id}>{m.businessName}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Amount (₹)</span>
              <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" required />
            </label>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full justify-center" disabled={!payable.length}>Submit payment</button>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400 md:col-span-3" role="alert">{error}</p>}
          </form>
          <p className="mt-3 text-xs text-slate-400">Payments are signed offline and queue as pending until the next sync.</p>
        </div>
      )}

      <DataTable
        columns={columns} data={rows} rowKey={(r) => r.id}
        searchPlaceholder="Search by sender, receiver or merchant..."
        searchFilter={(r, q) => r.senderName.toLowerCase().includes(q) || r.receiverName.toLowerCase().includes(q) || r.merchantName.toLowerCase().includes(q)}
        filters={[
          { key: 'status', label: 'Status', options: ['ACCEPTED', 'REJECTED', 'CONFLICT', 'RECONCILED', 'PENDING'].map((s) => ({ label: s[0] + s.slice(1).toLowerCase(), value: s })), filter: (r, v) => r.status === v },
          { key: 'syncStatus', label: 'Sync', options: ['SYNCED', 'PENDING', 'FAILED'].map((s) => ({ label: s[0] + s.slice(1).toLowerCase(), value: s })), filter: (r, v) => r.syncStatus === v },
        ]}
        exportName="transactions"
        exportRow={(r) => ({ ID: r.id, Sender: r.senderName, Receiver: r.receiverName, Merchant: r.merchantName, Amount: r.amount, Status: r.status, Sync: r.syncStatus, Timestamp: r.timestamp })}
      />
    </div>
  );
}
