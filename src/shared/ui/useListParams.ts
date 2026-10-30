import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListParams, PageSize, TicketParams } from '../../contracts/types';
import { STATUS_LABELS, PRIORITY_LABELS } from '../config';
export function useListParams(kind: 'customers' | 'tickets') {
  const [search, setSearch] = useSearchParams();
  const rawPage = Number(search.get('page') ?? 1);
  const rawSize = Number(search.get('pageSize') ?? 20);
  const params: TicketParams = {
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: ([10, 20, 50].includes(rawSize) ? rawSize : 20) as PageSize,
    ...(search.get('q')?.trim() ? { q: search.get('q')!.trim() } : {}),
    ...(kind === 'tickets' && search.get('customerId')
      ? { customerId: search.get('customerId')! }
      : {}),
    ...(kind === 'tickets' &&
    search.get('status') &&
    Object.hasOwn(STATUS_LABELS, search.get('status')!)
      ? { status: search.get('status') as TicketParams['status'] }
      : {}),
    ...(kind === 'tickets' &&
    search.get('priority') &&
    Object.hasOwn(PRIORITY_LABELS, search.get('priority')!)
      ? { priority: search.get('priority') as TicketParams['priority'] }
      : {}),
  };
  const canonical = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  useEffect(() => {
    if (search.toString() !== canonical) setSearch(canonical, { replace: true });
  }, [canonical, search, setSearch]);
  const update = (patch: Partial<TicketParams>) => {
    const next = { ...params, ...patch };
    setSearch(
      Object.fromEntries(
        Object.entries(next)
          .filter(([, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, String(value)]),
      ),
      { replace: true },
    );
  };
  return { params, update, reset: () => setSearch({ page: '1', pageSize: '20' }) };
}
export function usePageRecovery(
  total: number | undefined,
  params: ListParams,
  onRecover: (page: number) => void,
) {
  useEffect(() => {
    if (total === undefined) return;
    const last = Math.max(1, Math.ceil(total / (params.pageSize ?? 20)));
    if ((params.page ?? 1) > last) onRecover(last);
  }, [total, params.page, params.pageSize, onRecover]);
}
export function useDebouncedValue<T>(value: T, wait = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), wait);
    return () => clearTimeout(timer);
  }, [value, wait]);
  return debounced;
}
