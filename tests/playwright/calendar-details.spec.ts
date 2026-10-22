import { expect, test } from './fixtures';

test('Calendar chips open anchored source details before current-reference editing or deletion', async ({
  page,
  appURL,
}) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  const appointment = {
    ref_id: 'fixture-event-old',
    title: 'Literal appointment',
    editable: true,
    source_kind: 'manual',
    route_key: 'calendar_events',
    schedule: {
      kind: 'all_day',
      timezone: 'UTC',
      start_date: '2026-10-14',
      end_date: '2026-10-16',
    },
  };
  const deadline = {
    ref_id: 'fixture-work-current',
    title: 'Literal deadline',
    editable: false,
    source_kind: 'work_item',
    route_key: 'work_items',
    schedule: {
      kind: 'deadline',
      timezone: 'UTC',
      due_at: '2026-10-15T13:00:00Z',
    },
  };
  let deleted = false;
  let searches = 0;
  const deletes: string[] = [];
  await page.route('**/api/v1/calendar/events/search', async (route) => {
    searches++;
    const items = deleted ? [deadline] : [appointment, deadline];
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
  await page.route('**/api/v1/calendar/events/fixture-event-old', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          ...appointment,
          ref_id: 'fixture-event-current',
          title: 'Current appointment',
        },
      },
    }),
  );
  await page.route(
    '**/api/v1/calendar/events/fixture-event-current/reminders',
    (route) => route.fulfill({ json: { success: true, data: [] } }),
  );
  await page.route(
    '**/api/v1/calendar/events/fixture-event-current',
    async (route) => {
      expect(route.request().method()).toBe('DELETE');
      deletes.push(route.request().url());
      deleted = true;
      await route.fulfill({ json: { success: true, data: null } });
    },
  );
  await page.goto(appURL + '/operations/calendar');
  const views = page.locator('app-calendar-views');
  const chip = views
    .getByRole('button', { name: 'Literal appointment All day', exact: true })
    .first();
  await expect(chip).toBeVisible();
  const initialSearches = searches;
  const source = views.getByRole('checkbox', {
    name: 'My events',
    exact: true,
  });
  await source.uncheck();
  await expect(chip).toHaveCount(0);
  await expect(
    views.getByText('Literal deadline', { exact: true }),
  ).toBeVisible();
  await source.check();
  await expect(chip).toBeVisible();
  expect(searches).toBe(initialSearches);
  await chip.click();
  const details = page.getByRole('dialog', {
    name: 'Event details',
    exact: true,
  });
  await expect(details).toHaveAttribute('aria-modal', 'false');
  await expect(
    details.getByRole('heading', { name: 'Literal appointment', exact: true }),
  ).toBeVisible();
  await expect(details).toContainText('Personal event');
  await expect(details.locator('time[datetime="2026-10-14"]')).toBeVisible();
  await expect(details.locator('time[datetime="2026-10-15"]')).toBeVisible();
  await expect(details.locator('time[datetime="2026-10-16"]')).toHaveCount(0);
  await expect(page.locator('app-calendar-editor')).toHaveCount(0);
  await details
    .getByRole('button', { name: 'Close', exact: true })
    .press('Escape');
  await expect(details).toHaveCount(0);
  await expect(chip).toBeFocused();
  await views.getByText('Literal deadline', { exact: true }).click();
  await expect(details).toContainText('Workflow deadline');
  await expect(
    details.getByRole('button', { name: 'Edit', exact: true }),
  ).toHaveCount(0);
  await expect(
    details.getByRole('button', { name: 'Delete', exact: true }),
  ).toHaveCount(0);
  await expect(
    details.getByRole('link', { name: 'Open task', exact: true }),
  ).toHaveAttribute('href', '/operations/tasks/fixture-work-current');
  await details.getByRole('button', { name: 'Close', exact: true }).click();
  await chip.click();
  const transition = await page.evaluateHandle(() => {
    const state = { overlap: false };
    const observer = new MutationObserver(() => {
      if (
        document.querySelector('app-calendar-editor') &&
        document.querySelector(
          '.p-popover[role="dialog"][aria-label="Event details"]',
        )
      ) {
        state.overlap = true;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return { state, stop: (): void => observer.disconnect() };
  });
  await details.getByRole('button', { name: 'Edit', exact: true }).click();
  const editor = page.locator('app-calendar-editor');
  await expect(editor.getByLabel('Title', { exact: true })).toHaveValue(
    'Current appointment',
  );
  await expect(editor.getByLabel('Title', { exact: true })).toBeFocused();
  expect(await transition.evaluate((value) => value.state.overlap)).toBe(false);
  await transition.evaluate((value) => value.stop());
  await transition.dispose();
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(chip).toBeFocused();
  await chip.click();
  await details.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Confirm action',
    exact: true,
  });
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  expect(deletes).toEqual([]);
  await expect(details).toBeVisible();
  await details.getByRole('button', { name: 'Delete', exact: true }).click();
  await confirmation
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await expect(
    views.getByText('Literal appointment', { exact: true }),
  ).toHaveCount(0);
  expect(deletes).toHaveLength(1);
  expect(new URL(deletes[0]).pathname).toBe(
    '/api/v1/calendar/events/fixture-event-current',
  );
});
