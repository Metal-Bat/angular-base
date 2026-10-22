import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { Point, Workspace } from './authoring';
import {
  canvasEdges,
  CanvasNode,
  connectionKey,
  connectWorkspace,
  graphSteps,
} from './workflow-authoring';
export function duplicateSteps(
  workspace: Workspace,
  selected: readonly string[],
): { workspace: Workspace; keys: string[] } {
  const steps = graphSteps(workspace.graph);
  const selection = new Set(selected);
  if (
    !selection.size ||
    selected.some((key) => !steps.some((step) => step['key'] === key)) ||
    steps.length + selection.size > 256
  ) {
    throw Error('Select existing steps within the workspace limit');
  }
  const used = new Set(steps.map((step) => String(step['key'])));
  const mapping = new Map<string, string>();
  for (const key of selection) {
    let index = 1;
    const base = key.slice(0, 50) + '_copy_';
    while (used.has(base + index)) {
      index++;
    }
    mapping.set(key, base + index);
    used.add(base + index);
  }
  const result = structuredClone(workspace);
  const graph = result.graph as Record<string, JsonValue>;
  graph['steps'] = [
    ...steps,
    ...steps
      .filter((step) => selection.has(String(step['key'])))
      .map((step) => ({
        ...structuredClone(step),
        key: mapping.get(String(step['key']))!,
      })),
  ];
  const transitions = (graph['transitions'] ?? []) as JsonObject[];
  graph['transitions'] = [
    ...transitions,
    ...transitions
      .filter(
        (edge) =>
          mapping.has(String(edge['source'])) &&
          mapping.has(String(edge['target'])),
      )
      .map((edge) => ({
        ...edge,
        source: mapping.get(String(edge['source']))!,
        target: mapping.get(String(edge['target']))!,
      })),
  ];
  const bindings = (graph['bindings'] ?? []) as JsonObject[];
  const ordinals = new Map<string, number>();
  graph['bindings'] = [
    ...bindings,
    ...bindings
      .filter(
        (binding) =>
          mapping.has(String(binding['step'])) &&
          (binding['source_kind'] !== 'STEP_OUTPUT' ||
            mapping.has(String(binding['source_step']))),
      )
      .sort(
        (left, right) =>
          Number(left['ordinal'] ?? 0) - Number(right['ordinal'] ?? 0),
      )
      .map((binding) => {
        const target = JSON.stringify([
          binding['step'],
          binding['target_port'],
        ]);
        const ordinal = ordinals.get(target) ?? 0;
        ordinals.set(target, ordinal + 1);
        return {
          ...binding,
          step: mapping.get(String(binding['step']))!,
          ...(binding['source_kind'] === 'STEP_OUTPUT'
            ? { source_step: mapping.get(String(binding['source_step']))! }
            : {}),
          ordinal,
        };
      }),
  ];
  // Assignment/configuration references need their owning metadata and explicit revalidation.
  graph['targets'] = [
    ...((graph['targets'] ?? []) as JsonObject[]),
    ...((graph['targets'] ?? []) as JsonObject[])
      .filter((target) => mapping.has(String(target['step'])))
      .map((target) => ({
        ...structuredClone(target),
        step: mapping.get(String(target['step']))!,
      })),
  ];
  for (const [oldKey, newKey] of mapping) {
    const old = result.positions[oldKey] ?? { x: 40, y: 40 };
    result.positions[newKey] = { x: old.x + 40, y: old.y + 40 };
  }
  graphSteps(graph);
  return { workspace: result, keys: [...mapping.values()] };
}
/** Renumber only one LIST input and retain its authored routes as identities change. */
function reindexPort(
  workspace: Workspace,
  step: string,
  port: string,
  preferred?: { id: string; ordinal: number },
): void {
  const bindings = workspace.graph['bindings'] as JsonObject[];
  const ordered = bindings
    .map((binding, index) => ({ binding, index }))
    .filter(
      ({ binding }) =>
        binding['step'] === step && binding['target_port'] === port,
    )
    .sort(
      (a, b) =>
        Number(a.binding['ordinal'] ?? 0) - Number(b.binding['ordinal'] ?? 0),
    );
  if (preferred) {
    const index = ordered.findIndex(
      ({ binding }) => connectionKey('binding', binding) === preferred.id,
    );
    if (index >= 0) {
      const [item] = ordered.splice(index, 1);
      ordered.splice(Math.min(preferred.ordinal, ordered.length), 0, item);
    }
  }
  const routes = ordered.map(
    ({ binding }) => workspace.routing[connectionKey('binding', binding)],
  );
  for (const { binding } of ordered) {
    delete workspace.routing[connectionKey('binding', binding)];
  }
  ordered.forEach(({ binding, index }, ordinal) => {
    const replacement = { ...binding, ordinal };
    bindings[index] = replacement;
    if (routes[ordinal]) {
      workspace.routing[connectionKey('binding', replacement)] =
        routes[ordinal];
    }
  });
}
export function removeConnection(
  workspace: Workspace,
  id: string,
  nodes: readonly CanvasNode[] = [],
): Workspace {
  if (!canvasEdges(workspace.graph).some((edge) => edge.id === id)) {
    throw Error('Connection no longer exists');
  }
  const result = structuredClone(workspace);
  const graph = result.graph as Record<string, JsonValue>;
  graph['transitions'] = ((graph['transitions'] ?? []) as JsonObject[]).filter(
    (edge) => connectionKey('transition', edge) !== id,
  );
  graph['bindings'] = ((graph['bindings'] ?? []) as JsonObject[]).filter(
    (edge) => connectionKey('binding', edge) !== id,
  );
  delete result.routing[id];
  const removed = (
    workspace.graph['bindings'] as JsonObject[] | undefined
  )?.find((binding) => connectionKey('binding', binding) === id);
  if (
    removed &&
    nodes
      .find((node) => node.key === removed['step'])
      ?.ports.some(
        (port) =>
          port.direction === 'INPUT' &&
          port.key === removed['target_port'] &&
          port.cardinality === 'LIST',
      )
  ) {
    reindexPort(
      result,
      String(removed['step']),
      String(removed['target_port']),
    );
  }
  return result;
}
export function reconnect(
  workspace: Workspace,
  id: string,
  source: string,
  target: string,
  nodes: readonly CanvasNode[],
): Workspace {
  const edge = canvasEdges(workspace.graph).find((item) => item.id === id);
  if (!edge) {
    throw Error('Connection no longer exists');
  }
  const remaining = removeConnection(workspace, id, nodes);
  if (
    !source.startsWith(edge.kind + ':') ||
    !target.startsWith(edge.kind + ':') ||
    canvasEdges(remaining.graph).some(
      (item) =>
        item.kind === edge.kind &&
        item.source === source &&
        item.target === target &&
        item.label === edge.label,
    )
  ) {
    throw Error('Use a distinct connection of the same kind');
  }
  const next = connectWorkspace(
    remaining,
    source,
    target,
    edge.label ?? 'next',
    nodes,
  );
  const key = edge.kind === 'control' ? 'transitions' : 'bindings';
  const kind = edge.kind === 'control' ? 'transition' : 'binding';
  const original = (workspace.graph[key] as JsonObject[]).find(
    (item) => connectionKey(kind, item) === id,
  )!;
  const items = next.graph[key] as JsonObject[];
  const generated = items.at(-1)!;
  // Preserve condition, priority, default flag and configuration not owned by reconnection.
  items[items.length - 1] = {
    ...original,
    ...generated,
    ...(edge.kind === 'control'
      ? {
          priority: original['priority'] ?? 0,
          is_default: original['is_default'] ?? true,
        }
      : {}),
  };
  if (
    edge.kind === 'data' &&
    original['step'] === generated['step'] &&
    original['target_port'] === generated['target_port'] &&
    nodes
      .find((node) => node.key === generated['step'])
      ?.ports.some(
        (port) =>
          port.direction === 'INPUT' &&
          port.key === generated['target_port'] &&
          port.cardinality === 'LIST',
      )
  ) {
    reindexPort(
      next,
      String(generated['step']),
      String(generated['target_port']),
      {
        id: connectionKey('binding', items.at(-1)!),
        ordinal: Number(original['ordinal'] ?? 0),
      },
    );
  }
  const route = workspace.routing[id];
  if (route) {
    const identity = connectionKey(kind, items[items.length - 1]);
    next.routing[identity] = route.map((point) => ({ ...point }));
  }
  return next;
}
export function moveSelection(
  workspace: Workspace,
  keys: readonly string[],
  delta: Point,
): Workspace {
  if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
    throw Error('Invalid workspace position');
  }
  const result = structuredClone(workspace);
  const allowed = new Set(
    graphSteps(workspace.graph).map((step) => step['key']),
  );
  for (const key of new Set(keys)) {
    if (!allowed.has(key)) {
      throw Error('Selected step no longer exists');
    }
    const old = result.positions[key] ?? { x: 40, y: 40 };
    const point = { x: old.x + delta.x, y: old.y + delta.y };
    if (Math.abs(point.x) > 1000000 || Math.abs(point.y) > 1000000) {
      throw Error('Invalid workspace position');
    }
    result.positions[key] = point;
  }
  return result;
}

