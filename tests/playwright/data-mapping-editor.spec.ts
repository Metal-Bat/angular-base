import { expect, test } from './fixtures';
import { Locator, Page } from '@playwright/test';
import { choose, save, select } from './data-mapping-helpers';
test.use({ dataMapping: true });
async function sources(page: Page, mapper: Locator): Promise<void> {
  await mapper.getByText('Authorized data sources', { exact: true }).click();
  const picker = mapper.locator('app-studio-choice').first();
  await picker
    .getByRole('button', { name: 'Find references', exact: true })
    .click();
  await choose(page, picker, 'Selected resource', 'Example request-types');
  await mapper
    .getByRole('button', { name: 'Binding suggestions', exact: true })
    .click();
}
test('LIST mappings use authorized recipient choices, retain ordering through edits and reopen', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const mapper = await select(page, 'notify');
  await choose(page, mapper, 'Target port', 'recipients · array');
  const addUser = mapper
    .locator('app-mapping-constant app-studio-choice')
    .last();
  await addUser
    .getByRole('button', { name: 'Find references', exact: true })
    .click();
  await choose(page, addUser, 'Selected resource', 'Alice Example');
  await expect(
    mapper.getByRole('button', { name: 'Remove recipient 1', exact: true }),
  ).toBeVisible();
  await expect(
    mapper
      .locator('app-mapping-constant app-studio-choice')
      .last()
      .locator('input')
      .first(),
  ).toBeFocused();
  await mapper
    .getByRole('button', { name: 'Add data mapping', exact: true })
    .click();
  await addUser
    .getByRole('button', { name: 'Find references', exact: true })
    .click();
  await choose(page, addUser, 'Selected resource', 'Bob Example');
  await expect(
    mapper.getByRole('button', { name: 'Remove recipient 1', exact: true }),
  ).toBeVisible();
  await mapper
    .getByRole('button', { name: 'Add data mapping', exact: true })
    .click();
  const rows = mapper.locator('app-mapping-list li');
  await expect(rows).toHaveCount(2);
  await rows
    .nth(1)
    .getByRole('button', { name: 'Move mapping up', exact: true })
    .click();
  const written = await save(page);
  expect(written['graph']).toMatchObject({
    bindings: [
      { step: 'convert' },
      { constant_value: ['fixture-bob'], ordinal: 0 },
      { constant_value: ['fixture-alice'], ordinal: 1 },
    ],
  });
  await rows
    .first()
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await expect(
    mapper.getByRole('button', { name: 'Update data mapping', exact: true }),
  ).toBeVisible();
  await mapper
    .getByRole('button', { name: 'Discard mapping edits', exact: true })
    .click();
  await rows
    .first()
    .getByRole('button', { name: 'Remove data mapping', exact: true })
    .click();
  const removed = await save(page);
  expect(removed['graph']).toMatchObject({
    bindings: [
      { step: 'convert' },
      { constant_value: ['fixture-alice'], ordinal: 0 },
    ],
  });
  await page.reload();
  const reopened = await select(page, 'notify');
  await expect(reopened.locator('app-mapping-list li')).toHaveCount(1);
  expect(await reopened.locator('textarea').count()).toBe(0);
});
test('nested request sources and projection fields save without JSON or pointer entry', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const mapper = await select(page, 'convert');
  const inspector = page.locator('app-node-inspector:visible');
  const projection = inspector.locator('app-transform-projection');
  await choose(page, projection, 'Source field', 'person › Full name');
  await projection
    .getByLabel('Destination field name', { exact: true })
    .fill('display_name');
  await projection
    .getByRole('button', { name: 'Add projected field', exact: true })
    .click();
  await inspector
    .getByRole('button', { name: 'Apply typed configuration', exact: true })
    .click();
  const projected = await save(page);
  expect(projected['graph']).toMatchObject({
    steps: [
      { key: 'prepare' },
      {
        key: 'convert',
        config: {
          projection: { name: '/person/name', display_name: '/person/name' },
        },
      },
      { key: 'notify' },
    ],
  });
  await choose(page, inspector, 'Conversion Key', 'string');
  await projection
    .getByRole('button', { name: 'Remove projected field: name', exact: true })
    .click();
  await projection
    .getByRole('button', {
      name: 'Remove projected field: display_name',
      exact: true,
    })
    .click();
  await inspector
    .getByRole('button', { name: 'Apply typed configuration', exact: true })
    .click();
  await sources(page, mapper);
  await mapper
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await choose(
    page,
    mapper,
    'Source port',
    'request.profile › person › Full name · string',
  );
  await mapper
    .getByRole('button', { name: 'Update data mapping', exact: true })
    .click();
  const written = await save(page);
  expect(written['graph']).toMatchObject({
    bindings: [
      {
        source_kind: 'REQUEST',
        source_path: '/profile/person/name',
        target_schema: {},
      },
    ],
  });
  await page.reload();
  await select(page, 'convert');
  await expect(page.locator('app-mapping-list:visible')).toContainText(
    '/profile/person/name',
  );
});

