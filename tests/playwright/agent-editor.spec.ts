import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`Agent drafts preserve generated choices, multiline instructions and exact limits at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const calls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        calls.push(request.method() + ' ' + new URL(request.url()).pathname);
      }
    });
    await page.goto(appURL + '/administration/agents');
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click();
    await page
      .locator('app-record-page-header')
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    const editor = page.locator('.page-editor');
    await expect(
      editor.getByRole('heading', { name: 'Edit agent', exact: true }),
    ).toBeVisible();
    await expect(editor.locator('app-agent-overview')).toContainText(
      'Configuration summary',
    );
    await editor
      .getByRole('tab', { name: 'Instructions and decision', exact: true })
      .click();
    const instructions = editor.getByRole('textbox', {
      name: 'Agent instructions Required',
      exact: true,
    });
    await expect(instructions).toHaveAttribute('rows', '10');
    await instructions.fill(
      'Review only the permitted information.\nExplain uncertainty before a human decision.',
    );
    await editor.getByLabel('Choice source', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Fixed choices', exact: true })
      .click();
    for (const [index, label] of ['Proceed', 'Need details'].entries()) {
      await editor
        .getByRole('button', { name: 'Add choice', exact: true })
        .click();
      await editor.locator('#agent-choice-label-' + index).fill(label);
      await editor
        .locator('#agent-choice-description-' + index)
        .fill(label + ' with an explanation.');
    }
    const firstKey = await editor.locator('#agent-choice-key-0').inputValue();
    const secondKey = await editor.locator('#agent-choice-key-1').inputValue();
    expect(firstKey).toMatch(/^choice_[a-f0-9]{32}$/);
    expect(secondKey).not.toBe(firstKey);
    await editor.getByRole('tab', { name: 'فارسی', exact: true }).click();
    await editor.locator('#agent-choice-label-0').fill('ادامه');
    await editor.getByRole('tab', { name: 'English', exact: true }).click();
    await editor
      .locator('.choice-row')
      .nth(1)
      .getByRole('button', { name: 'Move up', exact: true })
      .click();
    await expect(editor.locator('#agent-choice-label-0')).toHaveValue(
      'Need details',
    );
    await expect(editor.locator('#agent-choice-key-1')).toHaveValue(firstKey);
    const firstChoice = editor.locator('.choice-row').first();
    await firstChoice.locator('summary').click();
    await editor.locator('#agent-choice-key-0').fill(firstKey);
    await expect(
      editor
        .locator('.page-editor-toolbar')
        .getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    await expect(firstChoice).toContainText(
      'Use a unique choice key starting with a letter.',
    );
    await editor.locator('#agent-choice-key-0').fill(secondKey);
    await page.screenshot({
      path: test.info().outputPath('agent-instructions-en.png'),
      fullPage: true,
    });
    const settings = page.locator('app-workspace-preferences details');
    if ((await settings.getAttribute('open')) === null) {
      await settings.locator('summary').click();
    }
    await settings
      .getByRole('combobox', { name: 'Theme', exact: true })
      .click();
    await page.locator('[data-theme-option="blue-dark"]').click();
    await expect(page.locator('html')).toHaveClass(/app-dark/);
    await settings
      .getByRole('combobox', { name: 'Language', exact: true })
      .click();
    await page.getByRole('option', { name: 'فارسی', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(editor.getByText('نسخه دستور', { exact: true })).toBeVisible();
    await expect(
      editor.getByText('پرسش', { exact: true }).first(),
    ).toBeVisible();
    await expect(editor.locator('#agent-choice-label-0')).toHaveValue(
      'Need details',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    if (width === 390 && (await settings.getAttribute('open')) !== null) {
      await settings.locator('summary').click();
    }
    await page.screenshot({
      path: test.info().outputPath('agent-instructions-fa-dark.png'),
      fullPage: true,
    });
    if ((await settings.getAttribute('open')) === null) {
      await settings.locator('summary').click();
    }
    await settings.locator('[data-language-picker] [role="combobox"]').click();
    await page.getByRole('option', { name: 'English', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    if (width === 390) {
      await settings.locator('summary').click();
    }
    await editor
      .getByRole('tab', { name: 'Usage limits', exact: true })
      .click();
    await editor.locator('#agent-limit-requests').fill('1e');
    const save = editor
      .locator('.page-editor-toolbar')
      .getByRole('button', { name: 'Save', exact: true });
    await expect(save).toBeDisabled();
    await editor
      .getByRole('tab', { name: 'Configuration checks', exact: true })
      .click();
    await editor
      .getByRole('button', { name: 'Check configuration', exact: true })
      .click();
    await editor
      .getByRole('button', {
        name: /^Provider requests: Enter a value within the allowed range/,
      })
      .click();
    await expect(editor.locator('#agent-limit-requests')).toBeFocused();
    await editor.getByRole('tab', { name: 'Overview', exact: true }).click();
    await editor
      .getByRole('tab', { name: 'Usage limits', exact: true })
      .click();
    await expect(editor.locator('#agent-limit-requests')).toHaveValue('1e');
    await editor.locator('#agent-limit-tool_calls').fill('0');
    await expect(editor.locator('#agent-limit-requests')).toHaveValue('1e');
    await editor.locator('#agent-limit-requests').fill('3');
    await editor.locator('#agent-limit-spend_usd').fill('۰٫۰۰۰۰۰۱');
    await editor
      .getByRole('tab', { name: 'Configuration checks', exact: true })
      .click();
    await editor
      .getByRole('button', { name: 'Check configuration', exact: true })
      .click();
    await expect(
      editor.getByText(
        'Local configuration checks passed. No provider or tool was executed.',
        { exact: true },
      ),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: test.info().outputPath('agent-editor.png'),
      fullPage: true,
    });
    const write = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/ai-agents/agent-current'),
    );
    await save.click();
    await page
      .locator('dialog[open]')
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
    const body = (await write).postDataJSON();
    expect(
      body.spec.decision.options.map((choice: { key: string }) => choice.key),
    ).toEqual([secondKey, firstKey]);
    expect(body.spec.decision.options[1].labels).toEqual({
      en: 'Proceed',
      fa: 'ادامه',
    });
    expect(body.spec.user_limits.requests).toBe(3);
    expect(body.spec.user_limits.tool_calls).toBe(0);
    expect(body.spec.user_limits.spend_usd).toBe('0.000001');
    expect(body.spec.instructions).toBe(
      'Review only the permitted information.\nExplain uncertainty before a human decision.',
    );
    await expect(editor).toHaveCount(0);
    await page.reload();
    await page
      .locator('app-agent-detail')
      .getByRole('tab', { name: 'Instructions and decision', exact: true })
      .click();
    await expect(
      page.locator('app-agent-instructions .instructions'),
    ).toHaveText(body.spec.instructions);
    await expect(
      page.locator('app-agent-decision-summary .decision-choices li').first(),
    ).toContainText('Need details');
    expect(
      calls.filter((call) =>
        /\/publish|\/dispatch|\/execute|\/tool-approval/.test(call),
      ),
    ).toEqual([]);
  });
}
