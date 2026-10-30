import { it, expect, vi } from 'vitest';
import { customersApi } from '../../src/shared/api/resources';
it('非法列表响应不能变成空列表', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: null }))));
  await expect(customersApi.list()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
it('204 删除不解析 JSON', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  await expect(customersApi.remove('a')).resolves.toBeUndefined();
});
it('网络失败返回可定位错误', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
  await expect(customersApi.list()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
});
it('422 字段错误可供表单展示', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: '错误',
          fieldErrors: { name: '请填写客户名称' },
        }),
        { status: 422 },
      ),
    ),
  );
  await expect(customersApi.create({ name: '', contactName: '', email: '' })).rejects.toMatchObject(
    { status: 422, fieldErrors: { name: '请填写客户名称' } },
  );
});
it('取消请求保留 AbortError', async () => {
  const controller = new AbortController();
  controller.abort();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
  await expect(customersApi.list({}, controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
});
