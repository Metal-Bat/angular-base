import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`Configured form presentation and sample row operations work at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route(
      '**/api/v1/form-versions/fixture-form-versions-v1',
      async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        body.data.data_schema = {
          type: 'object',
          properties: {
            notes: { type: 'string' },
            standard: { type: 'string' },
            compact: { type: 'string' },
            rows: {
              type: 'array',
              minItems: 1,
              maxItems: 2,
              items: {
                type: 'object',
                properties: { title: { type: 'string' } },
              },
            },
          },
        };
        body.data.render_schema.root = {
          component: 'vertical',
          node_key: 'presentation-root',
          children: [
            {
              component: 'textarea',
              node_key: 'notes',
              label: 'Notes',
              scope: '/properties/notes',
              options: { rows: 8, placeholder: 'Explain the request' },
            },
            {
              component: 'text',
              node_key: 'standard',
              label: 'Standard field',
              scope: '/properties/standard',
            },
            {
              component: 'text',
              node_key: 'compact',
              label: 'Compact field',
              scope: '/properties/compact',
              renderer: 'compact',
            },
            {
              component: 'table',
              node_key: 'rows',
              label: 'Line items',
              scope: '/properties/rows',
              children: [
                {
                  component: 'text',
                  node_key: 'row-title',
                  label: 'Title',
                  scope: '/properties/rows/items/properties/title',
                },
              ],
            },
          ],
        };
        await route.fulfill({ response, json: body });
      },
    );
    const writes: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() !== 'GET' &&
        /\/api\/v1\/(requests|work-items|uploads)/.test(request.url())
      ) {
        writes.push(request.method() + ' ' + new URL(request.url()).pathname);
      }
    });
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const preview = page.locator('app-form-live-preview');
    const ready = async (): Promise<void> => {
      await expect(preview.locator('.preview-freshness')).toHaveText(
        'Up to date',
      );
    };
    const refreshed = async (action: () => Promise<void>): Promise<void> => {
      const response = page.waitForResponse(
        (reply) =>
          new URL(reply.url()).pathname === '/api/v1/forms/runtime-preview',
      );
      await action();
      const reply = await response;
      expect(reply.status()).toBe(200);
      await reply.finished();
      await ready();
    };
    await ready();
    const notes = preview.getByRole('textbox', { name: 'Notes', exact: true });
    await expect(notes).toHaveAttribute('rows', '8');
    await expect(notes).toHaveAttribute('placeholder', 'Explain the request');
    await refreshed(() =>
      notes.fill('A multiline sample\nKept during row operations'),
    );
    const standard = preview
      .getByRole('textbox', { name: 'Standard field', exact: true })
      .locator('..');
    const compact = preview
      .getByRole('textbox', { name: 'Compact field', exact: true })
      .locator('..');
    expect((await compact.boundingBox())!.height).toBeLessThan(
      (await standard.boundingBox())!.height,
    );
    const add = preview.getByRole('button', { name: 'Add row', exact: true });
    await refreshed(() => add.click());
    const table = preview.getByRole('table', {
      name: 'Line items',
      exact: true,
    });
    await expect(
      table.getByRole('columnheader', { name: 'Title', exact: true }),
    ).toBeVisible();
    await refreshed(() =>
      table
        .getByRole('textbox', { name: 'Title', exact: true })
        .fill('First sample'),
    );
    await expect(
      table.getByRole('button', { name: 'Remove row', exact: true }),
    ).toBeDisabled();
    const originalKey = await table
      .locator('tbody tr')
      .first()
      .getAttribute('data-row-key');
    await refreshed(() => add.click());
    await refreshed(() =>
      table
        .getByRole('textbox', { name: 'Title', exact: true })
        .nth(1)
        .fill('Second sample'),
    );
    await expect(add).toBeDisabled();
    await refreshed(() =>
      table
        .getByRole('button', { name: 'Move up', exact: true })
        .nth(1)
        .click(),
    );
    await expect(
      table.getByRole('textbox', { name: 'Title', exact: true }).first(),
    ).toHaveValue('Second sample');
    await expect(table.locator('tbody tr').nth(1)).toHaveAttribute(
      'data-row-key',
      originalKey!,
    );
    await refreshed(() =>
      table
        .getByRole('button', { name: 'Remove row', exact: true })
        .first()
        .click(),
    );
    await refreshed(() =>
      table.getByRole('button', { name: 'Duplicate row', exact: true }).click(),
    );
    await expect(
      table.getByRole('textbox', { name: 'Title', exact: true }),
    ).toHaveCount(2);
    await expect(
      table.getByRole('textbox', { name: 'Title', exact: true }).nth(1),
    ).toHaveValue('First sample');
    expect(
      await table.locator('tbody tr').nth(1).getAttribute('data-row-key'),
    ).not.toBe(originalKey);
    await expect(notes).toHaveValue(
      'A multiline sample\nKept during row operations',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await preview.getByText('Preview options', { exact: true }).click();
    await refreshed(() =>
      preview
        .getByRole('button', {
          name: 'Use current sample as prior values',
          exact: true,
        })
        .click(),
    );
    const prior = preview.locator('app-runtime-form details').filter({
      has: page
        .locator('summary')
        .getByText('Previous submission', { exact: true }),
    });
    await prior.locator('summary').click();
    await expect(prior).toContainText('First sample');
    await expect(prior).toContainText('Title');
    await expect(prior).not.toContainText('/properties/');
    await expect(prior).not.toContainText('{');
    await expect(prior).not.toContainText('[');
    await expect(prior.locator('input:not(:disabled), button')).toHaveCount(0);
    expect(writes).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath('configured-form-presentation.png'),
      fullPage: true,
    });
    await page.goto(
      appURL + '/studio/form-versions?selected=fixture-form-versions-v1',
    );
    await page.getByRole('tab', { name: 'Display', exact: true }).click();
    const display = page.locator('app-form-display');
    const displayAdd = display.getByRole('button', {
      name: 'Add row',
      exact: true,
    });
    await displayAdd.click();
    const displayTable = display.getByRole('table', {
      name: 'Line items',
      exact: true,
    });
    const title = displayTable.getByRole('textbox', {
      name: 'Title',
      exact: true,
    });
    await title.fill('Display sample');
    const displayKey = await displayTable
      .locator('tbody tr')
      .first()
      .getAttribute('data-row-key');
    await display.getByLabel('Form view', { exact: true }).click();
    await page.getByRole('option', { name: 'Summary', exact: true }).click();
    await expect(displayTable).toContainText('Display sample');
    await expect(
      display.getByRole('button', { name: 'Add row', exact: true }),
    ).toHaveCount(0);
    await display.getByLabel('Form view', { exact: true }).click();
    await page.getByRole('option', { name: 'Entry form', exact: true }).click();
    await expect(title).toHaveValue('Display sample');
    await expect(displayTable.locator('tbody tr').first()).toHaveAttribute(
      'data-row-key',
      displayKey!,
    );
    await displayTable
      .getByRole('button', { name: 'Duplicate row', exact: true })
      .click();
    await expect(title).toHaveCount(2);
    await expect(title.nth(1)).toHaveValue('Display sample');
    expect(
      await displayTable
        .locator('tbody tr')
        .nth(1)
        .getAttribute('data-row-key'),
    ).not.toBe(displayKey);
    expect(writes).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: test.info().outputPath('form-display-collections.png'),
      fullPage: true,
    });
  });
}
