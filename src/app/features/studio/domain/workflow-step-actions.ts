import { JsonObject } from '../../forms/domain/runtime-document';
import { Point, Workspace } from './authoring';
import { connectionKey, graphSteps } from './workflow-authoring';

export type StepAction = {
  mode: 'next' | 'insert';
  source: string;
  edge: string;
  title: string;
  target: string;
  targetKey: string;
};
export function nextStepKey(graph: JsonObject, code: string): string {
  const base = code.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 48) || 'step';
  const used = new Set(graphSteps(graph).map((step) => step['key']));
  let index = 1;
  while (used.has('step_' + base + '_' + index)) {
    index++;
  }
  return 'step_' + base + '_' + index;
}
export function appendRegisteredStep(
  workspace: Workspace,
  entry: JsonObject,
  key: string,
  point?: Point,
): Workspace {
  const metadata = entry['metadata'] as JsonObject | undefined;
  if (
    entry['category'] !== 'step_type' ||
    typeof metadata?.['code'] !== 'string' ||
    !metadata['code'] ||
    typeof metadata['ref_id'] !== 'string' ||
    !metadata['ref_id']
  ) {
    throw Error('Select a registered step type');
  }
  const steps = graphSteps(workspace.graph);
  if (steps.length >= 256) {
    throw Error('Workspace step limit reached.');
  }
  const graph = {
    ...workspace.graph,
    steps: [
      ...steps,
      {
        key,
        type_code: metadata['code'],
        type_version_ref: metadata['ref_id'],
        config: {},
      },
    ],
  };
  graphSteps(graph);
  return {
    ...workspace,
    graph,
    positions: {
      ...workspace.positions,
      [key]: point ?? {
        x: 40 + (steps.length % 4) * 280,
        y: 40 + Math.floor(steps.length / 4) * 240,
      },
    },
  };
}
/** A single local workspace edit; server validation/publication stay separate. */
export function placeControlStep(
  workspace: Workspace,
  action: StepAction,
  entry: JsonObject,
  outcome: string,
  point: Point,
): { workspace: Workspace; key: string } {
  const transitions = (workspace.graph['transitions'] ??
    []) as readonly JsonObject[];
  const step = graphSteps(workspace.graph).find(
    (item) => item['key'] === action.source,
  );
  const metadata = entry['metadata'] as JsonObject | undefined;
  if (!step || !outcome.trim() || outcome.trim().length > 64) {
    throw Error('An outcome is required');
  }
  if (
    (action.mode === 'insert' ? ['start', 'finish'] : ['start']).includes(
      String(metadata?.['handler_key']),
    )
  ) {
    throw Error('Choose a step that can continue the workflow.');
  }
  if (
    action.mode === 'next' &&
    transitions.some(
      (edge) =>
        edge['source'] === action.source && edge['outcome'] === outcome.trim(),
    )
  ) {
    throw Error(
      'That outcome already has a connection. Insert a step on its connection instead.',
    );
  }
  const index = transitions.findIndex(
    (edge) => connectionKey('transition', edge) === action.edge,
  );
  if (action.mode === 'insert' && index < 0) {
    throw Error('Connection no longer exists');
  }
  const key = nextStepKey(
    workspace.graph,
    String(metadata?.['code'] ?? 'step'),
  );
  const next = appendRegisteredStep(workspace, entry, key, point);
  const edges = [...transitions];
  const routing = { ...workspace.routing };
  if (action.mode === 'insert') {
    const previous = transitions[index];
    edges[index] = { ...previous, target: key };
    edges.push({
      source: key,
      target: previous['target'],
      outcome: outcome.trim(),
      priority: 0,
      is_default: true,
    });
    delete routing[action.edge];
  } else {
    edges.push({
      source: action.source,
      target: key,
      outcome: outcome.trim(),
      priority: 0,
      is_default: true,
    });
  }
  return {
    key,
    workspace: {
      ...next,
      graph: { ...next.graph, transitions: edges },
      routing,
    },
  };
}
