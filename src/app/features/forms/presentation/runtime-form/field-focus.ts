import { fieldId } from '../../../../core/feedback/feedback';

/** Reuse canonical field IDs; collection/media targets focus their own fieldset. */
export function renderedField(
  host: HTMLElement,
  pointer: string,
): HTMLElement | null {
  const id = fieldId(pointer);
  for (const owner of host.querySelectorAll<HTMLElement>(
    '[data-field-pointer]',
  )) {
    if (owner.getAttribute('data-field-pointer') !== pointer) {
      continue;
    }
    const owned = (candidate: HTMLElement): boolean =>
      candidate.closest('[data-field-pointer]') === owner;
    const field =
      [...owner.querySelectorAll<HTMLElement>('[id]')].find(
        (candidate) =>
          owned(candidate) &&
          (candidate.id === id || candidate.id.startsWith(id + '--')),
      ) ??
      [
        ...owner.querySelectorAll<HTMLElement>('fieldset, section[aria-label]'),
      ].find(owned);
    if (
      field &&
      field.getClientRects().length &&
      !field.matches(':disabled, [aria-disabled="true"]')
    ) {
      return field;
    }
  }
  return null;
}
