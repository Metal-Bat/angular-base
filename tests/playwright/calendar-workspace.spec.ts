import { saveUserTimezone } from './timezone-settings';
import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures';

test('Calendar page editing preserves the selected view and guards an explicit DST draft', async ({
  page,
  appURL,
}, testInfo): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await saveUserTimezone(page, appURL, 'America/New_York');
  await page.goto(appURL + '/operations/calendar');
  const calendar = page.locator('app-calendar-page');
  await expect(page).toHaveTitle(/Calendar/);
  const week = calendar.getByRole('button', { name: 'Week', exact: true });
  await week.click();
  await expect(week).toHaveAttribute('aria-pressed', 'true');
  const create = calendar.getByRole('button', {
    name: 'Create event',
    exact: true,
  });
  await create.click();
  const editor = calendar.locator('app-calendar-editor');
  await expect(editor.getByLabel('Title', { exact: true })).toBeFocused();
  await expect(calendar.locator('app-calendar-views')).toBeHidden();
  await expect(
    editor.getByRole('button', { name: 'Save', exact: true }),
  ).toBeVisible();
  await editor
    .getByLabel('Title', { exact: true })
    .fill('Literal DST appointment');
  await expect(editor).toContainText('America/New_York');
  await expect(
    editor.getByRole('combobox', { name: 'Timezone', exact: true }),
  ).toHaveCount(0);
  const setTime = async (
    id: string,
    hour: number,
    minute: number,
  ): Promise<void> => {
    await editor.locator('#' + id).fill('2026-11-01');
    const clock = editor.locator('#' + id + '-time');
    await clock.click();
    for (const [unit, target, maximum] of [
      ['hour', hour, 24],
      ['minute', minute, 60],
    ] as const) {
      const picker: Locator = page.locator('.p-datepicker-' + unit + '-picker');
      await expect(picker).toBeVisible();
      for (let count = 0; count < maximum; count++) {
        const current = Number(await picker.locator('span').textContent());
        if (current === target) {
          break;
        }
        const increase = (target - current + maximum) % maximum <= maximum / 2;
        const step = picker.locator('button').nth(increase ? 0 : 1);
        await step.focus();
        await expect(step).toBeFocused();
        await step.press('Enter');
        const next = (current + (increase ? 1 : -1) + maximum) % maximum;
        await expect(picker.locator('span')).toHaveText(
          String(next).padStart(2, '0'),
        );
      }
      await expect(picker.locator('span')).toHaveText(
        String(target).padStart(2, '0'),
      );
    }
    await clock.press('Escape');
    await expect(page.locator('.p-datepicker-panel')).toHaveCount(0);
  };
  await setTime('event-start', 1, 30);
  await setTime('event-end', 3, 0);
  const offset = editor.getByRole('combobox', {
    name: 'Start offset',
    exact: true,
  });
  await expect(offset).toBeVisible();
  await offset.click();
  await page
    .getByRole('option', { name: '2026-11-01T05:30:00.000Z', exact: true })
    .click();
  await expect(offset).toContainText('2026-11-01T05:30:00.000Z');
  await expect(
    editor.getByRole('combobox', { name: 'End offset', exact: true }),
  ).toHaveCount(0);
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Confirm action',
    exact: true,
  });
  await expect(confirmation).toContainText('Discard unsaved calendar changes?');
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(editor.getByLabel('Title', { exact: true })).toHaveValue(
    'Literal DST appointment',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
  for (const name of ['Choose date', 'Clear date or time']) {
    const bounds = await editor
      .getByRole('button', { name, exact: true })
      .first()
      .boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  await editor.locator('#event-end-time').click();
  const phoneClock = page.locator('.p-datepicker-time-picker');
  await expect(phoneClock).toBeVisible();
  for (const button of await phoneClock.locator('button').all()) {
    await expect
      .poll(async () => (await button.boundingBox())!.width)
      .toBeGreaterThanOrEqual(44);
    await expect
      .poll(async () => (await button.boundingBox())!.height)
      .toBeGreaterThanOrEqual(44);
  }
  await editor.locator('#event-end-time').press('Escape');
  await testInfo.attach('phone-calendar-edit', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await confirmation
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  await expect(
    calendar.getByRole('combobox', { name: 'Calendar view', exact: true }),
  ).toContainText('Week');
  await expect(create).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(week).toHaveAttribute('aria-pressed', 'true');
  await expect(create).toBeFocused();
});

test('Date settings stay inside the anchored popup and preserve canonical dates', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/operations/calendar');
  await page.getByRole('button', { name: 'Create event', exact: true }).click();
  const editor = page.locator('app-calendar-editor');
  await editor.getByRole('combobox', { name: 'Schedule', exact: true }).click();
  await page.getByRole('option', { name: 'All day', exact: true }).click();
  const input = editor.locator('#event-start');
  await input.fill('2024-03-20');
  const trigger = editor
    .getByRole('button', { name: 'Choose date', exact: true })
    .first();
  await expect(
    editor.getByRole('combobox', { name: 'Calendar system', exact: true }),
  ).toHaveCount(0);
  await trigger.click();
  const popup = page
    .locator('.p-popover')
    .filter({ has: page.locator('.calendar-sheet') });
  await expect(popup).toHaveAttribute('aria-modal', 'false');
  const system = popup.getByRole('combobox', {
    name: 'Calendar system',
    exact: true,
  });
  await system.click();
  await expect(
    page.getByRole('option', { name: 'Jalali', exact: true }),
  ).toBeVisible();
  await system.press('Escape');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(popup).toBeVisible();
  await system.click();
  await page.getByRole('option', { name: 'Jalali', exact: true }).click();
  await expect(input).toHaveValue('1403-01-01');
  await expect(
    popup.locator('[data-calendar-day="2024-03-20"]'),
  ).toHaveAttribute('aria-pressed', 'true');
  await system.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  const title = editor.getByLabel('Title', { exact: true });
  await title.click();
  await expect(popup).toHaveCount(0);
  await expect(title).toBeFocused();
  await page.setViewportSize({ width: 390, height: 382 });
  await trigger.click();
  await expect(popup).toBeVisible();
  const bounds = await popup.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(382);
  await expect(system).toBeVisible();
  await popup.locator('[data-calendar-day="2024-03-20"]').click();
  await expect(input).toHaveValue('1403-01-01');
  await input.fill('1403-13-99');
  await trigger.click();
  await expect(system).toHaveAttribute('aria-disabled', 'true');
  await system.press('Escape');
  await expect(input).toHaveValue('1403-13-99');
});
