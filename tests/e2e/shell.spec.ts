import { test, expect } from './helpers';
test('应用提供两个业务入口', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/customers/);
  await expect(page.getByRole('link', { name: '客户管理', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '工单管理', exact: true }).click();
  await expect(page).toHaveURL(/\/tickets/);
  await expect(page.getByRole('table')).toBeVisible();
});
