import { expect, test } from './fixtures';
import { choose, save, select } from './data-mapping-helpers';
import type { Locator, Page } from '@playwright/test';
test.use({ subprocessMapping: true });
async function open(page: Page, appURL: string): Promise<Locator> {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await select(page, 'call');
  return page.locator('app-subprocess-pin:visible');
}
async function apply(page: Page): Promise<void> {
  await page
    .locator('app-node-inspector:visible')
    .getByRole('button', { name: 'Apply typed configuration', exact: true })
    .click();
}
test('structured child values, explicit null and empty collection members survive save and reopen', async ({
  page,
  appURL,
}) => {
  let pin = await open(page, appURL);
  await expect(pin.locator('#child-payload-model_id')).toBeEditable();
  await pin.locator('#child-payload-model_id').fill('changed');
  await pin.locator('#child-rows-0').fill('temporary');
  await pin.locator('#child-rows-0').fill('');
  await expect(
    pin.getByRole('checkbox', { name: 'Use null value', exact: true }),
  ).toBeChecked();
  const link = pin.getByRole('link', {
    name: 'Inspect pinned child workflow (opens a new tab)',
    exact: true,
  });
  await expect(link).toHaveAttribute(
    'href',
    '/studio/workflow-versions/fixture-child/edit',
  );
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(pin).toContainText('Child outputs');
  await expect(pin).toContainText('done');
  await apply(page);
  const stored = await save(page);
  expect(stored['graph']).toMatchObject({
    steps: [
      { key: 'prepare' },
      {
        key: 'call',
        subprocess: {
          workflow_version_ref: 'fixture-child',
          inputs: [
            {
              name: 'payload',
              constant_value: { model_id: 'changed', enabled: false },
            },
            { name: 'rows', constant_value: [''] },
            { name: 'note', constant_value: null },
            { name: 'amount', constant_value: 1 },
          ],
        },
      },
    ],
  });
  await page.reload();
  await select(page, 'call');
  pin = page.locator('app-subprocess-pin:visible');
  await expect(pin.locator('#child-payload-model_id')).toHaveValue('changed');
  await expect(pin.locator('#child-rows-0')).toHaveValue('');
  await expect(
    pin.getByRole('combobox', {
      name: 'Published child workflow',
      exact: true,
    }),
  ).toBeDisabled();
});
test('child source choices stay pending until applied and preserve canonical leaf schemas on save', async ({
  page,
  appURL,
}) => {
  const pin = await open(page, appURL);
  await pin
    .getByText('Authorized child input sources', { exact: true })
    .click();
  const picker = pin.locator('app-subprocess-sources app-studio-choice');
  await picker
    .getByRole('button', { name: 'Find references', exact: true })
    .click();
  await choose(page, picker, 'Selected resource', 'Example request-types');
  await pin
    .getByRole('button', { name: 'Binding suggestions', exact: true })
    .click();
  const row = pin
    .locator('app-subprocess-input')
    .filter({ has: page.locator('#child-payload-source') });
  await choose(page, row, 'Source port · payload', 'request.profile');
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
  await apply(page);
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
  await row
    .getByRole('button', {
      name: 'Use selected child input source',
      exact: true,
    })
    .click();
  await apply(page);
  const document = await save(page);
  const call = (
    document['graph'] as {
      steps: { subprocess?: { inputs: Record<string, unknown>[] } }[];
    }
  ).steps[1];
  expect(call.subprocess!.inputs).toHaveLength(4);
  expect(call.subprocess!.inputs[0]).toMatchObject({
    name: 'payload',
    source_kind: 'REQUEST',
    source_path: '/profile',
    source_schema: {
      type: 'object',
      properties: {
        model_id: { type: 'string' },
        enabled: { type: 'boolean' },
      },
    },
  });
  expect(
    call
      .subprocess!.inputs.slice(1)
      .map((retained) => retained['constant_value']),
  ).toEqual([[''], null, 1]);
  expect(call.subprocess!.inputs[0]).not.toHaveProperty('constant_value');
  await page.reload();
  await select(page, 'call');
  await expect(row).toContainText('/profile');
});
test('invalid child values remain editable and configuration discard restores the saved mapping', async ({
  page,
  appURL,
}) => {
  const pin = await open(page, appURL);
  await pin.locator('#child-amount').fill('-1');
  await apply(page);
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
  await expect(pin.locator('#child-amount')).toHaveValue('-1');
  await page
    .getByRole('button', { name: 'Discard configuration edits', exact: true })
    .click();
  await expect(pin.locator('#child-amount')).toHaveValue('1');
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeEnabled();
});
for (const code of ['en', 'fa', 'ar'] as const) {
  for (const width of [390, 1440]) {
    test(`${code} ${width}: child input fields remain editable and contained`, async ({
      page,
      appURL,
    }, testInfo) => {
      const pin = await open(page, appURL);
      await page.locator('[data-language-picker] [role=combobox]').click();
      await page
        .getByRole('option', {
          name: { en: 'English', fa: 'فارسی', ar: 'العربية' }[code],
          exact: true,
        })
        .click();
      await expect(page.locator('.p-select-overlay')).toHaveCount(0);
      await page.setViewportSize({ width, height: 900 });
      if (!(await pin.isVisible())) {
        await page.locator('.dock-toggle').click();
        await page.locator('p-tab[value=properties]').click();
      }
      await pin.locator('#child-payload-model_id').scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath('child-before.png') });
      await pin.locator('#child-payload-model_id').fill(code + '-literal');
      await expect(pin.locator('#child-payload-model_id')).toHaveValue(
        code + '-literal',
      );
      await expect(pin).toContainText(
        { en: 'Optional', fa: 'اختیاری', ar: 'اختياري' }[code],
      );
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        code === 'en' ? 'ltr' : 'rtl',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      expect(
        await pin
          .locator('button')
          .evaluateAll((buttons) =>
            buttons.every(
              (button) => button.scrollWidth <= button.clientWidth + 1,
            ),
          ),
      ).toBe(true);
      await page.screenshot({ path: testInfo.outputPath('child-after.png') });
    });
  }
}
test('child navigation reloads the exact version and retains unsaved-input confirmation', async ({
  page,
  appURL,
}) => {
  const pin = await open(page, appURL);
  await pin.locator('#child-payload-model_id').fill('keep-pending');
  const navigate = async (reference: string): Promise<void> => {
    await page.evaluate((ref) => {
      history.pushState(null, '', '/studio/workflow-versions/' + ref + '/edit');
      dispatchEvent(new PopStateEvent('popstate'));
    }, reference);
  };
  await navigate('fixture-child');
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(pin.locator('#child-payload-model_id')).toHaveValue(
    'keep-pending',
  );
  await expect(page).toHaveURL(/fixture-flow\/edit$/);
  await page
    .getByRole('button', { name: 'Discard configuration edits', exact: true })
    .click();
  await navigate('fixture-child');
  await expect(page.locator('.readonly-notice')).toBeVisible();
  await expect(
    page.locator('.board-node[data-node-key=child_only]'),
  ).toBeVisible();
  await expect(page.locator('.board-node[data-node-key=call]')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
  await navigate('fixture-flow');
  await expect(page.locator('.readonly-notice')).toHaveCount(0);
  await select(page, 'call');
  await expect(pin.locator('#child-payload-model_id')).toHaveValue('saved');
});
async function indexedChild(page: Page, appURL: string): Promise<Locator> {
  await page.route('**/api/v1/designer/completion', async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    payload.result.items.push({
      source: 'request',
      path: 'request.lines',
      type_schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { amount: { type: 'integer', minimum: 0 } },
        },
      },
      cardinality: 'SCALAR',
    });
    payload.result.totalRecords = payload.result.items.length;
    await route.fulfill({ response, json: payload });
  });
  const pin = await open(page, appURL);
  await pin
    .getByText('Authorized child input sources', { exact: true })
    .click();
  const picker = pin.locator('app-subprocess-sources app-studio-choice');
  await picker
    .getByRole('button', { name: 'Find references', exact: true })
    .click();
  await choose(page, picker, 'Selected resource', 'Example request-types');
  await pin
    .getByRole('button', { name: 'Binding suggestions', exact: true })
    .click();
  const row = pin
    .locator('app-subprocess-input')
    .filter({ has: page.locator('#child-amount-source') });
  await choose(page, row, 'Source port · amount', 'request.lines');
  return row;
}
test('maps a child input from an indexed collection field and retains invalid index recovery', async ({
  page,
  appURL,
}) => {
  const row = await indexedChild(page, appURL);
  await row.locator('#child-amount-item-index').fill('-1');
  await expect(row.getByRole('alert')).toHaveText(
    'Choose a valid collection item index.',
  );
  await expect(
    row.getByRole('button', {
      name: 'Use selected child input source',
      exact: true,
    }),
  ).toBeDisabled();
  await row.locator('#child-amount-item-index').fill('0');
  await choose(page, row, 'Collection item field', 'amount');
  await row
    .getByRole('button', {
      name: 'Use selected child input source',
      exact: true,
    })
    .click();
  await apply(page);
  const stored = await save(page);
  expect(stored['graph']).toMatchObject({
    steps: expect.arrayContaining([
      expect.objectContaining({
        key: 'call',
        subprocess: expect.objectContaining({
          inputs: expect.arrayContaining([
            {
              name: 'amount',
              source_kind: 'REQUEST',
              source_path: '/lines/0/amount',
              source_schema: { type: 'integer', minimum: 0 },
            },
          ]),
        }),
      }),
    ]),
  });
});

