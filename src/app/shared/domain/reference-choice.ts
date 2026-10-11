import { JsonObject } from './json-value';
export type ReferenceChoice = { key: string; label: string; row: JsonObject };
/** Display labels never substitute for the producer's opaque selection key. */
export function referenceChoice(row: JsonObject): ReferenceChoice {
  const key = row['key'] ?? row['ref_id'];
  const label = row['value'] ?? row['name'] ?? row['title'];
  if (
    typeof key !== 'string' ||
    !key ||
    typeof label !== 'string' ||
    !label.trim()
  ) {
    throw Error('Invalid selector response.');
  }
  return { key, label, row };
}
