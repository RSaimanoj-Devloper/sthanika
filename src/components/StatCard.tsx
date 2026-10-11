import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile. */
  tint?: string;
}

export default function StatCard({
  title, value, subtitle, icon: Icon,
  tint = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
}: StatCardProps) {
  return (
    <div className="card flex items-start justify-between p-5 transition-shadow hover:shadow-md">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 truncate text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
      </div>
      <div className={`rounded-xl p-2.5 ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
