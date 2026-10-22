import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';

export async function verifyPropertyActions(tools: Locator): Promise<void> {
  const panels = tools.locator('p-tabpanels');
  await panels.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const apply = tools.locator('.inspector-actions button');
  await expect
    .poll(() =>
      apply.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const tabList = element
          .closest('.form-tools')!
          .querySelector('p-tablist')!
          .getBoundingClientRect();
        return (
          rect.y >= tabList.bottom &&
          document
            .elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
            ?.closest('button') === element
        );
      }),
    )
    .toBe(true);
  await apply.click();
  const general = tools
    .locator('app-form-inspector p-accordion-header')
    .first();
  if ((await general.getAttribute('aria-expanded')) !== 'true') {
    await general.click();
  } else {
    await general.focus();
  }
  const field = tools.locator('#field-label');
  await expect(field).toBeVisible();
  await general.press('Tab');
  await expect(field).toBeFocused();
  let bounds: unknown = null;
  try {
    await expect
      .poll(async (): Promise<unknown> => {
        bounds = await field.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const outline =
            Math.max(0, Number.parseFloat(style.outlineWidth) || 0) +
            Math.max(0, Number.parseFloat(style.outlineOffset) || 0);
          const action = element
            .closest('app-form-inspector')!
            .querySelector('.inspector-actions')!
            .getBoundingClientRect();
          const panel = element.closest('p-tabpanels')!.getBoundingClientRect();
          const caption = element.ownerDocument
            .querySelector('label[for="field-label"]')!
            .getBoundingClientRect();
          return {
            belowActions: rect.y - outline >= action.bottom,
            captionVisible:
              caption.top >= action.bottom && caption.bottom <= panel.bottom,
            insidePanel: rect.bottom + outline <= panel.bottom,
            hit:
              document.elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              ) === element,
            fieldTop: rect.y,
            fieldBottom: rect.bottom,
            outline,
            actionBottom: action.bottom,
            panelBottom: panel.bottom,
            scrollTop: element.closest('p-tabpanels')!.scrollTop,
            focusVisible: element.matches(':focus-visible'),
          };
        });
        return bounds;
      })
      .toMatchObject({
        belowActions: true,
        insidePanel: true,
        hit: true,
        captionVisible: true,
      });
  } finally {
    await test.info().attach('focused-property-bounds', {
      body: JSON.stringify(bounds),
      contentType: 'application/json',
    });
  }
}
