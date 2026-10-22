import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

type Language = 'en' | 'fa' | 'ar';
const labels = {
  en: {
    count: 'Item count',
    value: 'Literal value',
    next: 'Next page',
    save: 'Save',
    saved: 'Saved',
    previous: 'Previous submission',
  },
  fa: {
    count: 'تعداد اقلام',
    value: 'مقدار فیلد',
    next: 'صفحه بعد',
    save: 'ذخیره',
    saved: 'ذخیره‌شده',
    previous: 'ارسال پیشین',
  },
  ar: {
    count: 'عدد العناصر',
    value: 'قيمة الحقل',
    next: 'الصفحة التالية',
    save: 'حفظ',
    saved: 'تم الحفظ',
    previous: 'الإرسال السابق',
  },
} as const;

/** Fixture presentation only; actual canonical persistence has its owned-service journey. */
async function literalFixture(page: Page, language: Language): Promise<void> {
  let saved = { items_total: 1, items: 'Original literal' };
  await page.route('**/api/v1/business-requests/**', async (route) => {
    if (route.request().method() === 'PUT') {
      saved = route.request().postDataJSON().data as typeof saved;
    }
    const response = await route.fetch();
    const envelope: unknown = await response.json();
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') {
        return;
      }
      const row = value as Record<string, unknown>;
      if (
        row['runtime_dialect'] === 'bpms.runtime/1' &&
        row['resource_kind'] === 'REQUEST'
      ) {
        const scopes = ['/properties/items_total', '/properties/items'];
        row['data'] = saved;
        row['before_data'] = { items_total: 1, items: 'Earlier literal' };
        row['before_item_identity'] = {};
        row['resolved_locale'] = language;
        row['direction'] = language === 'en' ? 'ltr' : 'rtl';
        row['readable_scopes'] = scopes;
        row['writable_scopes'] = scopes;
        row['required_scopes'] = [scopes[0]];
        row['actions'] = [];
        row['field_metadata'] = [
          {
            scope: scopes[0],
            validation_schema: { type: 'integer', minimum: 1 },
            writable: true,
            required: true,
          },
          {
            scope: scopes[1],
            validation_schema: { type: 'string', minLength: 3 },
            writable: true,
            required: false,
          },
        ];
        row['render_schema'] = {
          dialect: 'bpms.render/1',
          root: {
            component: 'vertical',
            children: [
              {
                component: 'integer',
                scope: scopes[0],
                label: labels[language].count,
              },
              {
                component: 'text',
                scope: scopes[1],
                label: labels[language].value,
              },
            ],
          },
        };
        row['page_settings'] = {
          pages: [
            { key: 'count', title: 'Count', scopes: [scopes[0]] },
            { key: 'values', title: 'Values', scopes: [scopes[1]] },
          ],
        };
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
    test(`${language} ${width}: literal items fields validate, retain prior values and save exact keys`, async ({
      page,
      appURL,
    }, testInfo) => {
      if (language !== 'en') {
        await page.locator('[data-language-picker] [role=combobox]').click();
        await page
          .getByRole('option', {
            name: language === 'fa' ? 'فارسی' : 'العربية',
            exact: true,
          })
          .click();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
      }
      await page.setViewportSize({ width, height: 900 });
      await literalFixture(page, language);
      const path = '/operations/requests/' + encodeURIComponent('request/1');
      await page.goto(appURL + path);
      const form = page.locator('app-runtime-form');
      const count = form.getByRole('textbox', {
        name: labels[language].count,
        exact: true,
      });
      await expect(count).toHaveValue('1');
      await count.fill('not-a-number');
      await form
        .getByRole('button', { name: labels[language].next, exact: true })
        .click();
      await expect(form.locator('nav h2')).toHaveText('Count');
      await expect(
        form.locator(':scope > section > p[role=alert]'),
      ).toBeVisible();
      await count.fill('0');
      await form
        .getByRole('button', { name: labels[language].next, exact: true })
        .click();
      await expect(form.locator('nav h2')).toHaveText('Count');
      await expect(form.locator('[role=alert]')).toBeVisible();
      await count.fill('5');
      await form
        .getByRole('button', { name: labels[language].next, exact: true })
        .click();
      await expect(form.locator('nav h2')).toHaveText('Values');
      const value = form.getByRole('textbox', {
        name: labels[language].value,
        exact: true,
      });
      await value.fill('New literal value');
      await form.getByText(labels[language].previous, { exact: true }).click();
      await expect(
        form.getByText('Earlier literal', { exact: true }),
      ).toBeVisible();
      const request = page.waitForRequest(
        (row) =>
          row.method() === 'PUT' &&
          row.url().includes('/api/v1/business-requests/'),
      );
      await page
        .locator('app-case-page-header')
        .getByRole('button', { name: labels[language].save, exact: true })
        .click();
      expect((await request).postDataJSON().data).toEqual({
        items_total: 5,
        items: 'New literal value',
      });
      await expect(
        page
          .locator('app-case-detail')
          .getByText(labels[language].saved, { exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('app-case-detail > p[role=status]'),
      ).toHaveCount(0);
      await page.reload();
      await expect(count).toHaveValue('5');
      await form
        .getByRole('button', { name: labels[language].next, exact: true })
        .click();
      await expect(value).toHaveValue('New literal value');
      await form.screenshot({
        path: testInfo.outputPath('literal-fields.png'),
      });
      const bounds = await value.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    });
  }
}
