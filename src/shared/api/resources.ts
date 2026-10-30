import { request } from './http';
import type {
  Customer,
  CustomerCreate,
  CustomerPatch,
  CustomerList,
  Ticket,
  TicketCreate,
  TicketPatch,
  TicketList,
  ListParams,
  TicketParams,
} from '../../contracts/types';
function query(params: object) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return `?${search}`;
}
export const customersApi = {
  list: (params: ListParams = {}, signal?: AbortSignal) =>
    request<CustomerList>(`/customers${query(params)}`, 'CustomerList', { signal }),
  get: (id: string, signal?: AbortSignal) =>
    request<Customer>(`/customers/${encodeURIComponent(id)}`, 'Customer', { signal }),
  create: (input: CustomerCreate) =>
    request<Customer>('/customers', 'Customer', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: CustomerPatch) =>
    request<Customer>(`/customers/${encodeURIComponent(id)}`, 'Customer', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request<void>(`/customers/${encodeURIComponent(id)}`, null, { method: 'DELETE' }),
};
export const ticketsApi = {
  list: (params: TicketParams = {}, signal?: AbortSignal) =>
    request<TicketList>(`/tickets${query(params)}`, 'TicketList', { signal }),
  get: (id: string, signal?: AbortSignal) =>
    request<Ticket>(`/tickets/${encodeURIComponent(id)}`, 'Ticket', { signal }),
  create: (input: TicketCreate) =>
    request<Ticket>('/tickets', 'Ticket', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: TicketPatch) =>
    request<Ticket>(`/tickets/${encodeURIComponent(id)}`, 'Ticket', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request<void>(`/tickets/${encodeURIComponent(id)}`, null, { method: 'DELETE' }),
};
