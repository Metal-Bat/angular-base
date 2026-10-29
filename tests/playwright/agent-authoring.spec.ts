import { expect, test } from './fixtures';

test.use({ agentAuthoring: true });
for (const width of [1440, 390]) {
  test(`Saved Agent checks use named resources, bounded previews and explicit submission at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const submissions: unknown[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/evaluations')) {
        submissions.push(request.postDataJSON());
      }
    });
    await page.goto(appURL + '/administration/agents');
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click();
    await page
      .getByRole('tab', { name: 'Saved version checks', exact: true })
      .click();
    const checks = page.locator('app-agent-authoring');
    const workflow = checks.locator('app-agent-workflow-checks');
    await expect(workflow).toContainText('Invoice review');
    await workflow
      .locator('app-record-table')
      .first()
      .getByRole('button', { name: 'Select', exact: true })
      .click();
    await workflow
      .locator('app-record-table')
      .nth(1)
      .getByRole('button', { name: 'Select', exact: true })
      .click();
    await workflow
      .getByRole('button', { name: 'Inspect workflow inputs', exact: true })
      .click();
    await expect(workflow).toContainText('No saved sample is available');
    await expect(checks).toContainText('No choice sample is available');
    await workflow
      .getByLabel('Provide an author sample', { exact: true })
      .check();
    const question = workflow
      .locator('fieldset')
      .filter({ has: page.locator('legend bdi', { hasText: /^question$/ }) });
    await question.getByLabel('Include input', { exact: true }).check();
    await workflow
      .locator('input#agent-sample-question')
      .fill('Proceed with review?');
    const choices = workflow
      .locator('fieldset')
      .filter({ has: page.locator('legend bdi', { hasText: 'choices' }) });
    await choices.getByLabel('Include input', { exact: true }).check();
    await workflow
      .getByRole('button', { name: 'Preview sample choices', exact: true })
      .click();
    await expect(checks).toContainText('The choice sample is empty');
    await workflow
      .getByRole('button', { name: 'Add choice', exact: true })
      .click();
    await workflow.locator('input[id^="sample-key-"]').fill('proceed');
    await workflow.locator('input[id^="sample-en-"]').fill('Proceed');
    await workflow.locator('input[id^="sample-fa-"]').fill('ادامه');
    await workflow.locator('input[id^="sample-ar-"]').fill('متابعة');
    await workflow
      .locator('textarea[id^="sample-description-"]')
      .fill('Ask a person to review.');
    await workflow
      .getByRole('button', { name: 'Preview sample choices', exact: true })
      .click();
    await expect(checks).toContainText('The choice sample is valid');
    const lookup = checks.locator('app-agent-retrieval-checks');
    await lookup.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(
      lookup.getByLabel('Maximum rows', { exact: true }),
    ).toHaveValue('3');
    await lookup
      .getByRole('button', { name: 'Preview lookup', exact: true })
      .click();
    await expect(lookup).toContainText('Human tool approval is still required');
    expect(submissions).toEqual([]);
    const evaluation = checks.locator('app-agent-evaluation-checks');
    await evaluation
      .getByRole('button', { name: 'Select', exact: true })
      .click();
    await evaluation
      .getByRole('button', { name: 'Submit saved request', exact: true })
      .click();
    const confirmation = page.getByRole('dialog', {
      name: 'Confirm action',
      exact: true,
    });
    await expect(confirmation).toContainText('Quarterly invoice');
    await confirmation
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    expect(submissions).toEqual([]);
    await evaluation
      .getByRole('button', { name: 'Submit saved request', exact: true })
      .click();
    await confirmation
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
    await expect(evaluation).toContainText('Request submission confirmed');
    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toEqual({
      request_ref: 'evaluation-request',
      submit_key: expect.any(String),
    });
    await expect(
      evaluation.getByRole('link', { name: 'Track process', exact: true }),
    ).toHaveAttribute('href', '/operations/processes/evaluation-process');
    const settings = page.locator('app-workspace-preferences details');
    if ((await settings.getAttribute('open')) === null) {
      await settings.locator('summary').click();
    }
    await settings.locator('[data-language-picker] [role="combobox"]').click();
    await page.getByRole('option', { name: 'فارسی', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(
      checks.getByRole('heading', {
        name: 'بررسی نسخه ذخیره‌شده',
        exact: true,
      }),
    ).toBeVisible();
    await expect(workflow.locator('input[id^="sample-fa-"]')).toHaveValue(
      'ادامه',
    );
    await expect(checks).toContainText('ارزیابی کنترل‌شده');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    if (width === 390) {
      await settings.locator('summary').click();
    }
    await page.screenshot({
      path: test.info().outputPath('saved-agent-checks-fa.png'),
      fullPage: true,
    });
  });
}
