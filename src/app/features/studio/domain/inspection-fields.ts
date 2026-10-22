import { fieldLabel } from '../../../shared/domain/field-label';

function result(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function inspectionLabel(text: string): string {
  const value = result(text);
  return value?.['valid'] === true
    ? 'Validation passed'
    : value?.['valid'] === false
      ? 'Validation needs changes'
      : text === 'Saved'
        ? 'Saved'
        : 'Inspection complete';
}

/** Present inspection values as named fields, never a serialized document. */
export function inspectionFields(
  text: string,
): readonly { label: string; value: string }[] {
  const value = result(text);
  const fields: { label: string; value: string }[] = [];
  const visit = (entry: unknown, path: string[]): void => {
    if (fields.length >= 2048) {
      return;
    }
    if (entry && typeof entry === 'object') {
      for (const [key, child] of Object.entries(entry)) {
        visit(child, [
          ...path,
          Array.isArray(entry) ? String(Number(key) + 1) : fieldLabel(key),
        ]);
      }
    } else {
      fields.push({
        label: path.join(' › '),
        value:
          entry === true
            ? 'Yes'
            : entry === false
              ? 'No'
              : entry === null
                ? 'No value'
                : String(entry),
      });
    }
  };
  if (value) {
    for (const [key, child] of Object.entries(value)) {
      if (!['issues', 'warnings', 'valid'].includes(key)) {
        visit(child, [fieldLabel(key)]);
      }
    }
  }
  if (fields.length >= 2048) {
    fields.push({
      label: 'Inspection',
      value: 'More results are available. Narrow the inspection.',
    });
  }
  return fields;
}
