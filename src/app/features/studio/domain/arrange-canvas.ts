import { Point, Workspace } from './authoring';
import { canvasEdges, CanvasNode } from './workflow-authoring';
export type NodeSizes = Readonly<
  Record<string, { width: number; height: number }>
>;
export type LayoutDirection = 'right' | 'down';
/** Presentation-only layout. Cycles stay in one layer; disconnected graphs have separate bands. */
export function arrangeCanvas(
  workspace: Workspace,
  nodes: readonly CanvasNode[],
  sizes: NodeSizes,
  direction: LayoutDirection,
): Workspace {
  const keys = nodes.map((node) => node.key).sort();
  const known = new Set(keys);
  const links = new Map(keys.map((key) => [key, new Set<string>()]));
  for (const edge of canvasEdges(workspace.graph, nodes)) {
    const source = edge.source.split(':')[1];
    const target = edge.target.split(':')[1];
    if (known.has(source) && known.has(target)) {
      links.get(source)!.add(target);
    }
  }
  const groups = stronglyConnected(keys, links);
  const groupOf = new Map(
    groups.flatMap((group, index) => group.map((key) => [key, index] as const)),
  );
  const edges = groups.map(() => new Set<number>());
  const incoming = groups.map(() => 0);
  for (const key of keys) {
    for (const target of links.get(key)!) {
      const from = groupOf.get(key)!;
      const to = groupOf.get(target)!;
      if (from !== to && !edges[from].has(to)) {
        edges[from].add(to);
        incoming[to]++;
      }
    }
  }
  const rank = groups.map(() => 0);
  const queue = groups
    .map((_, index) => index)
    .filter((index) => !incoming[index]);
  for (const index of queue) {
    for (const target of edges[index]) {
      rank[target] = Math.max(rank[target], rank[index] + 1);
      if (!--incoming[target]) {
        queue.push(target);
      }
    }
  }
  return {
    ...workspace,
    positions: positionsFor(groups, edges, rank, sizes, direction),
    routing: {},
  };
}
function positionsFor(
  groups: readonly string[][],
  edges: readonly ReadonlySet<number>[],
  rank: readonly number[],
  sizes: NodeSizes,
  direction: LayoutDirection,
): Record<string, Point> {
  const positions: Record<string, Point> = {};
  let band = 40;
  const assigned = new Set<number>();
  for (let root = 0; root < groups.length; root++) {
    if (assigned.has(root)) {
      continue;
    }
    const component = [root];
    assigned.add(root);
    for (const index of component) {
      for (let next = 0; next < groups.length; next++) {
        if (
          !assigned.has(next) &&
          (edges[index].has(next) || edges[next].has(index))
        ) {
          assigned.add(next);
          component.push(next);
        }
      }
    }
    const levels = new Map<number, string[]>();
    for (const index of component) {
      levels.set(rank[index], [
        ...(levels.get(rank[index]) ?? []),
        ...groups[index],
      ]);
    }
    let primary = 40;
    let extent = 0;
    for (const [, layer] of [...levels].sort(([a], [b]) => a - b)) {
      let cross = band;
      let breadth = 0;
      for (const key of layer.sort()) {
        const size = sizes[key] ?? { width: 240, height: 200 };
        positions[key] =
          direction === 'right'
            ? { x: primary, y: cross }
            : { x: cross, y: primary };
        const width = Math.max(1, size.width);
        const height = Math.max(1, size.height);
        breadth = Math.max(breadth, direction === 'right' ? width : height);
        cross += (direction === 'right' ? height : width) + 64;
      }
      extent = Math.max(extent, cross - band);
      primary += breadth + 120;
    }
    band += extent + 96;
  }
  return positions;
}
function stronglyConnected(
  keys: readonly string[],
  links: ReadonlyMap<string, ReadonlySet<string>>,
): string[][] {
  const indices = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const groups: string[][] = [];
  let sequence = 0;
  const visit = (key: string): void => {
    indices.set(key, sequence);
    low.set(key, sequence++);
    stack.push(key);
    onStack.add(key);
    for (const target of links.get(key)!) {
      if (!indices.has(target)) {
        visit(target);
        low.set(key, Math.min(low.get(key)!, low.get(target)!));
      } else if (onStack.has(target)) {
        low.set(key, Math.min(low.get(key)!, indices.get(target)!));
      }
    }
    if (low.get(key) === indices.get(key)) {
      const group: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        group.push(member);
      } while (member !== key);
      groups.push(group.sort());
    }
  };
  for (const key of keys) {
    if (!indices.has(key)) {
      visit(key);
    }
  }
  return groups.sort((a, b) => a[0].localeCompare(b[0]));
}
