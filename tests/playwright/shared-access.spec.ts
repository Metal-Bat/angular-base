import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`Workflow Access uses named recipients and exact confirmed rights at ${width}px`, async ({
    page,
    appURL,
  }, testInfo) => {
    const root = 'fixture-workflows-v1';
    let entries = [
      {
        ref_id: 'grant-existing',
        workflow_ref_id: root,
        user_ref_id: 'recipient-existing',
        work_group_ref_id: null,
        can_view: true,
        can_start: false,
      },
    ];
    const writes: { method: string; path: string; body: unknown }[] = [];
    await page.route('**/api/v1/workflows/*/grants/search', (route) =>
      route.fulfill({
        status: 200,
        json: {
          success: true,
          result: {
            items: entries,
            page: 1,
            size: 20,
            total: entries.length,
            total_pages: entries.length ? 1 : 0,
          },
        },
      }),
    );
    await page.route('**/api/v1/designer/selectors/users?*', (route) =>
      route.fulfill({
        status: 200,
        json: {
          success: true,
          result: {
            items: [{ key: 'recipient-new', value: 'Another reviewer' }],
            page: 1,
            size: 20,
            total: 1,
            total_pages: 1,
          },
        },
      }),
    );
    await page.route('**/api/v1/resource-links/selected', (route) =>
      route.fulfill({
        status: 200,
        json: {
          success: true,
          data: route
            .request()
            .postDataJSON()
            .resources.map((item: { kind: string; ref_id: string }) => ({
              ...item,
              available: true,
              number: null,
              label:
                item.ref_id === 'recipient-new'
                  ? 'Another reviewer'
                  : 'Named reviewer',
            })),
        },
      }),
    );
    await page.route('**/api/v1/workflows/*/grants', async (route) => {
      const request = route.request();
      const body = request.postDataJSON();
      writes.push({
        method: request.method(),
        path: new URL(request.url()).pathname,
        body,
      });
      const grant = { ...body, ref_id: 'grant-new', workflow_ref_id: root };
      entries = [...entries, grant];
      await route.fulfill({
        status: 201,
        json: { success: true, data: grant },
      });
    });
    await page.route('**/api/v1/workflows/*/grants/*', async (route) => {
      const request = route.request();
      if (request.method() !== 'DELETE') {
        await route.fallback();
        return;
      }
      const path = new URL(request.url()).pathname;
      writes.push({ method: 'DELETE', path, body: null });
      entries = entries.filter((entry) => !path.endsWith('/' + entry.ref_id));
      await route.fulfill({ status: 200, json: { success: true, data: null } });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appURL + '/studio/workflows?selected=' + root);
    const header = page.locator('app-catalog-header');
    await expect(header.getByRole('heading', { level: 1 })).toHaveText(
      'Example workflows',
    );
    const access = header.getByRole('button', { name: 'Access', exact: true });
    await access.click();
    let dialog = page.getByRole('dialog', { name: 'Access', exact: true });
    await expect(dialog.locator('tbody')).toContainText('Named reviewer');
    await expect(dialog.locator('textarea, pre, #grant-reference')).toHaveCount(
      0,
    );
    await expect(dialog).not.toContainText('recipient-existing');
    await expect(dialog).not.toContainText('grant-existing');
    await dialog.locator('#access-recipient-search').fill('Another');
    await dialog
      .getByRole('button', { name: 'Find references', exact: true })
      .click();
    await dialog
      .getByRole('combobox', { name: 'Selected resource', exact: true })
      .click();
    await page
      .getByRole('option', { name: 'Another reviewer', exact: true })
      .click();
    const add = (): ReturnType<typeof dialog.getByRole> =>
      dialog.getByRole('button', { name: 'Add grant', exact: true });
    await expect(add()).toBeEnabled();
    await expect(page.locator('.p-select-overlay')).toHaveCount(0);
    await add().focus();
    await expect(add()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toContainText(
      'Discard unsaved access changes?',
    );
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    dialog = page.getByRole('dialog', { name: 'Access', exact: true });
    await expect(add()).toBeEnabled();
    await add().click();
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    expect(writes).toEqual([]);
    await add().click();
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
    await expect(dialog.locator('tbody')).toContainText('Another reviewer');
    expect(writes).toHaveLength(1);
    expect(writes[0].body).toEqual({
      user_ref_id: 'recipient-new',
      work_group_ref_id: null,
      can_view: true,
      can_start: false,
    });
    await expect(header.getByRole('heading', { level: 1 })).toHaveText(
      'Example workflows',
    );
    const row = dialog
      .locator('tbody tr')
      .filter({ hasText: 'Another reviewer' });
    await page.screenshot({
      path: testInfo.outputPath(`named-access-${width}.png`),
    });
    await row
      .getByRole('button', { name: 'Revoke grant', exact: true })
      .click();
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    expect(writes).toHaveLength(1);
    await row
      .getByRole('button', { name: 'Revoke grant', exact: true })
      .click();
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
    await expect(row).toHaveCount(0);
    expect(writes).toHaveLength(2);
    expect(writes[1].path).toBe(
      '/api/v1/workflows/' + root + '/grants/grant-new',
    );
    await dialog
      .locator('form')
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(access).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
