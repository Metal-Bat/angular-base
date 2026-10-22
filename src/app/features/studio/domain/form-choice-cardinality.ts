import { schemaErrors } from '../../../shared/domain/schema-form';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { schemaAt } from './form-editing';

const scalarConstraints = [
  'enum',
  'const',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
];

/** A multiple-choice control emits an array; its canonical field must agree. */
export function applyChoiceCardinality(
  documents: JsonObject,
  scope: string,
  node: JsonObject,
): JsonObject {
  const multiple = (node['options'] as JsonObject | undefined)?.['multiple'];
  if (node['component'] !== 'choice') {
    return documents;
  }
  const next = structuredClone(documents);
  const field = schemaAt(next, scope) as Record<string, JsonValue>;
  const types = Array.isArray(field['type']) ? field['type'] : [field['type']];
  const changed =
    typeof multiple === 'boolean' && multiple !== types.includes('array');
  if (changed) {
    if (multiple) {
      wrapChoices(field, types, types.includes('null'));
    } else {
      unwrapChoices(field, types.includes('null'));
    }
  }
  const keysChanged = alignCustomKeys(field, node);
  return changed || keysChanged ? next : documents;
}

function wrapChoices(
  field: Record<string, JsonValue>,
  types: JsonValue[],
  nullable: boolean,
): void {
  const scalar = types.filter((type) => type !== 'null');
  const items: Record<string, JsonValue> = {
    type: scalar.length === 1 ? scalar[0] : scalar,
  };
  for (const key of scalarConstraints) {
    if (field[key] !== undefined) {
      items[key] = field[key];
      delete field[key];
    }
  }
  field['type'] = nullable ? ['array', 'null'] : 'array';
  field['items'] = items;
  if (field['default'] !== undefined && field['default'] !== null) {
    field['default'] = [field['default']];
  }
}

function unwrapChoices(
  field: Record<string, JsonValue>,
  nullable: boolean,
): void {
  const items = field['items'];
  if (
    !items ||
    typeof items !== 'object' ||
    Array.isArray(items) ||
    !(items as JsonObject)['type']
  ) {
    throw Error(
      'The choice item type must be configured before selecting one value.',
    );
  }
  const itemSchema = items as JsonObject;
  const defaults = field['default'];
  if (Array.isArray(defaults) && defaults.length > 1) {
    throw Error(
      'Clear the multi-value default before switching to one choice.',
    );
  }
  const scalar = Array.isArray(itemSchema['type'])
    ? itemSchema['type']
    : [itemSchema['type']];
  const target = [...new Set([...scalar, ...(nullable ? ['null'] : [])])];
  field['type'] = target.length === 1 ? target[0] : target;
  for (const key of scalarConstraints) {
    if (itemSchema[key] !== undefined) {
      field[key] = itemSchema[key];
    }
  }
  for (const key of ['items', 'minItems', 'maxItems', 'uniqueItems']) {
    delete field[key];
  }
  if (Array.isArray(defaults)) {
    if (defaults.length) {
      field['default'] = defaults[0];
    } else {
      delete field['default'];
    }
  }
}

function alignCustomKeys(
  field: Record<string, JsonValue>,
  node: JsonObject,
): boolean {
  const source = node['source'] as JsonObject | undefined;
  if (
    source?.['kind'] !== 'custom' ||
    !Array.isArray(source['items']) ||
    !source['items'].length
  ) {
    return false;
  }
  const keys = (source['items'] as JsonObject[]).map((item) => item['key']);
  const wanted = [
    ...new Set(
      keys.map((key) =>
        typeof key === 'number' && Number.isInteger(key)
          ? 'integer'
          : typeof key,
      ),
    ),
  ];
  if (
    wanted.some(
      (type) => !['string', 'integer', 'number', 'boolean'].includes(type),
    )
  ) {
    throw Error('Choices conflict with the existing field constraints.');
  }
  const types = Array.isArray(field['type']) ? field['type'] : [field['type']];
  const target = types.includes('array')
    ? (field['items'] as Record<string, JsonValue>)
    : field;
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    throw Error('Choices conflict with the existing field constraints.');
  }
  const current = Array.isArray(target['type'])
    ? target['type']
    : [target['type']];
  if (
    wanted.every(
      (type) =>
        current.includes(type) ||
        (type === 'integer' && current.includes('number')),
    )
  ) {
    return false;
  }
  const inferred: string[] = wanted.filter(
    (type) => type !== 'integer' || !wanted.includes('number'),
  );
  if (current.includes('null')) {
    inferred.push('null');
  }
  const candidate = {
    ...target,
    type: inferred.length === 1 ? inferred[0] : inferred,
  };
  if (keys.some((key) => Object.keys(schemaErrors(candidate, key)).length)) {
    throw Error('Choices conflict with the existing field constraints.');
  }
  target['type'] = candidate.type;
  return true;
}
