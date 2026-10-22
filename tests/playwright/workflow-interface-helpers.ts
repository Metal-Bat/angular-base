import { expect } from './fixtures';
import type { Locator, Page } from '@playwright/test';
export async function openInterface(
  page: Page,
  appURL: string,
): Promise<Locator> {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route(
    '**/api/v1/workflow-versions/fixture-flow/workspace',
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      const response = await route.fetch();
      const payload = await response.json();
      const graph = payload.data.document.graph;
      if (!graph.steps.some((step: { key: string }) => step.key === 'finish')) {
        graph.steps.unshift({ key: 'start', type_code: 'START', config: {} });
        graph.steps.push({ key: 'finish', type_code: 'FINISH', config: {} });
        graph.transitions.unshift({
          source: 'start',
          target: 'prepare',
          outcome: 'next',
        });
        graph.transitions.push({
          source: 'call',
          target: 'finish',
          outcome: 'done',
        });
      }
      await route.fulfill({ response, json: payload });
    },
  );
  await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
  await expect(
    page.locator('.board-node[data-node-key="finish"]'),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Properties', exact: true }).click();
  const editor = page.locator('app-workflow-interface-editor:visible');
  await editor.locator('summary').first().click();
  return editor;
}
export async function defineInterface(editor: Locator): Promise<void> {
  await editor
    .getByRole('button', { name: 'Define child interface', exact: true })
    .click();
}
