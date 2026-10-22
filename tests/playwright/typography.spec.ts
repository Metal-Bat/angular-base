import { expect, test } from './fixtures';

for (const code of ['fa', 'ar'] as const) {
  test(`${code}: bundled Vazirmatn loads for controls and overlays`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.locator('[data-language-picker] [role=combobox]').click();
    await page
      .getByRole('option', {
        name: code === 'fa' ? 'فارسی' : 'العربية',
        exact: true,
      })
      .click();
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.locator('body')).toHaveCSS(
      'font-family',
      'Vazirmatn, Tahoma, sans-serif',
    );
    const loaded = await page.evaluate(async () => {
      const faces = await document.fonts.load(
        '400 16px Vazirmatn',
        'فارسی العربية',
      );
      const bold = await document.fonts.load(
        '700 16px Vazirmatn',
        'فارسی العربية',
      );
      return [...faces, ...bold].map((face) => ({
        family: face.family,
        status: face.status,
      }));
    });
    expect(loaded.length).toBeGreaterThanOrEqual(2);
    expect(
      loaded.every(
        (face) => face.family === 'Vazirmatn' && face.status === 'loaded',
      ),
    ).toBe(true);
    const asset = await page.request.get(
      appURL + '/fonts/vazirmatn/Vazirmatn-Variable.woff2',
    );
    expect(asset.status()).toBe(200);
    expect((await asset.body()).subarray(0, 4).toString()).toBe('wOF2');
    await page.locator('[data-language-picker] [role=combobox]').click();
    await expect(page.getByRole('listbox')).toHaveCSS(
      'font-family',
      'Vazirmatn, Tahoma, sans-serif',
    );
  });
}
