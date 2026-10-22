import { expect, test } from './fixtures';

test('Pointer data wiring persists its exact mapping without creating a control transition', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('tab', { name: 'Steps', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add step: Transform', exact: true })
    .click();
  const nodes = page.locator('.board-node');
  await expect(nodes).toHaveCount(3);
  const third = nodes.nth(2);
  const thirdKey = await third.getAttribute('data-node-key');
  expect(thirdKey).toBeTruthy();
  await page.getByRole('button', { name: 'Arrange', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Left to right', exact: true })
    .click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  const baseline = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const before = (await baseline).postDataJSON().document;
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  const source = await page
    .locator(
      '.board-node[data-node-key="review"] .data-port.output-port .output-socket',
    )
    .boundingBox();
  const destination = await third
    .locator('.data-port:not(.output-port) .input-socket')
    .boundingBox();
  expect(source).not.toBeNull();
  expect(destination).not.toBeNull();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    destination!.x + destination!.width / 2,
    destination!.y + destination!.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
  await expect(page.locator('f-connection.data-edge')).toHaveCount(2);
  await expect(page.locator('.connection-choice')).toHaveCount(0);
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const after = (await write).postDataJSON().document;
  expect(after.graph).toEqual({
    ...before.graph,
    bindings: [
      ...before.graph.bindings,
      {
        source_kind: 'STEP_OUTPUT',
        source_step: 'review',
        source_port: 'result',
        source_schema: { type: 'string' },
        ordinal: 0,
        step: thirdKey,
        target_port: 'value',
        target_schema: { type: 'string' },
      },
    ],
  });
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('f-connection.data-edge')).toHaveCount(2);
  await expect(page.locator('f-connection.data-edge').last()).toHaveAttribute(
    'aria-label',
    `Inspect connection: data:review:out:result → data:${thirdKey}:in:value`,
  );
});
