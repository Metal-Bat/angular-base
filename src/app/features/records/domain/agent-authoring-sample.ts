import { JsonObject, JsonValue } from '../../../shared/domain/json-value';
export type AgentSampleField = {
  key: string;
  kind: 'text' | 'number' | 'integer' | 'boolean' | 'choices' | 'unsupported';
};
export type SampleChoice = {
  row: string;
  key: string;
  en: string;
  fa: string;
  ar: string;
  description: string;
};
export function sampleFields(
  schema: JsonObject | null,
  permitted: readonly string[],
  choiceKey: string,
): AgentSampleField[] {
  const properties = schema?.['properties'];
  if (
    !properties ||
    typeof properties !== 'object' ||
    Array.isArray(properties)
  ) {
    return [];
  }
  return Object.entries(properties)
    .filter(
      ([key]) =>
        permitted.includes(key) &&
        !['__proto__', 'constructor', 'prototype'].includes(key),
    )
    .slice(0, 64)
    .map(([key, value]) => {
      const definition =
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as JsonObject)
          : {};
      const type = definition['type'];
      return {
        key,
        kind:
          key === choiceKey && type === 'array'
            ? 'choices'
            : type === 'string'
              ? 'text'
              : type === 'number'
                ? 'number'
                : type === 'integer'
                  ? 'integer'
                  : type === 'boolean'
                    ? 'boolean'
                    : 'unsupported',
      };
    });
}
export function authorSample(
  fields: readonly AgentSampleField[],
  enabled: readonly string[],
  values: Partial<Record<string, string | boolean>>,
  choices: readonly SampleChoice[],
): JsonObject {
  const output: Record<string, JsonValue> = {};
  for (const field of fields.filter((item) => enabled.includes(item.key))) {
    if (field.kind === 'unsupported') {
      throw Error('Unsupported sample field');
    }
    const value = values[field.key];
    output[field.key] =
      field.kind === 'choices'
        ? choices.map((choice) => ({
            key: choice.key,
            labels: {
              ...(choice.en ? { en: choice.en } : {}),
              ...(choice.fa ? { fa: choice.fa } : {}),
              ...(choice.ar ? { ar: choice.ar } : {}),
            },
            description: choice.description,
          }))
        : field.kind === 'boolean'
          ? value === true
          : field.kind === 'number' || field.kind === 'integer'
            ? numeric(value, field.kind === 'integer')
            : String(value ?? '');
  }
  if (new TextEncoder().encode(JSON.stringify(output)).length > 32768) {
    throw Error('Sample exceeds the allowed size');
  }
  return output;
}
function numeric(
  value: string | boolean | undefined,
  integer: boolean,
): number {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value) ||
    !Number.isFinite(Number(value)) ||
    (integer && !Number.isSafeInteger(Number(value)))
  ) {
    throw Error('Enter a valid sample number');
  }
  return Number(value);
}
