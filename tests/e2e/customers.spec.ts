import { test, expect, createCustomer, api } from './helpers';
test('客户 CRUD、详情及刷新持久化', async ({ page }) => {
  await createCustomer(page);
  await page.reload();
  const row = page.getByRole('row').filter({ hasText: '面试演示客户' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '详情', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '客户详情' })).toContainText('qa@example.test');
  await page
    .getByRole('dialog', { name: '客户详情' })
    .getByRole('button', { name: '关闭' })
    .click();
  await row.getByRole('button', { name: '编辑', exact: true }).click();
  const edit = page.getByRole('dialog', { name: '编辑客户' });
  await edit.getByLabel('客户名称', { exact: true }).fill('客户已更新');
  await edit.getByRole('button', { name: '保存', exact: true }).click();
  await expect(edit).not.toBeVisible();
  const updated = page.getByRole('row').filter({ hasText: '客户已更新' });
  await updated.getByRole('button', { name: '删除', exact: true }).click();
  await page
    .getByRole('dialog', { name: '确认删除' })
    .getByRole('button', { name: '删除', exact: true })
    .click();
  await expect(updated).toHaveCount(0);
});
test('未保存修改需要确认，取消保留输入', async ({ page }) => {
  await page.goto('/customers');
  await page.getByRole('button', { name: '新增客户', exact: true }).click();
  const form = page.getByRole('dialog', { name: '新增客户' });
  await form.getByLabel('客户名称', { exact: true }).fill('未保存内容');
  await form.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '继续编辑', exact: true }).click();
  await expect(form.getByLabel('客户名称', { exact: true })).toHaveValue('未保存内容');
  await form.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '放弃修改', exact: true }).click();
  await expect(form).not.toBeVisible();
});
test('关联客户拒绝删除并解释原因', async ({ page }) => {
  await page.goto('/customers?q=青禾');
  const row = page.getByRole('row').filter({ hasText: '青禾设计' });
  await row.getByRole('button', { name: '删除', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '确认删除' });
  await dialog.getByRole('button', { name: '删除', exact: true }).click();
  await expect(dialog).toContainText('该客户有关联工单');
  expect((await api(page, '/customers/cust-001')).status).toBe(200);
});
