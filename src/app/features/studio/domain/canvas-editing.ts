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
  const maximumOrdinal = Math.max(
    -1,
    ...bindings.map((binding) => Number(binding['ordinal'] ?? 0)),
  );
  let ordinal = maximumOrdinal + 1;
  graph['bindings'] = [
    ...bindings,
    ...bindings
      .filter(
        (binding) =>
          mapping.has(String(binding['step'])) &&
          (binding['source_kind'] !== 'STEP_OUTPUT' ||
            mapping.has(String(binding['source_step']))),
      )
      .map((binding) => ({
        ...binding,
        step: mapping.get(String(binding['step']))!,
        ...(binding['source_kind'] === 'STEP_OUTPUT'
          ? { source_step: mapping.get(String(binding['source_step']))! }
          : {}),
        ordinal: ordinal++,
      })),
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
export function removeConnection(workspace: Workspace, id: string): Workspace {
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
  const remaining = removeConnection(workspace, id);
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
      : { ordinal: original['ordinal'] ?? generated['ordinal'] }),
  };
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
