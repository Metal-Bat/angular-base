import { expect, test } from './fixtures';

test('Calendar time grid scrolls to now and creates an unsaved local draft from keyboard slots', async ({
  page,
  appURL,
}) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  await page.goto(appURL + '/operations/calendar');
  const views = page.locator('app-calendar-views');
  const week = views.getByRole('button', { name: 'Week', exact: true });
  await week.click();
  const scroll = views.locator('.time-scroll');
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  const now = views.getByRole('img', { name: 'Current time', exact: true });
  await expect(now).toBeInViewport();
  const lane = views.locator('.time-lane[data-calendar-day="2026-10-15"]');
  const slot = lane.locator('[data-slot-hour="13"]');
  await slot.focus();
  await slot.press('ArrowDown');
  const next = lane.locator('[data-slot-hour="14"]');
  await expect(next).toBeFocused();
  await next.press('Enter');
  const editor = page.locator('app-calendar-editor');
  await expect(editor.getByLabel('Title', { exact: true })).toBeFocused();
  await expect(editor.locator('#event-start')).toHaveValue('2026-10-15');
  await expect(editor.locator('#event-start-time')).toHaveValue('14:00');
  await expect(editor.locator('#event-end')).toHaveValue('2026-10-15');
  await expect(editor.locator('#event-end-time')).toHaveValue('15:00');
  await expect(editor).toContainText('Asia/Tehran');
  await expect(
    editor.getByRole('combobox', { name: 'Timezone', exact: true }),
  ).toHaveCount(0);
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(week).toHaveAttribute('aria-pressed', 'true');
  await expect(next).toBeFocused();
  await views.getByRole('button', { name: 'Month', exact: true }).click();
  await views
    .getByRole('button', {
      name: 'Create event · Wednesday, October 14, 2026',
      exact: true,
    })
    .click();
  await expect(
    editor.getByRole('combobox', { name: 'Schedule', exact: true }),
  ).toContainText('All day');
  await expect(editor.locator('#event-start')).toHaveValue('2026-10-14');
  await expect(editor.locator('#event-end')).toHaveValue('2026-10-15');
  await expect(editor.locator('p-datepicker')).toHaveCount(0);
});

test('Phone calendar starts in Day and collapses the mini-month without losing source choices', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/operations/calendar');
  const views = page.locator('app-calendar-views');
  await expect(
    views.getByRole('combobox', { name: 'Calendar view', exact: true }),
  ).toContainText('Day');
  const rail = views.locator('app-calendar-rail');
  await expect(
    rail.getByRole('checkbox', { name: 'My events', exact: true }),
  ).toBeHidden();
  await rail.locator('summary').first().click();
  const source = rail.getByRole('checkbox', { name: 'My events', exact: true });
  await expect(source).toBeChecked();
  await source.uncheck();
  await expect(source).not.toBeChecked();
  await rail.locator('summary').first().click();
  await expect(source).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(source).toBeVisible();
  await expect(source).not.toBeChecked();
  await expect(
    views.getByRole('button', { name: 'Day', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(1440);
});
