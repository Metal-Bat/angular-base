import { saveUserTimezone } from './timezone-settings';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

const day = '2026-10-15';
type TimedFixture = {
  ref_id: string;
  title: string;
  editable: boolean;
  source_kind: 'manual';
  route_key: 'calendar_events';
  schedule: {
    kind: 'timed';
    timezone: 'UTC';
    start_at: string;
    end_at: string;
  };
};
const timed = (
  key: string,
  title: string,
  start: string,
  end: string,
): TimedFixture => ({
  ref_id: key,
  title,
  editable: true,
  source_kind: 'manual',
  route_key: 'calendar_events',
  schedule: {
    kind: 'timed',
    timezone: 'UTC',
    start_at: day + 'T' + start + 'Z',
    end_at: day + 'T' + end + 'Z',
  },
});
const allDay = Array.from({ length: 4 }, (_, index) => ({
  ref_id: 'all-day-' + index,
  title: 'All-day appointment ' + (index + 1),
  editable: true,
  source_kind: 'manual',
  route_key: 'calendar_events',
  schedule: {
    kind: 'all_day',
    timezone: 'UTC',
    start_date: day,
    end_date: '2026-10-16',
  },
}));
async function calendar(
  page: Page,
  appURL: string,
  width: number,
  items: readonly unknown[],
): Promise<Locator> {
  await saveUserTimezone(page, appURL, 'UTC');
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.clock.install({ time: new Date(day + 'T09:00:00Z') });
  await page.route('**/api/v1/calendar/events/search', async (route) => {
    expect(route.request().postDataJSON().size).toBe(100);
    await route.fulfill({
      json: {
        success: true,
        result: {
          items,
          page: 1,
          size: 100,
          total: items.length,
          total_pages: 1,
        },
      },
    });
  });
  await page.goto(appURL + '/operations/calendar');
  const views = page.locator('app-calendar-views');
  const rail = views.locator('app-calendar-rail');
  if (width === 390) {
    await rail.getByText('Calendar options', { exact: true }).click();
  }
  await expect(views.locator('.calendar-zone')).toContainText('UTC');
  await expect(
    views.getByRole('combobox', { name: 'Timezone', exact: true }),
  ).toHaveCount(0);
  await rail
    .getByRole('checkbox', { name: 'Work deadlines', exact: true })
    .uncheck();
  if (width === 390) {
    await rail.getByText('Calendar options', { exact: true }).click();
  } else {
    await views.getByRole('button', { name: 'Week', exact: true }).click();
  }
  await expect(
    views.locator('.time-lane[data-calendar-day="' + day + '"]'),
  ).toBeAttached();
  return views;
}
for (const width of [1440, 390]) {
  test(`Short calendar appointments have distinct full targets at ${width}px`, async ({
    page,
    appURL,
  }): Promise<void> => {
    const views = await calendar(page, appURL, width, [
      timed('first', 'Short first', '10:00:00', '10:10:00'),
      timed('second', 'Short second', '10:50:00', '11:00:00'),
      timed('late', 'Late appointment', '23:58:00', '23:59:00'),
    ]);
    const first = views
      .locator('.timed-event')
      .filter({ hasText: 'Short first' });
    const second = views
      .locator('.timed-event')
      .filter({ hasText: 'Short second' });
    await first.focus();
    const a = (await first.boundingBox())!;
    const b = (await second.boundingBox())!;
    for (const box of [a, b]) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const overlap =
      Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
      Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);
    expect(
      overlap,
      'Minimum target height must participate in collision layout',
    ).toBe(false);
    await expect(first).toContainText('10:00');
    await expect(first).toContainText('10:10');
    const late = views
      .locator('.timed-event')
      .filter({ hasText: 'Late appointment' });
    await late.focus();
    await expect(late).toBeInViewport({ ratio: 1 });
    expect((await late.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(late).toContainText('11:58');
    await first.focus();
    await expect(first).toBeFocused();
    expect(
      await first.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          element.ownerDocument
            .elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
            ?.closest('.timed-event') === element
        );
      }),
    ).toBe(true);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(width);
  });
  test(`Calendar all-day rows stay reachable while hours scroll at ${width}px`, async ({
    page,
    appURL,
  }): Promise<void> => {
    const views = await calendar(page, appURL, width, allDay);
    const scroll = views.locator('.time-scroll');
    await scroll.hover();
    await page.mouse.wheel(0, 450);
    await expect
      .poll(() => scroll.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(200);
    const lane = views
      .locator('.all-day-lane')
      .filter({ hasText: 'All-day appointment 1' });
    await expect(
      lane.getByRole('button').filter({ hasText: 'All-day appointment 1' }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      lane.getByRole('button', { name: /View more events in agenda/ }),
    ).toBeVisible();
    expect((await lane.boundingBox())!.height).toBeLessThanOrEqual(180);
    await page.screenshot({
      path: test.info().outputPath('calendar-pinned-all-day.png'),
      fullPage: true,
    });
    await lane
      .getByRole('button', { name: /View more events in agenda/ })
      .click();
    for (let index = 1; index <= 4; index++) {
      await expect(
        views
          .locator('.calendar-agenda button')
          .filter({ hasText: 'All-day appointment ' + index }),
      ).toHaveCount(1);
    }
  });
  test(`Dense timed events remain reachable in Agenda at ${width}px`, async ({
    page,
    appURL,
  }): Promise<void> => {
    const items = ['Alpha', 'Beta', 'Gamma', 'Delta'].map((name) =>
      timed(name.toLowerCase(), name + ' appointment', '14:00:00', '14:10:00'),
    );
    const views = await calendar(page, appURL, width, items);
    const lane = views.locator('.time-lane[data-calendar-day="' + day + '"]');
    const more = lane.getByRole('button', {
      name: /View more events in agenda/,
    });
    const calendarWrites: string[] = [];
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) &&
        path.startsWith('/api/v1/calendar/events') &&
        !path.endsWith('/search')
      ) {
        calendarWrites.push(path);
      }
    });
    await expect(more).toBeVisible();
    await more.focus();
    for (const event of await lane.locator('.timed-event').all()) {
      const bounds = (await event.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await more.click();
    const agenda =
      width === 390
        ? views.getByRole('combobox', { name: 'Calendar view', exact: true })
        : views.getByRole('button', { name: 'Agenda', exact: true });
    await expect(agenda).toBeFocused();
    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta']) {
      await expect(
        views
          .locator('.calendar-agenda button')
          .filter({ hasText: name + ' appointment' }),
      ).toHaveCount(1);
    }
    await expect(views.locator('.calendar-agenda > section')).toHaveCount(1);
    expect(await views.locator('#calendar-workflow').isChecked()).toBe(false);
    expect(calendarWrites).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath('calendar-dense-agenda.png'),
      fullPage: true,
    });
  });
}
