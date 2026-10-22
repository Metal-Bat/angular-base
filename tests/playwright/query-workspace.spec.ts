import { expect, test } from './fixtures';
import type { Locator, Request } from '@playwright/test';

test('Named sort fields reorder in both directions and preserve canonical payloads in RTL', async ({
  page,
  appURL,
}, testInfo): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(appURL + '/users');
  const query = page.locator('app-list-query');
  await query
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  await query.getByRole('button', { name: 'Add sort', exact: true }).click();
  const group = (index: number): Locator =>
    query.locator(`[data-query-sort="${index}"]`);
  const field = (sort: number, index: number): Locator =>
    group(sort).locator(`[data-sort-field-index="${index}"] [role="combobox"]`);
  await field(0, 0).click();
  await page.getByRole('option', { name: 'Username', exact: true }).click();
  await group(0)
    .getByRole('combobox', { name: 'Direction', exact: true })
    .click();
  await page.getByRole('option', { name: 'Descending', exact: true }).click();
  await group(0)
    .getByRole('button', { name: 'Add field', exact: true })
    .click();
  await expect(field(0, 1)).toContainText('Created At');
  await group(0)
    .getByRole('button', { name: 'Move up: Field 2', exact: true })
    .click();
  await expect(field(0, 0)).toContainText('Created At');
  await expect(field(0, 0)).toBeFocused();
  await query.getByRole('button', { name: 'Add sort', exact: true }).click();
  await field(1, 0).click();
  await page.getByRole('option', { name: 'Email', exact: true }).click();
  await group(1)
    .getByRole('button', { name: 'Move up: Sort 2', exact: true })
    .click();
  await expect(field(0, 0)).toContainText('Email');
  await expect(field(0, 0)).toBeFocused();
  const read = (): Promise<Request> =>
    page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/admin/users/select' &&
        request.postDataJSON().sort_orders?.length === 2,
    );
  const applied = read();
  await query.getByRole('button', { name: 'Apply', exact: true }).click();
  const first = (await applied).postDataJSON();
  expect(first.sort_orders).toEqual([
    { field_name: 'email', operation: 'asc' },
    { multi_field: ['created_at', 'username'], operation: 'desc' },
  ]);
  expect(first.filters).toContainEqual({
    field_name: 'is_superuser',
    operation: 'equal',
    value: false,
  });
  await expect(query.locator('input[data-query-sort]')).toHaveCount(0);
  await expect(group(1)).not.toContainText('created_at');
  await query
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  await query
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  await expect(field(1, 0)).toContainText('Created At');
  await page.locator('[data-language-picker] [role="combobox"]').click();
  await page.getByRole('option', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const down = group(1)
    .locator('[data-sort-field-index="0"] button')
    .filter({ has: page.locator('.pi-arrow-down') });
  await down.click();
  await expect(field(1, 1)).toBeFocused();
  const rtlApplied = read();
  await query.getByRole('button', { name: 'اعمال', exact: true }).click();
  expect((await rtlApplied).postDataJSON().sort_orders).toEqual([
    { field_name: 'email', operation: 'asc' },
    { multi_field: ['username', 'created_at'], operation: 'desc' },
  ]);
  await expect(query.locator('[data-query-sort]')).toHaveCount(2);
  await expect(field(1, 1)).toContainText('ایجاد');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(query).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      })),
    )
    .toEqual({ width: 390, documentWidth: 390 });
  const touch = await down.boundingBox();
  expect(touch?.height).toBeGreaterThanOrEqual(44);
  expect(touch?.width).toBeGreaterThanOrEqual(44);
  await testInfo.attach('rtl-named-sort-workspace', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});
