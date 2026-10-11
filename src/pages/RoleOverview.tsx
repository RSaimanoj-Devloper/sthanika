import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Clock, CreditCard, Store, Wallet } from 'lucide-react';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { inr } from '../lib/format';
import { isSettled } from '../lib/stats';
import { merchantsOwnedBy, visibleTransactions } from '../lib/selectors';
import Overview from './Overview';

export default function RoleOverview() {
  const { currentUser } = useAuth();
  const { merchants, transactions } = useData();

  if (currentUser?.role === 'ADMIN') return <Overview />;

  const isMerchant = currentUser?.role === 'MERCHANT';
  const mine = visibleTransactions(transactions, merchants, currentUser);
  const myStore = merchantsOwnedBy(merchants, currentUser)[0];
  const sum = (list: typeof mine) => list.reduce((total, tx) => total + tx.amount, 0);

  const sent = mine.filter((tx) => tx.senderId === currentUser?.id);
  const received = mine.filter((tx) => tx.receiverId === currentUser?.id && isSettled(tx));
  const pending = mine.filter((tx) => tx.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-indigo-100">{isMerchant ? 'Merchant workspace' : 'Personal wallet'}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Welcome, {currentUser?.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100">
          {isMerchant ? 'Track incoming payments and keep an eye on your store activity.' : 'A quick view of your payments, activity and account.'}
        </p>
        <Link to="/transactions" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">
          <CreditCard className="h-4 w-4" />
          {isMerchant ? 'View payments' : 'Make a payment'}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isMerchant ? (
          <>
            <StatCard title="Payments" value={mine.length} icon={CreditCard} tint="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
            <StatCard title="Settled volume" value={inr(sum(mine.filter(isSettled)))} icon={Wallet} tint="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
            <StatCard title="Awaiting sync" value={pending} icon={Clock} tint="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" />
            <StatCard title="Store status" value={myStore?.status ?? 'No store'} subtitle={myStore?.businessName} icon={Store} tint="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
          </>
        ) : (
          <>
            <StatCard title="Sent" value={inr(sum(sent))} icon={ArrowUpRight} />
            <StatCard title="Received" value={inr(sum(received))} icon={ArrowDownLeft} tint="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
            <StatCard title="Transactions" value={mine.length} icon={CreditCard} tint="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
            <StatCard title="Awaiting sync" value={pending} icon={Clock} tint="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" />
          </>
        )}
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent activity</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Your latest account transactions</p>
          </div>
          <Link to="/transactions" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">See all</Link>
        </div>
        {mine.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {mine.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {isMerchant ? `Payment from ${tx.senderName}` : tx.senderId === currentUser?.id ? `Payment to ${tx.merchantName}` : `Payment from ${tx.senderName}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{tx.merchantName} · {new Date(tx.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{inr(tx.amount)}</p>
                  <Badge variant={tx.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No activity yet. Your transactions will appear here.</p>
        )}
      </section>
    </div>
  );
}
