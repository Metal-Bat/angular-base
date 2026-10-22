import { expect, test } from './fixtures';

test('Agent editing keeps typed choices, languages, data scope and exact limits across tabs and save/reload', async ({
  page,
  appURL,
}): Promise<void> => {
  const calls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      calls.push(request.method() + ' ' + new URL(request.url()).pathname);
    }
  });
  await page.goto(appURL + '/administration/agents');
  await page.getByRole('button', { name: 'Open', exact: true }).first().click();
  await expect(page.locator('app-record-page-header h1')).toHaveText(
    'Review agent',
  );
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.page-editor')).toBeVisible();
  await page
    .getByRole('tab', { name: 'Connection and model', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Selected model capabilities',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('.page-editor app-agent-capabilities'),
  ).toContainText('fixture-region');
  await page
    .getByRole('tab', { name: 'Instructions and decision', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: /^Question\b/ })
    .fill('Which result is appropriate?');
  await page.getByLabel('Choice source', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Fixed choices', exact: true })
    .click();
  for (const [index, key, label] of [
    [0, 'approve', 'Approve'],
    [1, 'return', 'Return'],
  ] as const) {
    await page.getByRole('button', { name: 'Add choice', exact: true }).click();
    await page.locator('.choice-row').nth(index).locator('summary').click();
    await page.locator('#agent-choice-key-' + index).fill(key);
    await page.locator('#agent-choice-label-' + index).fill(label);
    await page
      .locator('#agent-choice-description-' + index)
      .fill(label + ' after reviewing the named inputs.');
  }
  await page.getByRole('tab', { name: 'فارسی', exact: true }).click();
  await page.locator('#agent-choice-label-0').fill('تأیید');
  await page.locator('#agent-choice-label-1').fill('بازگشت');
  await page
    .getByLabel('Human review below confidence', { exact: true })
    .fill('0');
  await page.getByRole('tab', { name: 'Permitted data', exact: true }).click();
  await page.locator('#agent-allowed_fields').fill('risk');
  await page
    .getByRole('button', { name: 'Add input', exact: true })
    .first()
    .click();
  await page.getByLabel('risk', { exact: true }).click();
  await page.getByRole('option', { name: 'PUBLIC', exact: true }).click();
  await expect(
    page
      .locator('.page-editor')
      .getByText('This backend exposes no general retrieval-source catalog.', {
        exact: false,
      }),
  ).toBeVisible();
  await page
    .getByRole('tab', { name: 'Instructions and decision', exact: true })
    .click();
  await expect(page.locator('#agent-choice-label-0')).toHaveValue('تأیید');
  await expect(
    page.getByLabel('Human review below confidence', { exact: true }),
  ).toHaveValue('0');
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/ai-agents/agent-current'),
  );
  await page
    .locator('.page-editor-toolbar')
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  const body = (await write).postDataJSON();
  expect(body.spec.decision.review_below).toBe(0);
  expect(body.spec.decision.options[0].labels).toEqual({
    en: 'Approve',
    fa: 'تأیید',
  });
  expect(body.spec.data_policy.allowed_fields).toEqual([
    'question',
    'choices',
    'risk',
  ]);
  expect(body.spec.field_classifications.risk).toBe('PUBLIC');
  expect(body.spec.user_limits.tool_calls).toBe(0);
  expect(body.spec.data_policy.allowed_tools).toEqual([]);
  await expect(page.locator('.page-editor')).toHaveCount(0);
  await page.reload();
  await page
    .getByRole('tab', { name: 'Instructions and decision', exact: true })
    .click();
  await expect(page.locator('app-agent-decision-summary')).toContainText(
    'Which result is appropriate?',
  );
  await expect(page.locator('app-agent-decision-summary')).toContainText(
    'Approve',
  );
  expect(
    calls.filter((call) =>
      /\/publish|\/tool-approval|\/dispatch|\/execute/.test(call),
    ),
  ).toEqual([]);
});

test('Agent permitted classifications preserve multiple selections and keyboard focus across save and reload', async ({
  page,
  appURL,
}) => {
  await page.goto(appURL + '/administration/agents');
  await page.getByRole('button', { name: 'Open', exact: true }).first().click();
  const edit = async (): Promise<void> => {
    await page
      .locator('app-record-page-header')
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    const editor = page.locator('.page-editor');
    await expect(editor).toBeVisible();
    await editor
      .getByRole('tab', { name: 'Permitted data', exact: true })
      .click();
  };
  await edit();
  const field = page.locator(
    '.page-editor [data-field-path="spec.data_policy.allowed_classifications"]',
  );
  const picker = field.getByRole('combobox', {
    name: 'Permitted classifications Required',
    exact: true,
  });
  await expect(field.locator('.p-multiselect-label')).toContainText('PUBLIC');
  await field.locator('.p-multiselect-label').click();
  await page.getByRole('option', { name: 'INTERNAL', exact: true }).click();
  await expect(picker).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(picker).toHaveAttribute('aria-expanded', 'false');
  await expect(picker).toBeFocused();
  await expect(field.locator('.p-multiselect-label')).toContainText(
    'PUBLIC, INTERNAL',
  );
  const language = page.locator('[data-language-picker] [role="combobox"]');
  await language.click();
  await page.getByRole('option', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(field.getByRole('combobox')).toHaveAttribute(
    'aria-label',
    'طبقه‌بندی‌های مجاز الزامی',
  );
  await expect(field.locator('.p-multiselect-label')).toContainText(
    'PUBLIC, INTERNAL',
  );
  await language.click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(field.getByRole('combobox')).toHaveAttribute(
    'aria-label',
    'Permitted classifications Required',
  );
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/ai-agents/agent-current'),
  );
  await page
    .locator('.page-editor-toolbar')
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  expect(
    (await write).postDataJSON().spec.data_policy.allowed_classifications,
  ).toEqual(['PUBLIC', 'INTERNAL']);
  await expect(page.locator('.page-editor')).toHaveCount(0);
  await page.reload();
  await edit();
  await expect(field.locator('.p-multiselect-label')).toContainText(
    'PUBLIC, INTERNAL',
  );
});
