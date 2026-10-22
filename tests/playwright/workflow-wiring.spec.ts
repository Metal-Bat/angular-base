import { expect, test } from './fixtures';

test('Pointer control wiring requires an explicit outcome and persists only the intended transition', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(page.locator('.zoom-value')).toHaveText('100%');
  const from = page.locator(
    '.board-node[data-node-key="review"] .control-port.output-port .port-socket',
  );
  const to = page.locator(
    '.board-node[data-node-key="prepare"] .control-port:not(.output-port) .port-socket',
  );
  const source = await from.boundingBox();
  const target = await to.boundingBox();
  expect(source).not.toBeNull();
  expect(target).not.toBeNull();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    target!.x + target!.width / 2,
    target!.y + target!.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
  const chooser = page.locator('.connection-choice');
  await expect(chooser).toBeVisible();
  await expect(
    chooser.getByRole('button', { name: 'Connect', exact: true }),
  ).toBeDisabled();
  await chooser.getByLabel('Control outcome', { exact: true }).fill('next');
  await chooser.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(chooser).toHaveCount(0);
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const document = (await write).postDataJSON().document;
  expect(document.graph.transitions).toEqual([
    { source: 'prepare', target: 'review', outcome: 'next' },
    {
      source: 'review',
      target: 'prepare',
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
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('.transition-label')).toHaveCount(2);
});

test.describe('Conditional transition preservation', () => {
  test.use({ conditionalWorkflow: true });
  for (const endpoint of ['source', 'target'] as const) {
    test(`Pointer ${endpoint} reassignment preserves conditional routing, pins and undo`, async ({
      page,
      appURL,
    }): Promise<void> => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
      await page
        .getByRole('button', { name: 'Focus mode', exact: true })
        .click();
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
      await page
        .getByRole('button', { name: 'Reset view', exact: true })
        .click();
      const baseline = page.waitForRequest(
        (request) =>
          request.method() === 'PUT' &&
          request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
      );
      await page
        .getByRole('button', { name: 'Save workspace', exact: true })
        .click();
      const before = (await baseline).postDataJSON().document;
      expect(before.graph.transitions[0]).toMatchObject({
        priority: 4,
        is_default: false,
        condition: 'request.flag',
      });
      await expect(
        page.getByText('Workspace saved. This is not an executable graph.', {
          exact: true,
        }),
      ).toBeVisible();
      const edge = page.locator('f-connection:not(.data-edge)');
      await edge.locator('.transition-label').click();
      const handle = await edge
        .locator(
          `circle[f-connection-drag-handle-${endpoint === 'source' ? 'start' : 'end'}]`,
        )
        .boundingBox();
      const destination = await third
        .locator(
          endpoint === 'source'
            ? '.control-port.output-port .output-socket'
            : '.control-port:not(.output-port) .input-socket',
        )
        .boundingBox();
      expect(handle).not.toBeNull();
      expect(destination).not.toBeNull();
      await page.mouse.move(
        handle!.x + handle!.width / 2,
        handle!.y + handle!.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        destination!.x + destination!.width / 2,
        destination!.y + destination!.height / 2,
        { steps: 20 },
      );
      await page.mouse.up();
      await expect
        .poll(() => edge.getAttribute('aria-label'))
        .toContain(thirdKey!);
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect
        .poll(() => edge.getAttribute('aria-label'))
        .toContain(
          endpoint === 'source' ? 'control:prepare:out' : 'control:review:in',
        );
      await page.getByRole('button', { name: 'Redo', exact: true }).click();
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
        transitions: [{ ...before.graph.transitions[0], [endpoint]: thirdKey }],
      });
      await expect(
        page.getByText('Workspace saved. This is not an executable graph.', {
          exact: true,
        }),
      ).toBeVisible();
      await page.reload();
      await expect
        .poll(() =>
          page
            .locator('f-connection:not(.data-edge)')
            .getAttribute('aria-label'),
        )
        .toContain(thirdKey!);
    });
  }
});

test('Pointer waypoints move, undo and reload without changing executable routing', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
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
  const edge = page.locator('f-connection:not(.data-edge)');
  await edge.locator('.transition-label').click();
  const candidate = edge.locator('circle.f-candidate').first();
  await expect(candidate).toBeVisible();
  const start = await candidate.boundingBox();
  expect(start).not.toBeNull();
  expect(start!.width).toBeGreaterThanOrEqual(24);
  await page.mouse.move(
    start!.x + start!.width / 2,
    start!.y + start!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(start!.x + start!.width / 2, start!.y - 100, {
    steps: 20,
  });
  await page.mouse.up();
  const waypoint = edge.locator('circle.f-waypoint');
  await expect(waypoint).toHaveCount(1);
  const initial = await waypoint.boundingBox();
  expect(initial).not.toBeNull();
  const initialX = await waypoint.getAttribute('cx');
  const initialY = await waypoint.getAttribute('cy');
  await page.mouse.move(
    initial!.x + initial!.width / 2,
    initial!.y + initial!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(initial!.x + 70, initial!.y - 60, { steps: 20 });
  await page.mouse.up();
  const moved = await waypoint.boundingBox();
  expect(moved!.x - initial!.x).toBeGreaterThan(40);
  const movedPoint = {
    x: Number(await waypoint.getAttribute('cx')),
    y: Number(await waypoint.getAttribute('cy')),
  };
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(waypoint).toHaveAttribute('cx', initialX!);
  await expect(waypoint).toHaveAttribute('cy', initialY!);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().endsWith('/workflow-versions/fixture-flow/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const document = (await write).postDataJSON().document;
  expect(document.graph).toEqual(before.graph);
  expect(document.positions).toEqual(before.positions);
  expect(Object.values(document.routing)).toHaveLength(1);
  expect(Object.values(document.routing)[0]).toEqual([movedPoint]);
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  const restored = page.locator(
    'f-connection:not(.data-edge) circle.f-waypoint',
  );
  await expect(restored).toHaveCount(1);
  await expect(restored).toHaveAttribute('cx', String(movedPoint.x));
  await expect(restored).toHaveAttribute('cy', String(movedPoint.y));
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(page.locator('.zoom-value')).toHaveText('80%');
  const beforeRemove = await restored.boundingBox();
  expect(beforeRemove).not.toBeNull();
  expect(beforeRemove!.width).toBeGreaterThanOrEqual(24);
  await restored.click({ button: 'right' });
  await expect(restored).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(restored).toHaveCount(1);
});
