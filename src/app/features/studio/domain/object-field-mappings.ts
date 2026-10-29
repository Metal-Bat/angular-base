import { JsonObject, JsonValue } from '../../../shared/domain/json-value';
import { CanvasNode, CanvasPort } from './workflow-authoring';
import { escapePointer, MappingSource } from './mapping-sources';
import { addMapping } from './data-mappings';
import { mappingFields, schemaAt } from './mapping-fields';

export const OBJECT_DIALECT = 'bpms.binding.object/1';
export function objectPort(port: CanvasPort): boolean {
  const type = port.schema['type'];
  return (
    port.cardinality !== 'LIST' &&
    (type === 'object' ||
      (Array.isArray(type) && type.includes('object')) ||
      !Object.keys(port.schema).length ||
      JSON.stringify(port.schema) === JSON.stringify({ not: { type: 'null' } }))
  );
}
export function objectBindings(
  graph: JsonObject,
  step: string,
  port: string,
): JsonObject[] {
  return ((graph['bindings'] ?? []) as JsonObject[]).filter(
    (row) => row['step'] === step && row['target_port'] === port,
  );
}
export function objectDeclaration(
  graph: JsonObject,
  step: string,
  port: CanvasPort,
): JsonObject {
  return (
    (objectBindings(graph, step, port.key)[0]?.['target_schema'] as
      JsonObject | undefined) ?? port.schema
  );
}
export function objectDestination(row: JsonObject): string {
  return String(
    (row['target_projection'] as JsonObject | undefined)?.['path'] ?? '',
  );
}
/** Source checks stay on the existing mapping path; only the explicit destination is new. */
export function addObjectField(
  graph: JsonObject,
  step: string,
  port: CanvasPort,
  nodes: readonly CanvasNode[],
  source: MappingSource | null,
  constant: JsonValue | undefined,
  destination: string,
  name: string,
  valueSchema: JsonObject,
): JsonObject {
  if (!objectPort(port)) {
    throw Error('Choose an object input port.');
  }
  const siblings = objectBindings(graph, step, port.key);
  if (
    siblings.length >= 64 ||
    siblings.some((row) => !row['target_projection'])
  ) {
    throw Error('Object fields cannot be mixed with a whole input mapping.');
  }
  let root = objectDeclaration(graph, step, port);
  let path = destination;
  if (!path) {
    if (
      Object.keys((port.schema['properties'] ?? {}) as JsonObject).length > 0 ||
      !name.trim() ||
      name !== name.trim() ||
      ['__proto__', 'prototype', 'constructor'].includes(name) ||
      new TextEncoder().encode(name).length > 120
    ) {
      throw Error('Choose a valid object field name.');
    }
    path = '/' + escapePointer(name);
    const properties = (root['properties'] ?? {}) as JsonObject;
    if (Object.hasOwn(properties, name)) {
      throw Error('This object field is already declared.');
    }
    root = {
      type: 'object',
      properties: { ...properties, [name]: valueSchema },
      required: [...((root['required'] ?? []) as string[]), name],
      additionalProperties: false,
    };
  }
  const leaf = mappingFields(root).find((field) => field.path === path)?.schema;
  if (
    !leaf ||
    siblings.some((row) => {
      const other = objectDestination(row);
      return (
        other === path ||
        other.startsWith(path + '/') ||
        path.startsWith(other + '/')
      );
    })
  ) {
    throw Error('Choose an unused declared object field.');
  }
  const mapped = addMapping(
    { bindings: [] },
    step,
    port.key,
    nodes.map((node) =>
      node.key === step
        ? {
            ...node,
            ports: node.ports.map((item) =>
              item.direction === 'INPUT' && item.key === port.key
                ? { ...item, schema: leaf }
                : item,
            ),
          }
        : node,
    ),
    source,
    constant,
  );
  const binding = (mapped['bindings'] as JsonObject[])[0];
  return {
    ...graph,
    bindings: [
      ...((graph['bindings'] ?? []) as JsonObject[]).map((row) =>
        siblings.includes(row) ? { ...row, target_schema: root } : row,
      ),
      {
        ...binding,
        target_schema: root,
        ordinal: siblings.length,
        target_projection: { dialect: OBJECT_DIALECT, path },
      },
    ],
  };
}
export function mappedTargetSchema(row: JsonObject): JsonObject {
  const root = (row['target_schema'] ?? {}) as JsonObject;
  return objectDestination(row)
    ? (schemaAt(root, objectDestination(row)) ?? {})
    : root;
}
