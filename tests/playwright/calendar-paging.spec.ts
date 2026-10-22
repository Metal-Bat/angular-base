import { expect, test } from './fixtures';

test('Calendar retains bounded partial pages, deduplicates chips, and exposes an explicit complete refresh', async ({
  page,
  appURL,
}) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  const event = {
    ref_id: 'fixture-partial',
    title: 'Partial appointment',
    editable: false,
    source_kind: 'manual',
    route_key: 'calendar_events',
    schedule: {
      kind: 'all_day',
      timezone: 'UTC',
      start_date: '2026-10-15',
      end_date: '2026-10-16',
    },
  };
  const pages: number[] = [];
  let complete = false;
  await page.route('**/api/v1/calendar/events/search', async (route) => {
    const body = route.request().postDataJSON();
    pages.push(body.page);
    expect(body.size).toBe(100);
    await route.fulfill({
      json: {
        success: true,
        result: {
          items: [event],
          page: body.page,
          size: 100,
          total: complete ? 1 : 2100,
          total_pages: complete ? 1 : 21,
        },
      },
    });
  });
  await page.goto(appURL + '/operations/calendar');
  const views = page.locator('app-calendar-views');
  const warning = views.getByRole('alert');
  await expect(warning).toContainText('Only some events are shown.');
  expect(pages).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
  await expect(
    views.getByRole('button', {
      name: 'Partial appointment All day',
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(
    views.getByText('No events in this range.', { exact: true }),
  ).toHaveCount(0);
  complete = true;
  await views.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(warning).toHaveCount(0);
  expect(pages).toEqual([
    ...Array.from({ length: 20 }, (_, index) => index + 1),
    1,
  ]);
  await expect(
    views.getByRole('button', {
      name: 'Partial appointment All day',
      exact: true,
    }),
  ).toHaveCount(1);
});

test('Month overflow expands actual event chips without fetching or losing their detail actions', async ({
  page,
  appURL,
}) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  let requests = 0;
  const items = Array.from({ length: 5 }, (_, index) => ({
    ref_id: 'fixture-overflow-' + index,
    title: 'Literal appointment ' + index,
    editable: false,
    source_kind: 'manual',
    route_key: 'calendar_events',
    schedule: {
      kind: 'all_day',
      timezone: 'UTC',
      start_date: '2026-10-15',
      end_date: '2026-10-16',
    },
  }));
  await page.route('**/api/v1/calendar/events/search', async (route) => {
    requests++;
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
  const cell = views.getByRole('cell', {
    name: 'Thursday, October 15, 2026',
    exact: true,
  });
  const chips = cell.locator('.day-events button');
  await expect(chips).toHaveCount(3);
  const more = cell.getByRole('button', {
    name: 'More events (2)',
    exact: true,
  });
  await more.click();
  await expect(chips).toHaveCount(5);
  const less = cell.getByRole('button', { name: 'Show less', exact: true });
  await expect(less).toHaveAttribute('aria-expanded', 'true');
  await chips.last().click();
  const details = page.getByRole('dialog', {
    name: 'Event details',
    exact: true,
  });
  await expect(
    details.getByRole('heading', {
      name: 'Literal appointment 4',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    details.getByRole('button', { name: 'Edit', exact: true }),
  ).toHaveCount(0);
  await details.getByRole('button', { name: 'Close', exact: true }).click();
  await less.click();
  await expect(chips).toHaveCount(3);
  expect(requests).toBe(1);
});
