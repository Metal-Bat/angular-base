import { JsonObject } from '../../forms/domain/runtime-document';
import { CanvasNode, graphSteps } from './workflow-authoring';
export type MappingSource = {
  key: string;
  label: string;
  schema: JsonObject;
  binding: JsonObject;
  rootSchema?: JsonObject;
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
  nodes?: readonly CanvasNode[],
  nestedOutputs = false,
): MappingSource[] {
  const prior = predecessors(graph, target);
  const found = rows.flatMap((row) => {
    const shape = completionShape(row);
    if (!shape) {
      return [];
    }
    const path = shape.path;
    let schema = shape.schema;
    let binding: JsonObject;
    if (row['source'] === 'step_output') {
      const match =
        /^steps\.([A-Za-z][A-Za-z0-9_.-]*)\.outputs\.([A-Za-z][A-Za-z0-9_-]*)$/.exec(
          path,
        );
      if (!match || !prior.has(match[1]) || row['source_step'] !== match[1]) {
        return [];
      }
      const output = nodes
        ?.find((node) => node.key === match[1])
        ?.ports.find(
          (port) => port.direction === 'OUTPUT' && port.key === match[2],
        );
      schema = output?.schema ?? schema;
      binding = {
        source_kind: 'STEP_OUTPUT',
        source_step: match[1],
        source_port: match[2],
      };
    } else if (row['source'] === 'request' && path.startsWith('request.')) {
      if (coveredRequestPath(rows, path)) {
        return [];
      }
      binding = {
        source_kind: 'REQUEST',
        source_path:
          '/' + path.slice(8).split('.').map(escapePointer).join('/'),
      };
    } else if (row['source'] === 'process' && path === 'process.status') {
      binding = { source_kind: 'CONTEXT', source_path: '/process/status' };
    } else {
      return [];
    }
    return expandSource(
      {
        key:
          binding['source_kind'] === 'REQUEST'
            ? String(binding['source_path'])
            : path,
        label: path,
        schema: schema as JsonObject,
        binding,
      },
      nestedOutputs,
    );
  });
  return [...new Map(found.map((source) => [source.key, source])).values()];
}
export function escapePointer(value: string): string {
  return value.replaceAll('~', '~0').replaceAll('/', '~1');
}
function expandSource(
  source: MappingSource,
  nestedOutputs: boolean,
  depth = 0,
): MappingSource[] {
  if (
    (source.binding['source_kind'] !== 'REQUEST' &&
      !(nestedOutputs && source.binding['source_kind'] === 'STEP_OUTPUT')) ||
    depth > 12
  ) {
    return [source];
  }
  const fields = (source.schema['properties'] ?? {}) as JsonObject;
  return [
    source,
    ...Object.entries(fields).flatMap(([key, schema]) => {
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return [];
      }
      const pointer =
        String(source.binding['source_path'] ?? '') + '/' + escapePointer(key);
      return expandSource(
        {
          key:
            source.binding['source_kind'] === 'REQUEST'
              ? pointer
              : source.key + '/' + escapePointer(key),
          label:
            source.label +
            ' › ' +
            String((schema as JsonObject)['title'] ?? key),
          schema: schema as JsonObject,
          ...(source.binding['source_kind'] === 'STEP_OUTPUT'
            ? { rootSchema: source.rootSchema ?? source.schema }
            : {}),
          binding: {
            ...source.binding,
            source_path: pointer,
          },
        },
        nestedOutputs,
        depth + 1,
      );
    }),
  ];
}

function coveredRequestPath(
  rows: readonly JsonObject[],
  path: string,
): boolean {
  return rows.some(
    (row) =>
      row['source'] === 'request' &&
      typeof row['path'] === 'string' &&
      path.startsWith(row['path'] + '.') &&
      !!(row['type_schema'] as JsonObject | undefined)?.['properties'],
  );
}

function completionShape(
  row: JsonObject,
): { path: string; schema: JsonObject } | null {
  const path = row['path'];
  const schema = row['type_schema'];
  if (
    typeof path !== 'string' ||
    path.length > 512 ||
    !['SCALAR', 'LIST'].includes(String(row['cardinality'])) ||
    !schema ||
    typeof schema !== 'object' ||
    Array.isArray(schema)
  ) {
    return null;
  }
  return { path, schema: schema as JsonObject };
}
