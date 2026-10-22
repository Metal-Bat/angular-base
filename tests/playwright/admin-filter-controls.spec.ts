import { expect, test } from './fixtures';
test.use({ administrationDetails: true });

test('Client type membership uses multiple choices and keeps exact values through reopen and Cancel', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/administration/clients');
  const query = page.locator('app-catalog-content app-list-query');
  await query
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  await query.getByRole('button', { name: 'Add filter', exact: true }).click();
  await query.locator('[data-query-field="0"] [role="combobox"]').click();
  await page.getByRole('option', { name: 'Type', exact: true }).click();
  await query.locator('[data-query-operation="0"] [role="combobox"]').click();
  await page.getByRole('option', { name: 'Is one of', exact: true }).click();
  const value = query.locator('p-multiselect [role="combobox"]');
  await query.locator('p-multiselect .p-multiselect-label').click();
  await page.getByRole('option', { name: 'WEB', exact: true }).click();
  await page.getByRole('option', { name: 'SDK', exact: true }).click();
  await value.press('Escape');
  await expect(value).toBeFocused();
  const submitted = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/v1/clients/search') &&
      request.method() === 'POST',
  );
  await query.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await submitted).postDataJSON().filters).toEqual([
    { field_name: 'kind', operation: 'in', value: ['WEB', 'SDK'] },
  ]);
  await query.locator('p-multiselect .p-multiselect-label').click();
  await page.getByRole('option', { name: 'B2B', exact: true }).click();
  await value.press('Escape');
  await query.getByRole('button', { name: 'Cancel', exact: true }).click();
  await query.locator('p-multiselect .p-multiselect-label').click();
  await expect(
    page.getByRole('option', { name: 'B2B', exact: true }),
  ).toHaveAttribute('aria-selected', 'false');
  await expect(
    page.getByRole('option', { name: 'WEB', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await value.press('Escape');
});

test('Date membership retains independent calendar rows and blocks an unfinished row', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/studio/request-types');
  const query = page.locator('app-catalog-content app-list-query');
  await query
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  await query.getByRole('button', { name: 'Add filter', exact: true }).click();
  await query.locator('[data-query-field="0"] [role="combobox"]').click();
  await page.getByRole('option', { name: 'Created At', exact: true }).click();
  await query.locator('[data-query-operation="0"] [role="combobox"]').click();
  await page.getByRole('option', { name: 'Is one of', exact: true }).click();
  const list = query.locator('app-list-values');
  const calendars = list.locator('app-temporal-control');
  await calendars
    .first()
    .getByRole('button', { name: 'Choose date', exact: true })
    .click();
  const popup = page.locator('.calendar-sheet');
  await popup.locator('[data-calendar-day]').first().click();
  await expect(calendars.first().locator('.date-entry input')).not.toHaveValue(
    '',
  );
  await list.getByRole('button', { name: 'Add value', exact: true }).click();
  await expect(calendars).toHaveCount(2);
  let writes = 0;
  page.on('request', (request) => {
    if (
      request.url().endsWith('/api/v1/request-types/search') &&
      request.method() === 'POST'
    ) {
      writes++;
    }
  });
  await query.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(query.getByRole('alert').first()).toBeVisible();
  expect(writes).toBe(0);
  await calendars.nth(1).locator('.date-entry input').fill('2026-11-05');
  const submitted = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/v1/request-types/search') &&
      request.method() === 'POST',
  );
  await query.getByRole('button', { name: 'Apply', exact: true }).click();
  const body = (await submitted).postDataJSON();
  expect(body.filters[0].field_name).toBe('created_at');
  expect(body.filters[0].value).toHaveLength(2);
  expect(body.filters[0].value[1]).toBe('2026-11-04T20:30:00.000Z');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
});

test('Column date ranges keep the owning filter open while calendars are used', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/administration/tasks/schedules');
  const trigger = page.getByRole('button', {
    name: 'Filter Created At',
    exact: true,
  });
  await trigger.click();
  const filter = page.locator('.column-filter');
  await filter
    .getByRole('combobox', { name: 'Condition', exact: true })
    .click();
  await page.getByRole('option', { name: 'Between', exact: true }).click();
  const calendars = filter.locator('app-temporal-control');
  await calendars
    .first()
    .getByRole('button', { name: 'Choose date', exact: true })
    .click();
  await page.locator('.calendar-sheet [data-calendar-day]').first().click();
  await expect(filter).toBeVisible();
  await calendars.nth(1).locator('.date-entry input').fill('2026-12-31');
  const submitted = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/v1/tasks/schedules/search') &&
      request.method() === 'POST',
  );
  await filter.getByRole('button', { name: 'Apply', exact: true }).click();
  const values = (await submitted).postDataJSON().filters[0];
  expect(values.field_name).toBe('created_at');
  expect(values.operation).toBe('between');
  expect(values.value).toHaveLength(2);
  expect(values.value[1]).toBe('2026-12-30T20:30:00.000Z');
  await expect(filter).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
});

