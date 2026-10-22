import { saveUserTimezone } from './timezone-settings';
import { expect, test } from './fixtures';

test('Dashboard shows summary values and a chart with exact inclusive date controls', async ({
  page,
  appURL,
}, testInfo): Promise<void> => {
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00Z'));
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests: Record<string, unknown>[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/v1/analytics/query') {
      requests.push(request.postDataJSON());
    }
  });
  await saveUserTimezone(page, appURL, 'UTC');
  await page.goto(appURL + '/operations/dashboard');
  const dashboard = page.locator('app-dashboard');
  const summaries = dashboard.locator('[data-metric-summary]');
  await expect(summaries).toHaveCount(4);
  await expect(summaries.nth(0).locator('.summary-value bdi')).toHaveText('5');
  await expect(summaries.nth(3).locator('.summary-value bdi')).toHaveText('72');
  await expect(page.locator('app-metric-chart svg[role="img"]')).toBeInViewport(
    {
      ratio: 0.25,
    },
  );
  await expect(dashboard.locator('.metric-customize')).not.toHaveAttribute(
    'open',
  );
  await expect(dashboard.locator('#metric-start')).toHaveCount(0);
  await expect(
    dashboard.getByRole('combobox', { name: 'Timezone', exact: true }),
  ).toHaveCount(0);
  await dashboard
    .getByRole('combobox', { name: 'Period', exact: true })
    .click();
  await page.getByRole('option', { name: 'Last 7 days', exact: true }).click();
  const changed = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/v1/analytics/query' &&
      request.postDataJSON().metric_key === 'submitted_requests' &&
      request.postDataJSON().start_date === '2026-10-09',
  );
  await dashboard.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await changed).postDataJSON()).toEqual({
    metric_key: 'submitted_requests',
    start_date: '2026-10-09',
    end_date: '2026-10-16',
    timezone: 'UTC',
    dimension: 'none',
    granularity: 'day',
  });
  await expect(dashboard.locator('.metric-period')).toContainText(
    'Oct 15, 2026',
  );
  await expect(dashboard.locator('.metric-period')).not.toContainText(
    'Oct 16, 2026',
  );
  await dashboard
    .getByRole('combobox', { name: 'Period', exact: true })
    .click();
  await page.getByRole('option', { name: 'Custom', exact: true }).click();
  await dashboard.locator('#metric-start').fill('2026-11-03');
  await dashboard.locator('#metric-end').fill('2026-11-02');
  const beforeInvalid = requests.length;
  await dashboard.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(dashboard.locator('#metric-end-error')).toContainText(
    '1 to 366 days',
  );
  await expect(dashboard.locator('#metric-start')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(dashboard.locator('#metric-end')).toHaveAttribute(
    'aria-describedby',
    'metric-end-error',
  );
  await expect(dashboard.locator('#metric-start')).toHaveValue('2026-11-03');
  expect(requests).toHaveLength(beforeInvalid);
  await dashboard.locator('#metric-start').fill('2026-11-01');
  const custom = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/v1/analytics/query' &&
      request.postDataJSON().start_date === '2026-11-01',
  );
  await dashboard.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await custom).postDataJSON().end_date).toBe('2026-11-03');
  await expect(dashboard.locator('.metric-period')).toContainText(
    'Nov 2, 2026',
  );
  await expect(dashboard.locator('#metric-start')).toHaveAttribute(
    'aria-invalid',
    'false',
  );
  await expect(dashboard.locator('#metric-end')).toHaveAttribute(
    'aria-invalid',
    'false',
  );
  await expect(dashboard.locator('#metric-end-error')).toHaveCount(0);
  expect(new Set(requests.map((request) => request['metric_key']))).toEqual(
    new Set([
      'submitted_requests',
      'active_requests',
      'overdue_work',
      'terminal_duration',
    ]),
  );
  await expect(summaries.getByRole('status')).toHaveCount(0);
  await testInfo.attach('desktop-dashboard-overview', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await page.locator('[data-language-picker] [role="combobox"]').click();
  await page.getByRole('option', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
  await expect(summaries.nth(0).locator('.summary-value bdi')).toHaveText('5');
  await summaries.nth(0).scrollIntoViewIfNeeded();
  await testInfo.attach('phone-persian-dashboard-overview', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});
