import { BarChart2 } from 'lucide-react';
import AreaChart from '../components/charts/AreaChart';
import BarChart from '../components/charts/BarChart';
import PageHeader from '../components/PageHeader';
import PieChart from '../components/charts/PieChart';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { dailyMetrics, mockMessages, weeklySyncMetrics } from '../data/mock';
import { topSenders, transactionStatusPie, userRolePie } from '../lib/stats';

const syncSuccessRate = weeklySyncMetrics.map((w) => ({
  week: w.week,
  rate: Math.round((w.success / (w.success + w.failed + w.conflict)) * 100),
}));

export default function Analytics() {
  const { users } = useAuth();
  const { transactions } = useData();

  return (
    <div className="space-y-5">
      <PageHeader icon={BarChart2} tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" title="Analytics" subtitle="Network-wide trends and performance metrics" />

      <AreaChart data={dailyMetrics} xKey="date" title="Message Volume Trend (Last 30 Days)" height={240} series={[{ key: 'messages', label: 'Messages', color: '#6366f1' }]} />
      <AreaChart data={dailyMetrics} xKey="date" title="Transaction Volume Trend (Last 30 Days)" height={240} series={[{ key: 'transactions', label: 'Transactions', color: '#22c55e' }]} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BarChart
          data={topSenders(mockMessages)} xKey="name" title="Top Senders — Messages Sent vs Delivered" height={260}
          series={[{ key: 'sent', label: 'Sent', color: '#6366f1' }, { key: 'delivered', label: 'Delivered', color: '#22c55e' }]}
        />
        <AreaChart data={syncSuccessRate} xKey="week" title="Sync Success Rate Over Time (%)" height={260} series={[{ key: 'rate', label: 'Success Rate %', color: '#f59e0b' }]} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PieChart data={transactionStatusPie(transactions)} title="Transaction Status Distribution" height={300} innerRadius={70} outerRadius={115} />
        <PieChart data={userRolePie(users)} title="User Role Distribution" height={300} innerRadius={70} outerRadius={115} />
      </div>

      <BarChart
        data={weeklySyncMetrics} xKey="week" title="Weekly Sync Events — Stacked View" height={240} stacked
        series={[{ key: 'success', label: 'Success', color: '#22c55e' }, { key: 'failed', label: 'Failed', color: '#ef4444' }, { key: 'conflict', label: 'Conflict', color: '#f59e0b' }]}
      />
    </div>
  );
}
