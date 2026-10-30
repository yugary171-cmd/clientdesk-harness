import { beforeAll, beforeEach, afterAll, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { createRepository } from '../../src/mocks/repository';
import { createHandlers } from '../../src/mocks/handlers';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => server.resetHandlers(...createHandlers(createRepository())));
afterAll(() => server.close());
it('高优先级筛选只返回 high', async () => {
  const response = await fetch('http://localhost/api/tickets?priority=high');
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.total).toBe(15);
  expect(result.items.every((item: { priority: string }) => item.priority === 'high')).toBe(true);
});
it('优先级与状态、客户条件取交集', async () => {
  const response = await fetch(
    'http://localhost/api/tickets?priority=high&status=pending&customerId=cust-003',
  );
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.total).toBeGreaterThan(0);
  expect(
    result.items.every(
      (item: { priority: string; status: string; customerId: string }) =>
        item.priority === 'high' && item.status === 'pending' && item.customerId === 'cust-003',
    ),
  ).toBe(true);
});
it('非法优先级返回 422', async () => {
  expect((await fetch('http://localhost/api/tickets?priority=urgent')).status).toBe(422);
});
