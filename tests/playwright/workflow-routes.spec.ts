import { expect, test } from './fixtures';

test('Parallel branches have distinct smooth routes and editable persisted routing without graph changes', async ({
  page,
  appURL,
}, testInfo) => {
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
      const graph = body.data.document.graph;
      graph.transitions.push({
        ...graph.transitions[0],
        outcome: 'alternate',
        condition: 'request.flag',
        priority: 1,
        is_default: false,
      });
      await route.fulfill({ response, json: body });
    },
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const edges = page.locator('f-connection:not(.data-edge)');
  await expect(edges).toHaveCount(2);
  const manual = edges.filter({
    has: page.locator('.transition-label').filter({ hasText: /^next$/ }),
  });
  const paths = edges.locator('path[f-connection-path]');
  await expect
    .poll(
      async () =>
        (await paths.first().getAttribute('d')) !==
        (await paths.last().getAttribute('d')),
    )
    .toBe(true);
  const first = (await edges
    .first()
    .locator('.transition-label')
    .boundingBox())!;
  const second = (await edges
    .last()
    .locator('.transition-label')
    .boundingBox())!;
  expect(
    first.y + first.height <= second.y || second.y + second.height <= first.y,
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('parallel-workflow-branches.png'),
  });
  await manual.locator('.transition-label').click({ button: 'right' });
  await page
    .getByRole('menuitem', { name: 'Edit connection route', exact: true })
    .click();
  await expect(manual.locator('circle.f-waypoint')).toHaveCount(1);
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
      source: 'prepare',
      target: 'review',
      outcome: 'alternate',
      condition: 'request.flag',
      priority: 1,
      is_default: false,
    },
  ]);
  expect(Object.values(document.routing)).toHaveLength(1);
  await expect(page.locator('.save-state')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Arrange', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Left to right', exact: true })
    .click();
  const confirmation = page.getByRole('dialog', {
    name: 'Confirm action',
    exact: true,
  });
  await expect(confirmation).toContainText('reset manual connection routes');
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(manual.locator('circle.f-waypoint')).toHaveCount(1);
  await page.getByRole('button', { name: 'Arrange', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Left to right', exact: true })
    .click();
  await confirmation
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await expect(manual.locator('circle.f-waypoint')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(manual.locator('circle.f-waypoint')).toHaveCount(1);
  await page.reload();
  await expect(manual.locator('circle.f-waypoint')).toHaveCount(1);
});
