import labels from './field-labels.json' with { type: 'json' };
const fieldLabels: Readonly<
  Record<string, { label: string; fa: string; ar: string }>
> = labels;
/** Presentation only: backend field keys and values remain canonical. */
export function fieldLabel(key: string, schemaTitle?: string): string {
  return (
    fieldLabels[key]?.label ??
    (schemaTitle || key)
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\b(?:Id|Ip|Api|Url|Json)\b/g, (token) => token.toUpperCase())
  );
}
export const fieldTranslations: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.values(fieldLabels).map((field) => [field.label, field.fa]),
  );

export const arabicFieldTranslations: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.values(fieldLabels).map((field) => [field.label, field.ar]),
  );
