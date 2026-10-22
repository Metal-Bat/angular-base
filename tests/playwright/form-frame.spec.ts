import { expect, test } from './fixtures';

test('The form workspace keeps useful pane widths across the required screen sizes', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1366, 768],
    [1024, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    const design = page.locator('.form-design-canvas');
    const preview = page.locator('app-form-live-preview');
    const tools = page.locator('.form-tools');
    await expect(design).toBeVisible();
    if (width >= 1366) {
      await expect(tools).toBeVisible();
      await expect(preview).toBeVisible();
      expect((await design.boundingBox())!.width).toBeGreaterThanOrEqual(560);
      expect((await tools.boundingBox())!.width).toBeGreaterThanOrEqual(272);
      expect((await preview.boundingBox())!.width).toBeGreaterThanOrEqual(360);
      const heights = await page
        .locator('.field-type-buttons button')
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getBoundingClientRect().height),
        );
      expect(heights.every((itemHeight) => itemHeight <= 72)).toBe(true);
    } else if (width === 1024) {
      await expect(tools).toBeHidden();
      await expect(preview).toBeVisible();
      expect((await design.boundingBox())!.width).toBeGreaterThanOrEqual(560);
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
      await expect(tools).toBeVisible();
      await expect(preview).toBeHidden();
      expect((await design.boundingBox())!.width).toBeGreaterThanOrEqual(560);
      expect((await tools.boundingBox())!.width).toBeGreaterThanOrEqual(360);
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
    } else {
      await expect(tools).toBeHidden();
      await expect(preview).toBeHidden();
      await page.getByRole('button', { name: 'Tools', exact: true }).click();
      await expect(tools).toBeVisible();
      await expect(design).toBeVisible();
      expect((await design.boundingBox())!.height).toBeGreaterThanOrEqual(160);
    }
    for (const pane of [design, tools, preview]) {
      if (await pane.isVisible()) {
        expect(
          await pane.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        ).toBe(true);
      }
    }
    await expect
      .poll(() =>
        page.evaluate(() => ({
          horizontal: document.documentElement.scrollWidth <= innerWidth,
          vertical: document.documentElement.scrollHeight <= innerHeight + 1,
        })),
      )
      .toEqual({ horizontal: true, vertical: true });
    await page.screenshot({
      path: test.info().outputPath('form-frame-' + width + '.png'),
    });
    if (width === 390) {
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
      await expect(preview).toBeVisible();
      await expect(design).toBeHidden();
      await expect(preview.locator('app-runtime-form input')).not.toHaveCount(
        0,
      );
    }
  }
});

test('A normal desktop keeps a useful design surface and preserves buffers when tools replace preview', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  const design = page.locator('.form-design-canvas');
  const preview = page.locator('.form-live-preview');
  const tools = page.locator('.form-tools');
  await expect(preview).toBeVisible();
  await expect(tools).toBeHidden();
  expect((await design.boundingBox())!.width).toBeGreaterThanOrEqual(560);
  await preview
    .getByRole('textbox', { name: 'Sample name', exact: true })
    .fill('Retained sample');
  await expect(preview.locator('.preview-freshness')).toHaveText('Up to date');
  await page.getByRole('button', { name: 'Add field', exact: true }).click();
  await expect(
    page.getByRole('tab', { name: 'Add', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.locator('.field-type-buttons button').first(),
  ).toBeFocused();
  await design.locator('.field-card').first().click();
  await expect(tools).toBeVisible();
  await expect(preview).toBeHidden();
  expect((await tools.boundingBox())!.width).toBeGreaterThanOrEqual(360);
  expect((await design.boundingBox())!.width).toBeGreaterThanOrEqual(560);
  await tools.locator('#field-label').fill('Applicant');
  const toggle = page.getByRole('button', { name: 'Tools', exact: true });
  await toggle.click();
  await expect(preview).toBeVisible();
  await toggle.click();
  await expect(tools.locator('#field-label')).toHaveValue('Applicant');
  await tools
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  await toggle.click();
  await expect(
    preview.getByRole('textbox', { name: 'Applicant', exact: true }),
  ).toHaveValue('Retained sample');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
