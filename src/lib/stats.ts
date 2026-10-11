import { Device, Message, SyncEvent, Transaction, User } from '../types';

const ONLINE_WINDOW_MS = 15 * 60_000;

export const isSettled = (tx: Transaction) => tx.status === 'ACCEPTED' || tx.status === 'RECONCILED';

export function transactionStatusPie(transactions: Transaction[]) {
  const colors: [Transaction['status'], string, string][] = [
    ['ACCEPTED', 'Accepted', '#22c55e'],
    ['REJECTED', 'Rejected', '#ef4444'],
    ['CONFLICT', 'Conflict', '#f59e0b'],
    ['RECONCILED', 'Reconciled', '#6366f1'],
    ['PENDING', 'Pending', '#94a3b8'],
  ];
  return colors.map(([status, name, color]) => ({
    name, color, value: transactions.filter((tx) => tx.status === status).length,
  }));
}

export function userRolePie(users: User[]) {
  return [
    { name: 'Users', color: '#6366f1', value: users.filter((u) => u.role === 'USER').length },
    { name: 'Merchants', color: '#22c55e', value: users.filter((u) => u.role === 'MERCHANT').length },
    { name: 'Admins', color: '#f59e0b', value: users.filter((u) => u.role === 'ADMIN').length },
  ];
}

export function topSenders(messages: Message[], limit = 8) {
  const byName = new Map<string, { name: string; sent: number; delivered: number }>();
  for (const m of messages) {
    const entry = byName.get(m.senderId) ?? { name: m.senderName.split(' ')[0], sent: 0, delivered: 0 };
    entry.sent += 1;
    if (m.status === 'DELIVERED') entry.delivered += 1;
    byName.set(m.senderId, entry);
  }
  return [...byName.values()].sort((a, b) => b.sent - a.sent).slice(0, limit);
}

export function buildKpis(users: User[], devices: Device[], messages: Message[], transactions: Transaction[], syncEvents: SyncEvent[], activeMerchants: number) {
  const active = devices.filter((d) => d.status === 'ACTIVE');
  const now = Date.now();
  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
    activeDevices: active.length,
    onlineDevices: active.filter((d) => now - new Date(d.lastSeen).getTime() < ONLINE_WINDOW_MS).length,
    messagesDelivered: messages.filter((m) => m.status === 'DELIVERED').length,
    totalMessages: messages.length,
    totalTransactions: transactions.length,
    totalVolume: transactions.filter(isSettled).reduce((sum, tx) => sum + tx.amount, 0),
    activeMerchants,
    pendingSyncs: syncEvents.filter((e) => e.status === 'PENDING' || e.status === 'PROCESSING').length,
  };
}
