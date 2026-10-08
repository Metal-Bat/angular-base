export function immutablePayload<T>(value: T): T {
  const copy: unknown = structuredClone(value);
  const visit = (item: unknown, depth: number): void => {
    if (depth > 64) {
      throw new Error('Command payload is too deep.');
    }
    if (
      item === null ||
      typeof item === 'string' ||
      typeof item === 'boolean'
    ) {
      return;
    }
    if (typeof item === 'number' && Number.isFinite(item)) {
      return;
    }
    if (
      typeof item !== 'object' ||
      item === null ||
      (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype)
    ) {
      throw new Error('Commands require canonical JSON payloads.');
    }
    for (const child of Object.values(item)) {
      visit(child, depth + 1);
    }
    Object.freeze(item);
  };
  visit(copy, 0);
  return copy as T;
}
