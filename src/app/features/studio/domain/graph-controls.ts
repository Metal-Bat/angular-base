import { JsonObject } from '../../forms/domain/runtime-document';
import { graphSteps } from './workflow-authoring';
export { mappingSources } from './mapping-sources';
export type { MappingSource } from './mapping-sources';
export { addMapping, removeMapping } from './data-mappings';
export function patchTransition(
  graph: JsonObject,
  index: number,
  patch: JsonObject,
): JsonObject {
  const transitions = [...((graph['transitions'] ?? []) as JsonObject[])];
  const edge = transitions[index];
  if (!edge) {
    throw Error('Invalid connection');
  }
  const priority = patch['priority'];
  const condition = patch['condition'];
  if (
    typeof priority !== 'number' ||
    !Number.isInteger(priority) ||
    priority < 0 ||
    priority > 2147483647 ||
    typeof patch['is_default'] !== 'boolean' ||
    (condition !== null &&
      (typeof condition !== 'string' || condition.length > 1024))
  ) {
    throw Error('Invalid connection');
  }
  const replacement = {
    ...edge,
    priority,
    is_default: patch['is_default'],
    condition,
  };
  if (replacement.is_default && condition !== null) {
    throw Error('A default transition must be unconditional.');
  }
  const siblings = transitions.filter(
    (item, position) =>
      position !== index &&
      item['source'] === edge['source'] &&
      item['outcome'] === edge['outcome'],
  );
  if (
    siblings.some(
      (item) =>
        item['priority'] === priority ||
        (replacement.is_default && item['is_default'] === true),
    )
  ) {
    throw Error('Transition priority or default conflicts.');
  }
  transitions[index] = replacement;
  return { ...graph, transitions };
}
export function addCandidate(
  graph: JsonObject,
  step: string,
  kind: 'user_ref' | 'work_group_ref',
  reference: string,
): JsonObject {
  if (
    !reference ||
    reference.length > 512 ||
    !graphSteps(graph).some((item) => item['key'] === step)
  ) {
    throw Error('Invalid value');
  }
  const targets = (graph['targets'] ?? []) as JsonObject[];
  if (
    targets.some((item) => item['step'] === step && item[kind] === reference)
  ) {
    return graph;
  }
  return {
    ...graph,
    targets: [...targets, { step, [kind]: reference, priority: 0 }],
  };
}

export function candidateKey(target: JsonObject): string {
  return JSON.stringify(
    ['step', 'user_ref', 'work_group_ref', 'priority', 'condition'].map(
      (key) => target[key] ?? null,
    ),
  );
}
export function removeCandidate(
  graph: JsonObject,
  step: string,
  id: string,
): JsonObject {
  const targets = (graph['targets'] ?? []) as JsonObject[];
  const index = targets.findIndex(
    (item) => item['step'] === step && candidateKey(item) === id,
  );
  if (index < 0) {
    throw Error('The selected resource is unavailable. Choose again.');
  }
  return {
    ...graph,
    targets: targets.filter((_, position) => position !== index),
  };
}
