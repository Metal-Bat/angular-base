import { expect, test } from './fixtures';

for (const width of [1024, 390]) {
  test(`Palette selection reveals the canvas and saves placement without focus mode at ${width}px`, async ({
    page,
    appURL,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
    await page.getByRole('button', { name: 'Add step', exact: true }).click();
    await expect(page.locator('.palette-item').first()).toBeVisible();
    await expect(page.locator('#palette-search')).toBeFocused();
    const before = await page.locator('.board-node').count();
    await page.locator('.palette-item').first().click();
    await expect(page.locator('.workflow-surface')).toBeVisible();
    await expect(page.locator('.canvas-stage')).toBeFocused();
    const stage = page.locator('.canvas-stage');
    const bounds = (await stage.boundingBox())!;
    await stage.click({
      position: { x: bounds.width - 40, y: bounds.height - 40 },
    });
    await expect(page.locator('.board-node')).toHaveCount(before + 1);
    const write = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' && request.url().endsWith('/workspace'),
    );
    await page
      .getByRole('button', { name: 'Save workspace', exact: true })
      .click();
    const saved = (await write).postDataJSON().document;
    expect(saved.graph.steps.at(-1).type_version_ref).toBe('fixture-type');
    await expect(page.locator('.save-state')).toHaveText('Saved');
    await page.reload();
    await expect(page.locator('.board-node')).toHaveCount(before + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test('Button addition reveals its node without changing the chosen zoom', async ({
  page,
  appURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await expect(page.locator('.board-node')).toHaveCount(2);
  await page.getByRole('button', { name: 'View', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Zoom in', exact: true }).click();
  await expect(page.locator('.zoom-value')).toHaveText('110%');
  await page.getByRole('button', { name: 'Add step', exact: true }).click();
  await page.locator('.palette-add').first().click();
  await expect(page.locator('.board-node')).toHaveCount(3);
  await expect(page.locator('.zoom-value')).toHaveText('110%');
  const node = page.locator('.board-node').last();
  await expect
    .poll(async () => {
      const stage = (await page.locator('.canvas-stage').boundingBox())!;
      const box = (await node.boundingBox())!;
      return (
        box.x >= stage.x &&
        box.y >= stage.y &&
        box.x + box.width <= stage.x + stage.width &&
        box.y + box.height <= stage.y + stage.height
      );
    })
    .toBe(true);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.board-node')).toHaveCount(2);
  await expect(page.locator('.zoom-value')).toHaveText('110%');
});
