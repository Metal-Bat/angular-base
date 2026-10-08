import { afterNextRender, Injector } from '@angular/core';

export function focusInvalidControl(
  root: () => HTMLElement | undefined,
  current: () => boolean,
  injector: Injector,
): void {
  afterNextRender(
    () => {
      if (!current()) {
        return;
      }
      const container = root();
      const selector = [
        'input[aria-invalid="true"]',
        'textarea[aria-invalid="true"]',
        '[role="combobox"][aria-invalid="true"]',
        '.ui-field:has(.field-error) input',
        '.ui-field:has(.field-error) textarea',
        '.ui-field:has(.field-error) [role="combobox"]',
      ].join(', ');
      const control =
        container?.querySelector<HTMLElement>(selector) ??
        container?.querySelector<HTMLElement>('fieldset[aria-invalid="true"]');
      control?.focus();
      control?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    { injector },
  );
}
