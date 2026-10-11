import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { authoredNode, nextNodeKey, outline, palette } from './form-authoring';
import { renderOf, schemaAt } from './form-editing';
import { freshPlacement, placementFits } from './fresh-placement';

/** Existing canonical fields in the selected container's collection context. */
export function placementFields(
  documents: JsonObject,
  path: readonly number[],
): { scope: string; name: string; component: (typeof palette)[number] }[] {
  const render = renderOf(documents);
  const parent = authoredNode(render, path);
  if (
    outline(render).length >= 256 ||
    path.length >= 16 ||
    ((parent['children'] ?? []) as JsonObject[]).length >= 100
  ) {
    return [];
  }
  if (
    !['vertical', 'horizontal', 'grid', 'repeater', 'table'].includes(
      String(parent['component']),
    )
  ) {
    return [];
  }
  let prefix = '';
  for (let length = path.length; length >= 0; length--) {
    const node = authoredNode(render, path.slice(0, length));
    if (
      ['repeater', 'table'].includes(String(node['component'])) &&
      typeof node['scope'] === 'string'
    ) {
      prefix = node['scope'] + '/items';
      break;
    }
  }
  const schema = prefix
    ? schemaAt(documents, prefix)
    : (documents['data_schema'] as JsonObject);
  const properties = schema['properties'] as JsonObject | undefined;
  const nodes = outline(render).map((item) => authoredNode(render, item.path));
  return Object.entries(properties ?? {}).flatMap(([name, value]) => {
    if (
      !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) ||
      ['constructor', 'prototype'].includes(name) ||
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return [];
    }
    const field = value as JsonObject;
    const scope = prefix + '/properties/' + name;
    const existing = nodes.find((node) => node['scope'] === scope);
    if (existing && !placementFits(render, path, existing)) {
      return [];
    }
    const component = placementKind(field, existing);
    return component ? [{ name, scope, component }] : [];
  });
}
export function placeField(
  documents: JsonObject,
  path: readonly number[],
  scope: string,
): JsonObject {
  const field = placementFields(documents, path).find(
    (item) => item.scope === scope,
  );
  if (!field) {
    throw Error('Choose an existing field in this collection context');
  }
  const next = structuredClone(documents);
  const render = renderOf(next);
  const parent = authoredNode(render, path) as Record<string, JsonValue>;
  const children = (parent['children'] ?? []) as JsonObject[];
  if (children.length >= 100) {
    throw Error('Too many components');
  }
  const existing = outline(render)
    .map((item) => authoredNode(render, item.path))
    .find(
      (node) =>
        node['scope'] === scope && node['component'] === field.component,
    );
  const placement = existing
    ? freshPlacement(render, existing)
    : {
        component: field.component,
        scope,
        label: field.name,
        node_key: nextNodeKey(render),
        ...(['repeater', 'table'].includes(field.component)
          ? { children: [] }
          : {}),
      };
  parent['children'] = [...children, placement];
  outline(render);
  return next;
}

function placementKind(
  field: JsonObject,
  existing?: JsonObject,
): (typeof palette)[number] | null {
  const existingKind = existing?.['component'];
  if (
    existingKind &&
    palette.includes(existingKind as (typeof palette)[number])
  ) {
    return existingKind as (typeof palette)[number];
  }
  const type = field['type'];
  if (
    type === 'array' &&
    (field['items'] as JsonObject | undefined)?.['type'] === 'object'
  ) {
    return 'repeater';
  }
  if (type === 'string') {
    return field['format'] === 'date'
      ? 'date'
      : field['format'] === 'date-time'
        ? 'datetime'
        : 'text';
  }
  return type === 'boolean'
    ? 'boolean'
    : type === 'integer'
      ? 'integer'
      : type === 'number'
        ? 'number'
        : null;
}
