import { expect, test } from './fixtures';

test('Preview width reflows a real grid and preserves answers through phone RTL', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  const focus = page.locator('app-workspace-breadcrumbs button[aria-pressed]');
  await focus.click();
  await page.locator('.form-palette details summary').click();
  await page
    .locator('.all-field-type-buttons')
    .getByRole('button', { name: 'Grid layout', exact: true })
    .click();
  const properties = page.locator('.form-properties');
  await expect(properties.getByLabel('Label', { exact: true })).toBeFocused();
  await properties.getByLabel('Label', { exact: true }).fill('Three columns');
  await properties
    .getByRole('button', { name: 'Appearance', exact: true })
    .click();
  await properties.locator('#field-options-columns').fill('3');
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  for (const label of ['Item', 'Quantity', 'Notes']) {
    await page.getByRole('tab', { name: 'Add', exact: true }).click();
    await page
      .locator('.field-type-buttons')
      .getByRole('button', { name: 'Text', exact: true })
      .click();
    await properties.getByLabel('Label', { exact: true }).fill(label);
    const apply = properties.getByRole('button', {
      name: 'Apply properties',
      exact: true,
    });
    const position = (await apply.boundingBox())!;
    await page.mouse.move(
      position.x + position.width / 2,
      position.y + position.height / 2,
    );
    await page.mouse.down();
    await expect
      .poll(() =>
        properties.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter(
                (animation) =>
                  animation.playState === 'running' &&
                  animation.effect?.getTiming().iterations !== Infinity,
              ).length,
        ),
      )
      .toBe(0);
    expect((await apply.boundingBox())!.y).toBe(position.y);
    await page.mouse.up();
    await expect(
      page.locator('.field-card strong').filter({ hasText: label }),
    ).toHaveText(label);
  }
  await page
    .locator('.form-modes')
    .getByRole('button', { name: 'Preview', exact: true })
    .click();
  const preview = page.locator('.form-live-preview');
  const grid = preview.locator('.runtime-layout[aria-label="Three columns"]');
  const columns = (): Promise<number> =>
    grid.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
  await expect(preview.getByText('Up to date', { exact: true })).toBeVisible();
  await expect.poll(columns).toBe(3);
  const item = preview.getByRole('textbox', { name: 'Item', exact: true });
  const answerPreview = page.waitForRequest(
    (request) =>
      request.url().includes('/api/v1/forms/runtime-preview') &&
      Object.values(request.postDataJSON()?.data ?? {}).includes(
        'Preserved across devices',
      ),
  );
  await item.fill('Preserved across devices');
  await answerPreview;
  await expect(preview.getByText('Up to date', { exact: true })).toBeVisible();
  const previewRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/forms/runtime-preview')) {
      previewRequests.push(request.url());
    }
  });
  await preview.locator('[data-preview-device="phone"]').click();
  await expect.poll(columns).toBe(1);
  expect(
    (await preview.locator('.preview-device-frame').boundingBox())!.width,
  ).toBe(360);
  await expect(item).toHaveValue('Preserved across devices');
  await preview.locator('[data-preview-device="desktop"]').click();
  await expect.poll(columns).toBe(3);
  await expect(item).toHaveValue('Preserved across devices');
  expect(previewRequests).toEqual([]);
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/form-versions/'),
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const saved = (await write).postDataJSON();
  expect(saved.render_schema.root.children[1].options.columns).toBe(3);
  expect(
    saved.render_schema.root.children[1].children.map(
      (node: { label: string }) => node.label,
    ),
  ).toEqual(['Item', 'Quantity', 'Notes']);
  await expect(page.locator('.editor-feedback')).toHaveText('Saved');
  await expect(preview.getByText('Up to date', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect.poll(columns).toBe(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(columns).toBe(1);
  await expect(item).toHaveValue('Preserved across devices');
  await focus.click();
  await page.locator('app-workspace-preferences details summary').click();
  const workspaceLocale = page.locator(
    '[data-language-picker] [role="combobox"]',
  );
  await workspaceLocale.click();
  const workspacePopup = page.locator(
    '[id="' + (await workspaceLocale.getAttribute('aria-controls')) + '"]',
  );
  await workspacePopup
    .getByRole('option', { name: 'فارسی', exact: true })
    .click();
  await expect(workspaceLocale).toHaveAttribute('aria-expanded', 'false');
  await expect(workspacePopup).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await focus.click();
  await expect(preview.locator('.preview-settings')).toBeVisible();
  await expect(preview.locator('.preview-options')).toHaveJSProperty(
    'open',
    false,
  );
  const previewLocale = preview.locator('#preview-locale');
  await previewLocale.click();
  const previewPopup = page.locator(
    '[id="' + (await previewLocale.getAttribute('aria-controls')) + '"]',
  );
  const farsiPreview = page.waitForRequest(
    (request) =>
      request.url().includes('/api/v1/forms/runtime-preview') &&
      request.postDataJSON()?.locale === 'fa',
  );
  await previewPopup
    .getByRole('option', { name: 'فارسی', exact: true })
    .click();
  await farsiPreview;
  await expect(previewLocale).toHaveAttribute('aria-expanded', 'false');
  await expect(previewLocale).toHaveText('فارسی');
  await expect(previewPopup).toBeHidden();
  await expect(preview.locator('app-runtime-form > section')).toHaveAttribute(
    'dir',
    'rtl',
  );
  await expect(preview.locator('.preview-freshness')).toHaveText('به‌روز');
  await expect(item).toHaveValue('Preserved across devices');
  await expect.poll(columns).toBe(1);
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  await test.info().attach('phone-preview-geometry', {
    body: JSON.stringify(geometry),
    contentType: 'application/json',
  });
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.height);
  await page.screenshot({
    path: test.info().outputPath('form-preview-phone-rtl.png'),
    fullPage: true,
  });
});
