import { expect, test } from './fixtures';

test('Pointer form placement preserves canonical fields, answers and undo', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('tab', { name: 'Add', exact: true }).click();
  await page
    .locator('.form-palette .field-type-buttons')
    .getByRole('button', { name: 'Text', exact: true })
    .click();
  const cards = page.locator('app-form-canvas .field-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.first().locator('strong')).toHaveText('Sample name');
  const preview = page.locator('.form-live-preview');
  await preview
    .getByRole('textbox', { name: 'Sample name', exact: true })
    .fill('Retained client answer');
  const beforeWrite = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/form-versions/'),
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const before = (await beforeWrite).postDataJSON();
  await expect(page.locator('app-form-builder .editor-feedback')).toContainText(
    'Saved',
  );
  const source = await cards.nth(1).boundingBox();
  await page.mouse.move(source!.x + 30, source!.y + 30);
  await page.mouse.down();
  await page.mouse.move(source!.x + 45, source!.y + 35, { steps: 5 });
  await expect(page.locator('app-form-canvas .canvas-sheet')).toHaveClass(
    /dragging/,
  );
  const target = await page
    .locator('app-form-canvas .placement-group')
    .first()
    .locator(':scope > .placement-drop')
    .first()
    .boundingBox();
  await page.mouse.move(target!.x + 20, target!.y + target!.height / 2, {
    steps: 16,
  });
  await page.mouse.move(target!.x + 22, target!.y + target!.height / 2);
  await page.mouse.up();
  await expect(cards.first().locator('strong')).toHaveText('Text');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(cards.first().locator('strong')).toHaveText('Sample name');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(cards.first().locator('strong')).toHaveText('Text');
  await expect(
    preview.getByRole('textbox', { name: 'Sample name', exact: true }),
  ).toHaveValue('Retained client answer');
  const afterWrite = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/form-versions/'),
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const after = (await afterWrite).postDataJSON();
  expect(after.data_schema).toEqual(before.data_schema);
  expect(after.render_schema.root.children).toEqual(
    [...before.render_schema.root.children].reverse(),
  );
  await expect(page.locator('app-form-builder .editor-feedback')).toContainText(
    'Saved',
  );
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(cards.first().locator('strong')).toHaveText('Text');
});
