import type {
  SavedView,
  ViewInput,
} from '../../../core/resources/personal-collections';
import { JsonObject, jsonObject } from '../../domain/json-value';
/** Rename retains the stored restrictions; save/update capture only the applied list query. */
export function savedViewBody(
  kind: ViewInput['resource_kind'],
  name: string,
  query: JsonObject,
  columns: readonly string[],
  rename: SavedView | null,
): ViewInput {
  const current = rename ? jsonObject(rename.query) : query;
  return {
    schema_version: 1,
    resource_kind: kind,
    name: name.trim(),
    query: Object.fromEntries(
      Object.entries(current).filter(
        ([key]) => key !== 'page' && key !== 'size',
      ),
    ),
    column_keys: rename ? [...rename.column_keys] : [...columns],
    page_size: rename
      ? rename.page_size
      : typeof current['size'] === 'number'
        ? current['size']
        : 20,
    command_key: crypto.randomUUID(),
  };
}
