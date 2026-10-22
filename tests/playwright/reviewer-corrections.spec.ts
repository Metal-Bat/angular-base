import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';
async function installReturnFixture(page: Page): Promise<void> {
  let returned = false;
  await page.route('**/api/v1/work-items/**', async (route) => {
    if (
      route.request().method() === 'POST' &&
      route.request().url().endsWith('/return')
    ) {
      returned = true;
    }
    const response = await route.fetch();
    const envelope = await response.json();
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') {
        return;
      }
      const row = value as Record<string, unknown>;
      if (
        row['runtime_dialect'] === 'bpms.runtime/1' &&
        row['resource_kind'] === 'WORK_ITEM'
      ) {
        const actions = row['actions'] as Record<string, unknown>[];
        if (returned) {
          row['purpose'] = 'observer';
          row['actions'] = [];
          row['writable_scopes'] = [];
          row['field_metadata'] = (
            row['field_metadata'] as Record<string, unknown>[]
          ).map((field) => ({ ...field, writable: false }));
        } else if (actions.length) {
          row['actions'] = [
            ...actions,
            {
              key: 'return',
              kind: 'return',
              outcome_key: 'return',
              title: 'Return',
              confirmation: null,
              required_scopes: [],
              require_comment: true,
              validation: 'partial',
            },
          ];
        }
      }
      if (
        returned &&
        typeof row['status'] === 'string' &&
        row['kind'] === 'HUMAN_TASK'
      ) {
        row['status'] = 'RETURNED';
      }
      for (const child of Object.values(row)) {
        visit(child);
      }
    };
    visit(envelope);
    await route.fulfill({ response, json: envelope });
  });
}
for (const language of ['en', 'fa', 'ar'] as const) {
  for (const width of [390, 1440]) {
    test(`${language} ${width}: field corrections retain drafts and send one explicit return`, async ({
      page,
      appURL,
    }, testInfo) => {
      await installReturnFixture(page);
      await page.goto(
        appURL + '/operations/tasks/' + encodeURIComponent('task/1'),
      );
      await page.getByRole('button', { name: 'Claim', exact: true }).click();
      await expect(
        page.locator('app-correction-feedback-editor'),
      ).toBeVisible();
      if (language !== 'en') {
        await page.locator('[data-language-picker] [role=combobox]').click();
        await page
          .getByRole('option', {
            name: language === 'fa' ? 'فارسی' : 'العربية',
            exact: true,
          })
          .click();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('.p-select-overlay')).toHaveCount(0);
      }
      await page.setViewportSize({ width, height: 900 });
      const panel = page.locator('app-correction-feedback-editor');
      const add = {
        en: 'Add correction',
        fa: 'افزودن اصلاح',
        ar: 'إضافة تصحيح',
      }[language];
      await panel.getByRole('button', { name: add, exact: true }).click();
      const target = panel.getByRole('combobox');
      await target.click();
      await page
        .getByRole('option')
        .filter({ hasText: /Amount|مبلغ|المبلغ/ })
        .click();
      const message = panel.locator('textarea');
      await message.fill('Fix this amount');
      const decision = page
        .locator('app-task-controls')
        .getByRole('button', { name: 'Return', exact: true });
      await expect(decision).toBeDisabled();
      await page.locator('#task-comment').fill('Please correct');
      await expect(decision).toBeEnabled();
      await panel.screenshot({
        path: testInfo.outputPath('correction-fields.png'),
      });
      for (const control of await panel
        .locator('textarea, [role=combobox], button')
        .all()) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      }
      const leaving = page.locator('app-case-page-header a').first();
      await leaving.click();
      const confirmation = page.locator('dialog[open]');
      await expect(confirmation).toBeVisible();
      await confirmation
        .getByRole('button', {
          name: { en: 'Cancel', fa: 'انصراف', ar: 'إلغاء' }[language],
          exact: true,
        })
        .click();
      await expect(message).toHaveValue('Fix this amount');
      const sent: unknown[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/return')) {
          sent.push(request.postDataJSON());
        }
      });
      await decision.click();
      await confirmation
        .getByRole('button', {
          name: { en: 'Continue', fa: 'ادامه', ar: 'متابعة' }[language],
          exact: true,
        })
        .click();
      await expect.poll(() => sent.length).toBe(1);
      expect(sent[0]).toMatchObject({
        outcome_key: 'return',
        comment: 'Please correct',
        feedback: [
          {
            scope: '/properties/amount',
            item_key: null,
            message: 'Fix this amount',
          },
        ],
      });
      await expect(decision).toHaveCount(0);
    });
  }
}
