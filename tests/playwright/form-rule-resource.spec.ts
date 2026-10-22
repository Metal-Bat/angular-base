import { expect, test } from './fixtures';
for (const width of [1440, 390]) {
  test(`Resource rule comparisons use authorized choices and readable saved names at ${width}px`, async ({
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
    await page
      .getByText('All field types and layouts', { exact: true })
      .click();
    await page
      .locator('.all-field-type-buttons')
      .getByRole('button', { name: 'User', exact: true })
      .click();
    await properties
      .getByRole('region', { name: 'General', exact: true })
      .getByLabel('Label', { exact: true })
      .fill('Reviewer');
    await properties
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    await page.getByRole('tab', { name: 'Add', exact: true }).click();
    await page
      .locator('.field-type-buttons')
      .getByRole('button', { name: 'Multiline text', exact: true })
      .click();
    await properties
      .getByRole('region', { name: 'General', exact: true })
      .getByLabel('Label', { exact: true })
      .fill('Reason');
    await properties
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    await page.getByRole('button', { name: 'Rules', exact: true }).click();
    const rules = properties.locator('app-form-rules');
    await rules
      .getByRole('combobox', { name: 'When field', exact: true })
      .click();
    await page.getByRole('option', { name: 'Reviewer', exact: true }).click();
    await rules
      .getByRole('combobox', { name: 'Operator', exact: true })
      .click();
    await page.getByRole('option', { name: 'Equals', exact: true }).click();
    const picker = rules.locator('app-form-rule-value app-form-rule-resource');
    await expect(
      rules.getByRole('button', { name: 'Add rule', exact: true }),
    ).toBeDisabled();
    await picker
      .getByRole('searchbox', { name: 'Search options', exact: true })
      .fill('Review');
    const value = picker.getByRole('combobox', { name: 'Value', exact: true });
    await expect(value).toHaveAttribute('aria-disabled', 'false');
    await value.click();
    await page
      .getByRole('option', { name: 'Review person', exact: true })
      .click();
    await expect(value).toHaveText('Review person');
    await rules.getByRole('button', { name: 'Add rule', exact: true }).click();
    await expect(rules.locator('.rule-list')).toContainText('Review person');
    await expect(rules.locator('.rule-list')).not.toContainText(
      'fixture-reviewer',
    );
    await expect(rules.locator('.rule-list')).toContainText('Reviewer');
    await expect(rules.locator('.rule-list')).toContainText('Reason');
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
    const owner = saved.render_schema.root.children[1];
    const reason = saved.render_schema.root.children[2];
    expect(reason.rules).toEqual([
      {
        scope: owner.scope,
        operator: 'eq',
        effect: 'show',
        value: 'fixture-reviewer',
      },
    ]);
    await expect(page.locator('.editor-feedback')).toHaveText('Saved');
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    const tools = page.getByRole('button', { name: 'Tools', exact: true });
    if (
      width === 390 &&
      (await tools.getAttribute('aria-expanded')) === 'true'
    ) {
      await tools.click();
    }
    await page.locator('app-form-canvas .field-card').nth(2).click();
    await page.getByRole('button', { name: 'Rules', exact: true }).click();
    await expect(rules.locator('.rule-list')).toContainText('Review person');
    await expect(rules.locator('.rule-list')).not.toContainText(
      'fixture-reviewer',
    );
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath('form-resource-rule.png'),
      fullPage: false,
    });
  });
}