test('Membership filters preserve zero and false as typed values', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/studio/request-types');
  const query = page.locator('app-catalog-content app-list-query');
  await query
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  await query.getByRole('button', { name: 'Add filter', exact: true }).click();
  await query.locator('[data-query-field="0"] [role="combobox"]').click();
  await page
    .getByRole('option', { name: 'Default Priority', exact: true })
    .click();
  await query.locator('[data-query-operation="0"] [role="combobox"]').click();
  await page.getByRole('option', { name: 'Is one of', exact: true }).click();
  const list = query.locator('app-list-values');
  await list.locator('input').fill('0');
  const numeric = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().endsWith('/api/v1/request-types/search'),
  );
  await query.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await numeric).postDataJSON().filters).toEqual([
    { field_name: 'default_priority', operation: 'in', value: [0] },
  ]);
  await query.locator('[data-query-field="0"] [role="combobox"]').click();
  await page.getByRole('option', { name: 'Active', exact: true }).click();
  await query.locator('[data-query-operation="0"] [role="combobox"]').click();
  await page.getByRole('option', { name: 'Is one of', exact: true }).click();
  await list.getByRole('combobox').click();
  await page.getByRole('option', { name: 'No', exact: true }).click();
  const boolean = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().endsWith('/api/v1/request-types/search'),
  );
  await query.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await boolean).postDataJSON().filters).toEqual([
    { field_name: 'is_active', operation: 'in', value: [false] },
  ]);
});

test('Column option lists keep multiple choices and return focus after applying', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/administration/clients');
  const trigger = page.getByRole('button', {
    name: 'Filter Type',
    exact: true,
  });
  await trigger.click();
  const filter = page.locator('.column-filter');
  await filter
    .getByRole('combobox', { name: 'Condition', exact: true })
    .click();
  await page.getByRole('option', { name: 'Is one of', exact: true }).click();
  await filter.locator('p-multiselect .p-multiselect-label').click();
  await page.getByRole('option', { name: 'WEB', exact: true }).click();
  await page.getByRole('option', { name: 'SDK', exact: true }).click();
  await filter.locator('p-multiselect [role=combobox]').press('Escape');
  await expect(filter).toBeVisible();
  const submitted = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().endsWith('/api/v1/clients/search'),
  );
  await filter.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await submitted).postDataJSON().filters).toEqual([
    { field_name: 'kind', operation: 'in', value: ['WEB', 'SDK'] },
  ]);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await filter.locator('p-multiselect .p-multiselect-label').click();
  await expect(
    page.getByRole('option', { name: 'WEB', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await filter.locator('p-multiselect [role=combobox]').press('Escape');
  await filter.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(trigger).not.toHaveClass(/filter-active/);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
});

test('Short viewports initially show usable date rows in a nested column filter', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto(appURL + '/administration/tasks/schedules');
  await page
    .getByRole('button', { name: 'Filter Created At', exact: true })
    .click();
  await page
    .locator('.column-filter')
    .getByRole('button', { name: 'Choose date', exact: true })
    .click();
  const calendar = page.locator('.calendar-sheet');
  await expect(calendar).toBeVisible();
  await expect
    .poll(() =>
      calendar.evaluate((sheet) => {
        const scroll = sheet
          .querySelector('.calendar-scroll')!
          .getBoundingClientRect();
        return [...sheet.querySelectorAll('[data-calendar-day]')].filter(
          (day) => {
            const bounds = day.getBoundingClientRect();
            return bounds.top >= scroll.top && bounds.bottom <= scroll.bottom;
          },
        ).length;
      }),
    )
    .toBeGreaterThanOrEqual(7);
  const bounds = await calendar.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(400);
  await calendar.locator('[data-calendar-day]').first().click();
  await expect(page.locator('.column-filter')).toBeVisible();
});
