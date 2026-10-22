import { test as base, expect } from '@playwright/test';

// Fixture-backed production pages through the real boundary, not real-service acceptance.
export const test = base.extend<{
  appURL: string;
  conditionalWorkflow: boolean;
  dataMapping: boolean;
  subprocessMapping: boolean;
  collapsedWorkflow: boolean;
  typedChoice: boolean;
  inlineAttachments: boolean;
  sharedRecords: boolean;
  administrationDetails: boolean;
  attachmentReceipt: 'absent' | 'committed' | null;
  diagnostics: void;
  authenticated: void;
}>({
  conditionalWorkflow: [false, { option: true }],
  dataMapping: [false, { option: true }],
  subprocessMapping: [false, { option: true }],
  collapsedWorkflow: [false, { option: true }],
  typedChoice: [false, { option: true }],
  inlineAttachments: [false, { option: true }],
  sharedRecords: [false, { option: true }],
  administrationDetails: [false, { option: true }],
  attachmentReceipt: [null, { option: true }],
  authenticated: [
    async ({ page, appURL }, use): Promise<void> => {
      await page.goto(appURL + '/login');
      await page.getByLabel('Username', { exact: true }).fill('fixture-user');
      await page
        .getByLabel('Password', { exact: true })
        .fill('fixture-password');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      const account = page.locator('details.account-menu summary');
      await expect(account).toContainText('fixture-user');
      await account.click();
      await expect(
        page.getByRole('button', { name: 'Sign out', exact: true }),
      ).toBeVisible();
      await account.click();
      await use();
    },
    { auto: true },
  ],
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
    {
      browserName,
      browser,
      page,
      conditionalWorkflow,
      dataMapping,
      subprocessMapping,
      collapsedWorkflow,
      typedChoice,
      inlineAttachments,
      sharedRecords,
      administrationDetails,
      attachmentReceipt,
    },
    use,
    testInfo,
  ): Promise<void> => {
    await testInfo.attach('browser-and-evidence', {
      body: JSON.stringify({
        browserName,
        browserVersion: browser.version(),
        evidence: 'fixture-backed production pages',
        conditionalWorkflow,
        collapsedWorkflow,
        typedChoice,
        attachmentReceipt,
      }),
      contentType: 'application/json',
    });
    const { startStudioBrowserFixture } =
      await import('../../server/playwright-studio-fixture.mjs');
    const app = await startStudioBrowserFixture({
      conditionalWorkflow,
      dataMapping,
      subprocessMapping,
      collapsedWorkflow,
      typedChoice,
      inlineAttachments,
      sharedRecords,
      administrationDetails,
      attachmentReceipt,
    });
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

export { expect } from '@playwright/test';
