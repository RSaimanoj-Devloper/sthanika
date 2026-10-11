import { shortId } from '../lib/format';

export default function IdCode({ id, short = true }: { id: string; short?: boolean }) {
  return (
    <code
      title={id}
      className="whitespace-nowrap rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400"
    >
      {short ? shortId(id) : `${id.slice(0, 12)}…`}
    </code>
  );
}
