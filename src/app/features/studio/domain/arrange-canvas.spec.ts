import { arrangeCanvas } from './arrange-canvas';
import { emptyWorkspace, Workspace } from './authoring';
import { CanvasNode } from './workflow-authoring';
describe('Measured workflow arrangement', () => {
  it.each(['right', 'down'] as const)(
    'separates branches, cycles and disconnected graphs without changing meaning: %s',
    (direction) => {
      const keys = ['root', 'left', 'right', 'cycleA', 'cycleB', 'alone'];
      const nodes: CanvasNode[] = keys.map((key) => ({
        key,
        title: key,
        position: { x: 10, y: 10 },
        ports: [],
      }));
      const sizes = Object.fromEntries(
        keys.map((key, index) => [
          key,
          { width: 240 + index * 10, height: 120 + index * 60 },
        ]),
      );
      const workspace: Workspace = {
        ...emptyWorkspace(),
        graph: {
          steps: keys.map((key) => ({
            key,
            type_code: 'TRANSFORM',
            type_version_ref: 'immutable-pin',
            config: { enabled: false, zero: 0 },
          })),
          transitions: [
            ['root', 'left'],
            ['root', 'right'],
            ['left', 'cycleA'],
            ['cycleA', 'cycleB'],
            ['cycleB', 'cycleA'],
          ].map(([source, target]) => ({
            source,
            target,
            outcome: 'next',
            condition: 'request.flag',
            priority: 4,
            is_default: false,
          })),
        },
        routing: { edge: [{ x: 70, y: 80 }] },
      };
      const before = structuredClone(workspace);
      const result = arrangeCanvas(workspace, nodes, sizes, direction);
      expect(result.graph).toBe(workspace.graph);
      expect(result.viewport).toBe(workspace.viewport);
      expect(workspace).toEqual(before);
      expect(result.routing).toEqual({});
      expect(
        arrangeCanvas(workspace, [...nodes].reverse(), sizes, direction)
          .positions,
      ).toEqual(result.positions);
      for (const first of keys) {
        for (const second of keys.filter((key) => key !== first)) {
          const a = result.positions[first];
          const b = result.positions[second];
          expect(
            a.x + sizes[first].width <= b.x ||
              b.x + sizes[second].width <= a.x ||
              a.y + sizes[first].height <= b.y ||
              b.y + sizes[second].height <= a.y,
          ).toBe(true);
        }
      }
    },
  );
});
