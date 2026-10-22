import { JsonObject } from './runtime-document';
export function attachmentRule(
  file: { readonly size: number; readonly type: string },
  kind: 'file' | 'image',
  caption: string,
  items: readonly { readonly ref: string; readonly size: number }[],
  options: JsonObject,
  replacement?: string,
): string {
  const kinds = options['allowed_kinds'];
  if (Array.isArray(kinds) && kinds.length && !kinds.includes(kind)) {
    return 'This upload type is not allowed for this field.';
  }
  const types = options['allowed_mime_types'];
  // Exact server membership. A stored wildcard is not broadened silently.
  const storedType = kind === 'image' ? 'image/webp' : file.type;
  if (Array.isArray(types) && types.length && !types.includes(storedType)) {
    return kind === 'image'
      ? 'This field must allow WebP images before pictures can be attached.'
      : 'Choose a file with an allowed content type.';
  }
  if (options['caption_required'] === true && !caption.trim()) {
    return 'Add a caption before uploading.';
  }
  const count = options['max_items'];
  if (!replacement && typeof count === 'number' && items.length >= count) {
    return 'This field has reached its attachment limit.';
  }
  // Image bytes are normalized privately by the service; original size is not stored size.
  if (kind === 'image') {
    return '';
  }
  const maximum = options['max_item_bytes'];
  if (typeof maximum === 'number' && file.size > maximum) {
    return 'The file exceeds the per-file size limit.';
  }
  const total = options['max_total_bytes'];
  const size = items
    .filter((item) => item.ref !== replacement)
    .reduce((sum, item) => sum + item.size, file.size);
  return typeof total === 'number' && size > total
    ? 'The files exceed the total size limit.'
    : '';
}
