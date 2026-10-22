import { expect, test } from './fixtures';
import { choose, save } from './data-mapping-helpers';
import {
  defineInterface as define,
  openInterface as open,
} from './workflow-interface-helpers';
test.use({ subprocessMapping: true });
test('authors interface inputs, exact port output and Finish outcome without JSON, saves and reopens', async ({
  page,
  appURL,
}) => {
  const editor = await open(page, appURL);
  await define(editor);
  await editor.locator('#interface-new-name').fill('flag');
  await expect(
    editor.getByRole('button', { name: 'Apply interface', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
  await choose(page, editor, 'Value type', 'boolean');
  await editor.getByRole('button', { name: 'Add input', exact: true }).click();
  await editor
    .getByRole('checkbox', { name: 'Required', exact: true })
    .uncheck();
  await editor.getByRole('button', { name: 'Add output', exact: true }).click();
  await editor.locator('#interface-output-name-0').fill('result');
  await choose(page, editor, 'Registered output port', 'prepare · result');
  await editor
    .getByRole('button', { name: 'Apply interface', exact: true })
    .click();
  const stored = await save(page);
  expect(stored['graph']).toMatchObject({
    interface: {
      inputs: [
        { name: 'flag', value_schema: { type: 'boolean' }, required: false },
      ],
      outputs: [
        {
          name: 'result',
          source_step: 'prepare',
          source_port: 'result',
          value_schema: { type: 'string' },
        },
      ],
      outcomes: { done: 'finish' },
    },
  });
  await page.reload();
  await page.getByRole('tab', { name: 'Properties', exact: true }).click();
  await editor.locator('summary').first().click();
  await expect(editor.locator('#interface-input-name-0')).toHaveValue('flag');
  await expect(editor.locator('#interface-output-name-0')).toHaveValue(
    'result',
  );
  await expect(
    editor.getByRole('checkbox', { name: 'Required', exact: true }),
  ).not.toBeChecked();
});
test('retains invalid outcome and input names, fences saving and supports discard and undo', async ({
  page,
  appURL,
}) => {
  const editor = await open(page, appURL);
  await define(editor);
  await editor.locator('#interface-outcome-name-0').fill('failure');
  await expect(
    editor.getByRole('button', { name: 'Apply interface', exact: true }),
  ).toBeDisabled();
  await editor
    .getByRole('button', { name: 'Discard interface edits', exact: true })
    .click();
  await expect(
    editor.getByRole('button', { name: 'Define child interface', exact: true }),
  ).toBeVisible();
  await define(editor);
  await editor
    .getByRole('button', { name: 'Apply interface', exact: true })
    .click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    editor.getByRole('button', { name: 'Define child interface', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(editor.locator('#interface-outcome-name-0')).toHaveValue('done');
  await editor
    .getByRole('button', { name: 'Add outcome', exact: true })
    .click();
  await editor.locator('#interface-outcome-name-1').fill('done');
  await editor
    .getByRole('combobox', { name: 'Finish step', exact: true })
    .nth(1)
    .click();
  await page.getByRole('option', { name: 'finish', exact: true }).click();
  await expect(
    editor.getByText('Business outcome names must be unique.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
});
for (const code of ['en', 'fa', 'ar'] as const) {
  for (const width of [390, 1440]) {
    test(`${code} ${width}: workflow interface controls fit and retain invalid edits`, async ({
      page,
      appURL,
    }, testInfo) => {
      const editor = await open(page, appURL);
      await define(editor);
      await editor.locator('#interface-new-name').fill('payload');
      await choose(page, editor, 'Value type', 'object');
      await editor
        .getByRole('button', { name: 'Add input', exact: true })
        .click();
      await editor
        .getByRole('button', { name: 'Add output', exact: true })
        .click();
      await editor.locator('#interface-output-name-0').fill('result');
      await choose(page, editor, 'Registered output port', 'prepare · result');
      await page.locator('[data-language-picker] [role=combobox]').click();
      await page
        .getByRole('option', {
          name: { en: 'English', fa: 'فارسی', ar: 'العربية' }[code],
          exact: true,
        })
        .click();
      await expect(page.locator('.p-select-overlay')).toHaveCount(0);
      await page.setViewportSize({ width, height: 900 });
      if (!(await editor.isVisible())) {
        await page.locator('.dock-toggle').click();
        await page.locator('p-tab[value=properties]').click();
      }
      await editor.locator('#interface-category').fill(code + '-category');
      await expect(editor.locator('#interface-category')).toHaveValue(
        code + '-category',
      );
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        code === 'en' ? 'ltr' : 'rtl',
      );
      await expect(editor.locator('summary').first()).toHaveText(
        {
          en: 'Reusable workflow interface',
          fa: 'رابط گردش کار قابل استفادهٔ مجدد',
          ar: 'واجهة سير العمل القابل لإعادة الاستخدام',
        }[code],
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      expect(
        await editor
          .locator('button')
          .evaluateAll((buttons) =>
            buttons.every(
              (button) => button.scrollWidth <= button.clientWidth + 1,
            ),
          ),
      ).toBe(true);
      const containment = await editor.evaluate((root) => {
        const host = root.getBoundingClientRect();
        return [
          ...root.querySelectorAll(
            'input:not([type=checkbox]), button, app-select-control',
          ),
        ]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => {
            const box = el.getBoundingClientRect();
            return {
              id: el.id || el.tagName,
              left: box.left,
              right: box.right,
              hostLeft: host.left,
              hostRight: host.right,
              fits: box.left >= host.left && box.right <= host.right,
            };
          });
      });
      expect(containment.filter((row) => !row.fits)).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('interface.png') });
    });
  }
}

test('authors nested object collection fields and preserves required flags without a schema console', async ({
  page,
  appURL,
}) => {
  const editor = await open(page, appURL);
  await define(editor);
  await editor.locator('#interface-new-name').fill('payload');
  await choose(page, editor, 'Value type', 'object');
  await editor.getByRole('button', { name: 'Add input', exact: true }).click();
  const root = editor.locator('app-interface-shape').first();
  await root.locator('summary').first().click();
  await root
    .getByRole('button', { name: 'Add input field', exact: true })
    .click();
  let dialog = page.getByRole('dialog', {
    name: 'Add input field',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'Field name', exact: true })
    .fill('lines');
  await choose(page, dialog, 'Value type', 'array');
  await dialog.getByRole('button', { name: 'Add field', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await root
    .getByRole('checkbox', { name: 'Required field · lines', exact: true })
    .check();
  const lines = root.locator('app-interface-shape').first();
  await lines.locator('summary').first().click();
  await choose(page, lines, 'Collection member type', 'object');
  const member = lines.locator('app-interface-shape').first();
  await member.locator('summary').first().click();
  await member
    .getByRole('button', { name: 'Add input field', exact: true })
    .click();
  dialog = page.getByRole('dialog', { name: 'Add input field', exact: true });
  await dialog
    .getByRole('textbox', { name: 'Field name', exact: true })
    .fill('note');
  await dialog.getByRole('button', { name: 'Add field', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await member
    .getByRole('checkbox', { name: 'Required field · note', exact: true })
    .check();
  await member
    .getByRole('button', { name: 'Add input field', exact: true })
    .click();
  dialog = page.getByRole('dialog', { name: 'Add input field', exact: true });
  await dialog
    .getByRole('textbox', { name: 'Field name', exact: true })
    .fill('note');
  await dialog.getByRole('button', { name: 'Add field', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText(
    'Use a new field name of up to 64 characters.',
  );
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await editor
    .getByRole('button', { name: 'Apply interface', exact: true })
    .click();
  const stored = await save(page);
  expect(stored['graph']).toMatchObject({
    interface: {
      inputs: [
        {
          name: 'payload',
          value_schema: {
            type: 'object',
            properties: {
              lines: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { note: { type: 'string' } },
                  required: ['note'],
                },
              },
            },
            required: ['lines'],
          },
        },
      ],
    },
  });
});
test('inserts authorized condition paths, retains the expression buffer and persists the applied branch', async ({
  page,
  appURL,
}) => {
  await open(page, appURL);
  await page.locator('.board-node[data-node-key="call"] .node-handle').click();
  const connections = page.locator('app-graph-connections:visible');
  await connections
    .getByText('Authorized data sources', { exact: true })
    .click();
  const picker = connections.locator('app-studio-choice');
  await picker
    .getByRole('button', { name: 'Find references', exact: true })
    .click();
  await choose(page, picker, 'Selected resource', 'Example request-types');
  await connections
    .getByRole('button', { name: 'Binding suggestions', exact: true })
    .click();
  const transition = connections.locator('app-transition-editor');
  await transition
    .getByRole('combobox', { name: 'Authorized condition value', exact: true })
    .click();
  await expect(
    page.getByRole('option', {
      name: 'request.amount · Requires a typed request mapping',
      exact: true,
    }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.p-select-overlay')).toHaveCount(0);
  await choose(
    page,
    transition,
    'Authorized condition value',
    'process.status',
  );
  await transition
    .getByRole('button', { name: 'Insert value path', exact: true })
    .click();
  await expect(transition.locator('#transition-condition')).toHaveValue(
    'process.status',
  );
  await expect(
    page.getByRole('button', { name: 'Save workspace', exact: true }),
  ).toBeDisabled();
  await transition
    .locator('#transition-condition')
    .fill('process.status == "RUNNING"');
  await transition
    .getByRole('button', { name: 'Apply transition', exact: true })
    .click();
  const stored = await save(page);
  expect(stored['graph']).toMatchObject({
    transitions: expect.arrayContaining([
      {
        source: 'call',
        target: 'finish',
        outcome: 'done',
        priority: 0,
        condition: 'process.status == "RUNNING"',
        is_default: false,
      },
    ]),
  });
});
test('uses declared child inputs as real mapper sources without a request type or parent form fields', async ({
  page,
  appURL,
}) => {
  const editor = await open(page, appURL);
  await define(editor);
  await editor.locator('#interface-new-name').fill('child_note');
  await editor.getByRole('button', { name: 'Add input', exact: true }).click();
  await editor
    .getByRole('button', { name: 'Apply interface', exact: true })
    .click();
  await page
    .locator('.board-node[data-node-key="prepare"] .node-handle')
    .click();
  const connections = page.locator('app-graph-connections:visible');
  await choose(page, connections, 'Target port', 'value · string');
  await choose(page, connections, 'Source port', 'request.child_note · string');
  await connections
    .getByRole('button', { name: 'Add data mapping', exact: true })
    .click();
  const stored = await save(page);
  expect(stored['graph']).toMatchObject({
    bindings: [
      {
        source_kind: 'REQUEST',
        source_path: '/child_note',
        source_schema: {
          type: 'object',
          properties: { child_note: { type: 'string' } },
          required: ['child_note'],
        },
        step: 'prepare',
        target_port: 'value',
      },
    ],
  });
  await page.reload();
  await page
    .locator('.board-node[data-node-key="prepare"] .node-handle')
    .click();
  await page.getByRole('tab', { name: 'Properties', exact: true }).click();
  await expect(connections.locator('app-mapping-list')).toContainText(
    '/child_note',
  );
});
