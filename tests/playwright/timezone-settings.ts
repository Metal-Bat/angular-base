import type { Page } from '@playwright/test';
import { expect } from './fixtures';

/** Configure the persisted user preference before testing a timezone-specific journey. */
export async function saveUserTimezone(
  page: Page,
  appURL: string,
  zone: string,
): Promise<void> {
  await page.goto(appURL + '/account/profile');
  const settings = page.locator('app-workspace-settings');
  const timezone = settings.getByRole('combobox', {
    name: 'Timezone',
    exact: true,
  });
  await timezone.click();
  const label = zone.replaceAll('_', ' ').replaceAll('/', ' / ');
  await page
    .getByRole('searchbox', { name: 'Search timezone', exact: true })
    .fill(label);
  await page.getByRole('option', { name: label, exact: true }).click();
  const saved = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/v1/me/preferences' &&
      response.request().method() === 'PATCH',
  );
  await settings
    .getByRole('button', { name: 'Save timezone', exact: true })
    .click();
  const response = await saved;
  expect(response.ok()).toBe(true);
  expect((await response.json()).data.locale.timezone).toBe(zone);
  await expect(page.locator('[data-preference-status]')).toHaveAttribute(
    'data-preference-status',
    'saved',
  );
}
