import { expect, test } from './fixtures';

test('Later pages keep original field positions without empty layout rows', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route(
    '**/api/v1/form-versions/fixture-form-versions-v1',
    async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      const children = Array.from({ length: 40 }, (_, index) => ({
        component: 'text',
        node_key: 'question-' + index,
        label: index === 39 ? 'Last question' : 'Question ' + index,
        scope: '/properties/question_' + index,
      }));
      body.data.data_schema = {
        type: 'object',
        required: [],
        properties: Object.fromEntries(
          children.map((_, index) => ['question_' + index, { type: 'string' }]),
        ),
      };
      body.data.render_schema = {
        ...body.data.render_schema,
        root: {
          component: 'vertical',
          node_key: 'paged-root',
          label: 'Long form',
          children,
        },
      };
      body.data.page_settings = {
        pages: [
          {
            key: 'first',
            title: 'Details',
            scopes: children.slice(0, 39).map((child) => child.scope),
          },
          { key: 'last', title: 'Last page', scopes: [children[39].scope] },
        ],
      };
      await route.fulfill({ response, json: body });
    },
  );
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const preview = page.locator('app-form-live-preview');
  await expect(preview.locator('.preview-freshness')).toHaveText('Up to date');
  const runtime = preview.locator('app-runtime-form');
  await runtime.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    runtime.getByRole('navigation', { name: 'Form pages', exact: true }),
  ).toContainText('Last page');
  const input = runtime.getByRole('textbox', {
    name: 'Last question',
    exact: true,
  });
  await input.scrollIntoViewIfNeeded();
  const layout = runtime.locator('.runtime-layout').first();
  await expect(layout.locator(':scope > app-runtime-node')).toHaveCount(40);
  const bounds = (await layout.boundingBox())!;
  expect((await input.boundingBox())!.y - bounds.y).toBeLessThan(80);
  expect(bounds.height).toBeLessThan(160);
  let releasePreview!: () => void;
  let sampleReceived!: () => void;
  const held = new Promise<void>((resolve) => {
    releasePreview = resolve;
  });
  const received = new Promise<void>((resolve) => {
    sampleReceived = resolve;
  });
  await page.route('**/api/v1/forms/runtime-preview', async (route) => {
    if (
      route.request().postDataJSON()?.data?.question_39 !==
      'Retained on last page'
    ) {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    sampleReceived();
    await held;
    await route.fulfill({ response });
  });
  await input.fill('Retained on last page');
  await received;
  await runtime
    .getByRole('button', { name: 'Previous page', exact: true })
    .click();
  const next = runtime.getByRole('button', { name: 'Next page', exact: true });
  await next.scrollIntoViewIfNeeded();
  const before = (await next.boundingBox())!;
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  releasePreview();
  await expect(preview.locator('.preview-freshness')).toHaveText('Up to date');
  const after = (await next.boundingBox())!;
  await page.mouse.up();
  expect(after.y).toBe(before.y);
  await expect(input).toHaveValue('Retained on last page');
  await expect(preview.locator('.preview-freshness')).toHaveText('Up to date');
  await expect(input).toHaveValue('Retained on last page');
  await page.screenshot({
    path: test.info().outputPath('last-page-no-empty-rows.png'),
  });
});
