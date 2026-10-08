import { diagramPositions } from './diagram-layout';
import { WorkflowTopology } from './workflow-topology';
const steps = ['start', 'review', 'finish'].map((key) => ({
  key,
  typeCode: 'task',
  typeVersionReference: null,
}));
const edge = (
  source: string,
  target: string,
): WorkflowTopology['transitions'][number] => ({
  source,
  target,
  outcome: 'next',
  condition: null,
  isDefault: false,
  priority: 0,
});
describe('Workflow diagram layout', () => {
  it('arranges control flow from left to right', () => {
    const positions = diagramPositions({
      steps,
      transitions: [edge('start', 'review'), edge('review', 'finish')],
    });
    expect(positions['start'].x).toBeLessThan(positions['review'].x);
    expect(positions['review'].x).toBeLessThan(positions['finish'].x);
  });
  it('keeps cycles and disconnected steps finite and deterministic', () => {
    const graph: WorkflowTopology = {
      steps,
      transitions: [
        edge('start', 'review'),
        edge('review', 'start'),
        edge('missing', 'finish'),
      ],
    };
    const positions = diagramPositions(graph);
    expect(positions).toEqual(diagramPositions(graph));
    expect(Object.keys(positions)).toHaveLength(3);
    expect(
      Object.values(positions).every(
        (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
      ),
    ).toBe(true);
    expect(
      new Set(Object.values(positions).map((point) => JSON.stringify(point)))
        .size,
    ).toBe(3);
  });
});
