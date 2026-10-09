import { schemaErrors } from '../../administration/domain/schema-form';
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
  const schema = port?.['value_schema'] as JsonObject | undefined;
  if (
    !port ||
    !schema ||
    !['string', 'integer', 'number', 'boolean'].includes(String(schema['type']))
  ) {
    throw Error('Unsupported mapping target');
  }
  const inputs = (current['inputs'] ?? []) as JsonObject[];
  const original = inputs.find((item) => item['name'] === name);
  if (value === undefined) {
    return {
      ...current,
      inputs: inputs.filter((item) => item['name'] !== name),
    };
  }
  if (original && original['source_kind'] !== 'CONSTANT') {
    throw Error('Remove the existing mapping before replacing it.');
  }
  if (Object.keys(schemaErrors(schema, value, 'value', true)).length) {
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
