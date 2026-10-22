import { Point } from '../../domain/authoring';
import { CanvasEdge, CanvasNode } from '../../domain/workflow-authoring';

/** Local viewing lanes: never write automatic routing into the workspace. */
export function automaticConnectionRoutes(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  manual: Readonly<Record<string, readonly Point[]>>,
): Record<string, Point[]> {
  const positions = new Map(nodes.map((node) => [node.key, node.position]));
  const groups = new Map<string, CanvasEdge[]>();
  for (const edge of edges) {
    const key = edge.source + '>' + edge.target;
    const group = groups.get(key);
    if (group) {
      group.push(edge);
    } else {
      groups.set(key, [edge]);
    }
  }
  const result: Record<string, Point[]> = {};
  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }
    const source = positions.get(group[0].source.split(':')[1]);
    const target = positions.get(group[0].target.split(':')[1]);
    if (!source || !target) {
      continue;
    }
    [...group]
      .sort(
        (left, right) =>
          (left.label ?? '').localeCompare(right.label ?? '') ||
          left.id.localeCompare(right.id),
      )
      .forEach((edge, index) => {
        if (!manual[edge.id]?.length) {
          result[edge.id] = [
            {
              x:
                Math.abs(target.x - source.x) >= 300
                  ? (source.x + 240 + target.x) / 2
                  : Math.max(source.x, target.x) + 304 + index * 56,
              y:
                Math.abs(target.x - source.x) >= 300
                  ? Math.min(source.y, target.y) + 80 + index * 56
                  : (source.y + target.y) / 2 + 100,
            },
          ];
        }
      });
  }
  return result;
}
