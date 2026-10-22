import { expect, test } from './fixtures';

test('Users has readable values and one header action menu with safe dialogs', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/users');
  await page.getByRole('button', { name: 'Open', exact: true }).first().click();
  const header = page.locator('app-record-page-header');
  await expect(header.getByRole('heading', { level: 1 })).toHaveText(
    'Ali Example',
  );
  await expect(
    page.locator('app-record-detail app-record-summary'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Identity', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Account', exact: true }),
  ).toBeVisible();
  const sizes = await page
    .locator('app-record-summary dd')
    .evaluateAll((values) =>
      values.map((value) => parseFloat(getComputedStyle(value).fontSize)),
    );
  expect(sizes.length).toBeGreaterThan(3);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    ),
  ).toBe('16px');
  await expect(
    page
      .locator('app-record-detail')
      .getByRole('button', { name: 'Delete', exact: true }),
  ).toHaveCount(0);
  const writes: string[] = [];
  page.on('request', (request) => {
    if (['PUT', 'DELETE'].includes(request.method())) {
      writes.push(request.url());
    }
  });
  const actions = header.getByRole('button', { name: 'Actions', exact: true });
  await actions.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('menuitem', { name: 'Assign role', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('menuitem', { name: 'Assign role', exact: true })
    .click();
  const role = page.getByRole('dialog', { name: 'Assign role', exact: true });
  await expect(role).toBeVisible();
  await role.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(role).toHaveCount(0);
  await expect(actions).toBeFocused();
  await actions.click();
  await page
    .getByRole('menuitem', { name: 'Reset password', exact: true })
    .click();
  const password = page.getByRole('dialog', {
    name: 'Reset password',
    exact: true,
  });
  await expect(
    password.getByLabel('New password', { exact: false }),
  ).toBeFocused();
  await password.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(password).toHaveCount(0);
  await expect(actions).toBeFocused();
  await actions.click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  const confirmation = page.locator('dialog[open]');
  await expect(confirmation).toBeVisible();
  expect(writes).toEqual([]);
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(header.getByRole('heading', { level: 1 })).toHaveText(
    'Ali Example',
  );
});

test('User edit keeps the same sections, retains the draft and returns through a real breadcrumb', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/users');
  await page.getByRole('button', { name: 'Open', exact: true }).first().click();
  const header = page.locator('app-record-page-header');
  await header
    .getByRole('button', { name: 'Update User', exact: true })
    .click();
  const editor = page.locator('.page-editor');
  await expect(editor).toBeVisible();
  await expect(page.locator('.p-dialog')).toHaveCount(0);
  await expect(
    editor.getByRole('heading', { name: 'Identity', exact: true }),
  ).toBeVisible();
  await expect(
    editor.getByRole('heading', { name: 'Account', exact: true }),
  ).toBeVisible();
  await page.locator('#record-first_name').fill('Changed locally');
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  await expect(header.getByRole('heading', { level: 1 })).toHaveText(
    'Ali Example',
  );
  const breadcrumb = page.getByRole('navigation', {
    name: 'Breadcrumb',
    exact: true,
  });
  await expect(
    breadcrumb.getByRole('link', { name: 'Users', exact: true }),
  ).toHaveAttribute('href', '/users');
  await breadcrumb.getByRole('link', { name: 'Users', exact: true }).click();
  await expect(page.locator('app-record-detail')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Open', exact: true }).first(),
  ).toBeVisible();
});

test('Calendar and Dashboard titles follow actual routes and locale, including browser history', async ({
  page,
}): Promise<void> => {
  await page
    .locator('#area-navigation')
    .getByRole('link', { name: 'Calendar', exact: true })
    .click();
  await expect(page).toHaveTitle('Calendar | Workflow workspace');
  await expect(page.locator('app-calendar-page h1')).toBeVisible();
  await page
    .locator('#area-navigation')
    .getByRole('link', { name: 'Dashboard', exact: true })
    .click();
  await expect(page).toHaveTitle('Dashboard | Workflow workspace');
  await expect(page.locator('app-dashboard h1')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveTitle('Calendar | Workflow workspace');
  await expect(page.locator('app-calendar-page h1')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveTitle('Dashboard | Workflow workspace');
  await expect(page.locator('app-dashboard h1')).toBeVisible();
  await page.locator('[data-language-picker] [role="combobox"]').click();
  await page.getByRole('option').filter({ hasText: 'فارسی' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page).toHaveTitle(/داشبورد/);
  await expect(page.locator('.breadcrumb a').first()).toHaveAttribute(
    'href',
    '/operations',
  );
  await expect(page.locator('.breadcrumb [aria-current="page"]')).toHaveText(
    'داشبورد',
  );
});

test('Phone display settings preserve a useful editor viewport and close with focus restored', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const focus = page.getByRole('button', { name: 'Focus mode', exact: true });
  await focus.click();
  const header = page.locator('header.workspace-header');
  await expect(header).toBeHidden();
  await expect
    .poll(async () => (await page.locator('f-flow').boundingBox())!.height)
    .toBeGreaterThanOrEqual(300);
  await focus.click();
  await expect(header).toBeVisible();
  await expect
    .poll(async () => (await header.boundingBox())!.height)
    .toBeLessThanOrEqual(80);
  await expect
    .poll(async () => (await page.locator('f-flow').boundingBox())!.height)
    .toBeGreaterThanOrEqual(300);
  const settings = page.locator('app-workspace-preferences details');
  const trigger = settings.locator('summary');
  await trigger.click();
  const theme = settings.getByRole('combobox', { name: 'Theme', exact: true });
  await theme.click();
  await expect(theme).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(theme).toHaveAttribute('aria-expanded', 'false');
  await expect(theme).toBeFocused();
  await expect(settings).toHaveAttribute('open', '');
  const selectedTheme = await theme.textContent();
  await theme.click();
  await page.getByText('Light mode', { exact: true }).click();
  await expect(theme).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(theme).toHaveAttribute('aria-expanded', 'false');
  await expect(theme).toBeFocused();
  await expect(theme).toHaveText(selectedTheme!);
  await expect(settings).toHaveAttribute('open', '');
  const language = settings.getByRole('combobox', {
    name: 'Language',
    exact: true,
  });
  await language.click();
  await page.getByRole('option', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(settings).toHaveAttribute('open', '');
  await settings.locator('[role="combobox"]').first().focus();
  await page.keyboard.press('Escape');
  await expect(settings).not.toHaveAttribute('open');
  await expect(trigger).toBeFocused();
  await expect
    .poll(async () => (await header.boundingBox())!.height)
    .toBeLessThanOrEqual(80);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
