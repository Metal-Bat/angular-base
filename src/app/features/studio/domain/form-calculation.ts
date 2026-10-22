import { schemaAt } from './form-editing';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';

/** Preserve override policy while switching the mutually exclusive calculation source. */
export function calculationSource(
  original: JsonValue | undefined,
  source: { function: string; scopes: string[] } | { expression: string },
): JsonObject {
  const next = { ...((original ?? {}) as JsonObject), ...source } as Record<
    string,
    JsonValue
  >;
  if ('expression' in source) {
    delete next['function'];
    delete next['scopes'];
  } else {
    delete next['expression'];
  }
  return next;
}

export function calculationType(
  documents: JsonObject,
  scope: string,
  calculation: JsonObject,
): string | null {
  const kind = calculation['function'];
  if (!kind) {
    return null;
  }
  const sources = calculation['scopes'];
  if (!Array.isArray(sources) || !sources.length) {
    throw Error('Choose compatible calculation source fields.');
  }
  const accepted =
    kind === 'sum'
      ? ['integer', 'number']
      : kind === 'concat'
        ? ['string']
        : kind === 'count'
          ? ['array']
          : [];
  const types = sources.flatMap((source) => {
    if (typeof source !== 'string' || source === scope) {
      throw Error('Choose compatible calculation source fields.');
    }
    const targetContexts = itemContexts(scope);
    const sourceContexts = itemContexts(source);
    if (sourceContexts.some((context) => !targetContexts.includes(context))) {
      throw Error('Choose compatible calculation source fields.');
    }
    const schema = schemaAt(documents, source);
    const values = Array.isArray(schema['type'])
      ? schema['type']
      : [schema['type']];
    if (
      values.some(
        (type) => typeof type !== 'string' || !accepted.includes(type),
      )
    ) {
      throw Error('Choose compatible calculation source fields.');
    }
    return values;
  });
  return kind === 'concat'
    ? 'string'
    : kind === 'count' || types.every((type) => type === 'integer')
      ? 'integer'
      : 'number';
}

export function applyCalculationType(
  documents: JsonObject,
  scope: string,
  calculation: JsonObject,
): JsonObject {
  const type = calculationType(documents, scope, calculation);
  if (!type) {
    return documents;
  }
  const next = structuredClone(documents);
  const schema = schemaAt(next, scope) as Record<string, JsonValue>;
  const previous = Array.isArray(schema['type'])
    ? schema['type']
    : [schema['type']];
  const accepted = type === 'integer' ? ['integer', 'number'] : [type];
  const valued = previous.filter((value) => value !== 'null');
  if (
    !valued.length ||
    !valued.every((value) => accepted.includes(String(value)))
  ) {
    for (const key of type === 'string'
      ? ['minimum', 'maximum']
      : ['minLength', 'maxLength', 'pattern', 'format']) {
      delete schema[key];
    }
    schema['type'] = previous.includes('null') ? [type, 'null'] : type;
  }
  return next;
}

function itemContexts(scope: string): string[] {
  const tokens = scope.split('/');
  return tokens.flatMap((token, index) =>
    token === 'items' ? [tokens.slice(0, index + 1).join('/')] : [],
  );
}
