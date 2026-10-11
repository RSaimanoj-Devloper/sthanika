import { ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import clsx from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Provide a value to make the column sortable. */
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface TableFilter<T> {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  filter: (row: T, value: string) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  filters?: TableFilter<T>[];
  pageSize?: number;
  emptyMessage?: string;
  /** Provide a file name to show an "Export CSV" button. */
  exportName?: string;
  exportRow?: (row: T) => Record<string, string | number>;
  headerExtra?: ReactNode;
}

function downloadCsv(name: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DataTable<T>({
  columns, data, rowKey, searchPlaceholder = 'Search...', searchFilter, filters = [],
  pageSize = 10, emptyMessage = 'No records found.', exportName, exportRow, headerExtra,
}: DataTableProps<T>) {
  const [params] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(urlQuery);
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  // Global search in the top bar links here with ?q=…
  useEffect(() => {
    setQuery(urlQuery);
    setPage(1);
  }, [urlQuery]);

  let rows = data;
  if (query && searchFilter) rows = rows.filter((row) => searchFilter(row, query.toLowerCase()));
  for (const f of filters) {
    const value = filterValues[f.key];
    if (value) rows = rows.filter((row) => f.filter(row, value));
  }
  const sortColumn = columns.find((c) => c.key === sort?.key);
  if (sort && sortColumn?.sortValue) {
    const get = sortColumn.sortValue;
    const factor = sort.dir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      return (x < y ? -1 : x > y ? 1 : 0) * factor;
    });
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    setSort((prev) => (prev?.key === key ? (prev.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));
  };

  const windowStart = totalPages <= 5 ? 1 : Math.min(Math.max(currentPage - 2, 1), totalPages - 4);
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => windowStart + i);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-end">
        {searchFilter && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="input-field pl-9"
            />
          </div>
        )}
        {filters.map((f) => (
          <select
            key={f.key}
            value={filterValues[f.key] ?? ''}
            onChange={(e) => { setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value })); setPage(1); }}
            className="select-field"
            aria-label={f.label}
          >
            <option value="">{f.label}: All</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        {headerExtra}
        {exportName && exportRow && (
          <button
            type="button"
            className="btn-secondary justify-center"
            disabled={!rows.length}
            onClick={() => downloadCsv(exportName, rows.map(exportRow))}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={clsx('table-header whitespace-nowrap', col.className)}>
                  {col.sortValue ? (
                    <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200">
                      {col.header}
                      {sort?.key === col.key && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  ) : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : visible.map((row) => (
              <tr key={rowKey(row)} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className={clsx('table-cell', col.className)}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-3 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing <b className="font-medium text-slate-700 dark:text-slate-300">{rows.length ? start + 1 : 0}</b>–
          <b className="font-medium text-slate-700 dark:text-slate-300">{Math.min(start + pageSize, rows.length)}</b> of{' '}
          <b className="font-medium text-slate-700 dark:text-slate-300">{rows.length}</b> results
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setPage(n)}
              className={clsx(
                'h-8 w-8 rounded-lg text-xs font-medium transition-colors',
                currentPage === n ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700',
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
