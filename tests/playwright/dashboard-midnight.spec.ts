import { saveUserTimezone } from './timezone-settings';
import { expect, test } from './fixtures';

test('Skipped midnight retains the confirmed dashboard period without an invalid query', async ({
  page,
  appURL,
}) => {
  let requests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/v1/analytics/query') {
      requests++;
    }
  });
  await saveUserTimezone(page, appURL, 'Pacific/Apia');
  await page.goto(appURL + '/operations/dashboard');
  const dashboard = page.locator('app-dashboard');
  const card = dashboard.locator('app-metric-card');
  await card.locator('details.metric-data summary').click();
  await expect(card.locator('table')).toBeVisible();
  await expect(
    dashboard.locator('[data-metric-summary] [role="status"]'),
  ).toHaveCount(0);
  const total = await card.locator('.metric-total').textContent();
  const period = await card.locator('.metric-period').textContent();
  await dashboard
    .getByRole('combobox', { name: 'Period', exact: true })
    .click();
  await page.getByRole('option', { name: 'Custom', exact: true }).click();
  await dashboard.locator('#metric-start').fill('2011-12-30');
  await dashboard.locator('#metric-end').fill('2011-12-30');
  await expect(
    dashboard.getByRole('combobox', { name: 'Timezone', exact: true }),
  ).toHaveCount(0);
  const before = requests;
  await dashboard.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(dashboard.locator('#metric-end-error')).toContainText(
    'midnight that does not exist',
  );
  await expect(dashboard.locator('#metric-start')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(dashboard.locator('#metric-start')).toHaveValue('2011-12-30');
  await expect(dashboard.locator('#metric-end')).toHaveValue('2011-12-30');
  await expect(card.locator('table')).toBeVisible();
  await expect(card.locator('.metric-total')).toHaveText(total!);
  await expect(card.locator('.metric-period')).toHaveText(period!);
  await expect(card).toContainText('Results may be out of date.');
  await expect(
    card.getByRole('button', { name: 'Open matching records', exact: true }),
  ).toHaveCount(0);
  expect(requests).toBe(before);
});
