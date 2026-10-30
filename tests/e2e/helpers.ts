import { test as base, expect, type Page } from '@playwright/test';
export const test = base.extend<{ localOnly: void; pageErrors: void }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'No uncaught browser errors').toEqual([]);
    },
    { auto: true },
  ],
  localOnly: [
    async ({ context }, use) => {
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (
          ['127.0.0.1', 'localhost'].includes(url.hostname) ||
          ['data:', 'blob:'].includes(url.protocol)
        )
          await route.continue();
        else {
          await route.abort();
          throw new Error(`Unexpected external request: ${url.origin}`);
        }
      });
      await use();
    },
    { auto: true },
  ],
});
export { expect };
export async function createCustomer(page: Page, name = '面试演示客户') {
  await page.goto('/customers');
  await expect(page.getByRole('button', { name: '新增客户', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '新增客户', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '新增客户' });
  await dialog.getByLabel('客户名称', { exact: true }).fill(name);
  await dialog.getByLabel('联系人', { exact: true }).fill('林女士');
  await dialog.getByLabel('邮箱', { exact: true }).fill('qa@example.test');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible();
}
export async function api(page: Page, path: string, method = 'GET', body?: object) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const response = await fetch(`/api${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: response.status,
        body: response.status === 204 ? null : await response.json(),
      };
    },
    { path, method, body },
  );
}
