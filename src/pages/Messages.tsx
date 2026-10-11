import { MessageSquare } from 'lucide-react';
import Badge from '../components/Badge';
import DataTable, { Column } from '../components/DataTable';
import IdCode from '../components/IdCode';
import PageHeader from '../components/PageHeader';
import { mockMessages } from '../data/mock';
import { fmtDateTime } from '../lib/format';
import { Message } from '../types';

const columns: Column<Message>[] = [
  { key: 'id', header: 'Message ID', render: (r) => <IdCode id={r.id} /> },
  {
    key: 'sender', header: 'Sender', sortValue: (r) => r.senderName,
    render: (r) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-200">{r.senderName}</p>
        <p className="text-xs text-slate-400">{r.senderId.split('-').slice(0, 2).join('-')}</p>
      </div>
    ),
  },
  {
    key: 'receiver', header: 'Receiver', sortValue: (r) => r.receiverName,
    render: (r) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-200">{r.receiverName}</p>
        <p className="text-xs text-slate-400">{r.receiverId.split('-').slice(0, 2).join('-')}</p>
      </div>
    ),
  },
  { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge variant={r.status} /> },
  {
    key: 'hops', header: 'Hops', sortValue: (r) => r.hops,
    render: (r) => (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`h-4 w-1.5 rounded-sm ${i < r.hops ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          ))}
        </div>
        <span className="ml-1 text-xs text-slate-500">{r.hops}</span>
      </div>
    ),
  },
  { key: 'ttl', header: 'TTL', sortValue: (r) => r.ttl, render: (r) => <span className="text-slate-500 dark:text-slate-400">{r.ttl}s</span> },
  { key: 'timestamp', header: 'Timestamp', sortValue: (r) => r.timestamp, render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(r.timestamp)}</span> },
];

export default function Messages() {
  return (
    <div className="space-y-5">
      <PageHeader icon={MessageSquare} tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" title="Messages" subtitle={`${mockMessages.length} messages in explorer`} />
      <DataTable
        columns={columns} data={mockMessages} rowKey={(r) => r.id}
        searchPlaceholder="Search by sender or receiver..."
        searchFilter={(r, q) => r.senderName.toLowerCase().includes(q) || r.receiverName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)}
        filters={[{
          key: 'status', label: 'Status',
          options: ['QUEUED', 'SENT', 'RELAYED', 'DELIVERED', 'FAILED'].map((s) => ({ label: s[0] + s.slice(1).toLowerCase(), value: s })),
          filter: (r, v) => r.status === v,
        }]}
        exportName="messages"
        exportRow={(r) => ({ ID: r.id, Sender: r.senderName, Receiver: r.receiverName, Status: r.status, Hops: r.hops, TTL: r.ttl, Timestamp: r.timestamp })}
      />
    </div>
  );
}
