import { it, expect, vi } from 'vitest';
import { loadSnapshot, saveSnapshot, STORAGE_KEY } from '../../src/mocks/storage';
import { createSeed } from '../../src/mocks/seed';
it('可恢复合法数据', () => {
  const seed = createSeed();
  const setItem = vi.fn();
  saveSnapshot({ setItem }, seed);
  expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  expect(loadSnapshot({ getItem: () => setItem.mock.calls[0][1] })).toEqual(seed);
});
it.each([
  'broken',
  '{"version":2,"data":{}}',
  '{"version":1,"data":{"customers":null,"tickets":[]}}',
])('拒绝损坏内容而不覆盖存储 %s', (raw) => {
  const storage = { getItem: () => raw, setItem: vi.fn() };
  expect(() => loadSnapshot(storage)).toThrow();
  expect(storage.setItem).not.toHaveBeenCalled();
});
it('拒绝孤立关联和重复标识', () => {
  const seed = createSeed();
  seed.customers = [];
  expect(() =>
    loadSnapshot({ getItem: () => JSON.stringify({ version: 1, data: seed }) }),
  ).toThrow();
  const duplicate = createSeed();
  duplicate.customers.push(duplicate.customers[0]);
  expect(() =>
    loadSnapshot({ getItem: () => JSON.stringify({ version: 1, data: duplicate }) }),
  ).toThrow();
});
it('写入失败向上层报告', () => {
  expect(() =>
    saveSnapshot(
      {
        setItem: () => {
          throw new Error('quota');
        },
      },
      createSeed(),
    ),
  ).toThrow('quota');
});
