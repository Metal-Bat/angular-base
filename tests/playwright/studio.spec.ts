import { test as base, expect } from '@playwright/test';

// Fixture-backed production pages through the real boundary, not real-service acceptance.
const test = base.extend<{ appURL: string; diagnostics: void }>({
  diagnostics: [
    async ({ page }, use): Promise<void> => {
      const diagnostics: string[] = [];
      page.on('pageerror', (error) => diagnostics.push(error.message));
      page.on('console', (message) => {
        if (['warning', 'warn', 'error'].includes(message.type())) {
          diagnostics.push(message.text());
        }
      });
      await use();
      expect(diagnostics).toEqual([]);
    },
    { auto: true },
  ],
  appURL: async (
    { browserName, browser, page },
    use,
    testInfo,
  ): Promise<void> => {
    await testInfo.attach('browser-and-evidence', {
      body: JSON.stringify({
        browserName,
        browserVersion: browser.version(),
        evidence: 'fixture-backed production pages',
      }),
      contentType: 'application/json',
    });
    const { startStudioBrowserFixture } =
      await import('../../server/playwright-studio-fixture.mjs');
    const app = await startStudioBrowserFixture();
    try {
      await use(app.origin);
    } finally {
      if (testInfo.status !== testInfo.expectedStatus && !page.isClosed()) {
        await testInfo.attach('fixture-failure', {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      }
      await page.close();
      await app.close();
    }
  },
});

test.beforeEach(async ({ page, appURL }): Promise<void> => {
  await page.goto(appURL + '/login');
  await page.getByLabel('Username', { exact: true }).fill('fixture-user');
  await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const account = page.locator('details.account-menu summary');
  await expect(account).toContainText('fixture-user');
  await account.click();
  await expect(
    page.getByRole('button', { name: 'Sign out', exact: true }),
  ).toBeVisible();
  await account.click();
});

test('canvas group selection, ordinary click, targeted duplication and undo', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const canvas = page.locator('app-workflow-canvas');
  const prepare = canvas
    .locator('.board-node')
    .filter({ hasText: 'prepare' })
    .first();
  const review = canvas
    .locator('.board-node')
    .filter({ hasText: 'review' })
    .first();
  await prepare.locator('.node-handle').click();
  await review.locator('.node-handle').click({ modifiers: ['Shift'] });
  await expect(canvas.locator('.board-node.selected')).toHaveCount(2);
  await review.locator('.node-handle').click();
  await expect(canvas.locator('.board-node.selected')).toHaveCount(1);
  await page.getByText('Selection and connections', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Duplicate selection', exact: true })
    .click();
  await expect(canvas.locator('.board-node')).toHaveCount(3);
  await expect(
    canvas.locator('.board-node').filter({ hasText: 'review_copy_1' }),
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
  const dock = page.getByRole('region', {
    name: 'Simulated runtime preview',
    exact: true,
  });
  await expect(
    dock.getByText('Preview matches the current design.', { exact: true }),
  ).toBeVisible();
  const sample = dock.getByLabel('Sample name', { exact: true });
  await sample.pressSequentially('Synthetic answer');
  await expect(sample).toHaveValue('Synthetic answer');
  await page.locator('app-form-canvas .field-card').first().click();
  await page.getByLabel('Label', { exact: true }).fill('Current unsaved label');
  await page
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  await expect(
    dock.getByLabel('Current unsaved label', { exact: true }),
  ).toHaveValue('Synthetic answer');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.reload();
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
  const prepare = canvas
    .locator('.board-node')
    .filter({ hasText: 'prepare' })
    .first();
  const review = canvas
    .locator('.board-node')
    .filter({ hasText: 'review' })
    .first();
  await page.getByText('Selection and connections', { exact: true }).click();
  await page.getByLabel('Connection', { exact: true }).click();
  await page.getByRole('option', { name: /^control ·/ }).click();
  await page
    .getByRole('button', { name: 'Remove connection', exact: true })
    .click();
  await expect(canvas.locator('f-connection:not(.data-edge)')).toHaveCount(0);
  await prepare
    .getByRole('button', { name: 'Step actions: TRANSFORM', exact: true })
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
