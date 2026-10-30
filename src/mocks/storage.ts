import { validate } from '../contracts/validate';
import { createSeed, type Snapshot } from './seed';
export const STORAGE_KEY = 'saas-harness.demo.v1';
export function assertSnapshot(value: unknown): asserts value is Snapshot {
  if (!value || typeof value !== 'object') throw new Error('演示数据格式损坏');
  const snapshot = value as Snapshot;
  if (!Array.isArray(snapshot.customers) || !Array.isArray(snapshot.tickets))
    throw new Error('演示数据格式损坏');
  if (snapshot.customers.some((c) => !validate('Customer', c).valid))
    throw new Error('客户数据不符合契约');
  const ids = new Set(snapshot.customers.map((c) => c.id));
  if (
    ids.size !== snapshot.customers.length ||
    new Set(snapshot.tickets.map((t) => t.id)).size !== snapshot.tickets.length
  )
    throw new Error('演示数据存在重复标识');
  for (const ticket of snapshot.tickets) {
    const customer = snapshot.customers.find((c) => c.id === ticket.customerId);
    if (!customer || !validate('Ticket', { ...ticket, customerName: customer.name }).valid)
      throw new Error('工单数据或客户关联无效');
  }
}
export function loadSnapshot(storage: Pick<Storage, 'getItem'>): Snapshot {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return createSeed();
  const parsed = JSON.parse(raw);
  if (!parsed || parsed.version !== 1) throw new Error('演示数据版本不兼容');
  assertSnapshot(parsed.data);
  return parsed.data;
}
export function saveSnapshot(storage: Pick<Storage, 'setItem'>, snapshot: Snapshot) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: snapshot }));
}
