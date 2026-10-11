import { Cell, Legend, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface PieData { name: string; value: number; color: string }

interface PieChartProps {
  data: PieData[];
  height?: number;
  title?: string;
  innerRadius?: number;
  outerRadius?: number;
}

const RADIAN = Math.PI / 180;

const sliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
}) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text
      x={cx + radius * Math.cos(-midAngle * RADIAN)} y={cy + radius * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PieChart({ data, height = 260, title, innerRadius = 60, outerRadius = 100 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="card p-5">
      {title && <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>}
      {total === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <RePieChart>
            <Pie
              data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius}
              dataKey="value" labelLine={false} label={sliceLabel} stroke="transparent"
            >
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          </RePieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
