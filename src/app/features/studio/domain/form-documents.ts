import { JsonObject } from '../../forms/domain/runtime-document';

const documentKeys = [
  'data_dialect',
  'render_dialect',
  'behavior_dialect',
  'data_schema',
  'render_schema',
  'page_settings',
  'variants',
  'reuse_instances',
  'localization',
];

export function formDocuments(row: JsonObject): JsonObject {
  return Object.fromEntries(
    documentKeys
      .filter((key) => row[key] !== undefined)
      .map((key) => [key, row[key]]),
  );
}

export function blankFormDocuments(): JsonObject {
  return {
    data_schema: { type: 'object', properties: {} },
    render_schema: {
      dialect: 'bpms.render/1',
      root: { component: 'vertical', children: [] },
    },
  };
}

export function nextFieldName(documents: JsonObject): string {
  const keys = new Set<string>();
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') {
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      visit(child);
    }
  };
  visit(documents['data_schema']);
  let index = 1;
  while (keys.has('field_' + index)) {
    index++;
  }
  return 'field_' + index;
}
