import { expect, test } from './fixtures';

test('Workflow names remain readable when a registered type returns an unresolved translation', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/api/v1/designer/catalog', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const type = body.result.items.find(
      (entry: { key: string }) => entry.key === 'transform',
    );
    expect(type.metadata.ref_id).toBe('fixture-type');
    type.title = 'step.transform.name';
    const second = structuredClone(type);
    second.key = 'TRANSFORM:2';
    second.metadata.number = 2;
    second.metadata.ref_id = 'fixture-type-v2';
    body.result.items.splice(1, 0, second);
    await route.fulfill({ response, json: body });
  });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const prepare = page.locator('.board-node[data-node-key="prepare"]');
  await expect(prepare.locator('.node-title strong')).toHaveText('Prepare');
  await expect(prepare.locator('.node-title small')).toHaveText('Transform');
  await expect(page.locator('app-workflow-board')).not.toContainText(
    'step.transform.name',
  );
  await expect(page.locator('.palette-card').first()).toContainText(
    'Transform',
  );
  await expect(page.locator('.palette-card').first()).toContainText(
    'Version 1',
  );
  const reports = page.getByRole('link', {
    name: 'Report label issue',
    exact: true,
  });
  await expect(reports).toHaveCount(2);
  await expect(reports.first()).toHaveAttribute('href', '/operations/support');
  await page
    .getByRole('button', {
      name: 'Add step: Transform · Version 2',
      exact: true,
    })
    .click();
  await expect(page.locator('.board-node')).toHaveCount(3);
  const added = page.locator('.board-node[data-node-key="step_TRANSFORM_1"]');
  await expect(added.locator('.node-title strong')).toHaveText(
    'Step Transform 1',
  );
  await expect(page.locator('app-workflow-editor-pane h2')).toHaveText(
    'Selected step Step Transform 1',
  );
  const name = await added.locator('.node-title').boundingBox();
  const action = await added.locator('.node-actions').boundingBox();
  expect(name).not.toBeNull();
  expect(action).not.toBeNull();
  expect(name!.x + name!.width).toBeLessThanOrEqual(action!.x);
  expect(
    await added
      .locator('.node-title strong')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await expect(page.locator('#node-conversion_key')).toBeInViewport({
    ratio: 1,
  });
  const details = page.getByText('Registered step details', { exact: true });
  await details.click();
  await expect(
    page.getByRole('heading', { name: 'Inputs and outputs', exact: true }),
  ).toBeVisible();
  await details.click();
  await expect(page.locator('#node-conversion_key')).toBeInViewport({
    ratio: 1,
  });
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const document = (await write).postDataJSON().document;
  expect(
    document.graph.steps.map(
      (step: { type_version_ref: string }) => step.type_version_ref,
    ),
  ).toEqual(['fixture-type', 'fixture-type', 'fixture-type-v2']);
  expect(document.graph.steps[0].key).toBe('prepare');
  expect(document.graph.steps[1].key).toBe('review');
  expect(document.graph.steps[0].title).toBeUndefined();
  expect(document.positions.prepare).toEqual({ x: 50, y: 70 });
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('workflow-labels.png'),
    fullPage: true,
  });
});
