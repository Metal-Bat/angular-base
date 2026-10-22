import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

test.use({ administrationDetails: true });

async function anchored(panel: Locator, trigger: Locator): Promise<void> {
  await expect(panel).toBeVisible();
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      const anchor = await trigger.boundingBox();
      if (!box || !anchor) {
        return false;
      }
      return (
        Math.min(
          Math.abs(box.y - anchor.y - anchor.height),
          Math.abs(box.y + box.height - anchor.y),
        ) <= 16 &&
        box.x < anchor.x + anchor.width &&
        box.x + box.width > anchor.x
      );
    })
    .toBe(true);
}
async function language(page: Page, code: 'en' | 'fa' | 'ar'): Promise<void> {
  await page.locator('[data-language-picker] [role=combobox]').click();
  await page
    .getByRole('option', {
      name: { en: 'English', fa: 'فارسی', ar: 'العربية' }[code],
      exact: true,
    })
    .click();
  await expect(page.locator('html')).toHaveAttribute('lang', code);
}
for (const code of ['en', 'fa', 'ar'] as const) {
  for (const width of [390, 1440]) {
    test(`${code} ${width}: nested filter and calendar selects remain anchored and commit real selections`, async ({
      page,
      appURL,
    }, testInfo): Promise<void> => {
      await page.clock.setFixedTime(new Date('2026-10-17T12:00:00Z'));
      await page.setViewportSize({ width: 1440, height: 900 });
      await language(page, code);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(appURL + '/administration/tasks/schedules');
      const filter = page
        .locator('[app-record-table-header] button')
        .filter({ has: page.locator('.pi-filter') })
        .first();
      await filter.click();
      const form = page.locator('.column-filter');
      const condition = form
        .locator('app-select-control [role=combobox]')
        .first();
      await condition.click();
      await anchored(page.locator('.p-select-overlay'), condition);
      await page.getByRole('option').nth(1).click();
      await expect(form).toBeVisible();
      await expect(page.getByRole('listbox')).toHaveCount(0);
      const input = form.locator('input').first();
      await input.fill('audit-value');
      const request = page.waitForRequest(
        (r) =>
          r.url().endsWith('/api/v1/tasks/schedules/search') &&
          r.method() === 'POST',
      );
      await form.locator('button[type=submit]').click();
      expect((await request).postDataJSON().filters[0].operation).toBe(
        'notEqual',
      );
      await page.goto(appURL + '/operations/calendar');
      const rail = page.locator('details.calendar-rail');
      if ((await rail.getAttribute('open')) === null) {
        await rail.locator('summary').first().click();
      }
      await page.locator('.calendar-settings summary').click();
      const date = page.locator('#calendar-date');
      const temporal = page
        .locator('app-temporal-control')
        .filter({ has: date });
      await temporal.locator('.date-entry button').click();
      const sheet = page.locator('.calendar-sheet');
      const system = sheet.locator('[role=combobox]');
      await system.click();
      await anchored(page.locator('.p-select-overlay'), system);
      await page.getByRole('option').first().click();
      await expect(sheet).toBeVisible();
      const day = sheet.locator('[data-calendar-day="2026-10-18"]');
      await day.click();
      await expect(date).toHaveValue('2026-10-18');
      await expect(
        page.locator('.mini-days [data-calendar-day="2026-10-18"]'),
      ).toHaveAttribute('aria-pressed', 'true');
      await page.locator('.mini-days [data-calendar-day="2026-10-19"]').click();
      await expect(date).toHaveValue('2026-10-19');
      await expect(
        page.locator(
          '.month-grid [data-calendar-day="2026-10-19"], .time-lane[data-calendar-day="2026-10-19"]',
        ),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: testInfo.outputPath('calendar-selected.png'),
      });
    });
  }
}
test('Public theme survives logout, login-page reload and a new tab, while language and theme retain spacing', async ({
  page,
  appURL,
  context,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const controls = page.locator('.preference-controls');
  expect(
    await controls.evaluate((e) => parseFloat(getComputedStyle(e).gap)),
  ).toBeGreaterThanOrEqual(12);
  await page.locator('app-theme-picker [role=combobox]').click();
  await page.locator('[data-theme-option="teal-dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'teal');
  await page.locator('.account-menu summary').click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('app-login')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/app-dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'teal');
  await expect(page.locator('html')).toHaveClass(/app-dark/);
  const tab = await context.newPage();
  await tab.goto(appURL + '/login');
  await expect(tab.locator('html')).toHaveClass(/app-dark/);
  expect(await tab.evaluate(() => ({ ...localStorage }))).toEqual({
    'workspace.public-theme': 'teal-dark',
  });
  expect(await tab.evaluate(() => sessionStorage.length)).toBe(0);
  await tab.close();
});