test('collection item fields reject invalid indexes and preserve canonical nested pointers', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const mapper = await select(page, 'prepare');
  await choose(page, mapper, 'Target port', 'value · string');
  await sources(page, mapper);
  await choose(page, mapper, 'Source port', 'request.profile › rows · array');
  await mapper.locator('#mapping-item-index').fill('-1');
  await mapper
    .getByRole('button', { name: 'Add data mapping', exact: true })
    .click();
  await expect(mapper.getByRole('alert')).toHaveText(
    'Choose a valid collection item index.',
  );
  await expect(mapper.locator('app-mapping-list li')).toHaveCount(0);
  await mapper.locator('#mapping-item-index').fill('0');
  await choose(page, mapper, 'Collection item field', 'note');
  await mapper
    .getByRole('button', { name: 'Add data mapping', exact: true })
    .click();
  const document = await save(page);
  expect(document['graph']).toMatchObject({
    bindings: [
      { step: 'convert' },
      {
        source_kind: 'REQUEST',
        source_path: '/profile/rows/0/note',
        ordinal: 0,
      },
    ],
  });
  await page.reload();
  const reopened = await select(page, 'prepare');
  await sources(page, reopened);
  await reopened
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await expect(reopened.locator('#mapping-item-index')).toHaveValue('0');
  await expect(
    reopened.getByRole('combobox', {
      name: 'Collection item field',
      exact: true,
    }),
  ).toContainText('note');
  await reopened
    .getByRole('button', { name: 'Discard mapping edits', exact: true })
    .click();
});

test('the same authorized recipient can be selected again after a mapping is added', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const mapper = await select(page, 'notify');
  await choose(page, mapper, 'Target port', 'recipients · array');
  for (let index = 0; index < 2; index++) {
    const picker = mapper
      .locator('app-mapping-constant app-studio-choice')
      .last();
    await picker
      .getByRole('button', { name: 'Find references', exact: true })
      .click();
    await choose(page, picker, 'Selected resource', 'Alice Example');
    await expect(
      mapper.getByRole('button', { name: 'Remove recipient 1', exact: true }),
    ).toBeVisible();
    await mapper
      .getByRole('button', { name: 'Add data mapping', exact: true })
      .click();
  }
  const document = await save(page);
  expect(document['graph']).toMatchObject({
    bindings: [
      { step: 'convert' },
      { constant_value: ['fixture-alice'], ordinal: 0 },
      { constant_value: ['fixture-alice'], ordinal: 1 },
    ],
  });
  await mapper
    .locator('app-mapping-list li')
    .first()
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  const existing = mapper
    .locator('app-mapping-constant app-studio-choice')
    .first();
  await existing.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(
    mapper.getByRole('button', { name: 'Remove recipient 1', exact: true }),
  ).toHaveCount(0);
  await mapper
    .getByRole('button', { name: 'Update data mapping', exact: true })
    .click();
  const cleared = await save(page);
  expect(cleared['graph']).toMatchObject({
    bindings: [
      { step: 'convert' },
      { constant_value: [], ordinal: 0 },
      { constant_value: ['fixture-alice'], ordinal: 1 },
    ],
  });
});
