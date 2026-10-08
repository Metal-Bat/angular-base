import { Point } from './authoring';
import { WorkflowTopology } from './workflow-topology';
// Deterministic layers for diagrams without a saved authoring layout. Cycles remain visible.
export function diagramPositions(
  topology: WorkflowTopology,
): Record<string, Point> {
  const keys = topology.steps.map((step) => step.key);
  const known = new Set(keys);
  const incoming = new Map(keys.map((key) => [key, 0]));
  const outgoing = new Map(keys.map((key) => [key, [] as string[]]));
  for (const edge of topology.transitions) {
    if (!known.has(edge.source) || !known.has(edge.target)) {
      continue;
    }
    outgoing.get(edge.source)!.push(edge.target);
    incoming.set(edge.target, incoming.get(edge.target)! + 1);
  }
  const queue = keys.filter((key) => incoming.get(key) === 0);
  const levels = new Map(queue.map((key) => [key, 0]));
  for (const key of queue) {
    for (const target of outgoing.get(key)!) {
      levels.set(
        target,
        Math.max(levels.get(target) ?? 0, levels.get(key)! + 1),
      );
      incoming.set(target, incoming.get(target)! - 1);
      if (incoming.get(target) === 0) {
        queue.push(target);
      }
    }
  }
  const rows = new Map<number, number>();
  return Object.fromEntries(
    keys.map((key, index) => {
      const level = levels.get(key) ?? index;
      const row = rows.get(level) ?? 0;
      rows.set(level, row + 1);
      return [key, { x: 40 + level * 300, y: 40 + row * 230 }];
    }),
  );
}
