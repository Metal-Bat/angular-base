import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { outline } from './form-authoring';

export function placementFits(
  render: JsonObject,
  parent: readonly number[],
  source: JsonObject,
): boolean {
  const subtree = outline({ root: source });
  return (
    outline(render).length + subtree.length <= 256 &&
    subtree.every((item) => parent.length + 1 + item.path.length <= 16)
  );
}

/** Copy presentation only. Canonical scopes, option sources and reuse pins stay shared. */
export function freshPlacement(
  render: JsonObject,
  source: JsonObject,
): JsonObject {
  const copy = structuredClone(source);
  const used = new Set(outline(render).map((item) => item.identity));
  let ordinal = 1;
  const renew = (node: JsonObject): void => {
    while (used.has('field_' + ordinal)) {
      ordinal++;
    }
    const key = 'field_' + ordinal++;
    used.add(key);
    (node as Record<string, JsonValue>)['node_key'] = key;
    for (const child of (node['children'] ?? []) as JsonObject[]) {
      renew(child);
    }
  };
  renew(copy);
  return copy;
}
