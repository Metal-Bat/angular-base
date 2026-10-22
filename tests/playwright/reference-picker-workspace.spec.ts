import { expect, test } from './fixtures';

for (const interaction of ['pointer', 'keyboard'] as const) {
  test(`Agent connection picker restores its trigger after ${interaction} selection and preserves the draft`, async ({
    page,
    appURL,
  }, testInfo): Promise<void> => {
    const writes: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'PUT') {
        writes.push(request.url());
      }
    });
    await page.goto(appURL + '/administration/agents');
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click();
    await page
      .locator('app-record-page-header')
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    const editor = page.locator('.page-editor');
    await expect(editor).toBeVisible();
    await editor
      .getByRole('tab', { name: 'Connection and model', exact: true })
      .click();
    const field = page.locator('#agent-connection-spec-connection_ref');
    const control = page.locator('.reference-control').filter({ has: field });
    const trigger = control.getByRole('button', { name: /^Select / });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Select', exact: true });
    await expect(
      dialog.getByText('Notification service', { exact: true }),
    ).toBeVisible();
    const choice = dialog
      .getByRole('button', { name: 'Select', exact: true })
      .first();
    if (interaction === 'keyboard') {
      await choice.focus();
      await page.keyboard.press('Enter');
    } else {
      await choice.click();
    }
    await expect(dialog).not.toBeVisible();
    await expect(field).toHaveValue('Notification service');
    await testInfo.attach('focus-after-pick', {
      contentType: 'application/json',
      body: JSON.stringify(
        await trigger.evaluate((element) => ({
          connected: element.isConnected,
          disabled: element.hasAttribute('disabled'),
          activeTag: document.activeElement?.tagName,
          activeId: document.activeElement?.id,
          fieldsetDisabled: element.closest('fieldset')?.disabled,
          hiddenAncestor: !!element.closest('[hidden], [inert]'),
        })),
      ),
    });
    await expect(trigger).toBeFocused();
    await expect(page.locator('.page-editor')).toBeVisible();
    expect(writes).toEqual([]);
  });
}
