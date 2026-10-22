import { workflowMappingSources } from './interface-sources';
import { literalErrors, mappingItem } from './data-mappings';
import { MappingSource } from './mapping-sources';
import { inspectorFor } from './node-inspector';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
export function chooseSubprocess(
  current: JsonObject | undefined,
  reference: string,
  catalog: readonly JsonObject[],
): JsonObject {
  const available = catalog.some(
    (row) =>
      (row['metadata'] as JsonObject | undefined)?.['workflow_version_ref'] ===
        reference && row['category'] === 'subprocess',
  );
  if (!available) {
    throw Error('No permitted operations.');
  }
  if (
    current?.['workflow_version_ref'] !== reference &&
    Array.isArray(current?.['inputs']) &&
    current['inputs'].length
  ) {
    throw Error('Repair existing child mappings before changing its version.');
  }
  return {
    ...current,
    workflow_version_ref: reference,
    inputs: current?.['inputs'] ?? [],
  };
}
export function setChildInput(
  current: JsonObject,
  name: string,
  value: JsonValue | undefined,
  catalog: readonly JsonObject[],
): JsonObject {
  const inputs = (current['inputs'] ?? []) as JsonObject[];
  if (value === undefined) {
    return {
      ...current,
      inputs: inputs.filter((item) => item['name'] !== name),
    };
  }
  const schema = childInputSchema(current, name, catalog);
  const original = inputs.find((item) => item['name'] === name);
  if (original && original['source_kind'] !== 'CONSTANT') {
    throw Error('Remove the existing mapping before replacing it.');
  }
  if (Object.keys(literalErrors(schema, value)).length) {
    throw Error('Invalid value');
  }
  const replacement = {
    ...original,
    name,
    source_kind: 'CONSTANT',
    source_schema: schema,
    constant_value: value,
  };
  return {
    ...current,
    inputs: original
      ? inputs.map((item) => (item['name'] === name ? replacement : item))
      : [...inputs, replacement],
  };
}

export function childInputSchema(
  current: JsonObject,
  name: string,
  catalog: readonly JsonObject[],
): JsonObject {
  const entry = catalog.find(
    (row) =>
      row['category'] === 'subprocess' &&
      (row['metadata'] as JsonObject | undefined)?.['workflow_version_ref'] ===
        current['workflow_version_ref'],
  );
  const contract = (entry?.['metadata'] as JsonObject | undefined)?.[
    'interface'
  ] as JsonObject | undefined;
  const port = ((contract?.['inputs'] ?? []) as JsonObject[]).find(
    (item) => item['name'] === name,
  );
  const schema = port?.['value_schema'];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw Error('Unsupported mapping target');
  }
  return schema as JsonObject;
}
export function setChildSource(
  current: JsonObject,
  name: string,
  key: string,
  catalog: readonly JsonObject[],
  sources: readonly MappingSource[],
  index?: number,
  field = '',
): JsonObject {
  const schema = childInputSchema(current, name, catalog);
  const selected = sources.find((item) => item.key === key);
  const source =
    selected && index !== undefined
      ? mappingItem(selected, index, field)
      : selected;
  if (
    !source ||
    !childSourceCompatible(source.schema, schema) ||
    (source.binding['source_kind'] === 'STEP_OUTPUT' &&
      source.binding['source_path']) ||
    String(source.binding['source_path'] ?? '').length > 512
  ) {
    throw Error('Source port changed. Reload suggestions.');
  }
  const inputs = (current['inputs'] ?? []) as JsonObject[];
  const replacement: JsonObject = {
    name,
    ...source.binding,
    source_schema: source.schema,
  };
  return {
    ...current,
    inputs: inputs.some((item) => item['name'] === name)
      ? inputs.map((item) => (item['name'] === name ? replacement : item))
      : [...inputs, replacement],
  };
}

/** Child calls validate exact registry port schemas, unlike configured GraphBinding ports. */
export function subprocessSources(
  rows: readonly JsonObject[],
  graph: JsonObject,
  target: string,
  catalog: readonly JsonObject[],
): MappingSource[] {
  if (!rows.length && !graph['interface']) {
    return [];
  }
  return workflowMappingSources(rows, graph, target, undefined).flatMap(
    (source) => {
      if (source.binding['source_kind'] !== 'STEP_OUTPUT') {
        return [source];
      }
      const step = ((graph['steps'] ?? []) as JsonObject[]).find(
        (item) => item['key'] === source.binding['source_step'],
      );
      const port =
        step &&
        inspectorFor(step, catalog)?.ports.find(
          (item) =>
            item['direction'] === 'OUTPUT' &&
            item['port_key'] === source.binding['source_port'],
        );
      if (!port || !port['value_schema']) {
        return [];
      }
      return [{ ...source, schema: port['value_schema'] as JsonObject }];
    },
  );
}

/** SubprocessValidator uses exact schemas, excluding only descriptive root annotations. */
export function childSourceCompatible(
  source: JsonObject,
  target: JsonObject,
): boolean {
  const strip = (schema: JsonObject): JsonObject =>
    Object.fromEntries(
      Object.entries(schema).filter(
        ([key]) =>
          !['title', 'description', 'default', 'examples'].includes(key),
      ),
    );
  return (
    JSON.stringify(ordered(strip(source))) ===
    JSON.stringify(ordered(strip(target)))
  );
}
function ordered(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(ordered);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, ordered(child)]),
    );
  }
  return value;
}

export type ChildSourceSelection = {
  key: string;
  index: number | null;
  field: string;
};
