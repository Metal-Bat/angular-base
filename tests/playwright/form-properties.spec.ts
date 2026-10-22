import { expect, test } from './fixtures';

test('Form properties author Title, Amount and Reason with one preview and explicit Apply', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  const cards = page.locator('app-form-canvas .field-card');
  const properties = page.locator('.form-properties');
  const preview = page.locator('.form-live-preview');
  const unexpectedWrites: string[] = [];
  const definitionWrites: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      request.method() === 'PUT' &&
      path.startsWith('/api/v1/form-versions/')
    ) {
      definitionWrites.push(path);
    } else if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) &&
      path.startsWith('/api/v1/') &&
      !path.endsWith('/search') &&
      !['/api/v1/forms/runtime-preview', '/api/v1/forms/options'].includes(path)
    ) {
      unexpectedWrites.push(path);
    }
  });
  const guidance = preview.getByRole('button', {
    name: 'About preview',
    exact: true,
  });
  await guidance.click();
  const guidancePopup = page.getByRole('dialog', {
    name: 'About preview',
    exact: true,
  });
  await expect(guidancePopup).toHaveAttribute('aria-modal', 'false');
  await expect(guidancePopup).toContainText(
    'Try sample answers and rows here. They are not saved. File uploads are unavailable in preview.',
  );
  await expect(
    guidancePopup.getByRole('button', { name: 'Close', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(guidancePopup).toBeHidden();
  await expect(guidance).toBeFocused();
  await cards.first().click();
  await expect(properties.getByLabel('Label', { exact: true })).toBeFocused();
  await properties.getByLabel('Label', { exact: true }).fill('Title');
  await properties
    .getByRole('checkbox', { name: 'Required', exact: true })
    .check();
  await expect(
    page.getByRole('button', { name: 'Save draft', exact: true }),
  ).toBeDisabled();
  await expect(cards.first().locator('strong')).toHaveText('Sample name');
  await expect(page.locator('.editor-feedback')).toHaveText(
    'Apply pending edits',
  );
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  await expect(cards.first().locator('strong')).toHaveText('Title *Required');
  await expect(page.locator('.editor-feedback')).toHaveText(
    'Unsaved draft changes',
  );
  await expect(cards.first().locator('strong [aria-hidden="true"]')).toHaveText(
    '*',
  );
  await preview
    .getByRole('textbox', { name: /^Title/ })
    .fill('Laptop replacement');
  await expect(
    preview.getByRole('textbox', { name: /^Title/ }),
  ).toHaveAttribute('aria-required', 'true');
  await expect(preview.locator('label [aria-hidden="true"]')).toHaveText('*');

  await page.getByRole('tab', { name: 'Add', exact: true }).click();
  await page
    .locator('.field-type-buttons')
    .getByRole('button', { name: 'Whole number', exact: true })
    .click();
  await properties.getByLabel('Label', { exact: true }).fill('Amount');
  await properties
    .getByRole('button', { name: 'Validation constraints', exact: true })
    .click();
  await properties.locator('#field-constraints-minimum').fill('0');
  await properties.locator('#field-constraints-maximum').fill('100000');
  await expect(properties.locator('#field-constraints-minLength')).toHaveCount(
    0,
  );
  await properties
    .getByRole('button', { name: 'Appearance', exact: true })
    .click();
  await properties
    .getByRole('button', { name: 'General', exact: true })
    .click();
  await expect(properties.getByLabel('Label', { exact: true })).toHaveValue(
    'Amount',
  );
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  await preview
    .getByRole('textbox', { name: 'Amount', exact: true })
    .fill('250');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(cards.nth(1).locator('strong')).toHaveText('Whole number');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(cards.nth(1).locator('strong')).toHaveText('Amount');

  await page.getByRole('tab', { name: 'Add', exact: true }).click();
  await page
    .locator('.field-type-buttons')
    .getByRole('button', { name: 'Multiline text', exact: true })
    .click();
  await properties.getByLabel('Label', { exact: true }).fill('Reason');
  await expect(
    properties.getByRole('button', { name: 'Apply properties', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  await preview
    .getByRole('textbox', { name: 'Reason', exact: true })
    .fill('Replace the damaged laptop.');
  await expect(preview.getByRole('textbox', { name: /^Title/ })).toHaveValue(
    'Laptop replacement',
  );
  await expect(
    preview.getByRole('textbox', { name: 'Amount', exact: true }),
  ).toHaveValue('250');
  await expect(
    page.locator('app-form-builder textarea.font-mono:visible'),
  ).toHaveCount(0);
  expect(
    await cards.locator('input, textarea, select, button, a').count(),
  ).toBe(0);
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/form-versions/'),
  );
  expect(definitionWrites).toEqual([]);
  expect(unexpectedWrites).toEqual([]);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const saved = (await write).postDataJSON();
  expect(
    saved.render_schema.root.children.map(
      (node: { label: string }) => node.label,
    ),
  ).toEqual(['Title', 'Amount', 'Reason']);
  expect(saved.render_schema.root.children[0].scope).toBe('/properties/name');
  expect(saved.data_schema.required).toEqual(['name']);
  const amountKey = saved.render_schema.root.children[1].scope
    .split('/')
    .at(-1);
  expect(saved.data_schema.properties[amountKey]).toEqual({
    type: 'integer',
    minimum: 0,
    maximum: 100000,
  });
  expect(saved.data).toBeUndefined();
  expect(definitionWrites).toHaveLength(1);
  expect(unexpectedWrites).toEqual([]);
  await expect(
    page.getByRole('tab', { name: 'Add', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.editor-feedback')).toHaveText('Saved');
  await expect(preview.getByText('Up to date', { exact: true })).toBeVisible();
  const geometry = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollY: window.scrollY,
    overflows: Array.from(document.querySelectorAll('body *'))
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (
          rect.bottom <= innerHeight ||
          !rect.height ||
          getComputedStyle(element).display === 'none'
        ) {
          return [];
        }
        return [
          {
            tag: element.tagName,
            id: element.id,
            class: element.getAttribute('class'),
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            position: getComputedStyle(element).position,
            parent: element.parentElement?.tagName,
            offsetParent:
              element instanceof HTMLElement
                ? element.offsetParent?.tagName
                : null,
          },
        ];
      })
      .sort((a, b) => b.bottom - a.bottom)
      .slice(0, 30),
    boxes: [
      'body',
      'app-shell',
      '.workspace-layout',
      'main',
      'app-form-builder',
      '.editor-document-bar',
      '.editor-content',
      '.design-mode',
      '.authoring-workspace',
      '.form-tools',
      '.form-design-canvas',
      '.form-live-preview',
      '.editor-feedback',
    ].map((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        return { selector, missing: true };
      }
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector,
        top: rect.top,
        height: rect.height,
        bottom: rect.bottom,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        available: element.style.getPropertyValue('--editor-available-height'),
        display: style.display,
        overflow: style.overflowY,
        minHeight: style.minHeight,
        blockSize: style.blockSize,
      };
    }),
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  await test.info().attach('form-editor-geometry', {
    body: JSON.stringify(geometry),
    contentType: 'application/json',
  });
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.height);
  await page.screenshot({
    path: test.info().outputPath('form-properties-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(2).locator('strong')).toHaveText('Reason');
});
