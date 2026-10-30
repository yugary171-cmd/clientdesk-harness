import type { Ticket } from '../contracts/types';
export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const STATUS_LABELS: Record<Ticket['status'], string> = {
  pending: '待处理',
  in_progress: '处理中',
  completed: '已完成',
};
export const PRIORITY_LABELS: Record<Ticket['priority'], string> = {
  low: '低',
  medium: '中',
  high: '高',
};
export const STATUS_COLORS = { pending: 'gold', in_progress: 'blue', completed: 'green' };
export const PRIORITY_COLORS = { low: 'default', medium: 'cyan', high: 'volcano' };
export const TRANSITIONS: Record<Ticket['status'], Ticket['status'][]> = {
  pending: ['in_progress'],
  in_progress: ['completed'],
  completed: ['in_progress'],
};
export const LIMITS = {
  name: 100,
  contactName: 50,
  email: 254,
  notes: 1000,
  title: 100,
  description: 2000,
};
export function formatTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
