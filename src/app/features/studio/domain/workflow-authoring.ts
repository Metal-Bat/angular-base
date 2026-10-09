import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { Point, Workspace } from './authoring';
export type CanvasPort = {
  key: string;
  direction: string;
  schema: JsonObject;
  cardinality?: string;
};
export type CanvasNode = {
  key: string;
  title: string;
  position: Point;
  ports: readonly CanvasPort[];
};
export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  kind: 'control' | 'data';
  label?: string;
};
export function graphSteps(graph: JsonObject): readonly JsonObject[] {
  if (!Array.isArray(graph['steps']) || graph['steps'].length > 256) {
    throw Error('Invalid bounded steps');
  }
  const steps = graph['steps'] as readonly JsonObject[];
  if (
    steps.some(
      (step) =>
        typeof step['key'] !== 'string' ||
        !/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(step['key']),
    ) ||
    new Set(steps.map((step) => step['key'])).size !== steps.length
  ) {
    throw Error('Step keys must be unique and stable');
  }
  return steps;
}
export function canvasEdges(
  graph: JsonObject,
  nodes?: readonly CanvasNode[],
): CanvasEdge[] {
  const transitions = (
    Array.isArray(graph['transitions']) ? graph['transitions'] : []
  ) as JsonObject[];
  const bindings = (
    Array.isArray(graph['bindings']) ? graph['bindings'] : []
  ) as JsonObject[];
  const result = [
    ...transitions
      .filter((edge) => !!edge && typeof edge === 'object')
      .map((edge) => ({
        id: connectionKey('transition', edge),
        source: 'control:' + edge['source'] + ':out',
        target: 'control:' + edge['target'] + ':in',
        kind: 'control' as const,
        label: String(edge['outcome'] ?? ''),
      })),
    ...bindings
      .filter(
        (edge) =>
          !!edge &&
          typeof edge === 'object' &&
          edge['source_kind'] === 'STEP_OUTPUT',
      )
      .map((edge) => ({
        id: connectionKey('binding', edge),
        source: 'data:' + edge['source_step'] + ':out:' + edge['source_port'],
        target: 'data:' + edge['step'] + ':in:' + edge['target_port'],
        kind: 'data' as const,
      })),
  ];
  if (!nodes) {
    return result;
  }
  const ports = new Set(
    nodes.flatMap((node) => [
      'control:' + node.key + ':in',
      'control:' + node.key + ':out',
      ...node.ports.map(
        (port) =>
          'data:' +
          node.key +
          ':' +
          (port.direction === 'INPUT' ? 'in' : 'out') +
          ':' +
          port.key,
      ),
    ]),
  );
  return result.filter(
    (edge) => ports.has(edge.source) && ports.has(edge.target),
  );
}
export function connectWorkspace(
  workspace: Workspace,
  source: string,
  target: string,
  outcome: string,
  nodes: readonly CanvasNode[],
): Workspace {
  const result = structuredClone(workspace);
  const graph = result.graph as Record<string, JsonValue>;
  const [kind, from, sourceRole, output] = source.split(':');
  const [targetKind, to, targetRole, input] = target.split(':');
  if (
    sourceRole !== 'out' ||
    targetRole !== 'in' ||
    kind !== targetKind ||
    !nodes.some((node) => node.key === from) ||
    !nodes.some((node) => node.key === to)
  ) {
    throw Error('Connect matching control or data ports');
  }
  if (kind === 'control') {
    if (!outcome.trim()) {
      throw Error('An outcome is required');
    }
    const edges = [...((graph['transitions'] as JsonObject[]) ?? [])];
    if (
      edges.some(
        (edge) =>
          edge['source'] === from &&
          edge['target'] === to &&
          edge['outcome'] === outcome,
      )
    ) {
      return workspace;
    }
    edges.push({
      source: from,
      target: to,
      outcome,
      is_default: true,
      priority: 0,
    });
    graph['transitions'] = edges;
  } else if (kind === 'data') {
    const sourcePort = nodes
      .find((node) => node.key === from)
      ?.ports.find(
        (port) => port.key === output && port.direction === 'OUTPUT',
      );
    const targetPort = nodes
      .find((node) => node.key === to)
      ?.ports.find((port) => port.key === input && port.direction === 'INPUT');
    if (!sourcePort || !targetPort) {
      throw Error('Use an output and an input port');
    }
    if (
      sourcePort.schema['type'] &&
      targetPort.schema['type'] &&
      sourcePort.schema['type'] !== targetPort.schema['type']
    ) {
      throw Error('Port types do not match');
    }
    const bindings = [...((graph['bindings'] as JsonObject[]) ?? [])];
    bindings.push({
      step: to,
      target_port: input,
      target_schema: targetPort.schema,
      source_kind: 'STEP_OUTPUT',
      source_step: from,
      source_port: output,
      source_schema: sourcePort.schema,
      ordinal: bindings.length,
    });
    graph['bindings'] = bindings;
  } else {
    throw Error('Unknown port kind');
  }
  return result;
}
export class WorkspaceHistory {
  private undoStates: Workspace[] = [];
  private redoStates: Workspace[] = [];
  record(value: Workspace): void {
    this.undoStates.push(structuredClone(value));
    if (this.undoStates.length > 20) {
      this.undoStates.shift();
    }
    this.redoStates = [];
  }
  undo(current: Workspace): Workspace | null {
    const state = this.undoStates.pop();
    if (!state) {
      return null;
    }
    this.redoStates.push(structuredClone(current));
    return state;
  }
  redo(current: Workspace): Workspace | null {
    const state = this.redoStates.pop();
    if (!state) {
      return null;
    }
    this.undoStates.push(structuredClone(current));
    return state;
  }
  clear(): void {
    this.undoStates = [];
    this.redoStates = [];
  }
}

export function connectionKey(kind: string, edge: JsonObject): string {
  const identity = JSON.stringify(
    Object.entries(edge).sort(([left], [right]) => left.localeCompare(right)),
  );
  let first = 2166136261;
  let second = 5381;
  for (const character of identity) {
    first = (first * 31 + character.charCodeAt(0)) % 4294967291;
    second = (second * 33 + character.charCodeAt(0)) % 4294967279;
  }
  return kind + '-' + first.toString(16) + '-' + second.toString(16);
}
