import { expect, test } from './fixtures';

test('Request header actions preserve draft data and explicit submission', async ({
  page,
  appURL,
}): Promise<void> => {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() !== 'GET' &&
      request.url().includes('/api/v1/business-requests/')
    ) {
      writes.push(request.url());
    }
  });
  await page.goto(
    appURL + '/operations/requests/' + encodeURIComponent('request/1'),
  );
  const header = page.locator('app-case-page-header');
  const amount = page.getByRole('textbox', { name: 'Amount', exact: true });
  await expect(amount).toBeVisible();
  await expect(
    header.getByRole('button', { name: 'Save', exact: true }),
  ).toBeVisible();
  await expect(
    header.getByRole('button', { name: 'Submit', exact: true }),
  ).toBeVisible();
  const saveBounds = await header
    .getByRole('button', { name: 'Save', exact: true })
    .boundingBox();
  const actionBounds = await header
    .getByRole('button', { name: 'Actions', exact: true })
    .boundingBox();
  expect(
    Math.abs(
      saveBounds!.y +
        saveBounds!.height / 2 -
        (actionBounds!.y + actionBounds!.height / 2),
    ),
  ).toBeLessThanOrEqual(2);
  await amount.fill('17');
  const saved = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/business-requests/'),
  );
  await header.getByRole('button', { name: 'Save', exact: true }).click();
  const body = (await saved).postDataJSON();
  expect(body.data.amount).toBe(17);
  expect(body.data.decimal).toBe('12345678901234567890.123456789');
  expect(body.data.approved).toBe(false);
  await expect(amount).toHaveValue('17');
  await expect(
    header.getByRole('button', { name: 'Save', exact: true }),
  ).toBeEnabled();
  const history = header.getByRole('button', { name: 'History', exact: true });
  await history.click();
  const dialog = page.getByRole('dialog', { name: 'History', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('updated');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(history).toBeFocused();
  const before = writes.length;
  await header.getByRole('button', { name: 'Actions', exact: true }).click();
  await expect(
    page.getByRole('menuitem', { name: 'Cancel draft', exact: true }),
  ).toBeVisible();
  expect(writes).toHaveLength(before);
  await page.keyboard.press('Escape');
  await header.getByRole('button', { name: 'Actions', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Request report', exact: true })
    .click();
  const report = page.getByRole('dialog', {
    name: 'Request report',
    exact: true,
  });
  await expect(
    report.getByRole('link', { name: 'Request detail', exact: true }),
  ).toBeVisible();
  await report.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(
    header.getByRole('button', { name: 'Actions', exact: true }),
  ).toBeFocused();
  await header.getByRole('button', { name: 'Submit', exact: true }).click();
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await expect(
    header.getByRole('button', { name: 'Submit', exact: true }),
  ).toHaveCount(0);
  const tracking = page.getByRole('link', {
    name: 'Open process tracking',
    exact: true,
  });
  await expect(tracking).toBeVisible();
  await expect(tracking).toHaveAttribute(
    'href',
    '/operations/processes/process%2Fcurrent',
  );
});

test('Human task decisions require confirmation and keep canonical payloads', async ({
  page,
  appURL,
}): Promise<void> => {
  const decisions: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/complete')) {
      decisions.push(request.url());
    }
  });
  await page.goto(appURL + '/operations/tasks/' + encodeURIComponent('task/1'));
  const actions = page.getByRole('region', {
    name: 'Task actions',
    exact: true,
  });
  await expect(
    actions.getByRole('button', { name: 'Claim', exact: true }),
  ).toBeVisible();
  const actionBounds = await actions.boundingBox();
  const summaryBounds = await page.locator('app-case-summary').boundingBox();
  expect(actionBounds!.y).toBeLessThan(summaryBounds!.y);

  await actions.getByRole('button', { name: 'Claim', exact: true }).click();
  await expect(
    actions.getByRole('button', { name: 'Approve', exact: true }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('4');
  expect(decisions).toEqual([]);
  await actions.getByRole('button', { name: 'Approve', exact: true }).click();
  const confirm = page.locator('dialog[open]');
  await expect(confirm).toBeVisible();
  expect(decisions).toEqual([]);
  const completed = page.waitForRequest(
    (request) =>
      request.method() === 'POST' && request.url().endsWith('/complete'),
  );
  await confirm.getByRole('button', { name: 'Continue', exact: true }).click();
  const body = (await completed).postDataJSON();
  expect(body.outcome_key).toBe('APPROVE');
  expect(body.data.amount).toBe(4);
  expect(body.data).not.toHaveProperty('decimal');
  expect(body.data).not.toHaveProperty('approved');
  expect(typeof body.command_key).toBe('string');
  expect(body.command_key.length).toBeGreaterThan(0);
  await expect(
    actions.getByRole('button', { name: 'Approve', exact: true }),
  ).toHaveCount(0);
  expect(decisions).toHaveLength(1);
});

test('Task commands preserve comments on rejection and show confirmed personal state', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/operations/tasks/' + encodeURIComponent('task/1'));
  const more = page.getByRole('button', {
    name: 'More task actions',
    exact: true,
  });
  const writes: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      /\/(comment|forward|pin)$/.test(request.url())
    ) {
      writes.push(request.url());
    }
  });
  await more.click();
  await expect(
    page.getByRole('menuitem', { name: 'Pin', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Unpin', exact: true }),
  ).toHaveCount(0);
  expect(writes).toEqual([]);
  await page.getByRole('menuitem', { name: 'Pin', exact: true }).click();
  await expect(more).toBeEnabled();
  await more.click();
  await expect(
    page.getByRole('menuitem', { name: 'Unpin', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Pin', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('menuitem', { name: 'Add comment', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Add comment', exact: true });
  const comment = dialog.getByRole('textbox', {
    name: /^Add comment/,
  });
  await comment.fill('Keep my reviewer explanation');
  await page.route('**/api/v1/work-items/**/comment', (route) =>
    route.fulfill({ json: { success: false, code: 1004 } }),
  );
  await dialog
    .getByRole('button', { name: 'Post comment', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(comment).toHaveValue('Keep my reviewer explanation');
  await comment.press('Escape');
  const confirmation = page.getByRole('dialog', {
    name: 'Confirm action',
    exact: true,
  });
  await expect(confirmation).toContainText('Discard unsaved changes?');
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(comment).toHaveValue('Keep my reviewer explanation');
  await page.unroute('**/api/v1/work-items/**/comment');
  await dialog
    .getByRole('button', { name: 'Post comment', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(more).toBeFocused();
  expect(writes.filter((url) => url.endsWith('/comment'))).toHaveLength(2);
});

test('Forwarding selects a named recipient and waits for explicit confirmation', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/operations/tasks/' + encodeURIComponent('task/1'));
  await page.getByRole('button', { name: 'Claim', exact: true }).click();
  let forwarded = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/forward')) {
      forwarded++;
    }
  });
  await page
    .getByRole('button', { name: 'More task actions', exact: true })
    .click();
  await page
    .getByRole('menuitem', { name: 'Forward task', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Forward task',
    exact: true,
  });
  await expect(dialog.getByRole('textbox', { name: /reference/i })).toHaveCount(
    0,
  );
  await expect(
    dialog.getByRole('button', { name: 'Forward', exact: true }),
  ).toBeDisabled();
  await dialog
    .getByRole('button', { name: 'Choose user', exact: true })
    .click();
  const picker = page.getByRole('dialog', { name: 'Select', exact: true });
  await expect(picker.getByRole('table')).toBeVisible();
  await picker
    .getByRole('button', { name: 'Select', exact: true })
    .first()
    .click();
  await expect(picker).toHaveCount(0);
  await dialog.getByRole('textbox', { name: /^Reason/ }).fill('Finance review');
  expect(forwarded).toBe(0);
  await dialog.getByRole('button', { name: 'Forward', exact: true }).click();
  const confirm = page.getByRole('dialog', {
    name: 'Confirm action',
    exact: true,
  });
  await expect(confirm).toContainText('Forward this task?');
  expect(forwarded).toBe(0);
  await confirm.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page).toHaveURL(appURL + '/operations/tasks');
  expect(forwarded).toBe(1);
});
