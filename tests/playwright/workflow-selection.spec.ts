import { expect, test } from './fixtures';

test('Native marquee and keyboard group menus retain the exact selection', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  const prepare = page.locator('.board-node[data-node-key="prepare"]');
  const review = page.locator('.board-node[data-node-key="review"]');
  const first = (await prepare.boundingBox())!;
  const second = (await review.boundingBox())!;
  await page.keyboard.down('Shift');
  await page.mouse.move(
    Math.min(first.x, second.x) - 16,
    Math.min(first.y, second.y) - 16,
  );
  await page.mouse.down();
  await page.mouse.move(
    Math.max(first.x + first.width, second.x + second.width) + 16,
    Math.max(first.y + first.height, second.y + second.height) + 16,
    { steps: 20 },
  );
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(page.locator('.board-node.selected')).toHaveCount(2);
  await prepare.focus();
  await prepare.press('Shift+F10');
  await expect(
    page.getByRole('menuitem', { name: 'Duplicate selection', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(prepare).toBeFocused();
  await prepare.press('Shift+F10');
  await page.getByRole('menuitem', { name: 'Align top', exact: true }).click();
  await expect(page.locator('.board-node.selected')).toHaveCount(2);
});

test('Group deletion requires confirmation and Undo restores every step and connection', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const nodes = page.locator('.board-node');
  await page
    .locator('.board-node[data-node-key="prepare"] .node-handle')
    .click();
  await page
    .locator('.board-node[data-node-key="review"] .node-handle')
    .click({ modifiers: ['Shift'] });
  await expect(page.locator('.board-node.selected')).toHaveCount(2);
  await page
    .locator('.board-node[data-node-key="prepare"] .node-handle')
    .click({ button: 'right' });
  await page
    .getByRole('menuitem', { name: 'Remove selected steps', exact: true })
    .click();
  const confirmation = page.getByRole('dialog', {
    name: 'Confirm action',
    exact: true,
  });
  await expect(confirmation).toContainText(
    'Neighbouring steps will not be connected.',
  );
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(nodes).toHaveCount(2);
  await expect(page.locator('f-connection')).toHaveCount(2);
  await expect(page.locator('.board-node.selected')).toHaveCount(2);
  await page
    .locator('.board-node[data-node-key="prepare"] .node-handle')
    .click({ button: 'right' });
  await page
    .getByRole('menuitem', { name: 'Remove selected steps', exact: true })
    .click();
  await confirmation
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await expect(nodes).toHaveCount(0);
  await expect(page.locator('f-connection')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(nodes).toHaveCount(2);
  await expect(page.locator('f-connection')).toHaveCount(2);
});

test('Validation issues open the relevant typed control inside the workflow dock', async ({
  page,
  appURL,
}) => {
  await page.route('**/api/v1/workflows/validate', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          valid: false,
          issues: [
            {
              pointer: '/graph/steps/0/config/conversion_key',
              code: 'step.config.invalid',
            },
          ],
        },
      },
    }),
  );
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Validate', exact: true }).click();
  if (
    await page.getByRole('button', { name: 'Tools', exact: true }).isVisible()
  ) {
    await page.getByRole('button', { name: 'Tools', exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Issues', exact: true }).click();
  await page.getByRole('button', { name: /step.config.invalid/ }).click();
  await expect(
    page.getByRole('tab', { name: 'Properties', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#node-conversion_key')).toBeFocused();
  await expect(page.locator('#node-conversion_key')).toBeInViewport({
    ratio: 1,
  });
});

test('Published workflow inspection keeps navigation usable and every mutation unavailable', async ({
  page,
  appURL,
}) => {
  let writes = 0;
  page.on('request', (request) => {
    if (
      request.method() !== 'GET' &&
      /workflow-versions\/fixture-flow\/(workspace|publish|promote)/.test(
        request.url(),
      )
    ) {
      writes++;
    }
  });
  await page.route(
    '**/api/v1/workflow-versions/fixture-flow',
    async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.status = 'PUBLISHED';
      body.data.workflow_ref_id = 'owned-workflow';
      await route.fulfill({ response, json: body });
    },
  );
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await expect(page.locator('.readonly-notice')).toContainText(
    'Read-only workflow version',
  );
  await expect(
    page.getByRole('link', { name: 'Workflow versions', exact: true }),
  ).toHaveAttribute('href', '/studio/workflow-versions?parent=owned-workflow');
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Undo', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Fit to view', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Add step: Transform', exact: true }),
  ).toBeDisabled();
  const node = page.locator('.board-node[data-node-key="prepare"]');
  await node.locator('.node-handle').click();
  await node.focus();
  const before = await node.getAttribute('style');
  await node.press('ArrowRight');
  await expect(node).toHaveAttribute('style', before!);
  await expect(page.locator('#node-conversion_key')).toBeDisabled();
  expect(writes).toBe(0);
});

test('Persian phone workflow tools retain usable tabs and draft fields', async ({
  page,
  appURL,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.locator('app-workspace-preferences details summary').click();
  const language = page.locator('[data-language-picker] [role="combobox"]');
  await language.click();
  await page
    .locator('[id="' + (await language.getAttribute('aria-controls')) + '"]')
    .getByRole('option', { name: 'فارسی', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('app-workspace-preferences details summary').click();
  await page.locator('.dock-toggle').click();
  const tools = page.locator('app-workflow-board .inspectors');
  await tools.locator('p-tab[value="properties"]').click();
  await tools.locator('app-workflow-selection details summary').first().click();
  await tools.locator('fieldset input').first().check();
  await page.locator('#node-conversion_key').fill('retained_fa');
  await tools
    .locator('p-tabpanels')
    .evaluate((element) => (element.scrollTop = element.scrollHeight));
  for (const tab of ['steps', 'properties', 'issues']) {
    await expect(tools.locator('p-tab[value="' + tab + '"]')).toBeInViewport({
      ratio: 1,
    });
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('workflow-phone-fa.png') });
  await tools.locator('p-tab[value="steps"]').click();
  await tools.locator('p-tab[value="properties"]').click();
  await expect(page.locator('#node-conversion_key')).toHaveValue('retained_fa');
});

test('Workspace history opens from the header as readable changes and retains pending node input', async ({
  page,
  appURL,
}) => {
  await page.route(
    '**/api/v1/workflow-versions/fixture-flow/workspace/history',
    (route) =>
      route.fulfill({
        json: {
          success: true,
          result: {
            page: 1,
            size: 20,
            total: 1,
            total_pages: 1,
            items: [
              {
                id: 'owned-history',
                entity_id: 'owned-workspace',
                modifier_type: 'USER',
                modifier_id: 'owned-user',
                changed_at: '2026-10-17T10:00:00Z',
                operation: 'UPDATE',
                reason: 'Arrange steps',
                from_values: {
                  document: { positions: { prepare: { x: 50 } } },
                },
                to_values: { document: { positions: { prepare: { x: 70 } } } },
              },
            ],
          },
        },
      }),
  );
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page
    .locator('.board-node[data-node-key="prepare"] .node-handle')
    .click();
  const field = page.locator('#node-conversion_key');
  await field.fill('unfinished draft');
  await page
    .getByRole('button', { name: 'Workspace history', exact: true })
    .click();
  const history = page.getByRole('dialog', {
    name: 'Workspace history',
    exact: true,
  });
  await expect(history).toContainText('Arrange steps');
  await history.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(history.locator('section.change-comparison')).toBeVisible();
  await expect(history.locator('.change-before')).toContainText('50');
  await expect(history.locator('.change-after')).toContainText('70');
  await expect(history.locator('textarea')).toHaveCount(0);
  await history.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(field).toHaveValue('unfinished draft');
});

test('Pending typed settings retain their owner while a different node is inspected', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page
    .locator('.board-node[data-node-key="prepare"] .node-handle')
    .click();
  await page.locator('#node-conversion_key').fill('retained_pending');
  await page
    .locator('.board-node[data-node-key="review"] .node-handle')
    .click();
  await expect(
    page.getByText('Pending edits are retained on another step.', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Return to pending edits', exact: true })
    .click();
  await expect(page.locator('#node-conversion_key')).toHaveValue(
    'retained_pending',
  );
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
});
