import { format, parseISO } from 'date-fns';

export const initials = (name: string) =>
  name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export const shortId = (id: string) => `${id.split('-')[1]}…${id.slice(-4)}`;

export const fmtDate = (iso: string) => format(parseISO(iso), 'dd MMM yyyy');
export const fmtDateTime = (iso: string) => format(parseISO(iso), 'dd MMM, HH:mm');
