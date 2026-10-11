import { fieldLabel } from '../../../shared/domain/field-label';
import { JsonObject } from '../../forms/domain/runtime-document';
/** Keep reference and credential columns out of ordinary result tables. */
export function resultColumns(
  rows: readonly JsonObject[],
): { key: string; label: string }[] {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))]
    .filter((key) => !/(ref|secret|password|token)/.test(key))
    .slice(0, 6)
    .map((key) => ({ key, label: fieldLabel(key) }));
}
