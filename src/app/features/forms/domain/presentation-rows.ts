/** Current textarea RenderOptions bounds, shared by passive design and live runtime. */
export function textareaRows(options: unknown): number {
  const value =
    options && typeof options === 'object'
      ? (options as Record<string, unknown>)['rows']
      : null;
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 30
    ? value
    : 3;
}
