import { Bar, BarChart as ReBarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';

interface BarChartProps {
  data: object[];
  series: { key: string; label: string; color: string }[];
  xKey: string;
  height?: number;
  title?: string;
  stacked?: boolean;
}

const tick = { fontSize: 11, fill: '#94a3b8' };

export default function BarChart({ data, series, xKey, height = 260, title, stacked = false }: BarChartProps) {
  return (
    <div className="card p-5">
      {title && <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
          <XAxis dataKey={xKey} tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="square" iconSize={8} />
          {series.map((s) => (
            <Bar
              key={s.key} dataKey={s.key} name={s.label} fill={s.color}
              radius={stacked ? 0 : [4, 4, 0, 0]} stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
