import { expect, test } from './fixtures';
for (const width of [1440, 390]) {
  test(`Field actions target their own placement and support keyboard recovery at ${width}px`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
    if (width === 390) {
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
    }
    await page
      .locator('.field-type-buttons')
      .getByRole('button', { name: 'Text', exact: true })
      .click();
    const properties = page.locator('.form-properties');
    await properties
      .getByRole('region', { name: 'General', exact: true })
      .getByLabel('Label', { exact: true })
      .fill('Reason');
    await properties
      .getByRole('button', { name: 'Apply properties', exact: true })
      .click();
    if (width === 390) {
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
    }
    const actions = page.getByRole('button', {
      name: 'Field actions: Sample name',
      exact: true,
    });
    await actions.focus();
    await actions.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(actions).toBeFocused();
    await actions.press('Enter');
    await menu
      .getByRole('menuitem', { name: 'Remove placement', exact: true })
      .click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const cards = page.locator('app-form-canvas .field-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.locator('strong')).toHaveText('Reason');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(cards).toHaveCount(2);
    await actions.focus();
    await actions.press('Enter');
    await menu
      .getByRole('menuitem', { name: 'Move to layout', exact: true })
      .click();
    const destination = page.getByRole('combobox', {
      name: 'Destination layout',
      exact: true,
    });
    await expect(destination).toBeVisible();
    await expect(destination).toBeFocused();
    const writing = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/v1/form-versions/'),
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    const saved = (await writing).postDataJSON();
    expect(saved.data_schema.properties.name).toEqual({ type: 'string' });
    expect(
      saved.render_schema.root.children.map(
        (node: { label: string }) => node.label,
      ),
    ).toEqual(['Sample name', 'Reason']);
    await expect(page.locator('.editor-feedback')).toHaveText('Saved');
  });
}
