import { expect, test } from './fixtures';
test.use({ sharedRecords: true });
for (const width of [1440, 390]) {
  test(`Favorites offer named links, current-state resolution and safe unavailable rows at ${width}px`, async ({
    page,
    appURL,
  }) => {
    const target = {
      available: true,
      kind: 'forms',
      route_key: 'forms',
      ref_id: 'fixture-forms-v1',
      label: 'Example forms',
      locator: 'owned-favorite-locator',
      number: null,
    };
    await page.route('**/api/v1/me/favorites/search', (route) =>
      route.fulfill({
        status: 200,
        json: {
          success: true,
          result: {
            items: [
              { ref_id: 'favorite-one', target },
              {
                ref_id: 'favorite-two',
                target: {
                  ...target,
                  available: false,
                  ref_id: null,
                  label: 'Private stale caption',
                },
              },
            ],
            page: 1,
            size: 20,
            total: 2,
            total_pages: 1,
          },
        },
      }),
    );
    let resolved = 0;
    await page.route('**/api/v1/resource-links/resolve', (route) => {
      resolved++;
      return route.fulfill({
        status: 200,
        json: { success: true, data: target },
      });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appURL + '/operations/favorites');
    const root = page.locator('app-favorites');
    const link = root.getByRole('link', { name: 'Example forms', exact: true });
    await expect(link).toHaveAttribute(
      'href',
      '/studio/forms?selected=fixture-forms-v1',
    );
    await expect(root).not.toContainText('Private stale caption');
    await expect(
      root.getByText('This resource is unavailable.', { exact: true }),
    ).toBeVisible();
    const tab = await page.context().newPage();
    try {
      await tab.goto(appURL + (await link.getAttribute('href')));
      await expect(tab.locator('app-catalog-header h1')).toHaveText(
        'Example forms',
      );
    } finally {
      await tab.close();
    }
    expect(resolved).toBe(0);
    await link.click();
    await expect(page.locator('app-catalog-header h1')).toHaveText(
      'Example forms',
    );
    expect(resolved).toBe(1);
    await page
      .getByRole('navigation', { name: 'Breadcrumb', exact: true })
      .getByRole('link', { name: 'Forms', exact: true })
      .click();
    await expect(page.locator('app-catalog-header h1')).toHaveText('Forms');
    await expect(page).not.toHaveURL(/selected=/);
    await page.goBack();
    await expect(page.locator('app-catalog-header h1')).toHaveText(
      'Example forms',
    );
  });
}

test('Persian dark phone lists keep typed filters usable without page overflow', async ({
  page,
  appURL,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/operations/tasks');
  const query = page.locator('app-task-list-query');
  await query.getByRole('button', { name: 'Filters', exact: true }).click();
  await query
    .getByRole('spinbutton', { name: 'Rows per page', exact: true })
    .fill('35');
  await page.locator('app-workspace-preferences summary').click();
  await page.locator('[data-language-picker] [role=combobox]').click();
  await page.getByRole('option', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('app-theme-picker [role=combobox]').click();
  await page.locator('[data-theme-option="blue-dark"]').click();
  await expect(page.locator('html')).toHaveClass(/app-dark/);
  await expect(query.getByRole('spinbutton')).toHaveValue('35');
  const apply = query.getByRole('button', { name: 'اعمال', exact: true });
  await apply.click();
  await expect(apply).toBeEnabled();
  await expect(page.locator('app-case-list a').first()).toBeVisible();
  await expect(page.locator('app-case-list a').first()).toContainText('کار ·');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('shared-lists-persian-dark-phone.png'),
  });
});
