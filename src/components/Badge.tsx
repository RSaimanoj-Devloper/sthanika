import { ReactNode } from 'react';
import clsx from 'clsx';

const variantClasses: Record<string, string> = {
  // Roles
  USER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  MERCHANT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  ADMIN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',

  // Status
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  BANNED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',

  // Message Status
  QUEUED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  RELAYED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',

  // Transaction Status
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  CONFLICT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  RECONCILED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',

  // Sync Status
  SYNCED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',

  // Alert state
  OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',

  // Severity
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

interface BadgeProps {
  variant: string;
  children?: ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className }: BadgeProps) {
  const classes = variantClasses[variant] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide',
        classes,
        className
      )}
    >
      {children ?? variant}
    </span>
  );
}
