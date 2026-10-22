import { expect, test } from './fixtures';

test.use({ typedChoice: true });
for (const width of [1440, 390]) {
  test(`Selected-field previews and issue repair preserve drafts at ${width}px`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
    await page.locator('app-form-canvas .field-card').nth(1).click();
    await page
      .getByRole('button', { name: 'Diagnostics', exact: true })
      .click();
    const diagnostics = page.locator('app-form-diagnostics');
    const inspection = diagnostics.locator('app-form-interaction-preview');
    await expect(inspection).toContainText('Selected component: Decision');
    await expect(page.locator('#interaction-json')).toHaveCount(0);
    const optionRequests: unknown[] = [];
    const sideEffects: string[] = [];
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (request.method() === 'POST' && path === '/api/v1/forms/options') {
        const body = request.postDataJSON();
        if (body.query?.generation === 0) {
          optionRequests.push(body);
        }
      }
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) &&
        (path.startsWith('/api/v1/media/') ||
          path.startsWith('/api/v1/requests') ||
          path.includes('/publish'))
      ) {
        sideEffects.push(path);
      }
    });
    await inspection
      .getByRole('textbox', { name: 'Page', exact: true })
      .fill('-');
    await inspection
      .getByRole('button', { name: 'Preview options', exact: true })
      .click();
    await expect(inspection.getByRole('alert')).toHaveText(
      'Enter a valid page and row position before previewing options.',
    );
    expect(optionRequests).toEqual([]);
    await inspection
      .getByRole('textbox', { name: 'Page', exact: true })
      .fill('1');
    await inspection
      .getByRole('textbox', { name: 'Search options', exact: true })
      .fill('Option');
    await inspection
      .getByRole('button', { name: 'Preview options', exact: true })
      .click();
    await expect(inspection.getByRole('status')).toHaveText(
      'Available options',
    );
    await expect(inspection.locator('li')).toHaveText(['Option 1']);
    expect(optionRequests).toHaveLength(1);
    expect(optionRequests[0]).toMatchObject({
      query: {
        node_pointer: '/root/children/1',
        page: 1,
        size: 20,
        search: 'Option',
        row_indices: [],
        selected_keys: [],
        generation: 0,
      },
    });
    expect(sideEffects).toEqual([]);
    await page.route('**/api/v1/forms/validate', (route) =>
      route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            valid: false,
            issues: [
              {
                pointer: '/render_schema/root/children/1/options',
                code: 'render.option',
              },
            ],
            warnings: [
              {
                pointer: '/localization/catalogs/fa/title',
                code: 'translation.missing',
              },
            ],
          },
        },
      }),
    );
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    await page.getByRole('button', { name: 'Validate', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Diagnostics', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    const tray = diagnostics.getByRole('region', {
      name: 'Validation diagnostics',
      exact: true,
    });
    await expect(
      tray.getByRole('status').filter({ hasText: /Errors:/ }),
    ).toHaveText('Errors: 1 · Warnings: 1');
    await expect(tray.locator('li').first()).toContainText(
      'Review this field’s presentation options.',
    );
    await expect(tray.locator('li')).toHaveCount(2);
    await expect(tray.locator('li').first()).not.toContainText(
      '/render_schema',
    );
    await expect(tray.locator('li').first()).not.toContainText('render.option');
    await expect(tray.locator('.validation-result')).toHaveText(
      'Validation needs changes',
    );
    await expect(tray.locator('pre, textarea')).toHaveCount(0);
    const goToField = tray.getByRole('button', {
      name: 'Go to field · Decision',
      exact: true,
    });
    const bounds = (await goToField.boundingBox())!;
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await tray.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: test.info().outputPath('form-issues.png'),
      fullPage: false,
    });
    await goToField.click();
    await expect(
      page.getByRole('button', { name: 'Design', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    const label = page
      .locator('.form-properties')
      .getByRole('region', { name: 'General', exact: true })
      .getByLabel('Label', { exact: true });
    await expect(label).toHaveValue('Decision');
    await expect(label).toBeFocused();
    await label.fill('Unfinished decision');
    await page
      .getByRole('button', { name: 'Diagnostics', exact: true })
      .click();
    await goToField.click();
    await expect(
      page.getByRole('button', { name: 'Diagnostics', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    await expect(label).toHaveValue('Unfinished decision');
    await expect(
      page.getByRole('button', { name: 'Validate', exact: true }),
    ).toBeDisabled();
    await page
      .locator('.form-properties')
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Diagnostics', exact: true })
      .click();
    await tray
      .getByRole('button', {
        name: 'Go to settings · Translations',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('button', { name: 'Languages', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#form-translations-title')).toBeFocused();
    expect(sideEffects).toEqual([]);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  });
}
