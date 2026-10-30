import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../shared/api/resources';
import { cacheKeys } from '../../shared/api/cache';
import type { TicketParams } from '../../contracts/types';
export function useTickets(params: TicketParams) {
  return useQuery({
    queryKey: cacheKeys.tickets(params),
    queryFn: ({ signal }) => ticketsApi.list(params, signal),
  });
}
export function useTicket(id?: string) {
  return useQuery({
    queryKey: cacheKeys.ticket(id ?? ''),
    queryFn: ({ signal }) => ticketsApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 0,
  });
}
