import { expect, test } from './fixtures';

test('Focus mode frees measured vertical space and restores global controls on exit and navigation', async ({
  page,
  appURL,
}, testInfo): Promise<void> => {
  await page.setViewportSize({ width: 720, height: 382 });
  for (const [name, path, surface] of [
    [
      'workflow',
      '/studio/workflow-versions/fixture-flow/edit',
      '.canvas-workspace',
    ],
    [
      'form',
      '/studio/form-versions/fixture-form-versions-v1/edit',
      '.editor-content',
    ],
  ]) {
    await page.goto(appURL + path);
    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();
    const toggle = page.getByRole('button', {
      name: 'Focus mode',
      exact: true,
    });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const viewport = page.locator(surface);
    await expect(viewport).toBeVisible();
    if (name === 'workflow') {
      await expect(page.locator('.board-node')).toHaveCount(2);
    } else {
      await expect(
        page.getByText('Up to date', { exact: true }),
      ).toBeAttached();
    }
    await expect(page.locator('html')).toHaveCSS(
      '--workspace-control-height',
      '2.875rem',
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    const metrics = (): Promise<unknown> =>
      page.evaluate(() => ({
        scrollY,
        innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
        boxes: [
          '.workspace-header',
          'app-workflow-board',
          'app-form-builder',
          'main',
          '.breadcrumb',
          '.editor-document-bar',
          '.console-page-header',
          '.canvas-workspace',
          '.canvas-toolbar',
          '.canvas-stage',
          '.editor-content',
        ].map((selector) => {
          const element = document.querySelector<HTMLElement>(selector);
          const rect = element?.getBoundingClientRect();
          return {
            selector,
            y: rect?.y,
            height: rect?.height,
            available: element?.style.getPropertyValue(
              '--editor-available-height',
            ),
          };
        }),
      }));
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
      .toBeLessThanOrEqual(383);
    const beforeMetrics = await metrics();
    const before = await viewport.boundingBox();
    const header = await banner.boundingBox();
    expect(header!.height).toBeGreaterThanOrEqual(60);
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(banner).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toBeFocused();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await testInfo.attach(name + '-focus-geometry', {
      body: JSON.stringify({ before: beforeMetrics, after: await metrics() }),
      contentType: 'application/json',
    });
    await expect
      .poll(async () => (await viewport.boundingBox())!.height)
      .toBeGreaterThanOrEqual(before!.height + header!.height - 1);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
      .toBeLessThanOrEqual(383);
    if (name === 'workflow') {
      await expect
        .poll(
          async () =>
            (await page.locator('.canvas-stage').boundingBox())!.height,
        )
        .toBeGreaterThanOrEqual(100);
      await page.getByRole('button', { name: 'View', exact: true }).click();
      await page
        .getByRole('menuitem', { name: 'Reset view', exact: true })
        .click();
      await expect(page.locator('.zoom-value')).toHaveText('100%');
      await page.getByRole('button', { name: 'View', exact: true }).click();
      await page
        .getByRole('menuitem', { name: 'Zoom out', exact: true })
        .click();
      await expect(page.locator('.zoom-value')).toHaveText('90%');
      await page.getByRole('button', { name: 'View', exact: true }).click();
      await page
        .getByRole('menuitem', { name: 'Reset view', exact: true })
        .click();
      await expect(page.locator('.zoom-value')).toHaveText('100%');
      const help = page.getByRole('button', { name: 'Help', exact: true });
      await help.click();
      const popup = page.getByRole('dialog', { name: 'Help', exact: true });
      await expect(popup).toHaveAttribute('aria-modal', 'false');
      await expect(popup).toContainText('Control flow');
      await expect(popup).toContainText('Data binding');
      const bounds = await popup.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(720);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(382);
      await page.keyboard.press('Escape');
      await expect(popup).toHaveCount(0);
      await expect(help).toBeFocused();
    }
    await testInfo.attach(name + '-focused-short-viewport', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await toggle.click();
    await expect(banner).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await page
      .getByRole('navigation', { name: 'Breadcrumb', exact: true })
      .getByRole('link', { name: 'Studio', exact: true })
      .click();
    await expect(page).toHaveURL(appURL + '/studio');
    await expect(banner).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Focus mode', exact: true }),
    ).toHaveCount(0);
  }
});

test('Canvas toolbar adapts to the actual pane beside inspectors', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await expect(page.locator('.board-node')).toHaveCount(2);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'View', exact: true }),
  ).toBeVisible();
  const panel = await page.locator('.canvas-panel').boundingBox();
  expect(panel!.width).toBeLessThan(864);
  await expect
    .poll(
      async () => (await page.locator('.canvas-toolbar').boundingBox())!.height,
    )
    .toBeLessThanOrEqual(72);
  await expect
    .poll(
      async () => (await page.locator('.canvas-stage').boundingBox())!.height,
    )
    .toBeGreaterThanOrEqual(300);
});
