import { expect, test } from './fixtures';

test('canvas group selection, ordinary click, targeted duplication and undo', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const canvas = page.locator('app-workflow-canvas');
  const prepare = canvas.locator('.board-node[data-node-key="prepare"]');
  const review = canvas.locator('.board-node[data-node-key="review"]');
  await prepare.locator('.node-handle').click();
  await review.locator('.node-handle').click({ modifiers: ['Shift'] });
  await expect(canvas.locator('.board-node.selected')).toHaveCount(2);
  await review.locator('.node-handle').click();
  await expect(canvas.locator('.board-node.selected')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Properties', exact: true }).click();
  await page.getByText('Selection and connections', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Duplicate selection', exact: true })
    .click();
  await expect(canvas.locator('.board-node')).toHaveCount(3);
  await expect(
    canvas.locator('.board-node[data-node-key="review_copy_1"]'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(canvas.locator('.board-node')).toHaveCount(2);
  await review.locator('.node-handle').click({ button: 'right' });
  await expect(
    page.getByRole('menuitem', { name: 'Inspect step' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
});

test('unsaved label refreshes the adjacent client preview and survives save/reopen', async ({
  page,
  appURL,
}): Promise<void> => {
  const route = appURL + '/studio/form-versions/fixture-form-versions-v1/edit';
  await page.goto(route);
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const dock = page.getByRole('region', {
    name: 'Simulated runtime preview',
    exact: true,
  });
  await expect(dock.getByText('Up to date', { exact: true })).toBeVisible();
  const sample = dock.getByLabel('Sample name', { exact: true });
  await sample.pressSequentially('Synthetic answer');
  await expect(sample).toHaveValue('Synthetic answer');
  await page.locator('app-form-canvas .field-card').first().click();
  await page.getByLabel('Label', { exact: true }).fill('Current unsaved label');
  await page
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  if (!(await dock.isVisible())) {
    await page.getByRole('button', { name: 'Tools', exact: true }).click();
  }
  await expect(dock).toBeVisible();
  await expect(
    dock.getByLabel('Current unsaved label', { exact: true }),
  ).toHaveValue('Synthetic answer');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-feedback')).toBeVisible();
  await expect(page.locator('.editor-feedback')).toHaveText('Saved');
  await page.reload();
  await expect(
    page.locator('app-form-canvas .field-card').first(),
  ).toContainText('Current unsaved label');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    dock.getByLabel('Current unsaved label', { exact: true }),
  ).toBeVisible();
});

test('direct connections require an outcome and retain it on save/reopen', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const canvas = page.locator('app-workflow-canvas');
  const prepare = canvas.locator('.board-node[data-node-key="prepare"]');
  const review = canvas.locator('.board-node[data-node-key="review"]');
  await page.getByRole('tab', { name: 'Properties', exact: true }).click();
  await page.getByText('Selection and connections', { exact: true }).click();
  await page.getByLabel('Connection', { exact: true }).click();
  await page.getByRole('option', { name: /^control ·/ }).click();
  await page
    .getByRole('button', { name: 'Remove connection', exact: true })
    .click();
  await expect(canvas.locator('f-connection:not(.data-edge)')).toHaveCount(0);
  await prepare
    .getByRole('button', { name: 'Step actions: Prepare', exact: true })
    .click();
  await page
    .getByRole('menuitem', { name: 'Connect to another step', exact: true })
    .click();
  await review.locator('.node-handle').click();
  const choice = canvas.locator('.connection-choice');
  await expect(
    choice.getByRole('button', { name: 'Connect', exact: true }),
  ).toBeDisabled();
  await choice.getByLabel('Control outcome', { exact: true }).fill('next');
  await choice.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(
    canvas.locator('.transition-label').filter({ hasText: /^next$/ }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(
    canvas.locator('.transition-label').filter({ hasText: /^next$/ }),
  ).toHaveCount(1);
});

test('form workspace keeps three useful areas and narrow preview retains the answer', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  const preview = page.locator('.form-live-preview');
  await expect(preview.getByText('Up to date', { exact: true })).toBeVisible();
  await preview
    .getByLabel('Sample name', { exact: true })
    .fill('Retained answer');
  const tools = await page.locator('.form-tools').boundingBox();
  const canvas = await page.locator('.form-design-canvas').boundingBox();
  const client = await preview.boundingBox();
  expect(tools).not.toBeNull();
  expect(canvas).not.toBeNull();
  expect(client).not.toBeNull();
  expect(tools!.x + tools!.width).toBeLessThanOrEqual(canvas!.x);
  expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(client!.x);
  expect(client!.width).toBeGreaterThanOrEqual(350);
  await page.setViewportSize({ width: 390, height: 900 });
  await page
    .locator('.form-modes')
    .getByRole('button', { name: 'Preview', exact: true })
    .click();
  await expect(preview.getByLabel('Sample name', { exact: true })).toHaveValue(
    'Retained answer',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page
    .locator('.form-modes')
    .getByRole('button', { name: 'Design', exact: true })
    .click();
  await expect(page.locator('.form-design-canvas')).toBeVisible();
});

test('optional scalar omission is a contextual action and leaves the editor usable', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const preview = page.locator('.form-live-preview');
  await expect(preview.getByText('Up to date', { exact: true })).toBeVisible();
  await preview
    .getByLabel('Sample name', { exact: true })
    .fill('Remove this synthetic answer');
  await preview
    .getByRole('button', { name: 'Actions: Sample name', exact: true })
    .click();
  await page
    .getByRole('menuitem', { name: 'Remove value', exact: true })
    .click();
  await expect(preview.getByLabel('Sample name', { exact: true })).toHaveValue(
    '',
  );
  await preview
    .getByLabel('Sample name', { exact: true })
    .fill('Replacement answer');
  await expect(preview.getByLabel('Sample name', { exact: true })).toHaveValue(
    'Replacement answer',
  );
});
