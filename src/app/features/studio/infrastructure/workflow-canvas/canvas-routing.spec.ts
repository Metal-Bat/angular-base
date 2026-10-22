import { automaticConnectionRoutes } from './canvas-routing';
import { CanvasEdge, CanvasNode } from '../../domain/workflow-authoring';
const nodes: CanvasNode[] = [
  { key: 'a', title: 'A', position: { x: 40, y: 100 }, ports: [] },
  { key: 'b', title: 'B', position: { x: 400, y: 100 }, ports: [] },
];
const edges: CanvasEdge[] = ['first', 'second'].map((id) => ({
  id,
  source: 'control:a:out',
  target: 'control:b:in',
  kind: 'control',
}));
describe('Parallel connection viewing lanes', () => {
  it('separates parallel branches deterministically without writing or reordering input data', () => {
    const before = structuredClone({ nodes, edges });
    const result = automaticConnectionRoutes(nodes, edges, {});
    expect(Math.abs(result['first'][0].y - result['second'][0].y)).toBe(56);
    expect(automaticConnectionRoutes(nodes, [...edges].reverse(), {})).toEqual(
      result,
    );
    expect({ nodes, edges }).toEqual(before);
  });
  it('preserves manual points, leaves single connections alone and refuses unknown node anchors', () => {
    const manual = { first: [{ x: 300, y: 50 }] };
    expect(
      automaticConnectionRoutes(nodes, edges, manual)['first'],
    ).toBeUndefined();
    expect(manual).toEqual({ first: [{ x: 300, y: 50 }] });
    expect(automaticConnectionRoutes(nodes, edges.slice(0, 1), {})).toEqual({});
    expect(automaticConnectionRoutes([], edges, {})).toEqual({});
  });
});
