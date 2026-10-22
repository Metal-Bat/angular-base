import { expect, test } from './fixtures';

test('Phone view selection renders the selected period and keeps the page within the viewport', async ({
  page,
  appURL,
}, testInfo): Promise<void> => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/operations/calendar');
  const views = page.locator('app-calendar-views');
  const selector = views.getByRole('combobox', {
    name: 'Calendar view',
    exact: true,
  });
  for (const [name, target, count] of [
    ['Week', '.time-lane', 7],
    ['Month', '.month-grid', 1],
    ['Day', '.time-lane', 1],
    ['Agenda', '.calendar-agenda', 1],
    ['Month', '.month-grid', 1],
    ['Day', '.time-lane', 1],
  ] as const) {
    await selector.click();
    await page.getByRole('option', { name, exact: true }).click();
    await expect(selector).toContainText(name);
    await expect(views.locator(target)).toHaveCount(count);
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(390);
    await expect(selector).toBeFocused();
    if (name === 'Week') {
      const chosen = views.locator(
        '.time-lane[data-calendar-day="2026-10-15"]',
      );
      const axis = await views.locator('.time-axis').boundingBox();
      const bounds = await chosen.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(axis!.x + axis!.width - 1);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    }
    if (name === 'Month') {
      const chosen = await views
        .locator('.month-grid [data-calendar-day="2026-10-15"]')
        .boundingBox();
      expect(chosen!.x).toBeGreaterThanOrEqual(16);
      expect(chosen!.x + chosen!.width).toBeLessThanOrEqual(390);
    }
    const path = testInfo.outputPath('phone-calendar-' + name + '.png');
    await page.screenshot({ path });
    await testInfo.attach('phone-calendar-' + name, {
      path,
      contentType: 'image/png',
    });
  }
});

test('RTL period selection keeps the chosen day visible and the time column pinned', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  await page.goto(appURL + '/operations/calendar');
  await page.getByRole('combobox', { name: 'Language', exact: true }).click();
  await page.getByRole('option', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.setViewportSize({ width: 390, height: 844 });
  const views = page.locator('app-calendar-views');
  const selector = views.getByRole('combobox', {
    name: 'نمای تقویم',
    exact: true,
  });
  await selector.click();
  await page.getByRole('option', { name: 'هفته', exact: true }).click();
  const axis = views.locator('.time-axis');
  const chosen = views.locator('.time-lane[data-calendar-day="2026-10-15"]');
  await expect
    .poll(async () => {
      const time = await axis.boundingBox();
      const cell = await chosen.boundingBox();
      return !!(
        time &&
        cell &&
        cell.x >= 16 &&
        cell.x + cell.width <= time.x + 1
      );
    })
    .toBe(true);
  const grid = views.getByRole('region', {
    name: 'جدول زمانی تقویم',
    exact: true,
  });
  await grid.focus();
  await grid.press('ArrowLeft');
  await expect
    .poll(
      async () =>
        (await axis.boundingBox())!.x + (await axis.boundingBox())!.width,
    )
    .toBeLessThanOrEqual(374);
  await selector.click();
  await page.getByRole('option', { name: 'ماه', exact: true }).click();
  await expect
    .poll(async () => {
      const cell = await views
        .locator('.month-grid [data-calendar-day="2026-10-15"]')
        .boundingBox();
      return !!(cell && cell.x >= 16 && cell.x + cell.width <= 390);
    })
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
});

for (const language of ['en', 'fa'] as const) {
  test(`${language} mini-calendar and date picker immediately display the chosen date in each view`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'));
    await page.goto(appURL + '/operations/calendar');
    if (language === 'fa') {
      await page
        .getByRole('combobox', { name: 'Language', exact: true })
        .click();
      await page.getByRole('option', { name: 'فارسی', exact: true }).click();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const views = page.locator('app-calendar-views');
    const rail = views.locator('app-calendar-rail');
    await rail.locator('.calendar-rail > summary').click();
    const selector = views.getByRole('combobox', {
      name: language === 'en' ? 'Calendar view' : 'نمای تقویم',
      exact: true,
    });
    for (const [view, iso] of [
      ['Day', '2026-10-20'],
      ['Week', '2026-10-22'],
      ['Month', '2026-10-19'],
    ] as const) {
      await selector.click();
      await page
        .getByRole('option', {
          name:
            language === 'en'
              ? view
              : { Day: 'روز', Week: 'هفته', Month: 'ماه' }[view],
          exact: true,
        })
        .click();
      const choice = rail.locator(
        `.mini-days button[data-calendar-day="${iso}"]`,
      );
      await choice.click();
      await expect(choice).toHaveAttribute('aria-pressed', 'true');
      await expect(
        views.locator(`.selected-day time[datetime="${iso}"]`),
      ).toBeVisible();
      await expect(views.locator('.selected-day')).toHaveCount(1);
    }
    await rail.locator('.calendar-settings summary').click();
    const date = rail.locator('app-temporal-control');
    const trigger = date.getByRole('button', {
      name: language === 'en' ? 'Choose date' : 'انتخاب تاریخ',
      exact: true,
    });
    await trigger.click();
    await expect
      .poll(() =>
        page
          .locator('.calendar-days > span')
          .evaluateAll((cells) =>
            cells.every((cell) => cell.scrollWidth <= cell.clientWidth),
          ),
      )
      .toBe(true);
    await page
      .locator('.calendar-sheet .calendar-navigation button')
      .last()
      .click();
    const picked = page.locator(
      '.calendar-days button[data-calendar-day="2026-11-04"]',
    );
    await picked.click();
    await expect(
      views.locator('.selected-day time[datetime="2026-11-04"]'),
    ).toBeVisible();
    await expect(
      rail.locator('.mini-days button[aria-pressed="true"]'),
    ).toHaveAttribute('data-calendar-day', '2026-11-04');
    await expect(trigger).toBeFocused();
    await expect(page.locator('.p-popover:visible')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(390);
  });
}

test('Desktop period buttons visibly distinguish the selected view', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/operations/calendar');
  const toolbar = page.locator('app-calendar-toolbar');
  for (const name of ['Week', 'Day', 'Agenda', 'Month']) {
    const chosen = toolbar.getByRole('button', { name, exact: true });
    await chosen.click();
    await expect(chosen).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.locator('app-calendar-toolbar .view-mode[aria-pressed="false"]'),
    ).toHaveCount(3);
    await expect
      .poll(() =>
        toolbar.locator('.view-mode').evaluateAll((buttons) => {
          const selectedButton = buttons.find(
            (button) => button.getAttribute('aria-pressed') === 'true',
          );
          const other = buttons.find(
            (button) => button.getAttribute('aria-pressed') === 'false',
          );
          return (
            !!selectedButton &&
            !!other &&
            getComputedStyle(selectedButton).backgroundColor !==
              getComputedStyle(other).backgroundColor &&
            getComputedStyle(selectedButton).color !==
              getComputedStyle(other).color
          );
        }),
      )
      .toBe(true);
  }
});
