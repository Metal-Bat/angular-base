import { expect, test } from './fixtures';
test.use({ administrationDetails: true });

test('Request type dependencies use names and preserve restrictions through save and cancellation', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/studio/request-types');
  const catalog = page.locator('app-resource-catalog');
  await catalog
    .locator('app-record-table')
    .getByRole('button', { name: 'Open', exact: true })
    .first()
    .click();
  const relations = catalog.locator('app-catalog-relations');
  await expect(relations).toContainText('Example forms');
  await expect(relations).toContainText('Example workflows');
  await expect(relations).toContainText('Example clients');
  await expect(relations).not.toContainText('fixture-clients-v1');
  await catalog
    .locator('app-catalog-header')
    .getByRole('button', { name: 'Edit', exact: true })
    .click();
  const editor = catalog.locator('.page-editor');
  await expect(editor.locator('textarea')).toHaveCount(0);
  await expect(editor.locator('#author-form_ref_id')).toHaveAttribute(
    'role',
    'combobox',
  );
  await editor
    .locator('#author-client_targets-0-minimum_release')
    .fill('1.5.0');
  const saved = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/request-types/'),
  );
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await saved).postDataJSON()).toMatchObject({
    form_ref_id: 'fixture-forms-v1',
    workflow_ref_id: 'fixture-workflows-v1',
    client_targets: [
      {
        client_ref_id: 'fixture-clients-v1',
        minimum_release: '1.5.0',
        maximum_release_exclusive: null,
      },
    ],
  });
  await expect(editor).toHaveCount(0);
  await catalog
    .locator('app-catalog-header')
    .getByRole('button', { name: 'Edit', exact: true })
    .click();
  await editor
    .getByRole('button', { name: 'Remove restriction', exact: true })
    .click();
  let writes = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/request-types/')
    ) {
      writes++;
    }
  });
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  const confirmation = page.locator('dialog[open]');
  await expect(confirmation).toContainText(
    'Remove all confidential-client restrictions',
  );
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  expect(writes).toBe(0);
  await expect(editor).toBeVisible();
});

test('Client release creation stays in Administration and authors capability rows without JSON', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/administration/clients');
  const catalog = page.locator('app-resource-catalog');
  await catalog
    .locator('app-record-table')
    .getByRole('button', { name: 'Open', exact: true })
    .first()
    .click();
  const versions = catalog.getByRole('link', { name: 'Versions', exact: true });
  await expect(versions).toHaveAttribute(
    'href',
    /\/administration\/client-releases\?parent=/,
  );
  await versions.click();
  await catalog
    .locator('app-catalog-header')
    .getByRole('button', { name: 'Create', exact: true })
    .click();
  const editor = catalog.locator('.page-editor');
  await expect(editor.locator('textarea')).toHaveCount(0);
  await editor.locator('#author-version').fill('2.1.0');
  await editor.locator('#author-api_version').fill('1');
  const capabilities = editor.locator('app-list-values');
  await capabilities.locator('input').fill('forms/1');
  await capabilities
    .getByRole('button', { name: 'Add value', exact: true })
    .click();
  await capabilities.locator('input').nth(1).fill('media/1');
  const saved = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().endsWith('/api/v1/client-releases'),
  );
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await saved).postDataJSON()).toEqual({
    client_ref_id: 'fixture-clients-v1',
    version: '2.1.0',
    api_version: '1',
    renderer_capabilities: ['forms/1', 'media/1'],
  });
  await expect(editor).toHaveCount(0);
});

