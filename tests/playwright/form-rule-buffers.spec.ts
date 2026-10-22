import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`Form rules retain unfinished values and save readable typed conditions at ${width}px`, async ({
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
    const properties = page.locator('.form-properties');
    for (const [kind, label] of [
      ['Whole number', 'Amount'],
      ['Multiline text', 'Reason'],
    ]) {
      await page.getByRole('tab', { name: 'Add', exact: true }).click();
      await page
        .locator('.field-type-buttons')
        .getByRole('button', { name: kind, exact: true })
        .click();
      await properties.getByLabel('Label', { exact: true }).fill(label);
      await properties
        .getByRole('button', { name: 'Apply properties', exact: true })
        .click();
    }
    await page.getByRole('button', { name: 'Rules', exact: true }).click();
    const rules = properties.locator('app-form-rules');
    await rules
      .getByRole('combobox', { name: 'When field', exact: true })
      .click();
    await page.getByRole('option', { name: 'Amount', exact: true }).click();
    const value = rules.getByRole('textbox', { name: 'Value', exact: true });
    await value.fill('1e');
    await expect(
      rules.getByRole('button', { name: 'Add rule', exact: true }),
    ).toBeDisabled();
    await expect(
      properties.getByRole('button', { name: 'Apply properties', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    await page.getByRole('button', { name: 'Rules', exact: true }).click();
    await expect(value).toHaveValue('1e');
    await expect
      .poll(() =>
        properties.evaluate((element) =>
          element
            .getAnimations({ subtree: true })
            .some((animation) => animation.playState === 'running'),
        ),
      )
      .toBe(false);
    await value.fill('0');
    await expect(
      rules.getByRole('button', { name: 'Add rule', exact: true }),
    ).toBeEnabled();
    await expect(
      properties.getByRole('button', { name: 'Apply properties', exact: true }),
    ).toBeDisabled();
    await rules.getByRole('button', { name: 'Add rule', exact: true }).click();
    const summary = rules.locator('.rule-list');
    await expect(summary).toContainText('Amount');
    await expect(summary).toContainText('Equals');
    await expect(summary).toContainText('0');
    await expect(summary).toContainText('Reason');
    await expect(summary).not.toContainText('/properties/');
    await properties
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(summary).toContainText('No behavior rules for this field.');
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(summary).toContainText('Amount');
    const write = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/v1/form-versions/'),
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    const saved = (await write).postDataJSON();
    expect(saved.render_schema.root.children[2].rules).toEqual([
      {
        scope: '/properties/field_1',
        operator: 'eq',
        effect: 'show',
        value: 0,
      },
    ]);
    expect(saved.data_schema.properties).toEqual({
      name: { type: 'string' },
      field_1: { type: 'integer' },
      field_2: { type: 'string' },
    });
    await expect(page.locator('.editor-feedback')).toHaveText('Saved');
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeEnabled();
    if (
      width === 390 &&
      !(await page.locator('app-form-rule-overview').isVisible())
    ) {
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
    }
    await page
      .locator('app-form-rule-overview')
      .getByRole('button', { name: 'Reason Rules: 1', exact: true })
      .click();
    await expect(summary).toContainText('Amount');
    await expect(summary).toContainText('Reason');
    const heading = properties.getByRole('heading', {
      name: 'Reason',
      exact: true,
    });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport({ ratio: 1 });
    if (width === 1440) {
      for (const row of await page.locator('app-form-rule-overview li').all()) {
        expect((await row.boundingBox())!.height).toBeLessThanOrEqual(88);
      }
    }
    if (width === 1440) {
      await expect(page.locator('.preview-freshness')).toHaveText('Up to date');
    }
    await page.screenshot({
      path: test.info().outputPath('readable-rule-properties.png'),
      fullPage: true,
    });
  });
}
