import { expect, test } from './fixtures';
import { choose, save, select } from './data-mapping-helpers';
test.use({ dataMapping: true });
test('empty text and generic payload keys round-trip as literal data through normal fields', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  let mapper = await select(page, 'prepare');
  await choose(page, mapper, 'Target port', 'value · string');
  await mapper.locator('#mapping-constant').fill('temporary');
  await mapper.locator('#mapping-constant').fill('');
  await mapper
    .getByRole('button', { name: 'Add data mapping', exact: true })
    .click();
  let document = await save(page);
  expect(document['graph']).toMatchObject({
    bindings: [{ step: 'convert' }, { step: 'prepare', constant_value: '' }],
  });
  mapper = await select(page, 'notify');
  await choose(page, mapper, 'Target port', 'data · object');
  for (const [key, value] of [
    ['model_id', 'sample-model'],
    ['user_ref_id', 'customer-text'],
    ['empty_text', ''],
  ]) {
    await mapper.locator('#mapping-constant-new-key').fill(key);
    await mapper
      .locator('app-schema-object')
      .first()
      .getByRole('button', { name: 'Add', exact: true })
      .last()
      .click();
    const input = mapper.locator('#mapping-constant-' + key);
    await expect(input).toBeEditable();
    await input.fill(value || 'temporary');
    if (!value) {
      await input.fill('');
    }
  }
  await mapper
    .getByRole('button', { name: 'Add data mapping', exact: true })
    .click();
  document = await save(page);
  expect(document['graph']).toMatchObject({
    bindings: [
      { step: 'convert' },
      { step: 'prepare' },
      {
        step: 'notify',
        constant_value: {
          model_id: 'sample-model',
          user_ref_id: 'customer-text',
          empty_text: '',
        },
      },
    ],
  });
  await page.reload();
  mapper = await select(page, 'notify');
  await mapper
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await expect(mapper.locator('#mapping-constant-model_id')).toHaveValue(
    'sample-model',
  );
  await expect(mapper.locator('#mapping-constant-user_ref_id')).toHaveValue(
    'customer-text',
  );
});

test('decimal and array union literals retain their correct field controls after reopen', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  const mapper = await select(page, 'convert');
  const inspector = page.locator('app-node-inspector:visible');
  await choose(page, inspector, 'Conversion Key', 'decimal');
  await inspector
    .getByRole('button', { name: 'Remove projected field: name', exact: true })
    .click();
  await inspector
    .getByRole('button', { name: 'Apply typed configuration', exact: true })
    .click();
  await mapper
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await choose(page, mapper, 'Source port', 'Constant value');
  await choose(page, mapper, 'Configuration type', 'number');
  await mapper.locator('#mapping-constant').fill('1.5');
  await mapper
    .getByRole('button', { name: 'Update data mapping', exact: true })
    .click();
  let document = await save(page);
  expect(document['graph']).toMatchObject({
    bindings: [
      {
        constant_value: 1.5,
        target_schema: { type: ['string', 'integer', 'number'] },
      },
    ],
  });
  await page.reload();
  await select(page, 'convert');
  await mapper
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await expect(mapper.locator('#mapping-constant')).toHaveValue('1.5');
  await mapper
    .getByRole('button', { name: 'Discard mapping edits', exact: true })
    .click();
  await choose(page, inspector, 'Conversion Key', 'array');
  await inspector
    .getByRole('button', { name: 'Apply typed configuration', exact: true })
    .click();
  await mapper
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await choose(page, mapper, 'Configuration type', 'array');
  await mapper.getByRole('button', { name: 'Add value', exact: true }).click();
  await mapper.locator('#mapping-constant-0').fill('temporary');
  await mapper.locator('#mapping-constant-0').fill('');
  await mapper
    .getByRole('button', { name: 'Update data mapping', exact: true })
    .click();
  document = await save(page);
  expect(document['graph']).toMatchObject({
    bindings: [
      { constant_value: [''], target_schema: { type: ['string', 'array'] } },
    ],
  });
  await page.reload();
  await select(page, 'convert');
  await mapper
    .getByRole('button', { name: 'Edit data mapping', exact: true })
    .click();
  await expect(mapper.locator('#mapping-constant-0')).toHaveValue('');
  await expect(
    mapper.getByRole('button', { name: 'Add value', exact: true }),
  ).toBeVisible();
});