/** Removing steps removes only their attached edges; it never joins neighbours. */
export function removeSteps(
  workspace: Workspace,
  keys: readonly string[],
  nodes: readonly CanvasNode[] = [],
): Workspace {
  const selection = new Set(keys);
  if (
    !selection.size ||
    keys.some(
      (key) => !graphSteps(workspace.graph).some((step) => step['key'] === key),
    )
  ) {
    throw Error('Selected step no longer exists');
  }
  const result = structuredClone(workspace);
  const graph = result.graph as Record<string, JsonValue>;
  graph['steps'] = graphSteps(graph).filter(
    (step) => !selection.has(String(step['key'])),
  );
  graph['transitions'] = ((graph['transitions'] ?? []) as JsonObject[]).filter(
    (edge) =>
      !selection.has(String(edge['source'])) &&
      !selection.has(String(edge['target'])),
  );
  graph['bindings'] = ((graph['bindings'] ?? []) as JsonObject[]).filter(
    (edge) =>
      !selection.has(String(edge['step'])) &&
      !selection.has(String(edge['source_step'])),
  );
  const affected = new Set<string>();
  for (const binding of (workspace.graph['bindings'] ?? []) as JsonObject[]) {
    if (
      selection.has(String(binding['source_step'])) &&
      !selection.has(String(binding['step'])) &&
      nodes
        .find((node) => node.key === binding['step'])
        ?.ports.some(
          (port) =>
            port.direction === 'INPUT' &&
            port.key === binding['target_port'] &&
            port.cardinality === 'LIST',
        )
    ) {
      const identity = JSON.stringify([
        binding['step'],
        binding['target_port'],
      ]);
      if (!affected.has(identity)) {
        affected.add(identity);
        reindexPort(
          result,
          String(binding['step']),
          String(binding['target_port']),
        );
      }
    }
  }
  graph['targets'] = ((graph['targets'] ?? []) as JsonObject[]).filter(
    (target) => !selection.has(String(target['step'])),
  );
  for (const key of selection) {
    delete result.positions[key];
  }
  result.collapsed = result.collapsed.filter((key) => !selection.has(key));
  const remaining = new Set(canvasEdges(graph).map((edge) => edge.id));
  result.routing = Object.fromEntries(
    Object.entries(result.routing).filter(([id]) => remaining.has(id)),
  );
  return result;
}
export function alignSteps(
  workspace: Workspace,
  nodes: readonly CanvasNode[],
  keys: readonly string[],
  axis: 'x' | 'y',
): Workspace {
  const selected = nodes.filter((node) => keys.includes(node.key));
  if (selected.length < 2) {
    return workspace;
  }
  const coordinate = Math.min(...selected.map((node) => node.position[axis]));
  return {
    ...workspace,
    positions: {
      ...workspace.positions,
      ...Object.fromEntries(
        selected.map((node) => [
          node.key,
          { ...node.position, [axis]: coordinate },
        ]),
      ),
    },
  };
}
