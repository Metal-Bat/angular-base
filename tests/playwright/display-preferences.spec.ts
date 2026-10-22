import { expect, test } from './fixtures';

test('Saved timezone governs the first calendar render after a full navigation', async ({
  page,
  appURL,
}) => {
  await page.goto(appURL + '/account/profile');
  const settings = page.locator('app-workspace-settings');
  const timezone = settings.getByRole('combobox', {
    name: 'Timezone',
    exact: true,
  });
  await expect(timezone).toContainText('Asia / Tehran');
  let updates = 0;
  page.on('request', (request) => {
    if (
      new URL(request.url()).pathname === '/api/v1/me/preferences' &&
      request.method() === 'PATCH'
    ) {
      updates++;
    }
  });
  await timezone.click();
  const search = page.getByRole('searchbox', {
    name: 'Search timezone',
    exact: true,
  });
  await search.fill('Invalid/Timezone');
  await expect(
    page.getByText('No matching timezones.', { exact: true }),
  ).toBeVisible();
  await search.press('Escape');
  await expect(search).toHaveCount(0);
  await expect(timezone).toContainText('Asia / Tehran');
  expect(updates).toBe(0);
  await timezone.click();
  await expect(search).toHaveValue('Invalid/Timezone');
  await search.fill('Tokyo');
  await page.getByRole('option', { name: 'Asia / Tokyo', exact: true }).click();
  await settings
    .getByRole('button', { name: 'Save timezone', exact: true })
    .click();
  await expect(page.locator('[data-preference-status]')).toHaveAttribute(
    'data-preference-status',
    'saved',
  );
  await page.goto(appURL + '/operations/calendar');
  await expect(page.locator('app-calendar-views')).toContainText('Asia/Tokyo');
  await page.getByRole('button', { name: 'Create event', exact: true }).click();
  await expect(page.locator('app-calendar-editor')).toContainText('Asia/Tokyo');
  await expect(page.locator('app-timezone-control')).toHaveCount(0);
  await page.goto(appURL + '/operations/dashboard');
  await expect(page.locator('app-dashboard')).toContainText('Asia/Tokyo');
  await expect(page.locator('app-timezone-control')).toHaveCount(0);
  await expect(page.locator('#metric-zone-settings')).toHaveAttribute(
    'href',
    '/account/profile',
  );
});

test('Saved display digits remain independent of language and apply to dashboard values', async ({
  page,
  appURL,
}) => {
  await page.goto(appURL + '/account/profile');
  const digits = page.getByRole('combobox', {
    name: 'Display digits',
    exact: true,
  });
  await digits.click();
  await page.getByRole('option', { name: '۰۱۲۳۴۵۶۷۸۹', exact: true }).click();
  await expect(page.locator('[data-preference-status]')).toHaveAttribute(
    'data-preference-status',
    'saved',
  );
  await page.goto(appURL + '/operations/dashboard');
  const value = page
    .locator('[data-metric-summary]')
    .first()
    .locator('.summary-value bdi');
  await expect(value).toHaveText('۵');
  const card = page.locator('app-metric-card');
  await expect(card.locator('.metric-total bdi')).toHaveText('۵');
  await expect(
    page.locator('[data-metric-summary]').first().locator('time').last(),
  ).toContainText(/[۰-۹]/);
  await expect(card.locator('.metric-period time').first()).toContainText(
    /[۰-۹]/,
  );
  await card.locator('.metric-data summary').click();
  const table = card.getByRole('region', { name: 'Data table', exact: true });
  await expect(table).toHaveAttribute('tabindex', '0');
  await expect(
    table.locator('tbody tr').first().locator('td').nth(2),
  ).toContainText(/[۰-۹]/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      table.evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(true);
  await table.focus();
  await expect(table).toBeFocused();
  await table.press('ArrowRight');
  await expect
    .poll(() => table.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  const chart = card.getByRole('region', {
    name: 'Submitted requests',
    exact: true,
  });
  await chart.focus();
  await expect(chart).toBeFocused();
  await chart.press('ArrowRight');
  await expect
    .poll(() => chart.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('[data-language-picker] [role="combobox"]').click();
  await page.getByRole('option', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(value).toHaveText('۵');
  await page.locator('[data-language-picker] [role="combobox"]').click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(value).toHaveText('۵');
  await page.goto(appURL + '/account/profile');
  await expect(digits).toContainText('۰۱۲۳۴۵۶۷۸۹');
  await digits.click();
  await page.getByRole('option', { name: '0123456789', exact: true }).click();
  await expect(page.locator('[data-preference-status]')).toHaveAttribute(
    'data-preference-status',
    'saved',
  );
  await page.goto(appURL + '/operations/dashboard');
  await expect(value).toHaveText('5');
});