for (const language of ['en', 'fa', 'ar'] as const) {
  test(`${language} phone: indexed child input fields fit and retain invalid values`, async ({
    page,
    appURL,
  }, testInfo) => {
    const row = await indexedChild(page, appURL);
    await row.locator('#child-amount-item-index').fill('0');
    await choose(page, row, 'Collection item field', 'amount');
    await page.locator('[data-language-picker] [role=combobox]').click();
    await page
      .getByRole('option', {
        name: { en: 'English', fa: 'فارسی', ar: 'العربية' }[language],
        exact: true,
      })
      .click();
    await expect(page.locator('.p-select-overlay')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 900 });
    if (!(await row.isVisible())) {
      await page.locator('.dock-toggle').click();
      await page.locator('p-tab[value=properties]').click();
    }
    await row.locator('#child-amount-item-index').fill('-1');
    await expect(row.locator('#child-amount-item-index')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(row.getByRole('alert')).toBeVisible();
    await row.locator('#child-amount-item-index').fill('0');
    await expect(row.getByRole('alert')).toHaveCount(0);
    expect(
      await row.evaluate((root) => {
        const host = root.getBoundingClientRect();
        return [...root.querySelectorAll('input,app-select-control,button')]
          .filter((el) => el.getClientRects().length)
          .every((el) => {
            const box = el.getBoundingClientRect();
            return box.left >= host.left && box.right <= host.right;
          });
      }),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('indexed-child.png') });
  });
}
