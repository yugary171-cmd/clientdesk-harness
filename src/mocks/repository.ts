import type {
  Customer,
  CustomerCreate,
  CustomerPatch,
  Ticket,
  TicketCreate,
  TicketPatch,
  ListParams,
  TicketParams,
} from '../contracts/types';
import { validate, type SchemaName } from '../contracts/validate';
import { TRANSITIONS } from '../shared/config';
import { createSeed, type Snapshot, type StoredTicket } from './seed';
export class DomainError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}
function checked<T>(schema: SchemaName, value: unknown): T {
  const normalized =
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            typeof item === 'string' ? item.trim() : item,
          ]),
        )
      : value;
  const result = validate(schema, normalized);
  if (!result.valid)
    throw new DomainError(422, 'VALIDATION_ERROR', '请检查填写内容', result.fieldErrors);
  return normalized as T;
}
function find<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((x) => x.id === id);
  if (!item) throw new DomainError(404, 'NOT_FOUND', '这条记录已不存在，请刷新列表');
  return item;
}
function paginate<T extends { id: string; createdAt: string }>(items: T[], params: ListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  if (!Number.isSafeInteger(page) || page < 1 || ![10, 20, 50].includes(pageSize))
    throw new DomainError(422, 'INVALID_QUERY', '分页参数不合法');
  const sorted = [...items].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
  );
  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
export function createRepository(
  options: {
    seed?: Snapshot;
    clock?: () => string;
    idFactory?: () => string;
    onChange?: (snapshot: Snapshot) => void;
  } = {},
) {
  let data = structuredClone(options.seed ?? createSeed());
  const now = options.clock ?? (() => new Date().toISOString());
  const id = options.idFactory ?? (() => crypto.randomUUID());
  const snapshot = () => structuredClone(data);
  const change = (next: Snapshot) => {
    data = next;
    options.onChange?.(snapshot());
  };
  const readTicket = (ticket: StoredTicket): Ticket => ({
    ...ticket,
    customerName: find(data.customers, ticket.customerId).name,
  });
  const assertCustomer = (customerId: string) => {
    if (!data.customers.some((c) => c.id === customerId))
      throw new DomainError(422, 'INVALID_CUSTOMER', '关联客户不存在，请重新选择', {
        customerId: '客户不存在，请重新选择',
      });
  };
  return {
    snapshot,
    reset() {
      change(createSeed());
    },
    listCustomers(params: ListParams = {}) {
      const q = params.q?.trim().toLowerCase() ?? '';
      return paginate(
        data.customers.filter(
          (c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
        ),
        params,
      );
    },
    getCustomer(customerId: string) {
      return structuredClone(find(data.customers, customerId));
    },
    createCustomer(value: unknown) {
      const input = checked<CustomerCreate>('CustomerCreate', value);
      const timestamp = now();
      const customer: Customer = { ...input, id: id(), createdAt: timestamp, updatedAt: timestamp };
      change({ ...data, customers: [...data.customers, customer] });
      return structuredClone(customer);
    },
    updateCustomer(customerId: string, value: unknown) {
      const current = find(data.customers, customerId);
      const input = checked<CustomerPatch>('CustomerPatch', value);
      const updated = { ...current, ...input, updatedAt: now() };
      change({
        ...data,
        customers: data.customers.map((c) => (c.id === customerId ? updated : c)),
      });
      return structuredClone(updated);
    },
    removeCustomer(customerId: string) {
      find(data.customers, customerId);
      if (data.tickets.some((t) => t.customerId === customerId))
        throw new DomainError(
          409,
          'CUSTOMER_HAS_TICKETS',
          '该客户有关联工单，请先处理并删除关联工单',
        );
      change({ ...data, customers: data.customers.filter((c) => c.id !== customerId) });
    },
    listTickets(params: TicketParams = {}) {
      const q = params.q?.trim().toLowerCase() ?? '';
      const matches = data.tickets.filter(
        (t) =>
          (!q || t.title.toLowerCase().includes(q)) &&
          (!params.customerId || t.customerId === params.customerId) &&
          (!params.status || t.status === params.status) &&
          (!params.priority || t.priority === params.priority),
      );
      const page = paginate(matches, params);
      return { ...page, items: page.items.map(readTicket) };
    },
    getTicket(ticketId: string) {
      return readTicket(find(data.tickets, ticketId));
    },
    createTicket(value: unknown) {
      const input = checked<TicketCreate>('TicketCreate', value);
      assertCustomer(input.customerId);
      const timestamp = now();
      const ticket: StoredTicket = {
        ...input,
        priority: input.priority ?? 'medium',
        status: 'pending',
        id: id(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      change({ ...data, tickets: [...data.tickets, ticket] });
      return readTicket(ticket);
    },
    updateTicket(ticketId: string, value: unknown) {
      const current = find(data.tickets, ticketId);
      const input = checked<TicketPatch>('TicketPatch', value);
      if (input.customerId) assertCustomer(input.customerId);
      if (
        input.status &&
        input.status !== current.status &&
        !TRANSITIONS[current.status].includes(input.status)
      )
        throw new DomainError(409, 'INVALID_TRANSITION', '当前状态不允许此操作，请刷新后重试');
      const updated = { ...current, ...input, updatedAt: now() };
      change({ ...data, tickets: data.tickets.map((t) => (t.id === ticketId ? updated : t)) });
      return readTicket(updated);
    },
    removeTicket(ticketId: string) {
      find(data.tickets, ticketId);
      change({ ...data, tickets: data.tickets.filter((t) => t.id !== ticketId) });
    },
  };
}
export type Repository = ReturnType<typeof createRepository>;
