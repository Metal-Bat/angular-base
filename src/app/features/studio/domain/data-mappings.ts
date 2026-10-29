import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { schemaBranch, schemaErrors } from '../../../shared/domain/schema-form';
import { CanvasNode, connectionKey } from './workflow-authoring';
import { mappingFields, schemaAt } from './mapping-fields';
import { MappingSource } from './mapping-sources';
import { editorSchema, mappingCompatible } from './mapping-schema';
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
    ?.ports.find((item) => item.direction === 'INPUT' && item.key === port);
  if (!target) {
    throw Error('Unsupported mapping target');
  }
  const bindings = (graph['bindings'] ?? []) as JsonObject[];
  if (
    target.cardinality !== 'LIST' &&
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
    if (
      !output ||
      JSON.stringify(output.schema) !== JSON.stringify(sourceRoot(source)) ||
      JSON.stringify(
        typeof source.binding['source_path'] === 'string'
          ? schemaAt(output.schema, source.binding['source_path'])
          : output.schema,
      ) !== JSON.stringify(source.schema)
    ) {
      throw Error('Source port changed. Reload suggestions.');
    }
  }
  if (source && !mappingCompatible(source.schema, target.schema)) {
    throw Error('Port types do not match');
  }
  if (!source && Object.keys(literalErrors(target.schema, constant)).length) {
    throw Error('Invalid value');
  }
  const binding: JsonObject = {
    step,
    target_port: port,
    target_schema: target.schema,
    ordinal:
      target.cardinality === 'LIST'
        ? bindings.filter(
            (item) => item['step'] === step && item['target_port'] === port,
          ).length
        : 0,
    ...(source
      ? { ...source.binding, source_schema: sourceRoot(source) }
      : { source_kind: 'CONSTANT', constant_value: constant! }),
  };
  return { ...graph, bindings: [...bindings, binding] };
}
function sourceRoot(source: MappingSource): JsonObject {
  if (source.rootSchema) {
    return source.rootSchema;
  }
  const path = source.binding['source_path'];
  if (typeof path !== 'string') {
    return source.schema;
  }
  return path
    .slice(1)
    .split('/')
    .reverse()
    .reduce<JsonObject>(
      (schema, key) => ({
        type: 'object',
        properties: {
          [key.replaceAll('~1', '/').replaceAll('~0', '~')]: schema,
        },
      }),
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
    bindings: compactPort(
      bindings.filter((_, position) => position !== index),
      bindings[index],
    ),
  };
}

function samePort(first: JsonObject, second: JsonObject): boolean {
  return (
    first['step'] === second['step'] &&
    first['target_port'] === second['target_port']
  );
}
function compactPort(
  bindings: readonly JsonObject[],
  selected: JsonObject,
): JsonObject[] {
  const ordered = bindings
    .filter((row) => samePort(row, selected))
    .sort((a, b) => Number(a['ordinal']) - Number(b['ordinal']));
  return bindings.map((row) =>
    samePort(row, selected) ? { ...row, ordinal: ordered.indexOf(row) } : row,
  );
}
export function moveMapping(
  graph: JsonObject,
  id: string,
  direction: -1 | 1,
  nodes: readonly CanvasNode[],
): JsonObject {
  const bindings = (graph['bindings'] ?? []) as JsonObject[];
  const selected = bindings.find((row) => connectionKey('data', row) === id);
  if (
    !selected ||
    !nodes
      .find((node) => node.key === selected['step'])
      ?.ports.some(
        (port) =>
          port.key === selected['target_port'] &&
          port.direction === 'INPUT' &&
          (port.cardinality === 'LIST' || !!selected['target_projection']),
      )
  ) {
    throw Error('Invalid connection');
  }
  const siblings = bindings
    .filter((row) => samePort(row, selected))
    .sort((a, b) => Number(a['ordinal']) - Number(b['ordinal']));
  const index = siblings.indexOf(selected);
  const destination = index + direction;
  if (!siblings[destination]) {
    return graph;
  }
  [siblings[index], siblings[destination]] = [
    siblings[destination],
    siblings[index],
  ];
  let position = 0;
  return {
    ...graph,
    bindings: bindings.map((row) =>
      samePort(row, selected)
        ? { ...siblings[position], ordinal: position++ }
        : row,
    ),
  };
}
export function replaceMapping(
  graph: JsonObject,
  id: string,
  nodes: readonly CanvasNode[],
  source: MappingSource | null,
  constant: JsonValue | undefined,
): JsonObject {
  const bindings = (graph['bindings'] ?? []) as JsonObject[];
  const index = bindings.findIndex((row) => connectionKey('data', row) === id);
  if (index < 0) {
    throw Error('Invalid connection');
  }
  const old = bindings[index];
  const reduced = {
    ...graph,
    bindings: bindings.filter((_, position) => position !== index),
  };
  const projection = old['target_projection'] as JsonObject | undefined;
  const target = projection
    ? schemaAt(old['target_schema'] as JsonObject, String(projection['path']))
    : null;
  const editNodes = target
    ? nodes.map((node) =>
        node.key === old['step']
          ? {
              ...node,
              ports: node.ports.map((port) =>
                port.direction === 'INPUT' && port.key === old['target_port']
                  ? { ...port, schema: target }
                  : port,
              ),
            }
          : node,
      )
    : nodes;
  const result = addMapping(
    projection ? { bindings: [] } : reduced,
    String(old['step']),
    String(old['target_port']),
    editNodes,
    source,
    constant,
  );
  const replacement = (result['bindings'] as JsonObject[]).at(-1)!;
  const retained = Object.fromEntries(
    Object.entries(old).filter(
      ([key]) =>
        ![
          'source_kind',
          'source_path',
          'source_step',
          'source_port',
          'source_schema',
          'constant_value',
        ].includes(key),
    ),
  );
  return {
    ...graph,
    bindings: bindings.map((row, position) =>
      position === index
        ? {
            ...retained,
            ...replacement,
            ...(projection ? { target_schema: old['target_schema'] } : {}),
            ordinal: old['ordinal'],
          }
        : row,
    ),
  };
}

