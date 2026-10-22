import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { parseNumberText } from '../../../shared/domain/number-text';
export type ResourceNumber = {
  key: string;
  label: string;
  minimum: number;
  maximum: number;
};
export type ResourceFlag = { key: string; label: string };
export const rowLimits: readonly ResourceNumber[] = [
  { key: 'minItems', label: 'Minimum rows', minimum: 0, maximum: 256 },
  { key: 'maxItems', label: 'Maximum rows', minimum: 0, maximum: 256 },
];
const counts: readonly ResourceNumber[] = [
  { key: 'min_items', label: 'Minimum items', minimum: 0, maximum: 256 },
  { key: 'max_items', label: 'Maximum items', minimum: 0, maximum: 256 },
];
export const attachmentLimits: readonly ResourceNumber[] = [
  ...counts,
  {
    key: 'max_item_bytes',
    label: 'Maximum bytes per file',
    minimum: 1,
    maximum: 1073741824,
  },
  {
    key: 'max_total_bytes',
    label: 'Maximum total bytes',
    minimum: 1,
    maximum: 4294967296,
  },
];
export const resourceFlags: readonly ResourceFlag[] = [
  { key: 'read_only', label: 'Read only' },
  { key: 'caption_required', label: 'Require a caption' },
  { key: 'allow_duplicates', label: 'Allow duplicate files' },
  { key: 'allow_remove', label: 'Allow removal' },
  { key: 'allow_replace', label: 'Allow replacement' },
  { key: 'allow_reorder', label: 'Allow reordering' },
  { key: 'preview', label: 'Allow file preview' },
  { key: 'camera', label: 'Allow camera capture' },
];
export function resourceNumbers(
  kind: string,
  validation: boolean,
): readonly ResourceNumber[] {
  if (validation) {
    return rowLimits;
  }
  return kind === 'attachment_collection'
    ? attachmentLimits
    : kind === 'media'
      ? []
      : counts;
}
export function resourceSettingsDraft(
  value: JsonObject,
  patches: JsonObject,
  fields: readonly ResourceNumber[],
  buffers: Readonly<Record<string, string>>,
  mime: string | null,
): { value: JsonObject; errors: string[] } {
  const next: Record<string, JsonValue> = { ...value, ...patches };
  const errors: string[] = [];
  for (const field of fields) {
    if (Object.hasOwn(buffers, field.key)) {
      const text = buffers[field.key];
      if (!text.trim()) {
        delete next[field.key];
        continue;
      }
      const number = parseNumberText(text);
      if (
        number === undefined ||
        !Number.isSafeInteger(number) ||
        number < field.minimum ||
        number > field.maximum
      ) {
        errors.push(field.label);
        continue;
      }
      next[field.key] = number;
    }
  }
  const minimum = next['minItems'] ?? next['min_items'];
  const maximum = next['maxItems'] ?? next['max_items'];
  if (
    typeof minimum === 'number' &&
    typeof maximum === 'number' &&
    minimum > maximum
  ) {
    errors.push('Minimum count must not exceed maximum count.');
  }
  if (mime !== null) {
    const types = mime
      .split(/\r?\n/)
      .map((type) => type.trim())
      .filter(Boolean);
    if (
      types.length > 32 ||
      types.some((type) => !/^[^\s/*]+\/[^\s/*]+$/.test(type))
    ) {
      errors.push('Enter at most 32 exact MIME types, one per line.');
    } else {
      next['allowed_mime_types'] = types.length ? types : null;
    }
  }
  return { value: next, errors };
}
