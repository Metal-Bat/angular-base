import { expect, test } from './fixtures';

test.use({ conditionalWorkflow: true });

test('Insert step preserves branch policy, bindings and pins through Cancel, Undo and save/reopen', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const edge = page.locator('f-connection:not(.data-edge) .transition-label');
  await edge.click({ button: 'right' });
  await page
    .getByRole('menuitem', { name: 'Insert step', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Insert step', exact: true });
  await expect(
    dialog.getByRole('button', { name: 'Insert step', exact: true }),
  ).toBeDisabled();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.board-node')).toHaveCount(2);
  await edge.click({ button: 'right' });
  await page
    .getByRole('menuitem', { name: 'Insert step', exact: true })
    .click();
  await dialog.getByLabel('Registered step type', { exact: true }).click();
  await page.getByRole('option', { name: /Timer.*Version 1/ }).click();
  await dialog.getByLabel('New step outcome', { exact: true }).fill('next');
  await dialog
    .getByRole('button', { name: 'Insert step', exact: true })
    .click();
  await expect(page.locator('.board-node')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.board-node')).toHaveCount(2);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.locator('.board-node')).toHaveCount(3);
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const document = (await write).postDataJSON().document;
  const inserted = document.graph.steps.find(
    (step: { type_code: string }) => step.type_code === 'TIMER',
  );
  expect(inserted.type_version_ref).toBe('fixture-timer');
  expect(document.graph.transitions).toEqual([
    {
      source: 'prepare',
      target: inserted.key,
      outcome: 'next',
      condition: 'request.flag',
      priority: 4,
      is_default: false,
    },
    {
      source: inserted.key,
      target: 'review',
      outcome: 'next',
      priority: 0,
      is_default: true,
    },
  ]);
  expect(document.graph.bindings).toEqual([
    {
      source_kind: 'STEP_OUTPUT',
      source_step: 'prepare',
      source_port: 'result',
      step: 'review',
      target_port: 'value',
    },
  ]);
  expect(
    document.graph.steps
      .slice(0, 2)
      .map((step: { type_version_ref: string }) => step.type_version_ref),
  ).toEqual(['fixture-type', 'fixture-type']);
  await expect(page.locator('.save-state')).toHaveText('Saved');
  await page.reload();
  await expect(page.locator('.board-node')).toHaveCount(3);
  await expect(page.locator('f-connection:not(.data-edge)')).toHaveCount(2);
});

test('Add next requires an unused explicit outcome and places exactly one registered step', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const prepare = page.locator(
    '.board-node[data-node-key="prepare"] .node-handle',
  );
  await prepare.click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Add next', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add next', exact: true });
  await dialog.getByLabel('Control outcome', { exact: true }).fill('next');
  await expect(dialog).toContainText('That outcome already has a connection.');
  await expect(
    dialog.getByRole('button', { name: 'Add next', exact: true }),
  ).toBeDisabled();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .locator('.board-node[data-node-key="review"] .node-handle')
    .click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Add next', exact: true }).click();
  await dialog.getByLabel('Registered step type', { exact: true }).click();
  await page.getByRole('option', { name: /Timer.*Version 1/ }).click();
  await dialog.getByLabel('Control outcome', { exact: true }).fill('next');
  await dialog.getByRole('button', { name: 'Add next', exact: true }).click();
  await expect(page.locator('.board-node')).toHaveCount(3);
  await expect(page.locator('f-connection:not(.data-edge)')).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.board-node')).toHaveCount(2);
});
