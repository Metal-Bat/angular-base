import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
export const palette = [
  'vertical',
  'horizontal',
  'grid',
  'text',
  'textarea',
  'integer',
  'number',
  'date',
  'datetime',
  'boolean',
  'choice',
  'calculated',
  'display',
  'user',
  'group',
  'repeater',
  'table',
  'media',
  'attachment_collection',
  'action',
] as const;
export type OutlineItem = {
  path: readonly number[];
  label: string;
  scope: string | null;
};
export function outline(render: JsonObject): OutlineItem[] {
  const result: OutlineItem[] = [];
  const visit = (value: JsonValue | undefined, path: number[]): void => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return;
    }
    const node = value as JsonObject;
    if (result.length >= 256 || path.length > 16) {
      throw Error('Layout is too complex');
    }
    result.push({
      path,
      label: String(node['label'] ?? node['component']),
      scope: typeof node['scope'] === 'string' ? node['scope'] : null,
    });
    if (Array.isArray(node['children'])) {
      node['children'].forEach((child, index) =>
        visit(child, [...path, index]),
      );
    }
  };
  visit(render['root'], []);
  return result;
}
export function authoredNode(
  render: JsonObject,
  path: readonly number[],
): JsonObject {
  let node = render['root'] as JsonObject;
  for (const index of path) {
    node = (node['children'] as readonly JsonObject[])[index];
  }
  if (!node) {
    throw Error('Selected component no longer exists');
  }
  return node;
}
export function replaceAuthored(
  render: JsonObject,
  path: readonly number[],
  replacement: JsonObject,
): JsonObject {
  const copy = structuredClone(render) as Record<string, JsonValue>;
  if (!path.length) {
    copy['root'] = replacement;
    return copy;
  }
  const parent = authoredNode(copy, path.slice(0, -1));
  (parent['children'] as JsonObject[])[path[path.length - 1]] = replacement;
  return copy;
}
export function reorderAuthored(
  render: JsonObject,
  path: readonly number[],
  offset: number,
): JsonObject {
  if (!path.length) {
    return render;
  }
  const copy = structuredClone(render);
  const siblings = authoredNode(copy, path.slice(0, -1))[
    'children'
  ] as JsonObject[];
  const index = path[path.length - 1];
  if (index + offset < 0 || index + offset >= siblings.length) {
    return render;
  }
  const [node] = siblings.splice(index, 1);
  siblings.splice(index + offset, 0, node);
  return copy;
}
export function addPrimitive(
  documents: JsonObject,
  parent: readonly number[],
  kind: (typeof palette)[number],
  name: string,
): JsonObject {
  const copy = structuredClone(documents) as Record<string, JsonValue>;
  const render = copy['render_schema'] as JsonObject;
  const container = authoredNode(render, parent);
  if (
    !['vertical', 'horizontal', 'grid', 'repeater', 'table'].includes(
      String(container['component']),
    )
  ) {
    throw Error('Select a layout or collection as parent');
  }
  const children = (container['children'] ?? []) as JsonObject[];
  if (children.length >= 100) {
    throw Error('Too many components');
  }
  const layout = [
    'vertical',
    'horizontal',
    'grid',
    'display',
    'action',
  ].includes(kind);
  const node: Record<string, JsonValue> = { component: kind, label: name };
  if (!layout) {
    if (!validPropertyName(name)) {
      throw Error('Use a stable property name');
    }
    const scope = collectionScope(render, parent) + '/properties/' + name;
    node['scope'] = scope;
    const rootSchema = copy['data_schema'] as Record<string, JsonValue>;
    let schema = rootSchema;
    const tokens = scope.split('/').slice(1);
    for (let index = 0; index < tokens.length - 2;) {
      if (tokens[index] === 'items') {
        schema['items'] ??= { type: 'object', properties: {} };
        schema = schema['items'] as Record<string, JsonValue>;
        index++;
      } else {
        schema['properties'] ??= {};
        const properties = schema['properties'] as Record<string, JsonValue>;
        schema = properties[tokens[index + 1]] as Record<string, JsonValue>;
        index += 2;
      }
    }
    schema['properties'] ??= {};
    const properties = schema['properties'] as Record<string, JsonValue>;
    if (Object.hasOwn(properties, name)) {
      throw Error('Property already exists');
    }
    properties[name] = ['repeater', 'table'].includes(kind)
      ? { type: 'array', items: { type: 'object', properties: {} } }
      : kind === 'attachment_collection'
        ? { type: 'array', items: { type: 'string' } }
        : {
            type:
              kind === 'boolean'
                ? 'boolean'
                : kind === 'integer'
                  ? 'integer'
                  : kind === 'number'
                    ? 'number'
                    : 'string',
            ...(['date', 'datetime'].includes(kind)
              ? { format: kind === 'date' ? 'date' : 'date-time' }
              : {}),
          };
  }
  if (['vertical', 'horizontal', 'grid', 'repeater', 'table'].includes(kind)) {
    node['children'] = [];
  }
  applyPrimitiveDefaults(copy, render, node, kind);
  children.push(node);
  (container as Record<string, JsonValue>)['children'] = children;
  outline(render);
  return copy;
}

function collectionScope(render: JsonObject, path: readonly number[]): string {
  for (let length = path.length; length >= 0; length--) {
    const node = authoredNode(render, path.slice(0, length));
    if (
      ['repeater', 'table'].includes(String(node['component'])) &&
      typeof node['scope'] === 'string'
    ) {
      return node['scope'] + '/items';
    }
  }
  return '';
}

function applyPrimitiveDefaults(
  documents: Record<string, JsonValue>,
  render: JsonObject,
  node: Record<string, JsonValue>,
  kind: (typeof palette)[number],
): void {
  if (kind === 'choice') {
    node['source'] = {
      kind: 'custom',
      items: [{ key: 'option1', value: 'Option 1' }],
    };
  }
  if (kind === 'user' || kind === 'group') {
    node['source'] = {
      kind: 'domain',
      selector: kind === 'user' ? 'users' : 'work_groups',
    };
  }
  if (kind === 'calculated') {
    documents['behavior_dialect'] = 'bpms.behavior/1';
    node['calculation'] = { expression: '""' };
  }
  if (kind === 'action') {
    node['outcome'] = 'next';
    (render as Record<string, JsonValue>)['outcomes'] = [
      ...new Set([...((render['outcomes'] as string[]) ?? []), 'next']),
    ];
  }
}

function validPropertyName(name: string): boolean {
  return (
    /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) &&
    !['constructor', 'prototype'].includes(name)
  );
}
