import { expect, test } from './fixtures';

test.use({ sharedRecords: true });

for (const kind of ['request', 'task'] as const) {
  test(`Automatic ${kind} refresh waits for the filter editing session to close`, async ({
    page,
    appURL,
  }) => {
    await page.clock.install();
    const path =
      kind === 'request' ? '/business-requests/search' : '/work-items/search';
    const reads: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith(path)) {
        reads.push(request.url());
      }
    });
    await page.goto(
      appURL + '/operations/' + (kind === 'request' ? 'requests' : 'tasks'),
    );
    await expect(page.locator('app-case-list a').first()).toBeVisible();
    const query = page.locator(
      kind === 'request' ? 'app-list-query' : 'app-task-list-query',
    );
    const toggle = query.getByRole('button', {
      name: kind === 'request' ? 'Advanced filters' : 'Filters',
      exact: true,
    });
    await toggle.click();
    if (kind === 'request') {
      await query
        .getByRole('button', { name: 'Add filter', exact: true })
        .click();
    }
    const control =
      kind === 'request'
        ? query.locator('[data-query-field="0"] [role="combobox"]')
        : query.getByRole('combobox', { name: 'Status', exact: true });
    await control.click();
    const option = page.getByRole('option', {
      name: kind === 'request' ? 'Priority' : 'CLAIMED',
      exact: true,
    });
    await expect(option).toBeVisible();
    const before = reads.length;
    await page.clock.fastForward(20_000);
    await expect(control).toBeEnabled();
    await expect(option).toBeVisible();
    expect(reads).toHaveLength(before);
    await option.click();
    if (kind === 'request') {
      await query.locator('input[data-query-value="0"]').fill('0');
    }
    await toggle.click();
    const resumed = page.waitForResponse(
      (response) =>
        response.url().endsWith(path) && response.request().method() === 'POST',
    );
    await page.clock.fastForward(20_000);
    expect((await resumed).status()).toBe(200);
    expect(reads.length).toBeGreaterThan(before);
    await toggle.click();
    if (kind === 'request') {
      await expect(query.locator('input[data-query-value="0"]')).toHaveValue(
        '0',
      );
    } else {
      await expect(control).toHaveText('CLAIMED');
    }
  });
}
