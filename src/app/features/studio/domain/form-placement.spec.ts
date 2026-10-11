import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { addPrimitive, authoredNode, outline } from './form-authoring';
import { renderOf } from './form-editing';
import {
  canReparent,
  duplicateLayout,
  reparentPlacement,
} from './form-placement';

function fixture(): JsonObject {
  let document: JsonObject = {
    data_schema: { type: 'object', properties: {} },
    render_schema: { root: { component: 'vertical', children: [] } },
    localization: { catalogs: { en: {}, fa: {} } },
    reuse_instances: { keep: true },
    variants: { preserve: true },
  };
  document = addPrimitive(document, [], 'grid', 'left');
  document = addPrimitive(document, [], 'horizontal', 'right');
  document = addPrimitive(document, [0], 'text', 'name');
  document = addPrimitive(document, [0], 'repeater', 'rows');
  return addPrimitive(document, [0, 1], 'boolean', 'active');
}

describe('Layout placement operations', () => {
  it('moves across parents atomically, preserving all canonical documents and bindings', () => {
    const initial = fixture();
    const before = structuredClone(initial);
    const result = reparentPlacement(initial, [0, 0], [1]);
    expect(result.selection).toEqual([1, 0]);
    expect(authoredNode(renderOf(result.documents), result.selection)).toEqual(
      authoredNode(renderOf(initial), [0, 0]),
    );
    for (const key of [
      'data_schema',
      'localization',
      'reuse_instances',
      'variants',
    ]) {
      expect(result.documents[key]).toEqual(initial[key]);
    }
    expect(initial).toEqual(before);
  });
  it('rebases a destination whose path shifts when a preceding placement is removed', () => {
    const initial = fixture();
    const result = reparentPlacement(initial, [0], [1]);
    expect(result.selection).toEqual([0, 0]);
    expect(
      authoredNode(renderOf(result.documents), result.selection)['label'],
    ).toBe('left');
  });
  it('rejects cycles, root movement, leaf parents and crossing collection contexts', () => {
    const initial = fixture();
    for (const [source, destination] of [
      [[0], [0, 1]],
      [[], [1]],
      [
        [0, 0],
        [0, 1, 0],
      ],
      [[0, 1, 0], [1]],
      [
        [0, 0],
        [0, 1],
      ],
    ]) {
      expect(canReparent(initial, source, destination)).toBe(false);
      expect(() => reparentPlacement(initial, source, destination)).toThrow();
    }
  });
  it('duplicates layout with fresh subtree keys and unchanged canonical fields', () => {
    const initial = fixture();
    const result = duplicateLayout(initial, [0]);
    expect(result.selection).toEqual([1]);
    const nodes = outline(renderOf(result.documents));
    expect(new Set(nodes.map((node) => node.identity)).size).toBe(nodes.length);
    const original = authoredNode(renderOf(initial), [0]);
    const duplicate = authoredNode(renderOf(result.documents), [1]);
    const withoutKeys = (node: JsonObject): unknown =>
      JSON.parse(
        JSON.stringify(node, (key, value: unknown) =>
          key === 'node_key' ? undefined : value,
        ),
      );
    expect(withoutKeys(duplicate)).toEqual(withoutKeys(original));
    expect(result.documents['data_schema']).toEqual(initial['data_schema']);
    expect(result.documents['localization']).toEqual(initial['localization']);
    expect(() => duplicateLayout(initial, [])).toThrow();
    expect(() => duplicateLayout(initial, [0, 0])).toThrow();
  });
  it('rejects overfull parents without changing the input', () => {
    const initial = fixture();
    const target = authoredNode(renderOf(initial), [1]) as Record<
      string,
      JsonValue
    >;
    target['children'] = Array.from({ length: 100 }, (_, index) => ({
      component: 'display',
      node_key: 'display_' + index,
    }));
    const before = structuredClone(initial);
    expect(() => reparentPlacement(initial, [0, 0], [1])).toThrow('100');
    expect(initial).toEqual(before);
  });
});
