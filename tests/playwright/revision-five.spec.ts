import { expect, test } from './fixtures';

test('Users links survive new tabs and browser Back/Forward while edit drafts are guarded', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/users');
  const link = page
    .locator('app-record-table')
    .getByRole('link', { name: 'Ali', exact: true });
  await expect(link).toHaveAttribute('href', /\/users\?selected=/);
  const target = await link.getAttribute('href');
  const detailTab = await page.context().newPage();
  await detailTab.goto(appURL + target);
  await expect(detailTab.locator('app-record-page-header h1')).toHaveText(
    'Ali Example',
  );
  await detailTab.close();
  await link.click();
  await expect(page).toHaveURL(/selected=/);
  await page.goBack();
  await expect(link).toBeVisible();
  await page.goForward();
  await expect(page.locator('app-record-page-header h1')).toHaveText(
    'Ali Example',
  );
  await page.getByRole('button', { name: 'Update User', exact: true }).click();
  await page.getByLabel('First Name', { exact: true }).fill('Protected draft');
  await page
    .getByRole('navigation', { name: 'Breadcrumb', exact: true })
    .getByRole('link', { name: 'Users', exact: true })
    .click();
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(page.getByLabel('First Name', { exact: true })).toHaveValue(
    'Protected draft',
  );
});

test('Task execution has owned result sections and one guarded command menu', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/administration/tasks/executions');
  await page.getByRole('button', { name: 'Open', exact: true }).first().click();
  const header = page.locator('app-record-page-header');
  await expect(header.locator('h1')).toHaveText('jobs.sample');
  await expect(
    page.getByRole('heading', { name: 'Worker', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('FAILURE', { exact: true }).first(),
  ).toBeVisible();
  await header.getByRole('button', { name: 'Actions', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Retry Execution', exact: true })
    .click();
  await expect(page.locator('app-resource-actions .p-dialog')).toBeVisible();
  await expect(page.locator('#action-path-task_id')).toHaveCount(0);
});

test('Dashboard fields stay together and exact source values drive the bounded chart', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/operations/dashboard');
  await expect(page.locator('app-metric-chart svg[role=img]')).toBeVisible();
  await expect(page.locator('app-metric-chart .point')).toHaveCount(6);
  await expect(page.locator('.metric-total')).toContainText('5');
  const chart = await page.locator('app-metric-chart').boundingBox();
  expect(chart!.height).toBeGreaterThan(200);
  await page.getByRole('combobox', { name: 'Period', exact: true }).click();
  await page.getByRole('option', { name: 'Custom', exact: true }).click();
  await page.locator('.metric-customize summary').click();
  const fields = page.locator('app-dashboard app-control-field');
  await expect(fields).toHaveCount(5);
  await expect(
    page.getByRole('combobox', { name: 'Timezone', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', {
      name: 'Change timezone in user settings.',
      exact: true,
    }),
  ).toHaveAttribute('href', '/account/profile');
  await expect(page.locator('app-dashboard .period-toolbar')).toContainText(
    'Asia/Tehran',
  );
  for (const field of await fields.all()) {
    const label = await field.locator('label').boundingBox();
    const control = await field.locator('.field-control').boundingBox();
    expect(control!.y - label!.y - label!.height).toBeLessThan(16);
    expect(Math.abs(label!.x - control!.x)).toBeLessThan(2);
  }
  await page.getByLabel('Metric', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Average time to closure', exact: true })
    .click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.locator('app-metric-chart .point')).toHaveCount(5);
  await expect(
    page.locator('app-metric-chart .series-line').first(),
  ).toHaveAttribute('d', /M.*M/);
  await page.getByText('Data table', { exact: true }).click();
  await expect(page.locator('.metric-data table')).toContainText('Unknown');
});

test('Calendar periods have complete month cells, a day time axis and keyboard navigation', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/operations/calendar');
  await expect(page.locator('.month-grid')).toBeVisible();
  const days = await page.locator('.month-grid td').count();
  expect(days).toBeGreaterThanOrEqual(28);
  expect(days % 7).toBe(0);
  const current = await page.locator('.period-title').textContent();
  await page.getByRole('button', { name: 'Next period', exact: true }).click();
  await expect(page.locator('.period-title')).not.toHaveText(current!);
  await page
    .getByRole('button', { name: 'Previous period', exact: true })
    .click();
  await expect(page.locator('.period-title')).toHaveText(current!);
  await page.getByRole('button', { name: 'Day', exact: true }).click();
  await expect(page.locator('.time-axis span')).toHaveCount(24);
  await expect(page.locator('.time-lane')).toHaveCount(1);
  await page.getByRole('button', { name: 'Today', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.day-heading.today')).toBeVisible();
});

test('Arrange is explicit, undoable, persists positions and leaves execution semantics unchanged', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const nodes = page.locator('app-workflow-canvas .board-node');
  await expect(nodes).toHaveCount(2);
  const original = await nodes.evaluateAll((elements) =>
    elements.map((element) => ({
      key: (element as HTMLElement).dataset['nodeKey'],
      transform: (element as HTMLElement).style.transform,
    })),
  );
  await page.getByRole('button', { name: 'Arrange', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Top to bottom', exact: true })
    .click();
  await expect(page.locator('.workflow-meta .save-state')).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect
    .poll(() =>
      nodes.evaluateAll((elements) =>
        elements.map((element) => ({
          key: (element as HTMLElement).dataset['nodeKey'],
          transform: (element as HTMLElement).style.transform,
        })),
      ),
    )
    .toEqual(original);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(nodes).toHaveCount(2);
  await expect(
    page.locator('.transition-label').filter({ hasText: /next/ }),
  ).toHaveCount(1);
});

test('Pointer movement commits one node move and Undo restores the real position without changing pins', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const initialResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/workflow-versions/fixture-flow/workspace') &&
      response.request().method() === 'GET',
  );
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const originalDocument = (await (await initialResponse).json()).data.document;
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(page.locator('.zoom-value')).toHaveText('100%');
  const node = page.locator('.board-node[data-node-key="prepare"]');
  const handle = node.locator('.node-handle');
  const before = await node.boundingBox();
  const target = await handle.boundingBox();
  await page.mouse.move(
    target!.x + target!.width / 2,
    target!.y + target!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    target!.x + target!.width / 2 + 70,
    target!.y + target!.height / 2 + 40,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect(page.locator('.workflow-meta .save-state')).toBeVisible();
  const moved = await node.boundingBox();
  expect(moved!.x - before!.x).toBeCloseTo(70, 0);
  expect(moved!.y - before!.y).toBeCloseTo(40, 0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect
    .poll(async () => Math.round((await node.boundingBox())!.x))
    .toBe(Math.round(before!.x));
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  const write = page.waitForRequest(
    (request) =>
      request.url().endsWith('/workflow-versions/fixture-flow/workspace') &&
      request.method() === 'PUT',
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const document = (await write).postDataJSON().document;
  expect(document.graph).toEqual(originalDocument.graph);
  expect(document.positions['prepare']).not.toEqual(
    originalDocument.positions['prepare'],
  );
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(node).toBeVisible();
});
