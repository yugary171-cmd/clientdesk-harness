import type { QueryClient } from '@tanstack/react-query';
import type { ListParams, TicketParams } from '../../contracts/types';
export const cacheKeys = {
  customers: (params: ListParams) => ['customers', 'list', params] as const,
  customer: (id: string) => ['customers', 'detail', id] as const,
  tickets: (params: TicketParams) => ['tickets', 'list', params] as const,
  ticket: (id: string) => ['tickets', 'detail', id] as const,
};
export async function refreshResources(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['customers'] }),
    client.invalidateQueries({ queryKey: ['tickets'] }),
  ]);
}
