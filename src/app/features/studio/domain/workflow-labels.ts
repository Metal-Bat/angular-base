import { fieldLabel } from '../../../shared/domain/field-label';
import { JsonObject } from '../../forms/domain/runtime-document';
export type WorkflowPaletteEntry = {
  readonly key: string;
  readonly category: string;
  readonly title: string;
  readonly typeLabel: string;
  readonly versionNumber: number | null;
  readonly titleMissing: boolean;
  readonly duplicateTitle: boolean;
};

/** The graph has a stable key, not a separate editable display-name field. */
export function workflowStepName(key: string): string {
  const words = key
    .replace(/[_.-]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return fieldLabel(
    words.replace(/\b[A-Z]{2,}\b/g, (word) => word.toLowerCase()),
  ).replace(/\bAi\b/g, 'AI');
}
function missingTitle(entry: JsonObject | undefined): boolean {
  const title = entry?.['title'];
  return (
    typeof title !== 'string' ||
    !title.trim() ||
    /^step\.[a-z0-9_.-]+\.name$/.test(title)
  );
}
export function stepTypeTitle(
  entry: JsonObject | undefined,
  code: string,
): string {
  const title = entry?.['title'];
  return missingTitle(entry) || title === code
    ? workflowStepName(code || 'step')
    : String(title);
}
const stepCategories: Readonly<Record<string, string>> = {
  start: 'Flow',
  finish: 'Flow',
  decision: 'Flow',
  subprocess: 'Flow',
  permission_check: 'Flow',
  request_priority: 'Flow',
  human_task: 'People',
  transform: 'Data',
  function: 'Data',
  event_wait: 'Time and events',
  timer: 'Time and events',
  notification: 'Integrations',
  service_task: 'Integrations',
  connection_status: 'Integrations',
  ai_decision: 'AI',
};
/** Derived presentation only; original catalog entries remain the pin/port authority. */
export function catalogEntryPresentation(
  entry: JsonObject,
): WorkflowPaletteEntry {
  const metadata = (entry['metadata'] ?? {}) as JsonObject;
  const code = String(metadata['code'] ?? String(entry['key']).split(':')[0]);
  const number = metadata['number'];
  return {
    key: String(entry['key']),
    category: stepCategories[String(metadata['handler_key'])] ?? 'Other steps',
    title: stepTypeTitle(entry, code),
    typeLabel: stepTypeTitle(undefined, code),
    titleMissing: missingTitle(entry),
    duplicateTitle: false,
    versionNumber:
      typeof number === 'number' && Number.isInteger(number) && number > 0
        ? number
        : null,
  };
}
export function readablePalette(
  catalog: readonly JsonObject[],
  search: string,
): WorkflowPaletteEntry[] {
  const entries = catalog.map(catalogEntryPresentation);
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const title = entry.title;
    counts.set(title, (counts.get(title) ?? 0) + 1);
  }
  return entries
    .filter((entry) =>
      (entry.title + ' ' + entry.category + ' ' + entry.key)
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .map((entry) => ({
      ...entry,
      duplicateTitle: counts.get(entry.title)! > 1,
    }));
}
