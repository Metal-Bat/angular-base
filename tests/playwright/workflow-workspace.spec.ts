import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

type SavedWorkspace = {
  graph: { steps: { key: string; type_version_ref: string }[] };
  positions: Record<string, { x: number; y: number }>;
  viewport: { x: number; y: number; zoom: number };
};
async function save(page: Page): Promise<SavedWorkspace> {
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const document = (await write).postDataJSON().document;
  await expect(page.locator('.save-state')).toHaveText('Saved');
  return document;
}

test('Group pointer movement is atomic, cancellable and preserves executable graph content', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  const baseline = await save(page);
  const prepare = page.locator('.board-node[data-node-key="prepare"]');
  const review = page.locator('.board-node[data-node-key="review"]');
  await prepare.locator('.node-handle').click();
  await review.locator('.node-handle').click({ modifiers: ['Shift'] });
  await expect(page.locator('.board-node.selected')).toHaveCount(2);
  const start = (await prepare.locator('.node-handle').boundingBox())!;
  await page.mouse.move(start.x + 70, start.y + 20);
  await page.mouse.down();
  await page.mouse.move(start.x + 130, start.y + 60, { steps: 12 });
  await page.mouse.up();
  const moved = await save(page);
  const delta = {
    x: moved.positions.prepare.x - baseline.positions.prepare.x,
    y: moved.positions.prepare.y - baseline.positions.prepare.y,
  };
  // Native pointer rounding and the installed one-pixel grid may differ by one
  // pixel; every selected node must still receive exactly the same delta.
  expect(Math.abs(delta.x - 60)).toBeLessThanOrEqual(1);
  expect(Math.abs(delta.y - 40)).toBeLessThanOrEqual(1);
  for (const key of ['prepare', 'review']) {
    expect(moved.positions[key]).toEqual({
      x: baseline.positions[key].x + delta.x,
      y: baseline.positions[key].y + delta.y,
    });
  }
  expect(moved.graph).toEqual(baseline.graph);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await save(page)).positions).toEqual(baseline.positions);
  await expect(page.locator('.board-node.selected')).toHaveCount(1);
  await page.getByText('Selection and connections', { exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Duplicate selection', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  expect((await save(page)).positions).toEqual(moved.positions);
  await review.locator('.node-handle').click({ modifiers: ['Shift'] });
  await expect(page.locator('.board-node.selected')).toHaveCount(2);
  const cancelStart = (await prepare.locator('.node-handle').boundingBox())!;
  await page.mouse.move(cancelStart.x + 70, cancelStart.y + 20);
  await page.mouse.down();
  await page.mouse.move(cancelStart.x + 140, cancelStart.y + 70, { steps: 12 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect((await save(page)).positions).toEqual(moved.positions);
});

test('Native palette drop and keyboard placement preserve exact registered pins after zoom', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(page.locator('.zoom-value')).toHaveText('80%');
  const before = await save(page);
  const source = page.locator('.palette-item').first();
  const stage = page.locator('.canvas-stage');
  const bounds = (await stage.boundingBox())!;
  const target = { x: bounds.width - 270, y: bounds.height - 200 };
  await source.dragTo(stage, { targetPosition: target });
  await expect(page.locator('.board-node')).toHaveCount(3);
  const after = await save(page);
  const added = after.graph.steps.at(-1)!;
  expect(added.type_version_ref).toBe('fixture-type');
  expect(after.positions[added.key].x).toBeCloseTo(
    (target.x - before.viewport.x) / 0.8,
    0,
  );
  expect(after.positions[added.key].y).toBeCloseTo(
    (target.y - before.viewport.y) / 0.8,
    0,
  );
  await page.getByRole('tab', { name: 'Steps', exact: true }).click();
  await source.click();
  await stage.focus();
  await stage.press('Enter');
  await expect(page.locator('.board-node')).toHaveCount(4);
  await page.getByRole('tab', { name: 'Steps', exact: true }).click();
  await source.click();
  await page.keyboard.press('Escape');
  await stage.focus();
  await stage.press('Enter');
  await expect(page.locator('.board-node')).toHaveCount(4);
  await save(page);
  await page.reload();
  await expect(page.locator('.board-node')).toHaveCount(4);
});

for (const width of [1440, 1366, 1024, 390]) {
  test(`Workflow dock keeps tabs reachable and standard properties have no JSON at ${width}px`, async ({
    page,
    appURL,
  }, testInfo) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : width === 1440 ? 900 : 768,
    });
    await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
    if (width === 1440) {
      await page
        .getByRole('button', { name: 'Focus mode', exact: true })
        .click();
    }
    await expect(page.locator('.board-node')).toHaveCount(2);
    const toolsMode = await page
      .getByRole('button', { name: 'Tools', exact: true })
      .isVisible();
    if (toolsMode) {
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
    }
    await page.getByRole('tab', { name: 'Properties', exact: true }).click();
    const tools = page.getByRole('complementary', {
      name: 'Workflow tools',
      exact: true,
    });
    await expect(tools.locator('textarea:visible')).toHaveCount(0);
    await tools.getByText('Selection and connections', { exact: true }).click();
    await tools.getByRole('checkbox', { name: 'Prepare', exact: true }).check();
    await expect(page.locator('#node-conversion_key')).toBeVisible();
    await page.locator('#node-conversion_key').fill('retained draft');
    await tools
      .locator('p-tabpanels')
      .evaluate((element) => (element.scrollTop = element.scrollHeight));
    await expect(
      page.getByRole('tab', { name: 'Steps', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await page.getByRole('tab', { name: 'Steps', exact: true }).click();
    await page.getByRole('tab', { name: 'Properties', exact: true }).click();
    await expect(page.locator('#node-conversion_key')).toHaveValue(
      'retained draft',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('workflow-dock.png') });
    if (toolsMode) {
      await page.getByRole('button', { name: 'Canvas', exact: true }).click();
      await expect(page.locator('.canvas-stage')).toBeVisible();
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
      await expect(page.locator('#node-conversion_key')).toHaveValue(
        'retained draft',
      );
    }
  });
}

test('Phone Tools preserves measured canvas geometry and the current graph and viewport', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'View', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'View', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Zoom out', exact: true }).click();
  await expect(page.locator('.zoom-value')).toHaveText('90%');
  const before = await save(page);
  const node = page.locator('.board-node[data-node-key="prepare"]');
  await node.locator('.node-handle').click();
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  await expect(page.locator('.inspectors')).toBeVisible();
  await expect(node).toBeHidden();
  // The covered flow keeps real geometry, so its registered connectors stay valid.
  expect(
    await node
      .locator('.port-socket')
      .first()
      .evaluate((element) => element.getClientRects().length),
  ).toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .querySelector('.workflow-surface')!
          .contains(document.activeElement),
      ),
    )
    .toBe(false);
  await page.getByRole('button', { name: 'Canvas', exact: true }).click();
  await expect(node).toBeVisible();
  await expect(node).toHaveClass(/selected/);
  await expect(page.locator('.zoom-value')).toHaveText('90%');
  expect(await save(page)).toEqual(before);
});
