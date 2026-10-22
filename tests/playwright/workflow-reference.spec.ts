import { expect, test } from './fixtures';

test('Arrange separates a branching cyclic workflow and disconnected step without changing graph meaning', async ({
  page,
  appURL,
}, testInfo) => {
  let baseline: Record<string, unknown>;
  let originalPositions: Record<string, unknown>;
  let initial = true;
  await page.route(
    '**/api/v1/workflow-versions/fixture-flow/workspace',
    async (route) => {
      if (route.request().method() !== 'GET' || !initial) {
        await route.continue();
        return;
      }
      initial = false;
      const response = await route.fetch();
      const body = await response.json();
      const document = body.data.document;
      const graph = document.graph;
      for (const key of ['branch_a', 'branch_b', 'return_step', 'alone']) {
        graph.steps.push({ ...graph.steps[0], key });
        document.positions[key] = { x: 50, y: 70 };
      }
      graph.transitions.push(
        {
          source: 'prepare',
          target: 'branch_a',
          outcome: 'alternate',
          priority: 3,
          condition: 'request.flag',
          is_default: false,
        },
        { source: 'review', target: 'branch_b', outcome: 'next' },
        { source: 'branch_b', target: 'review', outcome: 'return' },
        { source: 'branch_a', target: 'return_step', outcome: 'next' },
        { source: 'return_step', target: 'prepare', outcome: 'return' },
      );
      baseline = structuredClone(graph);
      originalPositions = structuredClone(document.positions);
      await route.fulfill({ response, json: body });
    },
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await expect(page.locator('.board-node')).toHaveCount(6);
  await page.getByRole('button', { name: 'Arrange', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Left to right', exact: true })
    .click();
  const nodes = page.locator('.board-node');
  const overlapCount = async (): Promise<number> => {
    const boxes = await nodes.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }),
    );
    return boxes.reduce(
      (total, a, index) =>
        total +
        boxes
          .slice(index + 1)
          .filter(
            (b) =>
              a.x < b.x + b.width &&
              b.x < a.x + a.width &&
              a.y < b.y + b.height &&
              b.y < a.y + a.height,
          ).length,
      0,
    );
  };
  await expect.poll(overlapCount).toBe(0);
  await expect
    .poll(async () => {
      const stage = (await page.locator('.canvas-stage').boundingBox())!;
      const boxes = await nodes.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          };
        }),
      );
      return boxes.every(
        (box) =>
          box.x >= stage.x &&
          box.y >= stage.y &&
          box.x + box.width <= stage.x + stage.width &&
          box.y + box.height <= stage.y + stage.height,
      );
    })
    .toBe(true);
  const paths = await page
    .locator('f-connection:not(.data-edge) path[f-connection-path]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('d')),
    );
  expect(new Set(paths).size).toBe(6);
  expect(paths.every((path) => path && /[CQ]/.test(path))).toBe(true);
  await expect(
    page.getByRole('menuitem', { name: 'Left to right', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('workflow-branches-loops-disconnected.png'),
  });
  const save = async (): Promise<Record<string, unknown>> => {
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
  };
  const arranged = await save();
  expect(arranged.graph).toEqual(baseline!);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await save()).positions).toEqual(originalPositions!);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  expect(await save()).toEqual(arranged);
  await page.reload();
  await expect(nodes).toHaveCount(6);
  await expect.poll(overlapCount).toBe(0);
});
