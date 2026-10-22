import { expect } from './fixtures';
import { Locator, Page } from '@playwright/test';
export async function choose(
  page: Page,
  root: Locator,
  name: string,
  value: string,
): Promise<void> {
  await root.getByRole('combobox', { name, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
export async function select(page: Page, key: string): Promise<Locator> {
  await page
    .locator(`.board-node[data-node-key="${key}"] .node-handle`)
    .click();
  await page.getByRole('tab', { name: 'Properties', exact: true }).click();
  return page.locator('app-graph-connections:visible');
}
export async function save(page: Page): Promise<Record<string, unknown>> {
  const write = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' && request.url().endsWith('/workspace'),
  );
  await page
    .getByRole('button', { name: 'Save workspace', exact: true })
    .click();
  const document = (await write).postDataJSON().document;
  await expect(
    page.getByText('Workspace saved. This is not an executable graph.', {
      exact: true,
    }),
  ).toBeVisible();
  return document;
}
