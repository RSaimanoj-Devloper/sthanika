import { useId } from 'react';
import { Area, AreaChart as ReAreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';

interface AreaChartProps {
  data: object[];
  series: { key: string; label: string; color: string }[];
  xKey: string;
  height?: number;
  title?: string;
}

const tick = { fontSize: 11, fill: '#94a3b8' };

export default function AreaChart({ data, series, xKey, height = 260, title }: AreaChartProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className="card p-5">
      {title && <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ReAreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey={xKey} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip round />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" iconSize={8} />
          {series.map((s) => (
            <Area
              key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2}
              fill={`url(#${uid}-${s.key})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
