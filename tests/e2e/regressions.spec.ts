import { test, expect, api } from './helpers';
test('优先级筛选重置页码，刷新保留，清空恢复', async ({ page }) => {
  await page.goto('/tickets?page=2');
  await page.getByRole('combobox', { name: '筛选优先级' }).click();
  await page.getByTitle('高', { exact: true }).click();
  await expect(page).toHaveURL(/priority=high/);
  expect(new URL(page.url()).searchParams.get('page')).toBe('1');
  await expect(page.getByText('共 15 条', { exact: true })).toBeVisible();
  const rows = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: '编辑', exact: true }) });
  await expect(rows).toHaveCount(15);
  for (const row of await rows.all()) await expect(row).toContainText('高');
  await page.reload();
  await expect(page.getByRole('combobox', { name: '筛选优先级' }).locator('..')).toContainText(
    '高',
  );
  await page.getByRole('button', { name: '重置筛选' }).click();
  await expect(page.getByText('共 45 条', { exact: true })).toBeVisible();
});
test('删除末页最后一项返回前一页', async ({ page }) => {
  await page.goto('/customers');
  await expect(page.getByRole('table')).toBeVisible();
  for (let i = 0; i < 21; i++)
    await api(page, '/customers', 'POST', {
      name: `分页测试 ${i}`,
      contactName: '李',
      email: 'pages@example.test',
    });
  await page.goto('/customers?q=分页测试&page=2&pageSize=20');
  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: '删除', exact: true }) });
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: '删除', exact: true }).click();
  await page
    .getByRole('dialog', { name: '确认删除' })
    .getByRole('button', { name: '删除', exact: true })
    .click();
  await expect(page.getByText('共 20 条', { exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('page')).toBe('1');
});
test('记录在打开编辑前消失时提示并刷新', async ({ page }) => {
  await page.goto('/customers');
  await expect(page.getByRole('table')).toBeVisible();
  expect((await api(page, '/customers/cust-025', 'DELETE')).status).toBe(204);
  await page
    .getByRole('row')
    .filter({ hasText: '朴石建筑' })
    .getByRole('button', { name: '编辑', exact: true })
    .click();
  await expect(
    page.getByText('这条记录已不存在，请刷新列表', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: '朴石建筑' })).toHaveCount(0);
});
test('客户改名后工单显示新名称且编辑能回显已选客户', async ({ page }) => {
  await page.goto('/tickets?customerId=cust-001');
  const row = page.getByRole('row').filter({ hasText: '青禾设计' }).first();
  await expect(row).toBeVisible();
  await api(page, '/customers/cust-001', 'PATCH', { name: '改名后的青禾' });
  await page.getByRole('button', { name: '刷新工单列表' }).click();
  const changed = page.getByRole('row').filter({ hasText: '改名后的青禾' }).first();
  await expect(changed).toBeVisible();
  await changed.getByRole('button', { name: '编辑', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '编辑工单' });
  await expect(dialog.locator('.customer-select')).toContainText('改名后的青禾');
});
test('列表失败可以重试，空场景与无搜索结果可区分', async ({ page }) => {
  await page.goto('/customers');
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: '演示环境' }).click();
  await page.getByRole('combobox', { name: '演示场景' }).click();
  await page.getByTitle('下一次请求失败', { exact: true }).click();
  await expect(page.getByText('暂时无法获取数据', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '演示环境' }).click();
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('textbox', { name: '搜索客户名称或邮箱' }).fill('不存在的客户xyz');
  await expect(page.getByText('没有匹配的客户，试试其他关键词')).toBeVisible();
});
test('窄屏不产生页面横向溢出，键盘可打开关闭表单并恢复焦点', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/customers');
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const button = page.getByRole('button', { name: '新增客户', exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: '新增客户' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('客户名称', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(button).toBeFocused();
});
test('较早的搜索请求不能覆盖当前条件', async ({ page }) => {
  await page.goto('/customers');
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: '演示环境' }).click();
  await page.getByRole('combobox', { name: '演示场景' }).click();
  await page.getByTitle('延迟 1.5 秒', { exact: true }).click();
  await page.getByRole('button', { name: '演示环境' }).click();
  const search = page.getByRole('textbox', { name: '搜索客户名称或邮箱' });
  const first = page.waitForRequest((r) => new URL(r.url()).searchParams.get('q') === '青禾');
  await search.fill('青禾');
  await first;
  await search.fill('远山');
  await expect(page.getByRole('row').filter({ hasText: '远山科技' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: '青禾设计' })).toHaveCount(0);
});
test('不合法 URL 参数归一到安全默认值', async ({ page }) => {
  await page.goto('/tickets?page=-2&pageSize=999&status=toString&priority=constructor');
  await expect(page.getByText('共 45 条', { exact: true })).toBeVisible();
  const query = new URL(page.url()).searchParams;
  expect(query.get('page')).toBe('1');
  expect(query.get('pageSize')).toBe('20');
  expect(query.has('status')).toBe(false);
  expect(query.has('priority')).toBe(false);
});
