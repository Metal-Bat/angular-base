import { expect, test } from './fixtures';
test.use({ sharedRecords: true });

for (const width of [1440, 390]) {
  test(`Shared catalog rows lead with names and details retain public sections at ${width}px`, async ({
    page,
    appURL,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appURL + '/administration/groups');
    const table = page.locator('app-record-table');
    await expect(table.getByRole('columnheader').first()).toContainText('Name');
    expect(
      await page
        .locator('app-resource-actions')
        .evaluateAll((actions) =>
          actions.every((action) => !!action.closest('app-record-page-header')),
        ),
    ).toBe(true);
    await table.getByRole('link', { name: 'Reviewers', exact: true }).click();
    const detail = page.locator('app-record-detail');
    for (const title of ['Identity', 'Account', 'Activity']) {
      await expect(
        detail.getByRole('heading', { name: title, exact: true }),
      ).toBeVisible();
    }
    await expect(detail).toContainText('Review requests');
    await expect(detail.locator('dt').first()).toHaveText('Name');
    await expect(detail).toContainText('No');
    await expect(detail).not.toContainText('group-current');
    await page.screenshot({
      path: testInfo.outputPath(`group-detail-${width}.png`),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(appURL + '/administration/integrations');
    await page
      .locator('app-record-table')
      .getByRole('link', { name: 'Notification service', exact: true })
      .click();
    await expect(page.locator('app-record-detail')).toContainText('hosted');
    await expect(page.locator('app-record-detail')).not.toContainText(
      'Empty object',
    );
    await expect(page.locator('app-record-detail textarea')).toHaveCount(0);
  });

  test(`Request refresh retains confirmed results and unfinished typed filters at ${width}px`, async ({
    page,
    appURL,
  }, testInfo) => {
    let fail = false;
    await page.route('**/api/v1/business-requests/search', async (route) => {
      if (fail) {
        await route.fulfill({
          status: 200,
          json: { success: false, code: 1000 },
        });
      } else {
        await route.continue();
      }
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appURL + '/operations/requests');
    const root = page.locator('app-request-list');
    const link = root.locator('app-case-list a').first();
    await expect(link).toContainText('Request');
    await expect(link).not.toHaveText('Open request');
    await expect(root.locator('app-case-list')).not.toContainText(
      '2026-10-15T',
    );
    await expect(root.locator('app-case-list tbody')).toContainText('0');
    const query = root.locator('app-list-query');
    await query
      .getByRole('button', { name: 'Advanced filters', exact: true })
      .click();
    await query
      .getByRole('button', { name: 'Add filter', exact: true })
      .click();
    await query.locator('[data-query-field="0"] [role="combobox"]').click();
    await page.getByRole('option', { name: 'Priority', exact: true }).click();
    const value = query.locator('input[data-query-value="0"]');
    await value.fill('0');
    await root.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(value).toHaveValue('0');
    const sent = page.waitForRequest(
      (request) =>
        request.url().endsWith('/business-requests/search') &&
        request.postDataJSON().filters?.length === 1,
    );
    await query.getByRole('button', { name: 'Apply', exact: true }).click();
    expect((await sent).postDataJSON()).toMatchObject({
      page: 1,
      scope: 'mine',
      filters: [{ field_name: 'priority', operation: 'equal', value: 0 }],
    });
    await expect(link).toBeVisible();
    fail = true;
    await root.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(
      root.getByText('Showing the last confirmed results.', { exact: true }),
    ).toBeVisible();
    await expect(link).toBeVisible();
    await expect(value).toHaveValue('0');
    await page.screenshot({
      path: testInfo.outputPath(`confirmed-list-${width}.png`),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`Task filters send only the supported cartable fields at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appURL + '/operations/tasks');
    const inbox = page.locator('app-task-inbox');
    await expect(inbox.locator('app-case-list a').first()).toContainText(
      'Task',
    );
    await expect(
      inbox.getByRole('button', { name: 'Refresh', exact: true }),
    ).toBeEnabled();
    const query = inbox.locator('app-task-list-query');
    const filters = query.getByRole('button', { name: 'Filters', exact: true });
    await filters.click();
    await expect(filters).toHaveAttribute('aria-expanded', 'true');
    await query.getByRole('combobox', { name: 'Status', exact: true }).click();
    await page.getByRole('option', { name: 'CLAIMED', exact: true }).click();
    await query
      .getByRole('combobox', { name: 'Date field', exact: true })
      .click();
    await page.getByRole('option', { name: 'Closed At', exact: true }).click();
    await query
      .getByRole('spinbutton', { name: 'Rows per page', exact: true })
      .fill('50');
    const sent = page.waitForRequest(
      (request) =>
        request.url().endsWith('/work-items/search') &&
        request.postDataJSON().size === 50,
    );
    await query.getByRole('button', { name: 'Apply', exact: true }).click();
    expect((await sent).postDataJSON()).toEqual({
      page: 1,
      size: 50,
      cartable: 'available',
      status: 'CLAIMED',
      time_field: 'closed_at',
      after: null,
      before: null,
      overdue_before: null,
    });
    await expect(page.locator('app-case-list a').first()).not.toHaveText(
      'Open task',
    );
    await expect(query.locator('textarea')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`An unusable save reply keeps the draft and requires deliberate revision recovery at ${width}px`, async ({
    page,
    appURL,
  }, testInfo) => {
    const writes: { body: unknown; path: string }[] = [];
    let loseReply = true;
    await page.route('**/api/v1/admin/users/*', async (route) => {
      const request = route.request();
      if (request.method() !== 'PUT') {
        await route.continue();
        return;
      }
      writes.push({
        body: request.postDataJSON(),
        path: new URL(request.url()).pathname,
      });
      if (loseReply) {
        loseReply = false;
        await route.fetch();
        await route.fulfill({ status: 200, json: {} });
      } else {
        await route.continue();
      }
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appURL + '/users');
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click();
    await page
      .getByRole('button', { name: 'Update User', exact: true })
      .click();
    const editor = page.locator('app-record-editor');
    await editor.locator('#record-first_name').fill('My retained edit');
    await editor.getByRole('button', { name: 'Save', exact: true }).click();
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
    const recovery = editor.locator('app-record-recovery');
    await expect(
      recovery.getByRole('heading', {
        name: 'Review the current record',
        exact: true,
      }),
    ).toBeVisible();
    await expect(editor.locator('#record-first_name')).toHaveValue(
      'My retained edit',
    );
    await expect(
      editor.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    expect(writes).toHaveLength(1);
    await recovery
      .getByRole('button', { name: 'Inspect current record', exact: true })
      .click();
    const use = recovery.getByRole('button', {
      name: 'Use current revision and keep my edits',
      exact: true,
    });
    await expect(use).toBeEnabled();
    expect(writes).toHaveLength(1);
    await page.screenshot({
      path: testInfo.outputPath(`recovery-${width}.png`),
    });
    await use.click();
    await expect(
      editor.getByRole('button', { name: 'Save', exact: true }),
    ).toBeFocused();
    await expect(editor.locator('#record-first_name')).toHaveValue(
      'My retained edit',
    );
    expect(writes).toHaveLength(1);
    await editor.getByRole('button', { name: 'Save', exact: true }).click();
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    expect(writes).toHaveLength(1);
    const navigation = page.locator('#area-navigation');
    if (!(await navigation.isVisible())) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
    }
    await page
      .locator('#area-navigation')
      .getByRole('link', { name: 'My requests', exact: true })
      .click();
    await expect(page.locator('dialog[open]')).toContainText(
      'Discard unsaved changes?',
    );
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    await expect(editor.locator('#record-first_name')).toHaveValue(
      'My retained edit',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
