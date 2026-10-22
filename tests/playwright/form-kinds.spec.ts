import { expect, test } from './fixtures';
const groups = [
  [
    ['text', 'Text'],
    ['textarea', 'Multiline text'],
    ['integer', 'Whole number'],
    ['number', 'Decimal number'],
    ['date', 'Date'],
  ],
  [
    ['datetime', 'Date and time'],
    ['boolean', 'Checkbox'],
    ['choice', 'Choice'],
    ['calculated', 'Calculated value'],
    ['display', 'Display text'],
  ],
  [
    ['user', 'User'],
    ['group', 'Work group'],
    ['media', 'Media'],
    ['attachment_collection', 'Attachments'],
    ['action', 'Action'],
  ],
  [
    ['vertical', 'Vertical layout'],
    ['horizontal', 'Horizontal layout'],
    ['grid', 'Grid layout'],
    ['repeater', 'Repeated fields'],
    ['table', 'Table'],
  ],
] as const;
for (const [index, kinds] of groups.entries()) {
  test(`Advertised form kinds have meaningful authoring and preserved bindings, group ${index + 1}`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
    const properties = page.locator('.form-properties');
    for (const [kind, label] of kinds) {
      await page
        .getByRole('button', { name: 'Select root layout', exact: true })
        .click();
      await page.getByRole('tab', { name: 'Add', exact: true }).click();
      const details = page.locator('.form-palette details');
      if (
        !(await details.evaluate(
          (element) => (element as HTMLDetailsElement).open,
        ))
      ) {
        await details.locator('summary').click();
      }
      await page
        .locator('.all-field-type-buttons')
        .getByRole('button', { name: label, exact: true })
        .click();
      const name = properties
        .getByRole('region', { name: 'General', exact: true })
        .getByLabel('Label', { exact: true });
      await expect(name).toBeFocused();
      await name.fill('Check ' + label);
      await properties
        .getByRole('button', { name: 'Appearance', exact: true })
        .click();
      await expect(
        properties.getByRole('region', { name: 'Appearance', exact: true }),
      ).toBeVisible();
      await expect(properties).not.toContainText(
        'Unsupported component. Existing settings are preserved.',
      );
      if (
        ['vertical', 'horizontal', 'grid', 'display', 'action'].includes(kind)
      ) {
        await expect(
          properties.getByRole('button', { name: 'Data binding', exact: true }),
        ).toHaveCount(0);
      }
      await properties
        .getByRole('button', { name: 'Apply properties', exact: true })
        .click();
    }
    const writing = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/v1/form-versions/'),
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    const saved = (await writing).postDataJSON();
    const nodes = saved.render_schema.root.children.slice(1);
    expect(nodes.map((node: { component: string }) => node.component)).toEqual(
      kinds.map(([kind]) => kind),
    );
    expect(nodes.map((node: { label: string }) => node.label)).toEqual(
      kinds.map(([, label]) => 'Check ' + label),
    );
    const scopes = nodes.flatMap((node: { scope?: string }) =>
      node.scope ? [node.scope] : [],
    );
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(Object.keys(saved.data_schema.properties)).toHaveLength(
      1 + scopes.length,
    );
    expect(saved.data_schema.properties.name).toEqual({ type: 'string' });
    if (kinds.some(([kind]) => kind === 'action')) {
      expect(saved.render_schema.outcomes).toContain('next');
    }
    await expect(page.locator('.editor-feedback')).toHaveText('Saved');
    await page.reload();
    const cards = page.locator('app-form-canvas .field-card');
    await expect(cards).toHaveCount(6);
    for (const [, label] of kinds) {
      await expect(
        cards.filter({
          has: page.getByText('Check ' + label, { exact: true }),
        }),
      ).toHaveCount(1);
    }
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const preview = page.locator('app-form-live-preview');
    await expect(preview.locator('.preview-freshness')).toHaveText(
      'Up to date',
    );
    await expect(preview.getByRole('alert')).toHaveCount(0);
    await expect(preview).not.toContainText(
      'This form requires unsupported controls',
    );
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  });
}
