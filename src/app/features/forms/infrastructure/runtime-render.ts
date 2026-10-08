import {
  JsonObject,
  primitiveKinds,
  RenderNode,
} from '../domain/runtime-document';
import { jsonObject, list, object, scope, text } from './runtime-shape';
const forbidden = [
  'calculation',
  'conditions',
  'rules',
  'default',
  'default_value',
  'context_bindings',
  'parameters',
  'reuse_instances',
  'localization',
  'source',
  'navigation',
  'messages',
  'option_messages',
];
function readScope(
  node: Record<string, unknown>,
  kind: unknown,
  readable: readonly string[],
): string | null {
  const fieldScope =
    node['scope'] === null || node['scope'] === undefined
      ? null
      : scope(node['scope']);
  if (
    fieldScope &&
    !readable.some(
      (path) =>
        fieldScope === path ||
        fieldScope.startsWith(path + '/') ||
        (['group', 'vertical', 'horizontal', 'grid'].includes(String(kind)) &&
          path.startsWith(fieldScope + '/')),
    )
  ) {
    throw new Error('policy');
  }
  return fieldScope;
}
function selectedRenderer(
  node: Record<string, unknown>,
  capabilities: readonly string[],
): 'default' | 'compact' {
  const interaction =
    node['interaction'] === null || node['interaction'] === undefined
      ? {}
      : object(node['interaction']);
  const required = list(interaction['required_capabilities'] ?? [], 16);
  const missing = required.some(
    (item) => !capabilities.includes(text(item, 128)),
  );
  const renderer = missing
    ? interaction['fallback_renderer']
    : (node['renderer'] ?? 'default');
  if (renderer !== 'default' && renderer !== 'compact') {
    throw new Error(missing ? 'capability' : 'primitive');
  }
  return renderer;
}
function label(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string' || value.length > 255) {
    throw new Error('shape');
  }
  return value;
}
export function readRender(
  value: unknown,
  readable: readonly string[],
  capabilities: readonly string[],
  depth = 0,
  budget = { nodes: 0 },
): RenderNode {
  if (depth > 32 || ++budget.nodes > 2048) {
    throw new Error('shape');
  }
  const node = object(value);
  const kind = node['component'];
  if (!primitiveKinds.includes(kind as (typeof primitiveKinds)[number])) {
    throw new Error('primitive');
  }
  if (forbidden.some((key) => node[key] !== undefined)) {
    throw new Error('policy');
  }
  const fieldScope = readScope(node, kind, readable);
  const renderer = selectedRenderer(node, capabilities);
  const display: JsonObject = jsonObject(
    Object.fromEntries(
      Object.entries(node).filter(
        ([key]) =>
          ![
            'children',
            'component',
            'scope',
            'label',
            'node_key',
            'renderer',
          ].includes(key),
      ),
    ),
  );
  return Object.freeze({
    component: kind as RenderNode['component'],
    key:
      node['node_key'] === null || node['node_key'] === undefined
        ? null
        : text(node['node_key'], 128),
    scope: fieldScope,
    label: label(node['label']),
    renderer,
    display,
    children: Object.freeze(
      list(node['children'] ?? [], 100).map((child) =>
        readRender(child, readable, capabilities, depth + 1, budget),
      ),
    ),
  });
}
