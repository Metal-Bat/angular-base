import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`Languages and Settings retain independent drafts at ${width}px`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
    const modes = page.locator('.form-modes');
    const settings = page.locator('app-form-settings');
    const save = page.getByRole('button', { name: 'Save draft', exact: true });
    await modes.getByRole('button', { name: 'Languages', exact: true }).click();
    await expect(
      settings.getByRole('heading', { name: 'Translations', exact: true }),
    ).toBeVisible();
    await settings
      .getByLabel('Message key', { exact: true })
      .fill('purchase.title');
    await settings
      .getByLabel('English', { exact: true })
      .fill('Purchase request');
    await settings.getByLabel('فارسی', { exact: true }).fill('درخواست خرید');
    await modes.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(
      settings.getByRole('heading', { name: 'Translations', exact: true }),
    ).toBeHidden();
    await settings.getByLabel('New outcome', { exact: true }).fill('review');
    await expect(
      settings.getByRole('button', { name: 'Add outcome', exact: true }),
    ).toBeDisabled();
    await modes.getByRole('button', { name: 'Languages', exact: true }).click();
    await expect(settings.getByLabel('فارسی', { exact: true })).toHaveValue(
      'درخواست خرید',
    );
    await expect(
      settings.getByRole('button', { name: 'Apply translation', exact: true }),
    ).toBeDisabled();
    await expect(save).toBeDisabled();
    await modes.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(
      settings.getByLabel('New outcome', { exact: true }),
    ).toHaveValue('review');
    await settings
      .getByRole('button', { name: 'Discard outcome edits', exact: true })
      .click();
    await modes.getByRole('button', { name: 'Languages', exact: true }).click();
    await settings
      .getByRole('button', { name: 'Apply translation', exact: true })
      .click();
    const row = settings
      .locator(width === 390 ? '.message-cards p-card' : 'p-table tbody tr')
      .filter({ hasText: 'purchase.title' });
    await expect(
      row.getByText('Current translation', { exact: true }),
    ).toHaveCount(2);
    await expect(
      row.getByText('Missing translation', { exact: true }),
    ).toHaveCount(1);
    await modes.getByRole('button', { name: 'Settings', exact: true }).click();
    await settings.getByLabel('New outcome', { exact: true }).fill('review');
    await settings
      .getByRole('button', { name: 'Add outcome', exact: true })
      .click();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(settings.getByText('review', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(settings.getByText('review', { exact: true })).toBeVisible();
    const write = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/v1/form-versions/'),
    );
    await save.click();
    const payload = (await write).postDataJSON();
    expect(payload.render_schema.outcomes).toEqual(['review']);
    expect(payload.localization.catalogs.fa['purchase.title']).toMatchObject({
      text: 'درخواست خرید',
      source_revision: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    await expect(page.locator('.editor-feedback')).toHaveText('Saved');
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(settings.getByText('review', { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath('form-settings.png'),
      fullPage: true,
    });
    await modes.getByRole('button', { name: 'Languages', exact: true }).click();
    await expect(
      row.getByText('Current translation', { exact: true }),
    ).toHaveCount(2);
    const edit = row.getByRole('button', { name: /^Edit/ });
    await expect(edit).toBeVisible();
    const editBounds = (await edit.boundingBox())!;
    expect(editBounds.width).toBeGreaterThanOrEqual(44);
    expect(editBounds.height).toBeGreaterThanOrEqual(44);
    expect(editBounds.x).toBeGreaterThanOrEqual(0);
    expect(editBounds.x + editBounds.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: test.info().outputPath('form-languages.png'),
      fullPage: true,
    });
  });
}
