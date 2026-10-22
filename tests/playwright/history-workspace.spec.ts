import { expect, test } from './fixtures';

test('Phone history comparison can be scrolled with the keyboard without moving the page', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/users');
  await page.getByRole('link', { name: 'Ali', exact: true }).click();
  await page.getByRole('button', { name: 'User History', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'History', exact: true });
  await dialog
    .getByRole('button', { name: 'Open', exact: true })
    .first()
    .click();
  const scroll = dialog.locator('.change-comparison [role="region"]');
  await expect(scroll).toHaveAccessibleName('Field changes');
  await expect(scroll).toHaveAttribute('tabindex', '0');
  expect(
    await scroll.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
  await scroll.focus();
  await expect(scroll).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
