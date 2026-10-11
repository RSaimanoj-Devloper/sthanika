import { Merchant, Transaction, User } from '../types';

export const merchantsOwnedBy = (merchants: Merchant[], user: User | null) =>
  merchants.filter((merchant) => merchant.userId === user?.id);

/** Transactions a given user is allowed to see, based on their role. */
export function visibleTransactions(transactions: Transaction[], merchants: Merchant[], user: User | null) {
  if (!user) return [];
  if (user.role === 'ADMIN') return transactions;
  if (user.role === 'MERCHANT') {
    const ids = merchantsOwnedBy(merchants, user).map((merchant) => merchant.id);
    return transactions.filter((tx) => ids.includes(tx.merchantId));
  }
  return transactions.filter((tx) => tx.senderId === user.id || tx.receiverId === user.id);
}

/** Stats are derived from transactions so tables, cards and charts never disagree. */
export function merchantStats(merchantId: string, transactions: Transaction[]) {
  const settled = transactions.filter(
    (tx) => tx.merchantId === merchantId && (tx.status === 'ACCEPTED' || tx.status === 'RECONCILED'),
  );
  return { count: settled.length, volume: settled.reduce((sum, tx) => sum + tx.amount, 0) };
}
