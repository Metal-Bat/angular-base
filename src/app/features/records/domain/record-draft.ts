import { RecordField } from './records';

/** An independently rendered section may update only the fields it owns. */
export function updateFieldValues(
  current: Record<string, string | boolean>,
  fields: readonly Pick<RecordField, 'key'>[],
  values: Record<string, string | boolean>,
): Record<string, string | boolean> {
  return {
    ...current,
    ...Object.fromEntries(
      fields.map((field) => [field.key, values[field.key] ?? '']),
    ),
  };
}
