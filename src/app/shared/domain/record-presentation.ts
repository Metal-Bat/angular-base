/** Read-only presentation; never alter the response used by mutations. */
export type PresentedField = {
  key: string;
  path: readonly string[];
  value: unknown;
};
export type FieldChange = {
  key: string;
  path: readonly string[];
  before: unknown;
  after: unknown;
  beforePresent: boolean;
  afterPresent: boolean;
};
export function hiddenField(key: string): boolean {
  return (
    /(^|_)ref(_id)?$|password|secret|credential|token|authorization|api_key/i.test(
      key,
    ) ||
    /^(id|entity_id|actor_id|modifier_id|request_id|trace_id|source_ip|user_agent|graph_checksum)$/.test(
      key,
    )
  );
}
export function presentedFields(
  value: unknown,
  path: readonly string[] = [],
): PresentedField[] {
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).filter(([key]) => !hiddenField(key));
    if (!Object.keys(value).length && path.length) {
      return [{ key: JSON.stringify(path), path, value }];
    }
    return entries.flatMap(([key, item]) =>
      presentedFields(item, [...path, key]),
    );
  }
  return path.length ? [{ key: JSON.stringify(path), path, value }] : [];
}
/** Compare leaves, including nested objects and array members, without JSON dumps. */
export function fieldChanges(before: unknown, after: unknown): FieldChange[] {
  const previous = new Map(
    presentedFields(before).map((field) => [field.key, field]),
  );
  const current = new Map(
    presentedFields(after).map((field) => [field.key, field]),
  );
  return [...new Set([...previous.keys(), ...current.keys()])].flatMap(
    (key) => {
      const old = previous.get(key);
      const next = current.get(key);
      if (
        old &&
        next &&
        (Object.is(old.value, next.value) ||
          (old.value !== null &&
            next.value !== null &&
            typeof old.value === 'object' &&
            typeof next.value === 'object' &&
            Array.isArray(old.value) === Array.isArray(next.value) &&
            !Object.keys(old.value).length &&
            !Object.keys(next.value).length))
      ) {
        return [];
      }
      return [
        {
          key,
          path: (next ?? old)!.path,
          before: old?.value,
          after: next?.value,
          beforePresent: !!old,
          afterPresent: !!next,
        },
      ];
    },
  );
}
