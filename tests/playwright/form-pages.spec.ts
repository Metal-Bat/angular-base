import { expect, test } from './fixtures';
for (const width of [1440, 390]) {
  test(`Pages organize existing fields, preserve answers and share history at ${width}px`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
    if (width === 390) {
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
    }
    await page
      .locator('.field-type-buttons')
      .getByRole('button', { name: 'Whole number', exact: true })
      .click();
    const properties = page.locator('.form-properties');
    await properties
      .getByRole('region', { name: 'General', exact: true })
      .getByLabel('Label', { exact: true })
      .fill('Amount');
    await properties
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const pages = page.locator('app-form-pages');
    const title = pages.getByRole('textbox', {
      name: 'Page title',
      exact: true,
    });
    const apply = pages.getByRole('button', {
      name: 'Apply page',
      exact: true,
    });
    await title.fill('Details');
    await expect(apply).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeDisabled();
    await pages
      .getByRole('checkbox', { name: 'Sample name', exact: true })
      .check();
    await apply.click();
    await expect(title).toHaveValue('');
    await expect(title).toBeFocused();
    await title.fill('Review');
    await pages.getByRole('checkbox', { name: 'Amount', exact: true }).check();
    await apply.click();
    const cards = pages.locator('.page-list > li');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).getByRole('heading')).toHaveText('Details');
    await cards
      .nth(0)
      .getByRole('button', { name: 'Edit page', exact: true })
      .click();
    await expect(title).toBeFocused();
    await title.fill('Overview');
    await apply.click();
    await cards
      .nth(1)
      .getByRole('button', { name: 'Move up', exact: true })
      .click();
    await expect(cards.first().getByRole('heading')).toHaveText('Review');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(cards.first().getByRole('heading')).toHaveText('Overview');
    await cards
      .first()
      .getByRole('button', { name: 'Remove page', exact: true })
      .click();
    await expect(cards).toHaveCount(1);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(cards).toHaveCount(2);
    const writing = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/v1/form-versions/'),
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    const saved = (await writing).postDataJSON();
    expect(saved.page_settings.pages).toEqual([
      { key: 'page_1', title: 'Overview', scopes: ['/properties/name'] },
      {
        key: 'page_2',
        title: 'Review',
        scopes: [saved.render_schema.root.children[1].scope],
      },
    ]);
    expect(Object.keys(saved.data_schema.properties)).toEqual([
      'name',
      'field_1',
    ]);
    await expect(page.locator('.editor-feedback')).toHaveText('Saved');
    await page.reload();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(cards).toHaveCount(2);
    await expect(cards.first().getByRole('heading')).toHaveText('Overview');
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    const design = page.locator('app-form-canvas');
    const pagePicker = design.getByRole('combobox', {
      name: 'Page',
      exact: true,
    });
    await pagePicker.click();
    await page.getByRole('option', { name: 'Review', exact: true }).click();
    await expect(design.locator('.field-card')).toHaveCount(1);
    await expect(design.locator('.field-card strong')).toHaveText('Amount');
    await expect(page.locator('.editor-feedback')).toHaveText(
      'No unsaved changes',
    );
    await pagePicker.click();
    await page.getByRole('option', { name: 'All fields', exact: true }).click();
    await expect(design.locator('.field-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const preview = page.locator('app-form-live-preview');
    const runtime = preview.locator('app-runtime-form');
    await expect(
      runtime.getByRole('navigation', { name: 'Form pages', exact: true }),
    ).toContainText('Overview');
    await runtime
      .getByRole('textbox', { name: 'Sample name', exact: true })
      .fill('Retained across pages');
    await runtime
      .getByRole('button', { name: 'Next page', exact: true })
      .click();
    await expect(
      runtime.getByRole('textbox', { name: 'Sample name', exact: true }),
    ).toHaveCount(0);
    const amount = runtime.getByRole('textbox', {
      name: 'Amount',
      exact: true,
    });
    await amount.fill('0');
    await runtime
      .getByRole('button', { name: 'Previous page', exact: true })
      .click();
    await expect(
      runtime.getByRole('textbox', { name: 'Sample name', exact: true }),
    ).toHaveValue('Retained across pages');
    await runtime
      .getByRole('button', { name: 'Next page', exact: true })
      .click();
    await expect(amount).toHaveValue('0');
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    const tools = page.getByRole('button', { name: 'Tools', exact: true });
    if (
      (await tools.isVisible()) &&
      (await tools.getAttribute('aria-expanded')) !== 'true'
    ) {
      await tools.click();
    }
    await page.getByRole('tab', { name: 'Outline', exact: true }).click();
    await page
      .locator('.form-page-outline')
      .getByRole('button', { name: 'Overview', exact: true })
      .click();
    await expect(title).toHaveValue('Overview');
    await expect(title).toBeFocused();
    await title.fill('Unfinished page');
    await page.getByRole('button', { name: 'Languages', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Apply translation', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(title).toHaveValue('Unfinished page');
    await pages
      .getByRole('button', { name: 'Discard page edits', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeEnabled();
    await expect(title).toBeFocused();
    await expect(page.locator('.editor-feedback')).toHaveText(
      'No unsaved changes',
    );
    if (width === 390) {
      const focus = page.getByRole('button', {
        name: 'Focus mode',
        exact: true,
      });
      if ((await focus.getAttribute('aria-pressed')) === 'true') {
        await focus.click();
      }
      await page.locator('app-workspace-preferences details summary').click();
      const picker = page.locator('[data-language-picker] [role="combobox"]');
      await picker.click();
      const popup = page.locator(
        '[id="' + (await picker.getAttribute('aria-controls')) + '"]',
      );
      await popup.getByRole('option', { name: 'فارسی', exact: true }).click();
      await expect(picker).toHaveAttribute('aria-expanded', 'false');
      await expect(popup).toBeHidden();
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await page.locator('app-workspace-preferences details summary').click();
      await expect(
        pages.getByRole('textbox', { name: 'عنوان صفحه', exact: true }),
      ).toBeVisible();
    }
    await pages.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath('form-page-settings.png'),
      fullPage: false,
    });
  });
}
