import type { Locator } from '@playwright/test';

export async function dropFiles(
  target: Locator,
  files: readonly { name: string; mimeType: string; buffer: Buffer }[],
): Promise<void> {
  await target.evaluate(
    (element, items) => {
      const transfer = new DataTransfer();
      for (const item of items) {
        const bytes = Uint8Array.from(atob(item.base64), (character) =>
          character.charCodeAt(0),
        );
        transfer.items.add(
          new File([bytes], item.name, { type: item.mimeType }),
        );
      }
      element.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
    },
    files.map((file) => ({
      name: file.name,
      mimeType: file.mimeType,
      base64: file.buffer.toString('base64'),
    })),
  );
}
