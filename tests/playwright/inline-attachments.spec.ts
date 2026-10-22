import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures';
import { dropFiles } from './file-actions';

test.use({ inlineAttachments: true });
for (const { width, language } of [
  { width: 1440, language: 'en' },
  { width: 390, language: 'fa' },
]) {
  test(`Inline files and images preserve confirmed content through replacement at ${width}px in ${language}`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(
      appURL + '/operations/requests/' + encodeURIComponent('request/1'),
    );
    const fa = language === 'fa';
    const png = Buffer.from(
      await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 640;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#e4edff';
        context.fillRect(0, 0, 960, 640);
        context.fillStyle = '#173f96';
        context.font = '60px sans-serif';
        context.fillText('Private receipt', 80, 160);
        context.fillRect(80, 240, 800, 12);
        context.fillRect(80, 300, 600, 12);
        return canvas.toDataURL('image/png').split(',')[1];
      }),
      'base64',
    );
    if (fa) {
      await page.locator('app-workspace-preferences details summary').click();
      await page.locator('[data-language-picker] [role=combobox]').click();
      await page.getByRole('option', { name: 'فارسی', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await page.locator('app-workspace-preferences details summary').click();
    }
    const field = page.locator('app-attachment-control');
    const caption = field.getByRole('textbox', {
      name: fa ? 'عنوان پیوست' : 'Caption',
      exact: true,
    });
    const kind = field.getByRole('combobox', {
      name: fa ? 'نوع بارگذاری' : 'Upload as',
      exact: true,
    });
    const add = field.getByRole('group', {
      name: fa ? 'بارگذاری پیوست' : 'Upload attachment',
      exact: true,
    });
    let imageUploads = 0;
    let fileUploads = 0;
    let replacements = 0;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith('/media/images')
      ) {
        imageUploads++;
      }
      if (
        request.method() === 'POST' &&
        request.url().endsWith('/media/files')
      ) {
        fileUploads++;
      }
      if (
        request.method() === 'PUT' &&
        /\/attachments\/[^/]+$/.test(request.url())
      ) {
        replacements++;
      }
    });
    await expect(caption).toBeEnabled();
    await caption.fill('Current receipt');
    await kind.click();
    await page
      .getByRole('option', { name: fa ? 'تصویر' : 'Image', exact: true })
      .click();
    await dropFiles(add, [
      { name: 'receipt.png', mimeType: 'image/png', buffer: png },
    ]);
    const row = field.locator('.attachment-items > li').first();
    await expect(
      row.getByRole('button', {
        name: fa ? 'پیش‌نمایش تصویر' : 'Preview image',
        exact: true,
      }),
    ).toBeVisible();
    expect(imageUploads).toBe(1);
    await row
      .getByRole('button', {
        name: fa ? 'پیش‌نمایش تصویر' : 'Preview image',
        exact: true,
      })
      .click();
    const current = row.locator('app-attachment-image img');
    await expect
      .poll(() =>
        current.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const previous = await current.getAttribute('src');
    await expect(caption).toBeEnabled();
    await caption.fill('Replacement receipt');
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/attachments/*', async (route) => {
      if (route.request().method() === 'PUT') {
        await held;
      }
      await route.continue();
    });
    try {
      await row
        .getByRole('group', {
          name: fa ? 'جایگزینی پیوست' : 'Replace attachment',
          exact: true,
        })
        .locator('input[type=file]')
        .setInputFiles({
          name: 'replacement.png',
          mimeType: 'image/png',
          buffer: png,
        });
      await expect.poll(() => replacements).toBe(1);
      await expect(current).toHaveAttribute('src', previous!);
      await expect(row).toContainText('Current receipt');
      release();
      await expect(
        field.locator('.attachment-items > li').first(),
      ).toContainText('Replacement receipt');
    } finally {
      release();
    }
    expect(imageUploads).toBe(2);
    await expect(caption).toBeEnabled();
    await caption.fill('Document as file');
    await kind.click();
    await page
      .getByRole('option', { name: fa ? 'فایل' : 'File', exact: true })
      .click();
    const bytes = Buffer.alloc(1024, 'x');
    await add.locator('input[type=file]').setInputFiles({
      name: 'receipt.txt',
      mimeType: 'text/plain',
      buffer: bytes,
    });
    const fileRow = field.locator('.attachment-items > li').last();
    await expect(fileRow).toContainText('Document as file');
    await expect(
      fileRow.getByRole('button', {
        name: fa ? 'پیش‌نمایش تصویر' : 'Preview image',
        exact: true,
      }),
    ).toHaveCount(0);
    expect(fileUploads).toBe(1);
    const downloading = page.waitForEvent('download');
    await fileRow
      .getByRole('button', { name: fa ? 'دریافت' : 'Download', exact: true })
      .click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('receipt.txt');
    expect((await readFile((await download.path())!)).equals(bytes)).toBe(true);
    await expect(field).not.toContainText('fixture-private-');
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await field.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: test.info().outputPath('inline-private-attachments.png'),
      fullPage: true,
    });
    await fileRow
      .getByRole('button', { name: fa ? 'برداشتن' : 'Remove', exact: true })
      .click();
    const confirmation = page.getByRole('dialog');
    await expect(confirmation).toBeVisible();
    await confirmation
      .getByRole('button', { name: fa ? 'ادامه' : 'Continue', exact: true })
      .click();
    await expect(field.locator('.attachment-items > li')).toHaveCount(1);
    expect(imageUploads).toBe(2);
    expect(fileUploads).toBe(1);
  });
}
