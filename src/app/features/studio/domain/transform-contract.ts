import { JsonObject } from '../../forms/domain/runtime-document';

/** Exact transform_schemas projection for the reviewed transform v2 producer. */
export function transformSchemas(
  config: JsonObject,
): readonly [JsonObject, JsonObject] | null {
  const contracts: Record<string, readonly [JsonObject, JsonObject]> = {
    string: [{}, { type: 'string' }],
    integer: [{ type: ['string', 'integer'] }, { type: 'integer' }],
    decimal: [{ type: ['string', 'integer', 'number'] }, { type: 'number' }],
    boolean: [{ type: ['string', 'boolean'] }, { type: 'boolean' }],
    date: [{ type: 'string' }, { type: 'string', format: 'date' }],
    date_time: [
      { type: 'string', format: 'date-time' },
      { type: 'string', format: 'date-time' },
    ],
    array: [{ type: ['string', 'array'] }, { type: 'array' }],
    object: [
      { type: 'object' },
      {
        type: 'object',
        properties: Object.fromEntries(
          Object.keys((config['projection'] ?? {}) as JsonObject).map((key) => [
            key,
            {},
          ]),
        ),
        additionalProperties: false,
      },
    ],
  };
  const pair = contracts[String(config['conversion_key'])];
  if (!pair) {
    return null;
  }
  return config['null_behavior'] === 'preserve'
    ? [pair[0], { ...pair[1], type: [String(pair[1]['type']), 'null'] }]
    : pair;
}

export function transformErrors(
  config: JsonObject,
): Readonly<Record<string, string>> {
  const errors: Record<string, string> = {};
  const conversion = config['conversion_key'];
  if (
    config['null_behavior'] === 'default' &&
    (config['default'] === null || config['default'] === undefined)
  ) {
    errors['default'] = 'Complete the required fields.';
  }
  const projection = config['projection'];
  if (
    conversion === 'object' &&
    (!projection || !Object.keys(projection as JsonObject).length)
  ) {
    errors['projection'] = 'Choose at least one projected field.';
  }
  if (
    conversion !== 'object' &&
    projection !== null &&
    projection !== undefined
  ) {
    errors['projection'] =
      'Remove object projections before choosing another conversion.';
  }
  if (
    config['format'] !== null &&
    config['format'] !== undefined &&
    !['string', 'date', 'date_time'].includes(String(conversion))
  ) {
    errors['format'] = 'This conversion does not support a format.';
  }
  return errors;
}
