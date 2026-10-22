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
      const visible = (element: HTMLElement): boolean => {
        for (
          let ancestor: HTMLElement | null = element;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          const style = getComputedStyle(ancestor);
          if (
            ancestor.hidden ||
            ancestor.getAttribute('aria-hidden') === 'true' ||
            style.display === 'none' ||
            style.visibility === 'hidden'
          ) {
            return false;
          }
        }
        return true;
      };
      const control =
        [...(container?.querySelectorAll<HTMLElement>(selector) ?? [])].find(
          visible,
        ) ??
        [
          ...(container?.querySelectorAll<HTMLElement>(
            'fieldset[aria-invalid="true"]',
          ) ?? []),
        ].find(visible);
      control?.focus();
      control?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    { injector },
  );
}
