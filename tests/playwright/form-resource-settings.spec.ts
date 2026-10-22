import { expect, test } from './fixtures';
for (const width of [1440, 390]) {
  test(`Attachment and row properties retain invalid buffers and exact values at ${width}px`, async ({
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
      .getByText('All field types and layouts', { exact: true })
      .click();
    await page
      .locator('.all-field-type-buttons')
      .getByRole('button', { name: 'Attachments', exact: true })
      .click();
    const properties = page.locator('.form-properties');
    const general = properties.getByRole('region', {
      name: 'General',
      exact: true,
    });
    await general.getByLabel('Label', { exact: true }).fill('Receipts');
    await properties
      .getByRole('button', { name: 'Appearance', exact: true })
      .click();
    const appearance = properties.getByRole('region', {
      name: 'Appearance',
      exact: true,
    });
    const maximum = appearance.getByRole('textbox', {
      name: 'Maximum items',
      exact: true,
    });
    await maximum.fill('-');
    await expect(maximum).toHaveAttribute('aria-invalid', 'true');
    await expect(
      properties.getByRole('button', { name: 'Apply properties', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeDisabled();
    const removal = appearance.getByRole('combobox', {
      name: 'Allow removal',
      exact: true,
    });
    await removal.click();
    await page.getByRole('option', { name: 'No', exact: true }).click();
    await expect(maximum).toHaveValue('-');
    await expect(removal).toHaveText('No');
    await properties
      .getByRole('button', { name: 'General', exact: true })
      .click();
    await expect(general.getByLabel('Label', { exact: true })).toHaveValue(
      'Receipts',
    );
    await properties
      .getByRole('button', { name: 'Appearance', exact: true })
      .click();
    await expect(maximum).toHaveValue('-');
    await maximum.fill('0');
    await appearance
      .getByRole('textbox', { name: 'Minimum items', exact: true })
      .fill('0');
    await appearance
      .getByRole('textbox', { name: 'Maximum bytes per file', exact: true })
      .fill('1048576');
    const mime = appearance.getByRole('textbox', {
      name: 'Accepted MIME types',
      exact: true,
    });
    await mime.fill('image/*');
    await expect(
      properties.getByRole('button', { name: 'Apply properties', exact: true }),
    ).toBeDisabled();
    await mime.fill('image/webp\napplication/pdf');
    await properties
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    const writing = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/v1/form-versions/'),
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    const saved = (await writing).postDataJSON();
    const attachment = saved.render_schema.root.children[1];
    expect(attachment.label).toBe('Receipts');
    expect(attachment.options).toMatchObject({
      max_items: 0,
      min_items: 0,
      max_item_bytes: 1048576,
      allow_remove: false,
      allowed_mime_types: ['image/webp', 'application/pdf'],
    });
    await expect(page.locator('.editor-feedback')).toHaveText('Saved');
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await page.locator('app-form-canvas .field-card').nth(1).click();
    await properties
      .getByRole('button', { name: 'Appearance', exact: true })
      .click();
    await expect(maximum).toHaveValue('0');
    await expect(removal).toHaveText('No');
    await expect(mime).toHaveValue('image/webp\napplication/pdf');
    await page.getByRole('tab', { name: 'Add', exact: true }).click();
    const allTypes = page.locator('.form-palette details');
    if (
      !(await allTypes.evaluate(
        (element) => (element as HTMLDetailsElement).open,
      ))
    ) {
      await allTypes.locator('summary').click();
    }
    await page
      .locator('.all-field-type-buttons')
      .getByRole('button', { name: 'Repeated fields', exact: true })
      .click();
    await properties
      .getByRole('button', { name: 'Validation constraints', exact: true })
      .click();
    const validation = properties.getByRole('region', {
      name: 'Validation constraints',
      exact: true,
    });
    await validation
      .getByRole('textbox', { name: 'Maximum rows', exact: true })
      .fill('2');
    await validation
      .getByRole('textbox', { name: 'Minimum rows', exact: true })
      .fill('3');
    await expect(
      properties.getByRole('button', { name: 'Apply properties', exact: true }),
    ).toBeDisabled();
    await expect(validation.getByRole('alert')).toHaveText(
      'Minimum count must not exceed maximum count.',
    );
    await validation
      .getByRole('textbox', { name: 'Maximum rows', exact: true })
      .fill('4');
    await properties
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    if (
      (await properties
        .getByRole('button', { name: 'Validation constraints', exact: true })
        .getAttribute('aria-expanded')) === 'false'
    ) {
      await properties
        .getByRole('button', { name: 'Validation constraints', exact: true })
        .click();
    }
    await expect(
      validation.getByRole('textbox', { name: 'Minimum rows', exact: true }),
    ).toHaveValue('');
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    if (
      (await properties
        .getByRole('button', { name: 'Validation constraints', exact: true })
        .getAttribute('aria-expanded')) === 'false'
    ) {
      await properties
        .getByRole('button', { name: 'Validation constraints', exact: true })
        .click();
    }
    await expect(
      validation.getByRole('textbox', { name: 'Minimum rows', exact: true }),
    ).toHaveValue('3');
    await expect(
      validation.getByRole('textbox', { name: 'Maximum rows', exact: true }),
    ).toHaveValue('4');
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath('form-row-limits.png'),
      fullPage: false,
    });
  });
}
