import type { Route } from '@playwright/test';
import { expect, test } from './fixtures';
test.use({ typedChoice: true });

test('Choice rows retain typed values, invalid buffers and order through save/reopen', async ({
  page,
  appURL,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    appURL + '/studio/form-versions/fixture-form-versions-v1/edit',
  );
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await page.locator('app-form-canvas .field-card').nth(1).click();
  const properties = page.locator('.form-properties');
  await properties
    .getByRole('region', { name: 'General', exact: true })
    .getByLabel('Label', { exact: true })
    .fill('Decision');
  await properties
    .getByRole('button', { name: 'Choices', exact: true })
    .click();
  const choices = properties.locator('app-form-choice-rows');
  const rows = choices.locator('li');
  await rows.nth(0).getByLabel('Label', { exact: true }).fill('Zero');
  const choose = async (
    row: number,
    label: string,
    value: string,
  ): Promise<void> => {
    const control = rows
      .nth(row)
      .getByRole('combobox', { name: label, exact: true });
    await expect(control).toHaveAttribute('aria-disabled', 'false');
    await control.click();
    const popup = page.locator(
      '#' + (await control.getAttribute('aria-controls')),
    );
    await popup.getByRole('option', { name: value, exact: true }).click();
    await expect(control).toHaveText(value);
    await expect(popup).toHaveCount(0);
    await expect(control).toHaveAttribute('aria-disabled', 'false');
  };
  await choose(0, 'Value type', 'Numeric value');
  const key = rows.nth(0).getByLabel('Stable value', { exact: true });
  await key.fill('-');
  await expect(
    properties.getByRole('button', { name: 'Apply properties', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Save draft', exact: true }),
  ).toBeDisabled();
  await properties
    .getByRole('button', { name: 'General', exact: true })
    .click();
  await expect(
    properties
      .getByRole('region', { name: 'General', exact: true })
      .getByLabel('Label', { exact: true }),
  ).toHaveValue('Decision');
  await properties
    .getByRole('button', { name: 'Choices', exact: true })
    .click();
  await expect(key).toHaveValue('-');
  for (const text of ['9007199254740993', '0.10000000000000000001', '1e-324']) {
    await key.fill(text);
    await expect(key).toHaveValue(text);
    await expect(
      properties.getByRole('button', { name: 'Apply properties', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeDisabled();
  }
  await key.fill('0');
  await choices
    .getByRole('button', { name: 'Add choice', exact: true })
    .click();
  await rows.nth(1).getByLabel('Label', { exact: true }).fill('No');
  await choose(1, 'Value type', 'Boolean value');
  await choose(1, 'Stable value', 'No');
  await choices
    .getByRole('button', { name: 'Add choice', exact: true })
    .click();
  await rows.nth(2).getByLabel('Label', { exact: true }).fill('Text zero');
  await rows.nth(2).getByLabel('Stable value', { exact: true }).fill('0');
  await rows
    .nth(1)
    .getByRole('button', { name: 'Move choice up', exact: true })
    .click();
  await expect(rows.nth(0).getByLabel('Label', { exact: true })).toHaveValue(
    'No',
  );
  await properties
    .getByRole('button', { name: 'Apply properties', exact: true })
    .click();
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      request.url().includes('/api/v1/form-versions/'),
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const saved = (await write).postDataJSON();
  expect(saved.render_schema.root.children[1].source.items).toEqual([
    { key: false, value: 'No' },
    { key: 0, value: 'Zero' },
    { key: '0', value: 'Text zero' },
  ]);
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await page.locator('app-form-canvas .field-card').nth(1).click();
  await properties
    .getByRole('button', { name: 'Choices', exact: true })
    .click();
  await expect(rows).toHaveCount(3);
  await expect(
    rows.nth(0).getByRole('combobox', { name: 'Stable value', exact: true }),
  ).toHaveText('No');
  await expect(
    rows.nth(1).getByLabel('Stable value', { exact: true }),
  ).toHaveValue('0');
  await expect(
    rows.nth(2).getByLabel('Stable value', { exact: true }),
  ).toHaveValue('0');
  await expect(
    rows.nth(1).getByRole('combobox', { name: 'Value type', exact: true }),
  ).toHaveText('Numeric value');
  await expect(
    rows.nth(2).getByRole('combobox', { name: 'Value type', exact: true }),
  ).toHaveText('Text value');
  await expect(
    page.locator('.form-live-preview').getByText('Up to date', { exact: true }),
  ).toBeVisible();
  const runtimeChoice = page.locator('.form-live-preview app-choice-control');
  const runtimeSelect = runtimeChoice.getByRole('combobox', {
    name: 'Decision',
    exact: true,
  });
  await expect(runtimeChoice.getByRole('searchbox')).toHaveCount(0);
  await expect(
    runtimeChoice.getByRole('button', { name: 'Previous', exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(async () => (await runtimeSelect.boundingBox())?.width ?? 0)
    .toBeGreaterThan(200);
  await runtimeChoice
    .getByRole('button', { name: 'Search options', exact: true })
    .click();
  const searchRequest = page.waitForRequest(
    (request) =>
      request.url().includes('/api/v1/forms/options') &&
      request.postDataJSON()?.query?.search === 'No',
  );
  await runtimeChoice
    .getByRole('searchbox', { name: 'Search options', exact: true })
    .fill('No');
  expect((await searchRequest).postDataJSON().query.search).toBe('No');
  await runtimeSelect.click();
  await expect(
    page.getByRole('option', { name: 'No', exact: true }),
  ).toBeVisible();
  await page.getByRole('option', { name: 'No', exact: true }).click();
  await expect(
    page
      .locator('.form-live-preview')
      .getByRole('combobox', { name: 'Decision', exact: true }),
  ).toHaveText('No');
  await expect(runtimeChoice.locator('.choice-main')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  await expect(runtimeSelect).toHaveAttribute('aria-expanded', 'false');
  await expect(runtimeSelect).toHaveAttribute('aria-disabled', 'false');
  await expect(
    page.locator('.form-live-preview .preview-freshness'),
  ).toHaveText('Up to date');
  await expect(runtimeChoice.locator('.choice-main')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  await expect(
    runtimeChoice.getByRole('button', { name: 'Search options', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
  let releaseRefresh: (() => void) | undefined;
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  let pausedRefresh = false;
  let pendingRefresh: Promise<void> | undefined;
  const pauseOptions = async (route: Route): Promise<void> => {
    pausedRefresh = true;
    expect(route.request().postDataJSON().query.data.decision).toBe(false);
    pendingRefresh = refreshGate.then(() => route.continue());
    await pendingRefresh;
  };
  await page.route('**/api/v1/forms/options', pauseOptions);
  try {
    await runtimeChoice
      .getByRole('button', { name: 'Search options', exact: true })
      .click();
    await expect(runtimeChoice.getByRole('searchbox')).toHaveCount(0);
    await expect.poll(() => pausedRefresh).toBe(true);
    await expect(runtimeChoice.locator('.choice-main')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect(runtimeSelect).toHaveText('No');
    await expect(runtimeChoice).not.toContainText('Check selection');
    await runtimeSelect.click();
    await expect(
      page.getByRole('option', { name: 'No', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await expect(runtimeSelect).toHaveAttribute('aria-expanded', 'false');
    await expect(runtimeSelect).toBeFocused();
  } finally {
    releaseRefresh!();
    await pendingRefresh;
    await page.unroute('**/api/v1/forms/options', pauseOptions);
  }
  await expect(runtimeChoice.locator('.choice-main')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  await expect(runtimeSelect).toHaveText('No');
  await expect(runtimeSelect).not.toContainText('json:');
  await page.screenshot({
    path: test.info().outputPath('form-choice-rows.png'),
    fullPage: true,
  });
});
