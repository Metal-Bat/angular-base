import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { interfaceDocument } from './interface-document';
import {
  escapePointer,
  MappingSource,
  mappingSources,
} from './mapping-sources';
const maps = [
  '$defs',
  'definitions',
  'properties',
  'patternProperties',
  'dependentSchemas',
];
const arrays = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
const singles = [
  'items',
  'contains',
  'additionalProperties',
  'unevaluatedProperties',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'additionalItems',
  'unevaluatedItems',
  'contentSchema',
];
/** Rebase schema references only: literal defaults/examples and document keys stay unchanged. */
function rebase(schema: JsonValue, prefix: string): JsonValue {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return schema;
  }
  const node = schema as JsonObject;
  const scope =
    typeof node['$id'] === 'string' && node['$id'].length > 0 ? '' : prefix;
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => {
      if (
        ['$ref', '$dynamicRef', '$recursiveRef'].includes(key) &&
        typeof value === 'string' &&
        scope &&
        (value === '#' || value.startsWith('#/'))
      ) {
        return [key, '#' + scope + value.slice(1)];
      }
      if (
        maps.includes(key) &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return [
          key,
          Object.fromEntries(
            Object.entries(value).map(([name, child]) => [
              name,
              rebase(child, scope),
            ]),
          ),
        ];
      }
      if (arrays.includes(key) && Array.isArray(value)) {
        return [key, value.map((child) => rebase(child, scope))];
      }
      if (singles.includes(key)) {
        return [key, rebase(value, scope)];
      }
      return [key, value];
    }),
  );
}
/** REQUEST in a child executes against its declared isolated input context, not the parent's form. */
export function interfaceMappingSources(
  graph: JsonObject,
  selected: string,
): MappingSource[] {
  const contract = graph['interface'];
  if (!interfaceDocument(contract)) {
    return [];
  }
  const roots = new Map<string, JsonObject>();
  const ports = (contract['inputs'] ?? []) as JsonObject[];
  const rows = ports
    .filter(
      (port) =>
        /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(String(port['name'])) &&
        ports.filter((other) => other['name'] === port['name']).length === 1,
    )
    .map((port) => {
      const name = String(port['name']);
      roots.set(name, {
        type: 'object',
        properties: {
          [name]: rebase(
            port['value_schema'],
            '/properties/' + escapePointer(name),
          ),
        },
        ...(port['required'] !== false ? { required: [name] } : {}),
      });
      return {
        source: 'request',
        path: 'request.' + name,
        type_schema: port['value_schema'],
        cardinality: 'SCALAR',
      };
    });
  return mappingSources(rows, graph, selected).map((source) => ({
    ...source,
    rootSchema: roots.get(String(source.binding['source_path']).split('/')[1])!,
  }));
}
export function workflowMappingSources(
  rows: readonly JsonObject[],
  graph: JsonObject,
  selected: string,
  nodes: Parameters<typeof mappingSources>[3],
  nestedOutputs = false,
): MappingSource[] {
  if (graph['interface'] === undefined || graph['interface'] === null) {
    return mappingSources(rows, graph, selected, nodes, nestedOutputs);
  }
  // Once an interface is declared, request values mean its isolated context. Other authorized namespaces remain available.
  return [
    ...interfaceMappingSources(graph, selected),
    ...mappingSources(
      rows.filter((row) => row['source'] !== 'request'),
      graph,
      selected,
      nodes,
      nestedOutputs,
    ),
  ];
}
/** Root interface names are expression identifiers; nested arbitrary document keys keep their pointer controls. */
export function interfaceExpressionCompletions(
  rows: readonly JsonObject[],
  graph: JsonObject,
  selected: string,
): readonly JsonObject[] {
  if (graph['interface'] === undefined || graph['interface'] === null) {
    return rows;
  }
  return [
    ...interfaceMappingSources(graph, selected)
      .filter((source) => /^\/[A-Za-z][A-Za-z0-9_]*$/.test(source.key))
      .map((source) => ({
        source: 'request',
        path: source.label,
        type_schema: source.schema,
        cardinality: 'SCALAR',
      })),
    ...rows.filter((row) => row['source'] !== 'request'),
  ];
}
