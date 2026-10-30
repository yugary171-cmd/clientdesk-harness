import { test, expect, createCustomer, api } from './helpers';
test('工单 CRUD、状态流转和关联释放', async ({ page }) => {
  await createCustomer(page, '工单测试客户');
  await page.getByRole('link', { name: '工单管理', exact: true }).click();
  await page.getByRole('button', { name: '新增工单', exact: true }).click();
  const form = page.getByRole('dialog', { name: '新增工单' });
  await form.getByLabel('工单标题', { exact: true }).fill('需要技术协助');
  await form.getByRole('combobox', { name: '关联客户' }).fill('工单测试客户');
  await page.getByTitle('工单测试客户', { exact: true }).click();
  await form.getByLabel('问题描述', { exact: true }).fill('需要确认配置方法。');
  await form.getByRole('button', { name: '保存', exact: true }).click();
  await expect(form).not.toBeVisible();
  const row = page.getByRole('row').filter({ hasText: '需要技术协助' });
  await expect(row).toContainText('待处理');
  await row.getByRole('button', { name: '详情', exact: true }).click();
  const detail = page.getByRole('dialog', { name: '工单详情' });
  await expect(detail).toContainText('需要确认配置方法。');
  await detail.getByRole('button', { name: '关闭' }).click();
  for (const status of ['处理中', '已完成', '处理中']) {
    await row.getByRole('button', { name: '编辑', exact: true }).click();
    const edit = page.getByRole('dialog', { name: '编辑工单' });
    await edit.getByLabel('状态', { exact: true }).click();
    await page.getByTitle(status, { exact: true }).last().click();
    await edit.getByRole('button', { name: '保存', exact: true }).click();
    await expect(edit).not.toBeVisible();
    await expect(row).toContainText(status);
  }
  const customer = (await api(page, '/customers?q=工单测试客户')).body.items[0];
  expect((await api(page, `/customers/${customer.id}`, 'DELETE')).status).toBe(409);
  await row.getByRole('button', { name: '删除', exact: true }).click();
  await page
    .getByRole('dialog', { name: '确认删除' })
    .getByRole('button', { name: '删除', exact: true })
    .click();
  await expect(row).toHaveCount(0);
  expect((await api(page, `/customers/${customer.id}`, 'DELETE')).status).toBe(204);
});
test('客户选择器能够访问第二页', async ({ page }) => {
  await page.goto('/tickets');
  await page.getByRole('button', { name: '新增工单', exact: true }).click();
  await page
    .getByRole('dialog', { name: '新增工单' })
    .getByRole('combobox', { name: '关联客户' })
    .click();
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.getByTitle('青禾设计', { exact: true })).toBeVisible();
});
