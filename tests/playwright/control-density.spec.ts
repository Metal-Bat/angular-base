import { expect, test } from './fixtures';

test('Saved density aligns native values and selectors without shrinking text', async ({
  page,
  appURL,
}, testInfo): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [density, label, height] of [
    ['comfortable', 'Comfortable', 40],
    ['compact', 'Compact', 36],
  ] as const) {
    await page.goto(appURL + '/account/profile');
    await page.getByRole('combobox', { name: 'Density', exact: true }).click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-density', density);
    await expect(
      page.locator('app-profile-appearance [data-preference-status]'),
    ).toHaveAttribute('data-preference-status', 'saved');
    await page.goto(appURL + '/users');
    const query = page.locator('app-list-query');
    await query
      .getByRole('button', { name: 'Advanced filters', exact: true })
      .click();
    await expect(
      query.getByText('Advanced filters', { exact: true }),
    ).toHaveCount(1);
    await query
      .getByRole('button', { name: 'Add filter', exact: true })
      .click();
    await query.getByRole('combobox', { name: 'Field', exact: true }).click();
    await page.getByRole('option', { name: 'Username', exact: true }).click();
    await expect(page.locator('.p-select-overlay')).toHaveCount(0);
    const controls = query.locator(
      '.filter-row .field-control > input, .filter-row .field-control > app-select-control',
    );
    await expect(controls).toHaveCount(3);
    for (const control of await controls.all()) {
      await expect
        .poll(async () =>
          Math.abs((await control.boundingBox())!.height - height),
        )
        .toBeLessThan(1);
    }
    // The native value is a sibling of the two selectors, with the same body text size.
    await expect(query.locator('.filter-row .field-control > input')).toHaveCSS(
      'font-size',
      '16px',
    );
    await testInfo.attach(`${density}-filters`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const control of await controls.all()) {
      await expect
        .poll(async () => (await control.boundingBox())!.height)
        .toBeGreaterThanOrEqual(44);
    }
    await expect(query.locator('.filter-row .field-control > input')).toHaveCSS(
      'font-size',
      '16px',
    );
    await expect(page.locator('html')).toHaveAttribute('data-density', density);
    for (const name of ['Add filter', 'Remove filter 1']) {
      const bounds = await query
        .getByRole('button', { name, exact: true })
        .boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('link', { name: 'Ali', exact: true }).click();
    await page
      .getByRole('button', { name: 'Update User', exact: true })
      .click();
    const firstName = page.getByLabel('First Name', { exact: true });
    await expect(firstName).toHaveCSS('font-size', '16px');
    await expect
      .poll(async () =>
        Math.abs((await firstName.boundingBox())!.height - height),
      )
      .toBeLessThan(1);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  }
});
