import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';
type Language = 'en' | 'fa' | 'ar';
const labels = {
  en: {
    count: 'Count',
    note: 'Note',
    rows: 'Items',
    go: 'Go to field',
    row: 'Row',
    unavailable: 'Field unavailable',
  },
  fa: {
    count: 'تعداد',
    note: 'یادداشت',
    rows: 'اقلام',
    go: 'رفتن به فیلد',
    row: 'ردیف',
    unavailable: 'فیلد در دسترس نیست',
  },
  ar: {
    count: 'العدد',
    note: 'ملاحظة',
    rows: 'العناصر',
    go: 'الانتقال إلى الحقل',
    row: 'الصف',
    unavailable: 'الحقل غير متاح',
  },
} as const;

/** Presentation fixture only. Actual collection/reviewer persistence has a separate owned-service journey. */
async function install(
  page: Page,
  language: Language,
): Promise<{ rows: (keys: string[]) => void; observe: () => void }> {
  let keys = ['row-a', 'row-b'];
  let observer = false;
  const scopes = [
    '/properties/amount',
    '/properties/lines',
    '/properties/lines/items/properties/note',
  ];
  const render = {
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
          component: 'repeater',
          scope: scopes[1],
          label: labels[language].rows,
          children: [
            {
              component: 'text',
              scope: scopes[2],
              label: labels[language].note,
            },
          ],
        },
      ],
    },
  };
  await page.route('**/api/v1/work-items/**', async (route) => {
    const response = await route.fetch();
    const envelope: unknown = await response.json();
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') {
        return;
      }
      const row = value as Record<string, unknown>;
      const runtime =
        row['runtime_dialect'] === 'bpms.runtime/1' &&
        row['resource_kind'] === 'WORK_ITEM';
      const view =
        typeof row['work_item_ref_id'] === 'string' &&
        Array.isArray(row['feedback']);
      if (runtime || view) {
        const writable =
          !observer && ['edit', 'correction'].includes(String(row['purpose']));
        row['data'] = {
          amount: 1,
          lines: keys.map((key) => ({
            note: key === 'row-a' ? 'Current A' : 'Current B',
          })),
        };
        row['item_identity'] = { '/lines': keys };
        row['before_data'] = {
          amount: 1,
          lines: [{ note: 'Prior A' }, { note: 'Prior B' }],
        };
        row['before_item_identity'] = { '/lines': ['row-a', 'row-b'] };
        row['render_schema'] = render;
        if (observer) {
          row['purpose'] = 'observer';
          row['actions'] = [];
        }
        if (runtime) {
          row['resolved_locale'] = language;
          row['direction'] = language === 'en' ? 'ltr' : 'rtl';
          row['readable_scopes'] = scopes;
          row['writable_scopes'] = writable ? scopes : [];
          row['required_scopes'] = [];
          row['field_metadata'] = [
            {
              scope: scopes[0],
              validation_schema: { type: 'integer' },
              writable,
              required: false,
            },
            {
              scope: scopes[1],
              validation_schema: { type: 'array', items: { type: 'object' } },
              writable,
              required: false,
            },
            {
              scope: scopes[2],
              validation_schema: { type: 'string' },
              writable,
              required: false,
            },
          ];
          row['page_settings'] = {
            pages: [
              {
                key: 'count',
                title: labels[language].count,
                scopes: [scopes[0]],
              },
              {
                key: 'items',
                title: labels[language].rows,
                scopes: scopes.slice(1),
              },
            ],
          };
        }
        if (view) {
          row['feedback'] = [
            {
              key: 'count-feedback',
              scope: scopes[0],
              item_key: null,
              message: 'Correct count',
              status: 'OPEN',
            },
            {
              key: 'row-feedback',
              scope: scopes[2],
              item_key: 'row-a',
              message: 'Correct original row',
              status: 'OPEN',
            },
          ];
        }
      }
      for (const child of Object.values(row)) {
        visit(child);
      }
    };
    visit(envelope);
    await route.fulfill({ response, json: envelope });
  });
  return {
    rows: (next): void => {
      keys = next;
    },
    observe: (): void => {
      observer = true;
    },
  };
}
for (const language of ['en', 'fa', 'ar'] as const) {
  for (const width of [390, 1440]) {
    test(`${language} ${width}: correction links preserve drafts and follow stable rows across pages`, async ({
      page,
      appURL,
    }, testInfo) => {
      const state = await install(page, language);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(
        appURL + '/operations/tasks/' + encodeURIComponent('task/1'),
      );
      await page.getByRole('button', { name: 'Claim', exact: true }).click();
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
      const form = page.locator('app-runtime-form');
      const feedback = page.locator('.task-feedback');
      await expect(feedback).toHaveAttribute('aria-busy', 'false');
      await feedback.locator('summary').click();
      const row = feedback
        .locator('li')
        .filter({ hasText: 'Correct original row' });
      const countFeedback = feedback
        .locator('li')
        .filter({ hasText: 'Correct count' });
      const go = (root: Locator): Locator =>
        root.getByRole('button', {
          name: new RegExp('^' + labels[language].go + ':'),
        });
      const count = form.getByRole('textbox', {
        name: labels[language].count,
        exact: true,
      });
      await expect(count).toHaveValue('1');
      await expect(row).toContainText(labels[language].row + ' 1');
      const mutations: string[] = [];
      page.on('request', (request) => {
        if (
          request.method() !== 'GET' &&
          request.url().includes('/api/v1/work-items/')
        ) {
          mutations.push(request.method());
        }
      });
      await count.fill('invalid');
      await go(row).click();
      await expect(form.locator('nav h2')).toHaveText(labels[language].count);
      await expect(count).toHaveValue('invalid');
      await expect(count).toBeFocused();
      await expect(
        form.locator(':scope > section > p[role=alert]'),
      ).toBeVisible();
      await count.fill('42');
      await go(row).click();
      const note = form.getByRole('textbox', {
        name: labels[language].note,
        exact: true,
      });
      await expect(note.nth(0)).toBeFocused();
      await expect(note.nth(0)).toHaveValue('Current A');
      await go(countFeedback).click();
      await expect(count).toBeFocused();
      await expect(count).toHaveValue('42');
      state.rows(['row-b', 'row-a']);
      const refresh = page.locator('app-case-detail > button.reload-control');
      const refreshKeepingEdits = async (): Promise<void> => {
        await refresh.click();
        const confirmation = page.locator('dialog[open]');
        await expect(confirmation).toBeVisible();
        await confirmation
          .getByRole('button', {
            name: { en: 'Continue', fa: 'ادامه', ar: 'متابعة' }[language],
            exact: true,
          })
          .click();
        await expect(confirmation).toHaveCount(0);
        await expect(feedback).toHaveAttribute('aria-busy', 'false');
      };
      await refreshKeepingEdits();
      await expect(row).toContainText(labels[language].row + ' 2');
      await go(row).click();
      await expect(note.nth(1)).toBeFocused();
      await expect(note.nth(1)).toHaveValue('Current A');
      await expect(row).toContainText('Prior A');
      await expect(row).not.toContainText('row-a');
      await row.screenshot({
        path: testInfo.outputPath('linked-feedback.png'),
      });
      for (const button of await row.getByRole('button').all()) {
        const bounds = await button.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      state.rows(['row-b']);
      await refreshKeepingEdits();
      await expect(row).toContainText(labels[language].unavailable);
      await expect(go(row)).toHaveCount(0);
      state.observe();
      await refreshKeepingEdits();
      await expect(form.locator('output')).toHaveCount(1);
      await go(countFeedback).click();
      await expect(form.locator('output')).toBeFocused();
      await expect(form.locator('output')).toHaveCSS('outline-style', 'solid');
      await expect(feedback.locator('li button')).toHaveCount(1);
      expect(mutations).toEqual([]);
    });
  }
}
