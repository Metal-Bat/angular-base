import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`Workspace navigation remains reachable at ${width}px`, async ({
    page,
    appURL,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appURL + '/operations/dashboard');
    const navigation = page.getByRole('navigation', {
      name: 'Main navigation',
    });
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    if (width < 768) {
      await expect(navigation).toBeHidden();
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
    }
    await expect(navigation).toBeVisible();
    const dashboard = navigation.getByRole('link', {
      name: 'Dashboard',
      exact: true,
    });
    await expect(dashboard).toHaveAttribute('aria-current', 'page');
    await dashboard.focus();
    await expect(dashboard).toBeFocused();
    const size = await dashboard.boundingBox();
    expect(size?.height).toBeGreaterThanOrEqual(44);
    if (width >= 768) {
      const header = await page.locator('.workspace-header').boundingBox();
      const sidebar = await navigation.boundingBox();
      expect(
        Math.abs(
          (sidebar?.y ?? 0) - ((header?.y ?? 0) + (header?.height ?? 0)),
        ),
      ).toBeLessThanOrEqual(1);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath('workspace-navigation.png'),
      fullPage: true,
    });
    if (width < 768) {
      await menu.click();
      await expect(navigation).toBeHidden();
      await expect(
        page.getByRole('heading', { name: 'Dashboard', exact: true }),
      ).toBeVisible();
    }
  });
}
