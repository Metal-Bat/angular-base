import { JsonObject } from '../../forms/domain/runtime-document';

/** Local hints mirror GraphValidator._assignable. Server validation is authoritative. */
export function mappingCompatible(
  source: JsonObject,
  target: JsonObject,
): boolean {
  if (!Object.keys(target).length) {
    return true;
  }
  const types = (schema: JsonObject): string[] =>
    Array.isArray(schema['type'])
      ? (schema['type'] as string[])
      : typeof schema['type'] === 'string'
        ? [schema['type']]
        : [];
  const from = types(source);
  const to = types(target);
  return (
    from.length > 0 &&
    from.every((type) => to.includes(type)) &&
    (target['format'] === undefined || source['format'] === target['format'])
  );
}

/** Resolve local definitions for field controls without rewriting pinned schemas. */
export function editorSchema(
  schema: JsonObject,
  root = schema,
  depth = 0,
): JsonObject {
  if (depth > 16) {
    return {};
  }
  if (Array.isArray(schema['type'])) {
    const { type, ...rest } = schema;
    return editorSchema(
      { ...rest, anyOf: (type as string[]).map((item) => ({ type: item })) },
      root,
      depth + 1,
    );
  }
  const ref = schema['$ref'];
  if (typeof ref === 'string' && ref.startsWith('#/$defs/')) {
    const definition = (root['$defs'] as JsonObject | undefined)?.[
      ref.slice(8)
    ];
    return definition &&
      typeof definition === 'object' &&
      !Array.isArray(definition)
      ? editorSchema(definition as JsonObject, root, depth + 1)
      : {};
  }
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => key !== '$defs')
      .map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((item) =>
              item && typeof item === 'object' && !Array.isArray(item)
                ? editorSchema(item, root, depth + 1)
                : item,
            )
          : value && typeof value === 'object'
            ? editorSchema(value as JsonObject, root, depth + 1)
            : value,
      ]),
  ) as JsonObject;
}

export function schemaSummary(schema: JsonObject): string {
  const shape = editorSchema(schema);
  const type = schema['type'] ?? shape['type'];
  const label = Array.isArray(type)
    ? type.join(' / ')
    : String(type ?? 'Any value');
  return shape['format'] ? label + ' · ' + String(shape['format']) : label;
}
