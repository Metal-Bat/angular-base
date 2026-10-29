import { expect, test } from './fixtures';
test.use({ operationNotices: true });
for (const width of [1440, 390]) {
  test(`Operation notices open current evidence without executing an effect at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const effects: string[] = [];
    page.on('request', (request) => {
      if (
        /\/(reconcile|recover|resume|complete|evaluations)$/.test(
          new URL(request.url()).pathname,
        )
      ) {
        effects.push(request.url());
      }
    });
    await page.goto(appURL + '/operations/notifications');
    const inbox = page.locator('app-personal-services');
    await inbox
      .getByRole('button', { name: 'Notification unavailable', exact: true })
      .click();
    const detail = inbox.locator('app-personal-service-detail');
    await expect(
      detail.getByRole('button', { name: 'Open', exact: true }),
    ).toHaveCount(0);
    await detail.getByRole('button', { name: 'Close', exact: true }).click();
    await inbox
      .getByRole('button', {
        name: 'Operation requires attention',
        exact: true,
      })
      .click();
    await detail.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(page).toHaveURL(
      appURL + '/operations/processes/process_unknown',
    );
    const evidence = page.locator('app-process-evidence');
    await expect(evidence).toContainText(
      'No confirmed receipt is available. Do not repeat the operation.',
    );
    await expect(evidence).not.toContainText('receipt_confirmed');
    expect(effects).toEqual([]);
    await page.goto(appURL + '/operations/notifications');
    await inbox
      .getByRole('button', { name: 'Business receipt confirmed', exact: true })
      .click();
    await detail.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(page).toHaveURL(
      appURL + '/operations/processes/process_confirmed',
    );
    await expect(evidence).toContainText('receipt_confirmed');
    const settings = page.locator('app-workspace-preferences details');
    if ((await settings.getAttribute('open')) === null) {
      await settings.locator('summary').click();
    }
    await settings.locator('[data-language-picker] [role="combobox"]').click();
    await page.getByRole('option', { name: 'فارسی', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(evidence).toContainText('receipt_confirmed');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    expect(effects).toEqual([]);
    if (width === 390) {
      await settings.locator('summary').click();
    }
    await page.screenshot({
      path: test.info().outputPath('operation-evidence-fa.png'),
      fullPage: true,
    });
  });
}
