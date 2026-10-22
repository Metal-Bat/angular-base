import { expect, test } from './fixtures';

test('user editor is a page, retains invalid input and returns to the filtered list', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/users');
  await page.getByRole('button', { name: 'Create User', exact: true }).click();
  const editor = page.locator('.page-editor');
  await expect(editor).toBeVisible();
  await expect(page.locator('.p-dialog')).toHaveCount(0);
  await expect(page.locator('.page-editor input').first()).toBeFocused();
  await page.locator('#record-username').fill('Page user');
  await page.locator('#record-password').fill('short');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#record-password')).toBeFocused();
  await expect(page.locator('#record-username')).toHaveValue('Page user');
  await expect(editor.locator('.field-error-summary')).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Create User', exact: true }),
  ).toBeFocused();
});

test('date popover is anchored and Escape preserves the value and restores focus', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/users');
  await page
    .getByRole('button', { name: 'Advanced filters', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add filter', exact: true }).click();
  await page
    .locator('.filter-row [data-query-field="0"] [role="combobox"]')
    .click();
  await page.getByRole('option', { name: 'Created At', exact: true }).click();
  const temporal = page.locator('app-query-filters app-temporal-control');
  const input = temporal.locator('.date-entry input');
  await input.fill('2024-03-20');
  const trigger = temporal.getByRole('button', {
    name: 'Choose date',
    exact: true,
  });
  await trigger.click();
  const popup = page.locator('.p-popover');
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute('aria-modal', 'false');
  await expect(page.locator('.p-dialog')).toHaveCount(0);
  const anchor = await trigger.boundingBox();
  const bounds = await popup.boundingBox();
  expect(anchor).not.toBeNull();
  expect(bounds).not.toBeNull();
  expect(
    Math.min(
      Math.abs(bounds!.y - (anchor!.y + anchor!.height)),
      Math.abs(bounds!.y + bounds!.height - anchor!.y),
    ),
  ).toBeLessThan(40);
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(input).toHaveValue('2024-03-20');
});

test('catalog lifecycle menu opens without mutating and versions stay in the header', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/studio/forms');
  await page
    .locator('app-record-table')
    .getByRole('button', { name: 'Open', exact: true })
    .first()
    .click();
  const header = page.locator('app-catalog-header');
  await expect(
    header.getByRole('link', { name: 'Versions', exact: true }),
  ).toBeVisible();
  const writes: string[] = [];
  page.on('request', (request) => {
    if (['PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      writes.push(request.url());
    }
  });
  await header.getByRole('button', { name: 'Actions', exact: true }).click();
  await expect(page.getByRole('menuitem').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem')).toHaveCount(0);
  expect(writes).toEqual([]);
  await header.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.page-editor')).toBeVisible();
  await expect(page.locator('.p-dialog')).toHaveCount(0);
  await expect(page.locator('#author-code')).toBeFocused();
  await page
    .locator('.page-editor')
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(page.locator('.page-editor')).toHaveCount(0);
});

test('saved view controls stay compact and focused actions restore the toolbar', async ({
  page,
  appURL,
}) => {
  await page.goto(appURL + '/studio/forms');
  const views = page.locator('app-saved-views');
  await expect(views).toBeVisible();
  await expect(page.locator('#saved-view-name')).toHaveCount(0);
  await views
    .getByRole('button', { name: 'View actions', exact: true })
    .click();
  await page
    .getByRole('menuitem', { name: 'Save current view', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Save current view',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('textbox', { name: 'Name', exact: true }),
  ).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    views.getByRole('button', { name: 'View actions', exact: true }),
  ).toBeFocused();
  await views.getByRole('button', { name: 'Columns', exact: true }).click();
  await expect(page.locator('.p-popover')).toBeVisible();
  const columnControl = page.locator('.p-popover p-multiselect');
  await expect(columnControl).toBeVisible();
  await columnControl.click();
  await page.getByRole('option', { name: 'Name', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('app-record-table thead th')).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Sort Name', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.p-popover')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open', exact: true }).first().click();
  await expect(views).toHaveCount(0);
  await expect(
    page.locator('app-catalog-header app-favorite-action'),
  ).toBeVisible();
});
