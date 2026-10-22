import { JsonObject } from '../../forms/domain/runtime-document';
import { schemaSummary } from '../domain/mapping-schema';
/** Translate each type/format token while retaining the producer's canonical schema. */
export function translatedSchemaSummary(
  schema: JsonObject,
  text: (value: string) => string,
): string {
  return schemaSummary(schema)
    .split(/( · | \/ )/)
    .map(text)
    .join('');
}
