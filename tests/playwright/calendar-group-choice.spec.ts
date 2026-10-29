import { expect, test } from './fixtures';
for (const width of [1440, 390]) {
  test(`Calendar group visibility uses named current memberships and guards the draft at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const calls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/')) {
        calls.push(new URL(request.url()).pathname);
      }
    });
    await page.goto(appURL + '/operations/calendar');
    await page
      .getByRole('button', { name: 'Create event', exact: true })
      .click();
    const editor = page.locator('app-calendar-editor');
    await editor.getByLabel('Title', { exact: true }).fill('Finance planning');
    await editor
      .getByRole('combobox', { name: 'Event visibility', exact: true })
      .click();
    await page
      .getByRole('option', { name: 'My work group', exact: true })
      .click();
    const save = editor.getByRole('button', { name: 'Save', exact: true });
    await expect(save).toBeDisabled();
    await expect(editor).toContainText('Only its creator can edit it.');
    await editor.getByLabel('Find my group', { exact: true }).fill('Finance');
    await editor
      .locator('app-calendar-group-choice')
      .getByRole('button', { name: 'Search', exact: true })
      .click();
    await editor.getByRole('combobox', { name: /^Work group/ }).click();
    await page.getByRole('option', { name: 'Finance', exact: true }).click();
    await expect(save).toBeEnabled();
    await editor
      .getByRole('combobox', { name: 'Schedule', exact: true })
      .click();
    await page.getByRole('option', { name: 'All day', exact: true }).click();
    await editor.locator('#event-start').fill('2026-10-29');
    await editor.locator('#event-end').fill('2026-10-30');
    const settings = page.locator('app-workspace-preferences details');
    if ((await settings.getAttribute('open')) === null) {
      await settings.locator('summary').click();
    }
    await settings.locator('[data-language-picker] [role="combobox"]').click();
    await page.getByRole('option', { name: 'فارسی', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(
      editor.getByRole('combobox', { name: /^گروه کاری/ }),
    ).toContainText('Finance');
    await expect(editor.getByLabel('عنوان', { exact: true })).toHaveValue(
      'Finance planning',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    if (width === 390) {
      await settings.locator('summary').click();
    }
    await page.screenshot({
      path: test.info().outputPath('calendar-group-fa.png'),
      fullPage: true,
    });
    const command = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname === '/api/v1/calendar/events' &&
        request.method() === 'POST',
    );
    await editor.getByRole('button', { name: 'ذخیره', exact: true }).click();
    expect((await command).postDataJSON()).toMatchObject({
      title: 'Finance planning',
      work_group_ref_id: 'finance-current',
      schedule: {
        kind: 'all_day',
        start_date: '2026-10-29',
        end_date: '2026-10-30',
      },
    });
    await expect(editor).toHaveCount(0);
    expect(
      calls.some((path) => path.startsWith('/api/v1/admin/work-groups')),
    ).toBe(false);
  });
}
