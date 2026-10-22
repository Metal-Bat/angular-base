import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures';

for (const receipt of ['absent', 'committed'] as const) {
  test.describe(`Unusable ${receipt} attachment receipt`, () => {
    test.use({ attachmentReceipt: receipt });
    for (const { width, language } of [
      { width: 1440, language: 'en' },
      { width: 390, language: 'en' },
      { width: 390, language: 'fa' },
    ]) {
      test(`Recovers a chosen file without another byte upload at ${width}px in ${language}`, async ({
        page,
        appURL,
      }): Promise<void> => {
        await page.setViewportSize({
          width,
          height: width === 390 ? 844 : 900,
        });
        let uploads = 0;
        const links: unknown[] = [];
        page.on('request', (request) => {
          if (request.method() !== 'POST') {
            return;
          }
          if (request.url().endsWith('/api/v1/media/files')) {
            uploads++;
          }
          if (request.url().endsWith('/attachments')) {
            links.push(request.postDataJSON());
          }
        });
        await page.goto(
          appURL + '/operations/requests/' + encodeURIComponent('request/1'),
        );
        const farsi = language === 'fa';
        if (farsi) {
          await page
            .locator('app-workspace-preferences details summary')
            .click();
          const picker = page.locator(
            '[data-language-picker] [role="combobox"]',
          );
          await picker.click();
          const popup = page.locator(
            '[id="' + (await picker.getAttribute('aria-controls')) + '"]',
          );
          await popup
            .getByRole('option', { name: 'فارسی', exact: true })
            .click();
          await expect(picker).toHaveAttribute('aria-expanded', 'false');
          await expect(popup).toBeHidden();
          await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
          await page
            .locator('app-workspace-preferences details summary')
            .click();
        }
        const field = page.locator('app-attachment-control');
        await expect(
          field.getByText('Receipts', { exact: true }),
        ).toBeVisible();
        await field
          .getByRole('textbox', {
            name: farsi ? 'عنوان پیوست' : 'Caption',
            exact: true,
          })
          .fill('Purchase receipt');
        const choosing = page.waitForEvent('filechooser');
        await field
          .getByRole('group', {
            name: farsi ? 'بارگذاری پیوست' : 'Upload attachment',
            exact: true,
          })
          .locator('input[type=file]')
          .click();
        await (
          await choosing
        ).setFiles({
          name: 'purchase-receipt.txt',
          mimeType: 'text/plain',
          buffer: Buffer.alloc(256 * 1024, 'x'),
        });
        const recovery = field.locator('.attachment-recovery');
        await expect(recovery).toBeVisible();
        await expect(field.locator('.attachment-rules')).toBeHidden();
        await expect(
          field.locator('app-attachment-recovery').first(),
        ).toHaveAttribute('dir', farsi ? 'rtl' : 'ltr');
        await expect(recovery).toContainText('purchase-receipt.txt');
        await expect(recovery).toContainText('Purchase receipt');
        await expect(field).not.toContainText('fixture-private-upload');
        const retry = recovery.getByRole('button', {
          name: farsi ? 'تلاش دوباره برای پیوست فایل' : 'Retry attachment link',
          exact: true,
        });
        await expect(retry).toBeDisabled();
        const submit = page
          .locator('app-case-page-header')
          .getByRole('button', {
            name: farsi ? 'ارسال' : 'Submit',
            exact: true,
          });
        await expect(submit).toBeDisabled();
        expect(uploads).toBe(1);
        expect(links).toHaveLength(1);
        for (const button of await recovery.getByRole('button').all()) {
          const bounds = (await button.boundingBox())!;
          expect(bounds.height).toBeGreaterThanOrEqual(44);
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        }
        await recovery.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: test.info().outputPath('pending-attachment.png'),
          fullPage: false,
        });
        await recovery
          .getByRole('button', {
            name: farsi ? 'بررسی وضعیت پیوست' : 'Check attachment state',
            exact: true,
          })
          .click();
        if (receipt === 'absent') {
          await expect(retry).toBeEnabled();
          await expect(submit).toBeDisabled();
          await retry.click();
          await expect(recovery).toHaveCount(0);
          expect(links).toHaveLength(2);
          expect(links[1]).toEqual(links[0]);
        } else {
          await expect(recovery).toHaveCount(0);
          expect(links).toHaveLength(1);
        }
        expect(uploads).toBe(1);
        expect(links[0]).toEqual({
          field_path: '/amount',
          upload_ref_id: 'fixture-private-upload',
          caption: 'Purchase receipt',
        });
        await expect(
          field.getByRole('button', {
            name: farsi ? 'دریافت' : 'Download',
            exact: true,
          }),
        ).toBeVisible();
        await expect(field).toContainText('Purchase receipt');
        await expect(submit).toBeEnabled();
        const downloading = page.waitForEvent('download');
        await field
          .getByRole('button', {
            name: farsi ? 'دریافت' : 'Download',
            exact: true,
          })
          .click();
        const download = await downloading;
        expect(await download.failure()).toBeNull();
        expect(download.suggestedFilename()).toBe('purchase-receipt.txt');
        expect(
          (await readFile((await download.path())!)).equals(
            Buffer.alloc(256 * 1024, 'x'),
          ),
        ).toBe(true);
        expect(uploads).toBe(1);

        const geometry = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          overflowing: [...document.querySelectorAll<HTMLElement>('body *')]
            .filter(
              (element) =>
                element.getClientRects().length &&
                element.getBoundingClientRect().right > innerWidth + 1,
            )
            .map((element) => ({
              tag: element.tagName,
              classes: element.className,
              right: element.getBoundingClientRect().right,
              width: element.getBoundingClientRect().width,
              minWidth: getComputedStyle(element).minWidth,
              display: getComputedStyle(element).display,
            })),
        }));
        await test.info().attach('attachment-layout-geometry', {
          body: JSON.stringify(geometry),
          contentType: 'application/json',
        });
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        await page.screenshot({
          path: test.info().outputPath('confirmed-attachment.png'),
          fullPage: true,
        });
      });
    }
  });
}
