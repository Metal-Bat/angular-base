import { dropFiles } from './file-actions';
import { expect, test } from './fixtures';

for (const selection of ['choose', 'drop'] as const) {
  test(`Inline avatar ${selection} preserves the current image and name draft until association succeeds`, async ({
    page,
    appURL,
  }): Promise<void> => {
    await page.setViewportSize({
      width: selection === 'drop' ? 390 : 1440,
      height: 900,
    });
    await page.goto(appURL + '/account/profile');
    const editor = page.locator('app-profile-editor');
    const current = editor.getByRole('img', {
      name: 'Current avatar',
      exact: true,
    });
    await expect(current).toBeVisible();
    await expect
      .poll(() =>
        current.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    const previous = await current.getAttribute('src');
    await editor
      .getByLabel('First name', { exact: true })
      .fill('Independent name draft');
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/v1/me/profile', async (route) => {
      if (route.request().method() === 'PATCH') {
        await held;
      }
      await route.continue();
    });
    const uploads: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith('/api/v1/media/images')
      ) {
        uploads.push(request.url());
      }
    });
    const write = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        request.url().endsWith('/api/v1/me/profile'),
    );
    const selected = {
      name: 'chosen-avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP4sAAAAASUVORK5CYII=',
        'base64',
      ),
    };
    if (selection === 'choose') {
      await editor.locator('#profile-avatar').setInputFiles(selected);
    } else {
      await dropFiles(
        editor.getByRole('group', { name: 'Avatar', exact: true }),
        [selected],
      );
    }
    await expect(
      editor.getByRole('img', { name: 'Selected avatar', exact: true }),
    ).toBeVisible();
    await expect(current).toHaveAttribute('src', previous!);
    await expect(
      editor.getByRole('button', { name: 'Retry avatar link', exact: true }),
    ).toBeDisabled();
    const body = (await write).postDataJSON();
    expect(body).toEqual({
      ref_id: 'fixture-profile-0',
      avatar_ref_id: 'fixture-avatar-upload-1',
    });
    release();
    await expect(
      editor.getByRole('img', { name: 'Selected avatar', exact: true }),
    ).toHaveCount(0);
    await expect(current).not.toHaveAttribute('src', previous!);
    await expect(editor.getByLabel('First name', { exact: true })).toHaveValue(
      'Independent name draft',
    );
    await expect(editor).not.toContainText('fixture-avatar-upload-1');
    expect(uploads).toHaveLength(1);
    await page.locator('details.account-menu summary').click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
    await expect(page.locator('app-private-avatar img')).toHaveCount(0);
  });
}
