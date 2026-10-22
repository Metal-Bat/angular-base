import { expect, test } from './fixtures';

test('Action properties choose a declared outcome without adding a canonical field or executing it', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  const sideEffects: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) &&
      path.startsWith('/api/v1/') &&
      !path.endsWith('/search') &&
      !path.startsWith('/api/v1/form-versions/') &&
      !['/api/v1/forms/runtime-preview', '/api/v1/forms/options'].includes(path)
    ) {
      sideEffects.push(path);
    }
  });
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByText('All field types and layouts', { exact: true }).click();
  await page
    .locator('.all-field-type-buttons')
    .getByRole('button', { name: 'Action', exact: true })
    .click();
  const properties = page.locator('.form-properties');
  await properties.getByLabel('Label', { exact: true }).fill('Continue');
  const outcome = properties.getByRole('combobox', {
    name: 'Outcome',
    exact: true,
  });
  await expect(outcome).toHaveText('Next');
  await outcome.click();
  await page.getByRole('option', { name: 'Next', exact: true }).click();
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/form-versions/'),
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const saved = (await write).postDataJSON();
  expect(saved.render_schema.outcomes).toEqual(['next']);
  expect(saved.render_schema.root.children[1]).toMatchObject({
    component: 'action',
    label: 'Continue',
    outcome: 'next',
  });
  expect(saved.data_schema.properties).toEqual({ name: { type: 'string' } });
  await expect(page.locator('.editor-feedback')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await page.locator('app-form-canvas .field-card').nth(1).click();
  await expect(
    properties.getByRole('combobox', { name: 'Outcome', exact: true }),
  ).toHaveText('Next');
  expect(sideEffects).toEqual([]);
});

test('General edits the visible accessibility caption and preserves canonical answers through reopen', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const card = page.locator('app-form-canvas .field-card').first();
  const properties = page.locator('.form-properties');
  const preview = page.locator('.form-live-preview');
  await preview
    .getByRole('textbox', { name: 'Sample name', exact: true })
    .fill('Retained answer');
  await card.click();
  await properties
    .getByRole('button', { name: 'Appearance', exact: true })
    .click();
  await properties
    .locator('#field-accessibility-label')
    .fill('Visible caption');
  await properties
    .locator('#field-accessibility-description')
    .fill('Helpful description');
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  await expect(card.locator('strong')).toHaveText('Visible caption');
  await expect(
    preview.getByRole('textbox', { name: 'Visible caption', exact: true }),
  ).toHaveValue('Retained answer');
  await properties
    .getByRole('button', { name: 'General', exact: true })
    .click();
  const label = properties.getByLabel('Label', { exact: true });
  await expect(label).toHaveValue('Visible caption');
  await expect
    .poll(() =>
      properties.evaluate((element) =>
        element
          .getAnimations({ subtree: true })
          .some((animation) => animation.playState === 'running'),
      ),
    )
    .toBe(false);
  await label.fill('Edited visible caption');
  await expect(page.locator('.editor-feedback')).toHaveText(
    'Apply pending edits',
  );
  await expect(
    properties.getByRole('button', { name: 'Apply properties', exact: true }),
  ).toBeEnabled();
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  await expect(card.locator('strong')).toHaveText('Edited visible caption');
  await expect(
    preview.getByRole('textbox', {
      name: 'Edited visible caption',
      exact: true,
    }),
  ).toHaveValue('Retained answer');
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/form-versions/'),
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const saved = (await write).postDataJSON();
  expect(saved.render_schema.root.children[0]).toMatchObject({
    node_key: 'sample_name',
    scope: '/properties/name',
    label: 'Sample name',
    accessibility: {
      label: 'Edited visible caption',
      description: 'Helpful description',
    },
  });
  expect(saved.data_schema.properties).toEqual({ name: { type: 'string' } });
  expect(saved.data).toBeUndefined();
  await expect(page.locator('.editor-feedback')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(card.locator('strong')).toHaveText('Edited visible caption');
  await card.click();
  await expect(properties.getByLabel('Label', { exact: true })).toHaveValue(
    'Edited visible caption',
  );
  await expect(preview.getByRole('status')).toHaveText('Up to date');
  await expect(
    preview.getByRole('textbox', {
      name: 'Edited visible caption',
      exact: true,
    }),
  ).toBeVisible();
  await expect(card).toContainText('Helpful description');
  await page.screenshot({
    path: test.info().outputPath('form-label-ownership.png'),
    fullPage: true,
  });
});
