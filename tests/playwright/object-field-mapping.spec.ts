import { expect, test } from './fixtures';
import { choose, save, select } from './data-mapping-helpers';
test.use({ dataMapping: true });
for (const width of [1440, 390]) {
  test(`object fields and redacted samples preserve typed values and RTL at ${width}px`, async ({
    page,
    appURL,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
    const mapper = await select(page, 'notify');
    await choose(page, mapper, 'Target port', 'data · object');
    await mapper.getByText('Authorized data sources', { exact: true }).click();
    const picker = mapper.locator('app-studio-choice').first();
    await picker
      .getByRole('button', { name: 'Find references', exact: true })
      .click();
    await choose(page, picker, 'Selected resource', 'Example request-types');
    await mapper
      .getByRole('button', { name: 'Binding suggestions', exact: true })
      .click();
    const composer = mapper.locator('app-object-field-mapping');
    await composer.getByText('Assemble object fields', { exact: true }).click();
    await composer.getByLabel('Field name', { exact: true }).fill('amount');
    await choose(page, composer, 'Field source', 'request.amount');
    await composer
      .getByRole('button', { name: 'Add object field', exact: true })
      .click();
    for (const [name, type] of [
      ['enabled', 'boolean'],
      ['items', 'array'],
      ['note', 'null'],
    ]) {
      await composer.getByLabel('Field name', { exact: true }).fill(name);
      await choose(page, composer, 'Field type', type);
      await composer
        .getByRole('button', { name: 'Add object field', exact: true })
        .click();
    }
    const preview = mapper.locator('app-object-binding-preview');
    await preview.getByText('Preview object mapping', { exact: true }).click();
    await preview
      .getByRole('button', { name: 'Check object samples', exact: true })
      .click();
    await expect(preview.getByRole('status')).toContainText('MISSING');
    await preview.getByLabel('Include author sample', { exact: true }).check();
    await preview.locator('#binding-sample-0').fill('0');
    await preview
      .getByRole('button', { name: 'Check object samples', exact: true })
      .click();
    await expect(preview.getByRole('status')).toContainText('VALID');
    const workspace = await save(page);
    expect(workspace['graph']).toMatchObject({
      bindings: [
        { step: 'convert' },
        { source_kind: 'REQUEST', target_projection: { path: '/amount' } },
        { constant_value: false, target_projection: { path: '/enabled' } },
        { constant_value: [], target_projection: { path: '/items' } },
        { constant_value: null, target_projection: { path: '/note' } },
      ],
    });
    await composer
      .getByLabel('Field name', { exact: true })
      .fill('retained_name');
    const preferences = page.locator('app-workspace-preferences');
    const settings = preferences.locator('details');
    if ((await settings.getAttribute('open')) === null) {
      await settings.locator('summary').click();
    }
    await choose(page, preferences, 'Language', 'فارسی');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(composer.locator('#object-field-name')).toHaveValue(
      'retained_name',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await composer.scrollIntoViewIfNeeded();
    await testInfo.attach('object-fields-rtl', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}
