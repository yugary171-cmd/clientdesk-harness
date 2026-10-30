import { beforeAll, beforeEach, afterAll, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { AppProviders } from '../../src/app/providers';
import { CustomerForm } from '../../src/features/customers/CustomerForm';
const server = setupServer();
beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api');
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});
it('提交失败保留输入并把字段错误展示给用户', async () => {
  server.use(
    http.post('http://localhost/api/customers', () =>
      HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: '请检查字段', fieldErrors: { email: '邮箱暂不可用' } },
        { status: 422 },
      ),
    ),
  );
  const user = userEvent.setup();
  const close = vi.fn();
  render(
    <AppProviders motion={false}>
      <CustomerForm onClose={close} />
    </AppProviders>,
  );
  const dialog = within(await screen.findByRole('dialog', { name: '新增客户' }));
  await user.type(dialog.getByLabelText('客户名称', { exact: true }), '新客户');
  await user.type(dialog.getByLabelText('联系人', { exact: true }), '李女士');
  await user.type(dialog.getByLabelText('邮箱', { exact: true }), 'qa@example.test');
  await user.click(dialog.getByRole('button', { name: '保存' }));
  await waitFor(() => expect(dialog.getByText('邮箱暂不可用')).toBeVisible());
  expect(dialog.getByLabelText('客户名称', { exact: true })).toHaveValue('新客户');
  expect(close).not.toHaveBeenCalled();
});
it('快速重复提交只产生一个写请求', async () => {
  let release: () => void = () => {};
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  const received = vi.fn();
  server.use(
    http.post('http://localhost/api/customers', async () => {
      received();
      await barrier;
      return HttpResponse.json({ code: 'DEMO_ERROR', message: '稍后重试' }, { status: 503 });
    }),
  );
  const user = userEvent.setup();
  render(
    <AppProviders motion={false}>
      <CustomerForm onClose={vi.fn()} />
    </AppProviders>,
  );
  const dialog = within(await screen.findByRole('dialog', { name: '新增客户' }));
  await user.type(dialog.getByLabelText('客户名称', { exact: true }), '新客户');
  await user.type(dialog.getByLabelText('联系人', { exact: true }), '李');
  await user.type(dialog.getByLabelText('邮箱', { exact: true }), 'qa@example.test');
  await user.dblClick(dialog.getByRole('button', { name: '保存' }));
  await waitFor(() => expect(received).toHaveBeenCalledTimes(1));
  release();
  await waitFor(() => expect(dialog.getByText('稍后重试')).toBeVisible());
});
