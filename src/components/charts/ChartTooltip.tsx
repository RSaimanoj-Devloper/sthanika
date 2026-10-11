interface Entry { name: string; value: number | string; color: string }

export default function ChartTooltip({ active, payload, label, round = false }: {
  active?: boolean;
  payload?: Entry[];
  label?: string;
  round?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div className={`h-2 w-2 ${round ? 'rounded-full' : 'rounded-sm'}`} style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
