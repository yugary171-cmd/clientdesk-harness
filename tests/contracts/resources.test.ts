import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { createRepository } from '../../src/mocks/repository';
import { createSeed } from '../../src/mocks/seed';
import { createHandlers } from '../../src/mocks/handlers';
import { customersApi, ticketsApi } from '../../src/shared/api/resources';
const server = setupServer();
let repository: ReturnType<typeof createRepository>;
beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api');
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  repository = createRepository({ seed: createSeed() });
  server.resetHandlers(...createHandlers(repository));
});
afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});
describe('HTTP 业务契约', () => {
  it('关联工单阻止客户删除，移除关联后允许删除', async () => {
    const c = await customersApi.create({
      name: '客户',
      contactName: '李女士',
      email: 'li@example.test',
    });
    const t = await ticketsApi.create({
      title: '测试工单',
      description: '描述',
      customerId: c.id,
      priority: 'medium',
    });
    await expect(customersApi.remove(c.id)).rejects.toMatchObject({ status: 409 });
    await ticketsApi.remove(t.id);
    await expect(customersApi.remove(c.id)).resolves.toBeUndefined();
    await expect(customersApi.get(c.id)).rejects.toMatchObject({ status: 404 });
  });
  it('拒绝非法状态流转且不改变数据', async () => {
    const t = await ticketsApi.create({
      title: '测试',
      description: '描述',
      customerId: 'cust-001',
    });
    const before = repository.snapshot();
    await expect(ticketsApi.update(t.id, { status: 'completed' })).rejects.toMatchObject({
      status: 409,
    });
    expect(repository.snapshot()).toEqual(before);
    for (const status of ['in_progress', 'completed', 'in_progress'] as const) {
      await expect(ticketsApi.update(t.id, { status })).resolves.toMatchObject({ status });
    }
  });
  it('校验字段、关联和分页', async () => {
    await expect(
      customersApi.create({ name: '  ', contactName: '李', email: 'invalid' }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      ticketsApi.create({ title: '不存在', description: '描述', customerId: 'missing' }),
    ).rejects.toMatchObject({ status: 422 });
    const res = await fetch('http://localhost/api/customers?page=0');
    expect(res.status).toBe(422);
    const unknown = await fetch('http://localhost/api/customers?surprise=yes');
    expect(unknown.status).toBe(422);
  });
  it('支持分页、组合筛选及越界空页', async () => {
    const first = await ticketsApi.list({ page: 1, pageSize: 20 });
    expect(first.items).toHaveLength(20);
    expect(first.total).toBe(45);
    const second = await ticketsApi.list({ page: 2, pageSize: 20 });
    expect(new Set([...first.items, ...second.items].map((x) => x.id)).size).toBe(40);
    expect((await ticketsApi.list({ page: 100 })).items).toEqual([]);
    const filtered = await ticketsApi.list({ customerId: 'cust-001', status: 'pending' });
    expect(filtered.items.every((x) => x.customerId === 'cust-001' && x.status === 'pending')).toBe(
      true,
    );
  });
  it('客户改名实时反映在工单，PATCH 保留省略字段', async () => {
    const before = await customersApi.get('cust-001');
    await customersApi.update('cust-001', { name: '新名称', notes: '' });
    expect((await customersApi.get('cust-001')).email).toBe(before.email);
    const list = await ticketsApi.list({ customerId: 'cust-001' });
    expect(list.items.every((x) => x.customerName === '新名称')).toBe(true);
  });
  it('客户允许重名；直接请求不能写入只读字段', async () => {
    const input = { name: '同名客户', contactName: '王', email: 'a@example.test' };
    const a = await customersApi.create(input);
    const b = await customersApi.create(input);
    expect(a.id).not.toBe(b.id);
    const response = await fetch(`http://localhost/api/customers/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'hijack' }),
    });
    expect(response.status).toBe(422);
  });
});
it.each([
  null,
  [],
  { name: 'a'.repeat(101), contactName: '联系人', email: 'qa@example.test' },
  { name: '客户', contactName: '联系人', email: 'qa@example.test', notes: 'x'.repeat(1001) },
])('非法客户输入无部分写入', async (input) => {
  const before = repository.snapshot();
  const response = await fetch('http://localhost/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  expect(response.status).toBe(422);
  expect(repository.snapshot()).toEqual(before);
});
it('非 JSON 请求体返回 422', async () => {
  expect(
    (await fetch('http://localhost/api/customers', { method: 'POST', body: '{broken' })).status,
  ).toBe(422);
});
