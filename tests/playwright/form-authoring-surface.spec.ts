import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { verifyPropertyActions } from './form-property-actions';

async function pointerDrop(
  page: Page,
  source: Locator,
  target: Locator,
): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  const start = (await source.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    start.x + start.width / 2 + 12,
    start.y + start.height / 2,
    { steps: 5 },
  );
  await expect(page.locator('.canvas-sheet')).toHaveClass(/dragging/);
  await target.scrollIntoViewIfNeeded();
  const end = (await target.boundingBox())!;
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 16,
  });
  await page.mouse.move(end.x + end.width / 2 + 1, end.y + end.height / 2);
  await page.mouse.up();
  await expect(page.locator('.canvas-sheet')).not.toHaveClass(/dragging/);
}

for (const width of [1440, 390]) {
  test(`Palette drag creates fields in empty and nested layouts at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    let initial = true;
    await page.route(
      '**/api/v1/form-versions/fixture-form-versions-v1',
      async (route) => {
        if (route.request().method() !== 'GET' || !initial) {
          await route.continue();
          return;
        }
        initial = false;
        const response = await route.fetch();
        const body = await response.json();
        body.data.data_schema = { type: 'object', properties: {} };
        body.data.render_schema.root = {
          component: 'vertical',
          node_key: 'empty-root',
          children: [],
        };
        await route.fulfill({ response, json: body });
      },
    );
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.getByRole('button', { name: 'Tools', exact: true }).click();
    const canvas = page.locator('app-form-canvas');
    const palette = page.getByRole('region', {
      name: 'Component palette',
      exact: true,
    });
    const cards = canvas.locator('.field-card');
    await pointerDrop(
      page,
      palette.getByRole('button', { name: 'Text', exact: true }),
      canvas.locator('.canvas-empty'),
    );
    await expect(cards).toHaveCount(1);
    await page.getByRole('tab', { name: 'Add', exact: true }).click();
    await palette
      .getByText('All field types and layouts', { exact: true })
      .click();
    await pointerDrop(
      page,
      palette.getByRole('button', { name: 'Grid layout', exact: true }),
      canvas.locator('.root-drop'),
    );
    await expect(cards).toHaveCount(2);
    await page.getByRole('tab', { name: 'Add', exact: true }).click();
    const grid = canvas.locator('.placement-group').filter({
      has: page.locator(':scope > .field-card [data-design-kind="grid"]'),
    });
    await pointerDrop(
      page,
      palette
        .getByRole('button', { name: 'Multiline text', exact: true })
        .first(),
      grid.locator(':scope > .placement-drop').nth(1),
    );
    await expect(cards).toHaveCount(3);
    await expect(
      grid.locator(':scope > .layout-children .field-card strong'),
    ).toHaveText('Multiline text');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(cards).toHaveCount(2);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(cards).toHaveCount(3);
    const save = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/v1/form-versions/'),
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    const document = (await save).postDataJSON();
    const children = document.render_schema.root.children;
    expect(
      children.map((child: { component: string }) => child.component),
    ).toEqual(['text', 'grid']);
    expect(children[1].children[0].component).toBe('textarea');
    expect(
      new Set([
        children[0].node_key,
        children[1].node_key,
        children[1].children[0].node_key,
      ]).size,
    ).toBe(3);
    expect(Object.keys(document.data_schema.properties)).toHaveLength(2);
    await expect(page.locator('.editor-feedback')).toContainText('Saved');
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(cards).toHaveCount(3);
    await expect(canvas.locator('.field-card-selected')).toHaveCount(0);
    await page.screenshot({
      path: test.info().outputPath('palette-and-canvas.png'),
    });
  });

  test(`Form panels use fields and readable results throughout at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(
      appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
    );
    await page.route('**/api/v1/forms/validate', async (route) => {
      expect(
        route.request().postDataJSON().data_schema.properties.name.type,
      ).toBe('string');
      await route.fulfill({
        json: {
          success: true,
          data: { valid: true, issues: [], warnings: [] },
        },
      });
    });
    await page.locator('.field-card').first().click();
    const tools = page.locator('.form-tools');

    await expect(tools).toBeVisible();
    await expect(page.locator('.form-design-canvas')).toBeVisible();
    for (const value of ['components', 'outline', 'properties']) {
      const tab = tools.locator('p-tab[value="' + value + '"]');
      expect(
        await tab.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return (
            document
              .elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              )
              ?.closest('[role="tab"]') === element
          );
        }),
      ).toBe(true);
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
    }

    await tools
      .getByRole('button', { name: 'Appearance', exact: true })
      .click();
    expect(
      await tools.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    await tools
      .locator('#field-options-placeholder')
      .fill('Readable input hint');
    await verifyPropertyActions(tools);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const preview = page.locator('app-form-live-preview');
    await expect(
      preview.getByRole('textbox', { name: 'Sample name', exact: true }),
    ).toHaveAttribute('placeholder', 'Readable input hint');
    await preview
      .getByRole('textbox', { name: 'Sample name', exact: true })
      .fill('Prior typed sample');
    await expect(
      preview.getByText('Up to date', { exact: true }),
    ).toBeVisible();
    await preview.getByText('Preview options', { exact: true }).click();
    const prior = page.waitForRequest(
      (request) =>
        request.url().includes('/forms/runtime-preview') &&
        request.postDataJSON()?.before_data?.name === 'Prior typed sample',
    );
    await preview
      .getByRole('button', {
        name: 'Use current sample as prior values',
        exact: true,
      })
      .click();
    expect((await prior).postDataJSON().before_item_identity).toEqual({});
    await expect(preview.locator('#prior-sample-name')).toHaveValue(
      'Prior typed sample',
    );
    const policy = page.waitForRequest(
      (request) =>
        request.url().includes('/forms/runtime-preview') &&
        request.postDataJSON()?.policy !== null,
    );
    await preview
      .getByRole('checkbox', {
        name: 'Simulate field permissions',
        exact: true,
      })
      .check();
    expect((await policy).postDataJSON().policy).toEqual({
      read: ['/properties/name'],
      write: ['/properties/name'],
      required: [],
      hidden: [],
    });
    expect(
      await preview.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Validate', exact: true }).click();
    await expect(page.locator('.validation-result')).toHaveText(
      'Validation passed',
    );
    await page.getByText('Advanced inspection', { exact: true }).click();
    await page
      .getByRole('button', { name: 'Field catalog', exact: true })
      .click();
    await expect(page.locator('.validation-result')).toHaveText(
      'Inspection complete',
    );
    await expect(
      page.locator(
        'app-form-builder pre, app-form-builder textarea.font-mono, ' +
          '#node-json, #schema-json, #behavior-json, #sample-json, #preview-context',
      ),
    ).toHaveCount(0);
    await page.screenshot({
      path: test.info().outputPath('readable-diagnostics.png'),
    });
    if (width === 390) {
      await page.locator('app-workspace-preferences details summary').click();
    }
    const language = page.locator('[data-language-picker] [role="combobox"]');
    await language.click();
    await page
      .locator('[id="' + (await language.getAttribute('aria-controls')) + '"]')
      .getByRole('option', { name: 'فارسی', exact: true })
      .click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    if (width === 390) {
      await page.locator('app-workspace-preferences details summary').click();
      await expect(
        page.locator('app-workspace-preferences details'),
      ).not.toHaveAttribute('open', '');
    }
    await page.locator('.form-modes button').first().click();
    await expect(tools).toBeVisible();
    await expect(page.locator('.form-design-canvas')).toBeVisible();
    for (const value of ['components', 'outline', 'properties']) {
      const tab = tools.locator('p-tab[value="' + value + '"]');
      expect(
        await tab.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return (
            document
              .elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              )
              ?.closest('[role="tab"]') === element
          );
        }),
      ).toBe(true);
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
    }

    expect(
      await tools.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await verifyPropertyActions(tools);
    await page.screenshot({
      path: test.info().outputPath('farsi-designer-panels.png'),
    });
    await page.locator('.form-modes button').nth(2).click();
    const previewControls = preview.locator('.preview-settings');
    const refresh = preview.locator('.preview-device-controls button').nth(2);
    await expect(preview.locator('.preview-freshness')).toHaveText('به‌روز');
    await expect(refresh).toBeEnabled();
    await refresh.scrollIntoViewIfNeeded();
    await expect(refresh).toBeInViewport({ ratio: 1 });
    const beforeRefresh = (await previewControls.boundingBox())!;
    let release!: () => void;
    let captured!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const received = new Promise<void>((resolve) => {
      captured = resolve;
    });
    await page.route('**/api/v1/forms/runtime-preview', async (route) => {
      const response = await route.fetch();
      captured();
      await held;
      await route.fulfill({ response });
    });
    try {
      await refresh.click();
      await received;
      expect((await previewControls.boundingBox())!.y).toBe(beforeRefresh.y);
      release();
      await expect(preview.locator('.preview-freshness')).toHaveText('به‌روز');
      expect((await previewControls.boundingBox())!.y).toBe(beforeRefresh.y);
    } finally {
      release();
    }
  });
}

test('Form version catalog edits open the designer and creation has no document console', async ({
  page,
  appURL,
}) => {
  await page.goto(
    appURL + '/studio/form-versions?selected=fixture-form-versions-v1',
  );
  await page
    .locator('app-catalog-header')
    .getByRole('button', { name: 'Edit', exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/studio\/form-versions\/fixture-form-versions-v1\/edit$/,
  );
  await expect(page.locator('app-form-canvas .field-card')).toHaveCount(1);
  await expect(page.locator('.preview-freshness')).toHaveText('Up to date');
  await page.goto(
    appURL + '/studio/form-versions?parent=fixture-forms-v1&create=1',
  );
  await expect(page.locator('app-catalog-editor form')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Expert document setup', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator('app-catalog-editor textarea.font-mono'),
  ).toHaveCount(0);
  await expect(page.locator('#author-number')).toBeVisible();
});
