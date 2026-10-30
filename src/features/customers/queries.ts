import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../shared/api/resources';
import { cacheKeys } from '../../shared/api/cache';
import type { ListParams } from '../../contracts/types';
export function useCustomers(params: ListParams) {
  return useQuery({
    queryKey: cacheKeys.customers(params),
    queryFn: ({ signal }) => customersApi.list(params, signal),
  });
}
export function useCustomer(id?: string) {
  return useQuery({
    queryKey: cacheKeys.customer(id ?? ''),
    queryFn: ({ signal }) => customersApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 0,
  });
}
