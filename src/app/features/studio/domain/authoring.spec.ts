import {
  emptyWorkspace,
  FieldSpec,
  parseDocument,
  projectFields,
} from './authoring';
import { addPrimitive, authoredNode, reorderAuthored } from './form-authoring';
import {
  canvasEdges,
  CanvasNode,
  connectWorkspace,
  graphSteps,
  WorkspaceHistory,
} from './workflow-authoring';
const nameField: FieldSpec = {
  key: 'name',
  title: 'Name',
  type: 'text',
  required: true,
  nullable: false,
  options: [],
  initial: undefined,
  schema: { type: 'string' },
};
const documents = {
  data_schema: { type: 'object', properties: {} },
  render_schema: { root: { component: 'vertical', children: [] } },
};
describe('Studio document editing', () => {
  it('projects writable fields without copying lifecycle or secret metadata', () => {
    expect(
      projectFields([nameField], {
        name: 'Renamed',
        ref_id: 'opaque',
        secret: 'volatile',
        status: 'PUBLISHED',
      }),
    ).toEqual({ name: 'Renamed' });
  });
  it('retains opaque restriction entries when renaming', () => {
    const targets: FieldSpec = {
      ...nameField,
      key: 'client_targets',
      type: 'json',
      required: false,
    };
    const restrictions = [
      { client_ref_id: 'opaque-unchanged', release: '1.0' },
    ];
    expect(
      projectFields([nameField, targets], {
        name: 'Renamed',
        client_targets: restrictions,
      })['client_targets'],
    ).toEqual(restrictions);
  });
  it('rejects unsafe, deeply nested and nonobject documents', () => {
    expect(() => parseDocument('{"__proto__": {}}')).toThrow();
    expect(() => parseDocument('[]')).toThrow();
    expect(() => parseDocument('{"amount":1e999}')).toThrow();
    expect(() =>
      parseDocument('{"node":'.repeat(34) + '{}' + '}'.repeat(34)),
    ).toThrow();
  });
  it('adds fields inside nested layouts of a repeater to the collection schema', () => {
    const rows = addPrimitive(documents, [], 'repeater', 'rows');
    const layout = addPrimitive(rows, [0], 'vertical', 'Details');
    const result = addPrimitive(layout, [0, 0], 'text', 'note');
    expect(
      authoredNode(
        result['render_schema'] as typeof documents.render_schema,
        [0, 0, 0],
      )['scope'],
    ).toBe('/properties/rows/items/properties/note');
    expect(JSON.stringify(result['data_schema'])).toContain(
      '"note":{"type":"string"}',
    );
    expect(documents.data_schema.properties).toEqual({});
  });
  it('reorders siblings without changing schema or mutating the saved layout', () => {
    const first = addPrimitive(documents, [], 'text', 'first');
    const second = addPrimitive(first, [], 'text', 'second');
    const reordered = reorderAuthored(
      second['render_schema'] as typeof documents.render_schema,
      [1],
      -1,
    );
    expect(authoredNode(reordered, [0])['scope']).toBe('/properties/second');
    expect(
      authoredNode(
        second['render_schema'] as typeof documents.render_schema,
        [0],
      )['scope'],
    ).toBe('/properties/first');
  });
});
const nodes: CanvasNode[] = [
  {
    key: 'one',
    title: 'One',
    position: { x: 0, y: 0 },
    ports: [{ key: 'value', direction: 'OUTPUT', schema: { type: 'string' } }],
  },
  {
    key: 'two',
    title: 'Two',
    position: { x: 0, y: 0 },
    ports: [{ key: 'value', direction: 'INPUT', schema: { type: 'string' } }],
  },
];
describe('Nonexecuting workflow workspace', () => {
  it('keeps control transitions separate from typed data bindings', () => {
    const initial = emptyWorkspace();
    const control = connectWorkspace(
      initial,
      'control:one:out',
      'control:two:in',
      'approve',
      nodes,
    );
    const data = connectWorkspace(
      control,
      'data:one:out:value',
      'data:two:in:value',
      '',
      nodes,
    );
    expect(canvasEdges(data.graph).map((edge) => edge.kind)).toEqual([
      'control',
      'data',
    ]);
    expect(initial.graph['transitions']).toEqual([]);
  });
  it('rejects mixed port kinds, incompatible schemas and duplicate stable step keys', () => {
    expect(() =>
      connectWorkspace(
        emptyWorkspace(),
        'control:one:out',
        'data:two:in:value',
        'next',
        nodes,
      ),
    ).toThrow();
    expect(() =>
      connectWorkspace(
        emptyWorkspace(),
        'data:one:out:value',
        'data:two:in:value',
        '',
        [
          nodes[0],
          {
            ...nodes[1],
            ports: [
              { key: 'value', direction: 'INPUT', schema: { type: 'number' } },
            ],
          },
        ],
      ),
    ).toThrow();
    expect(() =>
      graphSteps({ steps: [{ key: 'same' }, { key: 'same' }] }),
    ).toThrow();
  });
  it('preserves edge routing identity when an unrelated edge is inserted', () => {
    const edge = { source: 'one', target: 'two', outcome: 'next' };
    const key = canvasEdges({ transitions: [edge] })[0].id;
    expect(
      canvasEdges({
        transitions: [{ source: 'other', target: 'two' }, edge],
      })[1].id,
    ).toBe(key);
  });
  it('bounds undo history and copies coordinates without touching graph pins', () => {
    const history = new WorkspaceHistory();
    const initial = emptyWorkspace();
    for (let index = 0; index < 25; index++) {
      history.record({ ...initial, positions: { one: { x: index, y: 0 } } });
    }
    let current = initial;
    let count = 0;
    while (true) {
      const previous = history.undo(current);
      if (!previous) {
        break;
      }
      current = previous;
      count++;
    }
    expect(count).toBe(20);
    expect(current.positions['one'].x).toBe(5);
    expect(history.redo(current)?.positions['one'].x).toBe(6);
    history.clear();
    expect(history.undo(initial)).toBeNull();
  });
});