test('Schedule variants retain inactive drafts but send only their own fields', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/administration/tasks/schedules');
  const resource = page.locator('app-resource-page');
  await resource
    .locator('app-record-page-header')
    .getByRole('button', { name: 'Create', exact: true })
    .click();
  const editor = resource.locator('app-record-editor');
  await editor.locator('#record-name').fill('Owned interval');
  const type = editor.getByRole('combobox', { name: /^Schedule type/ });
  await type.click();
  await page.getByRole('option', { name: 'interval', exact: true }).click();
  await editor.locator('#record-interval_seconds').fill('120');
  await expect(editor.locator('#record-clocked_at')).toHaveCount(0);
  await type.click();
  await page.getByRole('option', { name: 'clocked', exact: true }).click();
  await expect(editor.locator('#record-interval_seconds')).toHaveCount(0);
  await editor.locator('#record-clocked_at').fill('2026-12-01');
  await type.click();
  await page.getByRole('option', { name: 'interval', exact: true }).click();
  await expect(editor.locator('#record-interval_seconds')).toHaveValue('120');
  await expect(editor.locator('#record-name')).toHaveValue('Owned interval');
  const task = editor.locator('#record-task_name');
  await task.locator('..').getByRole('button').click();
  const picker = page.locator('app-reference-picker .p-dialog');
  await picker
    .getByRole('button', { name: 'Select', exact: true })
    .first()
    .click();
  const saved = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().endsWith('/api/v1/tasks/schedules'),
  );
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  const body = (await saved).postDataJSON();
  expect(body).toMatchObject({
    schedule_type: 'interval',
    interval_seconds: 120,
    enabled: true,
    one_off: false,
  });
  expect(body).not.toHaveProperty('clocked_at');
  expect(body).not.toHaveProperty('cron_minute');
});

test('Schedule edits validate new expiry against retained start before sending a command', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.route(
    '**/api/v1/tasks/schedules/schedule-current',
    async (route) => {
      if (route.request().method() === 'GET') {
        const response = await route.fetch();
        const envelope = await response.json();
        envelope.data.start_at = '2026-12-02T09:00:00Z';
        envelope.data.expires_at = '2026-12-04T12:00:00Z';
        await route.fulfill({ response, json: envelope });
      } else {
        await route.continue();
      }
    },
  );
  await page.goto(appURL + '/administration/tasks/schedules');
  const resource = page.locator('app-resource-page');
  await resource
    .getByRole('button', { name: 'Open', exact: true })
    .first()
    .click();
  await resource
    .locator('app-record-page-header')
    .getByRole('button', { name: 'Edit', exact: true })
    .click();
  const editor = resource.locator('app-record-editor');
  let writes = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/tasks/schedules/')
    ) {
      writes++;
    }
  });
  await editor.locator('#record-expires_at').fill('2026-12-01');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(editor).toContainText(
    'Expiry must be after the start and scheduled time.',
  );
  expect(writes).toBe(0);
  await editor.locator('#record-expires_at').fill('2026-12-05');
  const saved = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/tasks/schedules/'),
  );
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  expect((await saved).postDataJSON().expires_at).toMatch(/^2026-12-05T/);
  expect(writes).toBe(1);
  await expect(editor.locator('.page-editor')).toHaveCount(0);
  await expect(resource.locator('app-record-detail')).toBeVisible();
});

test('Administration command settings use typed controls and selection alone never executes', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(appURL + '/administration/commands/users');
  const console = page.locator('app-admin-console');
  let reads = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().endsWith('/api/v1/admin/users/search')
    ) {
      reads++;
    }
  });
  await console
    .getByRole('combobox', { name: 'Operation', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'List Admin Users', exact: true })
    .click();
  const form = console.locator('app-admin-command-form');
  await expect(form.locator('textarea')).toHaveCount(0);
  await expect(form.locator('#body-size')).toHaveAttribute('type', 'number');
  expect(reads).toBe(0);
  await form.locator('#body-size').fill('0');
  await expect(
    form.getByRole('button', { name: 'Load', exact: true }),
  ).toBeDisabled();
  expect(reads).toBe(0);
  await form.locator('#body-size').fill('25');
  const loaded = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().endsWith('/api/v1/admin/users/search'),
  );
  await form.getByRole('button', { name: 'Load', exact: true }).click();
  expect((await loaded).postDataJSON()).toMatchObject({ page: 1, size: 25 });
});