/** Index one declared collection while retaining its exact pinned root schema. */
export function isMappingCollection(
  source: MappingSource | undefined,
): boolean {
  return (
    !!source &&
    ['REQUEST', 'STEP_OUTPUT'].includes(
      String(source.binding['source_kind']),
    ) &&
    source.schema['type'] === 'array'
  );
}
export function invalidCollectionIndex(index: number | null): boolean {
  return index !== null && (!Number.isSafeInteger(index) || index < 0);
}
export function mappingItem(
  source: MappingSource,
  index: number,
  field = '',
): MappingSource {
  const items = editorSchema(source.schema)['items'];
  if (
    !['REQUEST', 'STEP_OUTPUT'].includes(
      String(source.binding['source_kind']),
    ) ||
    invalidCollectionIndex(index) ||
    !items ||
    typeof items !== 'object' ||
    Array.isArray(items)
  ) {
    throw Error('Choose a valid collection item index.');
  }
  return {
    ...source,
    schema: field
      ? (schemaAt(items as JsonObject, field) ?? invalidItemField())
      : (items as JsonObject),
    rootSchema: sourceRoot(source),
    binding: {
      ...source.binding,
      source_path:
        String(source.binding['source_path'] ?? '') + '/' + index + field,
    },
  };
}

export function mappingSelection(
  sources: readonly MappingSource[],
  binding: JsonObject,
): { key: string; index: number | null; field: string } {
  if (binding['source_kind'] === 'CONSTANT') {
    return { key: '', index: null, field: '' };
  }
  for (const source of sources) {
    if (
      ['source_kind', 'source_path', 'source_step', 'source_port'].every(
        (key) => (source.binding[key] ?? null) === (binding[key] ?? null),
      )
    ) {
      return { key: source.key, index: null, field: '' };
    }
    if (
      ['REQUEST', 'STEP_OUTPUT'].includes(
        String(source.binding['source_kind']),
      ) &&
      source.binding['source_kind'] === binding['source_kind'] &&
      source.binding['source_step'] === binding['source_step'] &&
      source.binding['source_port'] === binding['source_port'] &&
      source.schema['type'] === 'array'
    ) {
      const prefix = String(source.binding['source_path'] ?? '') + '/';
      const path = String(binding['source_path']);
      const suffix = path.slice(prefix.length);
      if (path.startsWith(prefix) && /^(0|[1-9][0-9]*)(\/.*)?$/.test(suffix)) {
        const [index, ...field] = suffix.split('/');
        return {
          key: source.key,
          index: Number(index),
          field: field.length ? '/' + field.join('/') : '',
        };
      }
    }
  }
  return { key: '__unavailable__', index: null, field: '' };
}

function invalidItemField(): never {
  throw Error('Choose a valid collection field.');
}

/** A literal's presence is separate from form-required empty-text semantics. */
export function literalErrors(
  schema: JsonObject,
  value: JsonValue | undefined,
): Record<string, string> {
  const shape = editorSchema(schema);
  if (
    typeof value === 'number' &&
    schemaBranch(shape, value)['type'] === 'integer' &&
    !((shape['anyOf'] ?? []) as JsonObject[]).some(
      (branch) => branch['type'] === 'number',
    ) &&
    !Number.isSafeInteger(value)
  ) {
    return {
      value:
        'Use a text literal and an integer Transform step for values outside the safe integer range.',
    };
  }
  if (value === undefined) {
    return { value: 'Complete the required fields.' };
  }
  if (value === '') {
    return emptyTextAllowed(shape) ? {} : { value: 'Invalid value' };
  }
  if (value === null && !Object.keys(shape).length) {
    return {};
  }
  return schemaErrors(shape, value, 'value', true, true);
}
function emptyTextAllowed(schema: JsonObject): boolean {
  const shape = { ...schema, ...schemaBranch(schema, '') };
  return (
    (!shape['type'] || shape['type'] === 'string') &&
    Number(shape['minLength'] ?? 0) === 0 &&
    !shape['format'] &&
    (shape['const'] === undefined || shape['const'] === '') &&
    (!Array.isArray(shape['enum']) || shape['enum'].includes('')) &&
    (!shape['pattern'] || new RegExp(String(shape['pattern'])).test(''))
  );
}

export function selectableMappingSource(
  source: MappingSource,
  compatible: (schema: JsonObject) => boolean,
): boolean {
  const items = (editorSchema(source.schema)['items'] as JsonObject) ?? {};
  return (
    compatible(source.schema) ||
    (isMappingCollection(source) &&
      (compatible(items) ||
        mappingFields(items).some((field) => compatible(field.schema))))
  );
}
