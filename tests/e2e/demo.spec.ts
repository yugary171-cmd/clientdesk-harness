import { test, expect, createCustomer } from './helpers';
test('损坏存储不静默覆盖，可选择内存模式', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('saas-harness.demo.v1', 'broken'));
  await page.goto('/');
  await expect(page.getByText('无法载入演示数据', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('saas-harness.demo.v1'))).toBe('broken');
  await page.getByRole('button', { name: '使用临时内存模式' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('内存模式', { exact: true })).toBeVisible();
});
test('确认重置恢复种子并更新页面', async ({ page }) => {
  await createCustomer(page, '重置前客户');
  await page.getByRole('button', { name: '演示环境' }).click();
  await page.getByRole('button', { name: '重置演示数据' }).click();
  await page.getByRole('button', { name: '确认重置' }).click();
  await expect(page.getByRole('row').filter({ hasText: '重置前客户' })).toHaveCount(0);
  await expect(page.getByRole('table')).toBeVisible();
});
test('存储不可写时明确降级内存模式', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('blocked', 'QuotaExceededError');
    };
  });
  await page.goto('/customers');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('内存模式', { exact: true })).toBeVisible();
  await expect(
    page.getByText('本地存储不可写，已切换内存模式；刷新可能丢失本次更改。'),
  ).toBeVisible();
});
