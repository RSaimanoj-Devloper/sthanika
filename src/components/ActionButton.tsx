import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'default' | 'danger' | 'success';
}

const tones = {
  default: 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700',
  danger: 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40',
  success: 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/60 dark:text-green-400 dark:hover:bg-green-950/40',
};

export default function ActionButton({ tone = 'default', className, ...props }: ActionButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        tones[tone],
        className,
      )}
    />
  );
}
