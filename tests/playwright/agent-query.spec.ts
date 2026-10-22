import { expect, test } from './fixtures';
import type { Locator } from '@playwright/test';

test('Agent list filters serialize typed values and ordered sorts', async ({
  page,
  appURL,
}) => {
  await page.goto(appURL + '/administration/agents');
  const query = page.locator('app-list-query');
  await query
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  const choose = async (control: Locator, name: string): Promise<void> => {
    await control.click();
    await page.getByRole('option', { name, exact: true }).click();
  };
  for (const [index, field, operation, value] of [
    [0, 'Status', 'Equals', 'DRAFT'],
    [1, 'Name', 'Contains', 'Review'],
    [2, 'Version Number', 'At least', '1'],
  ] as const) {
    await query
      .getByRole('button', { name: 'Add filter', exact: true })
      .click();
    await choose(
      query.locator(`[data-query-field="${index}"] [role="combobox"]`),
      field,
    );
    await choose(
      query.locator(`[data-query-operation="${index}"] [role="combobox"]`),
      operation,
    );
    if (field === 'Status') {
      await choose(
        query
          .locator('.filter-row')
          .nth(index)
          .getByRole('combobox', { name: 'Value', exact: true }),
        value,
      );
    } else {
      await query.locator(`input[data-query-value="${index}"]`).fill(value);
    }
  }
  await expect(query.locator('input[data-query-value="2"]')).toHaveAttribute(
    'type',
    'number',
  );
  for (const [index, field, direction] of [
    [0, 'Created At', 'Descending'],
    [1, 'Name', 'Ascending'],
  ] as const) {
    await query.getByRole('button', { name: 'Add sort', exact: true }).click();
    const group = query.locator(`[data-query-sort="${index}"]`);
    await choose(
      group.locator('[data-sort-field-index="0"] [role="combobox"]'),
      field,
    );
    await choose(
      group.getByRole('combobox', { name: 'Direction', exact: true }),
      direction,
    );
  }
  const sent = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/v1/ai-agents/search' &&
      request.postDataJSON().filters?.length === 3,
  );
  await query.getByRole('button', { name: 'Apply', exact: true }).click();
  const body = (await sent).postDataJSON();
  expect(body.filters).toEqual([
    { field_name: 'status', operation: 'equal', value: 'DRAFT' },
    { field_name: 'name', operation: 'contains', value: 'Review' },
    { field_name: 'number', operation: 'gte', value: 1 },
  ]);
  expect(body.sort_orders).toEqual([
    { field_name: 'created_at', operation: 'desc' },
    { field_name: 'name', operation: 'asc' },
  ]);
  await query.getByText('Applied query', { exact: true }).click();
  await expect(query.locator('.applied-summary')).toContainText(
    'Show records matching all these conditions.',
  );
  await expect(query.locator('.applied-summary')).toContainText(
    'Version Number',
  );
  await expect(query.locator('textarea')).toHaveCount(0);
});
