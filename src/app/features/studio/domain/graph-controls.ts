import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { schemaErrors } from '../../administration/domain/schema-form';
import { CanvasNode, connectionKey, graphSteps } from './workflow-authoring';
export type MappingSource = {
  key: string;
  label: string;
  schema: JsonObject;
  binding: JsonObject;
};
function predecessors(graph: JsonObject, target: string): Set<string> {
  const steps = graphSteps(graph);
  const edges = (graph['transitions'] ?? []) as JsonObject[];
  const roots = steps
    .filter(
      (step) =>
        step['type_code'] === 'START' ||
        !edges.some((edge) => edge['target'] === step['key']),
    )
    .map((step) => String(step['key']));
  const reachable = new Set(roots);
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of edges) {
      if (
        reachable.has(String(edge['source'])) &&
        !reachable.has(String(edge['target']))
      ) {
        reachable.add(String(edge['target']));
        changed = true;
      }
    }
  }
  const dom = new Map(
    [...reachable].map((key) => [
      key,
      new Set(roots.includes(key) ? [key] : reachable),
    ]),
  );
  changed = true;
  while (changed) {
    changed = false;
    for (const key of reachable) {
      if (roots.includes(key)) {
        continue;
      }
      const prior = edges
        .filter(
          (edge) =>
            edge['target'] === key && reachable.has(String(edge['source'])),
        )
        .map((edge) => dom.get(String(edge['source']))!);
      const next = new Set([
        key,
        ...[...reachable].filter((candidate) =>
          prior.every((set) => set.has(candidate)),
        ),
      ]);
      const old = dom.get(key)!;
      if (next.size !== old.size || [...next].some((item) => !old.has(item))) {
        dom.set(key, next);
        changed = true;
      }
    }
  }
  const found = new Set(dom.get(target) ?? []);
  found.delete(target);
  return found;
}
/** Only server-authorized completion rows, intersected with the current draft's predecessors. */
export function mappingSources(
  rows: readonly JsonObject[],
  graph: JsonObject,
  target: string,
): MappingSource[] {
  const prior = predecessors(graph, target);
  return rows.flatMap((row) => {
    const path = row['path'];
    const schema = row['type_schema'];
    if (
      typeof path !== 'string' ||
      path.length > 512 ||
      row['cardinality'] !== 'SCALAR' ||
      !schema ||
      typeof schema !== 'object' ||
      Array.isArray(schema)
    ) {
      return [];
    }
    let binding: JsonObject;
    if (row['source'] === 'step_output') {
      const match =
        /^steps\.([A-Za-z][A-Za-z0-9_.-]*)\.outputs\.([A-Za-z][A-Za-z0-9_-]*)$/.exec(
          path,
        );
      if (!match || !prior.has(match[1]) || row['source_step'] !== match[1]) {
        return [];
      }
      binding = {
        source_kind: 'STEP_OUTPUT',
        source_step: match[1],
        source_port: match[2],
      };
    } else if (row['source'] === 'request' && path.startsWith('request.')) {
      binding = {
        source_kind: 'REQUEST',
        source_path: '/' + path.slice(8).split('.').join('/'),
      };
    } else if (row['source'] === 'process' && path === 'process.status') {
      binding = { source_kind: 'CONTEXT', source_path: '/process/status' };
    } else {
      return [];
    }
    return [{ key: path, label: path, schema: schema as JsonObject, binding }];
  });
}
export function addMapping(
  graph: JsonObject,
  step: string,
  port: string,
  nodes: readonly CanvasNode[],
  source: MappingSource | null,
  constant: JsonValue | undefined,
): JsonObject {
  const target = nodes
    .find((node) => node.key === step)
    ?.ports.find(
      (item) =>
        item.direction === 'INPUT' &&
        item.cardinality === 'SCALAR' &&
        item.key === port,
    );
  if (
    !target ||
    !['string', 'number', 'integer', 'boolean'].includes(
      String(target.schema['type']),
    )
  ) {
    throw Error('Unsupported mapping target');
  }
  const bindings = (graph['bindings'] ?? []) as JsonObject[];
  if (
    bindings.some(
      (item) => item['step'] === step && item['target_port'] === port,
    )
  ) {
    throw Error('Remove the existing mapping before replacing it.');
  }
  if (source?.binding['source_kind'] === 'STEP_OUTPUT') {
    const output = nodes
      .find((node) => node.key === source.binding['source_step'])
      ?.ports.find(
        (item) =>
          item.direction === 'OUTPUT' &&
          item.key === source.binding['source_port'],
      );
    if (!output || output.schema['type'] !== source.schema['type']) {
      throw Error('Source port changed. Reload suggestions.');
    }
  }
  if (source && source.schema['type'] !== target.schema['type']) {
    throw Error('Port types do not match');
  }
  if (
    !source &&
    Object.keys(schemaErrors(target.schema, constant, 'value', true)).length
  ) {
    throw Error('Invalid value');
  }
  const binding: JsonObject = {
    step,
    target_port: port,
    target_schema: target.schema,
    ordinal: 0,
    ...(source
      ? { ...source.binding, source_schema: sourceRoot(source) }
      : { source_kind: 'CONSTANT', constant_value: constant! }),
  };
  return { ...graph, bindings: [...bindings, binding] };
}
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
    Math.abs(priority) > 2147483647 ||
    typeof patch['is_default'] !== 'boolean' ||
    (condition !== null &&
      (typeof condition !== 'string' || condition.length > 4096))
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

function sourceRoot(source: MappingSource): JsonObject {
  const path = source.binding['source_path'];
  if (typeof path !== 'string') {
    return source.schema;
  }
  return path
    .slice(1)
    .split('/')
    .reverse()
    .reduce<JsonObject>(
      (schema, key) => ({ type: 'object', properties: { [key]: schema } }),
      source.schema,
    );
}
export function removeMapping(graph: JsonObject, id: string): JsonObject {
  const bindings = (graph['bindings'] ?? []) as JsonObject[];
  const index = bindings.findIndex(
    (binding) => connectionKey('data', binding) === id,
  );
  if (index < 0) {
    throw Error('Invalid connection');
  }
  return {
    ...graph,
    bindings: bindings.filter((_, position) => position !== index),
  };
}
