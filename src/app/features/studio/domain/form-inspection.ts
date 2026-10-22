import { JsonObject } from '../../forms/domain/runtime-document';
import { parseNumberText } from '../../../shared/domain/number-text';
import { authoredNode } from './form-authoring';
import { renderOf } from './form-editing';
import { parseDocument } from './authoring';

export function inspectionBody(
  tool: string,
  view: {
    documents(): JsonObject;
    locale: string;
    interactionJson: string;
    sampleJson: string;
  },
  query?: JsonObject,
): JsonObject {
  if (tool === 'options' || tool === 'navigation') {
    return {
      documents: view.documents(),
      ...(tool === 'options' ? { locale: view.locale } : {}),
      query: query ?? parseDocument(view.interactionJson),
    };
  }
  if (tool === 'schema') {
    return {};
  }
  return tool === 'behavior'
    ? {
        documents: view.documents(),
        data: parseDocument(view.sampleJson),
        initialize: true,
      }
    : view.documents();
}

/** A late inspection belongs only to the selected placement, draft and answers it read. */
export function inspectionContext(
  view: {
    selected(): readonly number[];
    documents(): JsonObject;
    data(): JsonObject;
  },
  tool: string,
): () => boolean {
  if (!['options', 'navigation'].includes(tool)) {
    return () => true;
  }
  const path = view.selected();
  const documents = view.documents();
  const data = view.data();
  return () =>
    path === view.selected() &&
    documents === view.documents() &&
    data === view.data();
}

export function scopeRowCount(scope: string): number {
  const tokens = scope.split('/').slice(1);
  let count = 0;
  for (let index = 0; index < tokens.length;) {
    if (tokens[index] === 'items') {
      count++;
      index++;
    } else {
      index += 2;
    }
  }
  return count;
}

/** Build the frozen preview DTO from the current placement and the sole synthetic answer owner. */
export function inspectionQuery(
  tool: 'options' | 'navigation',
  documents: JsonObject,
  path: readonly number[],
  data: JsonObject,
  input: { search: string; page: string; rows: readonly string[] },
): JsonObject {
  const node = authoredNode(renderOf(documents), path);
  const nodePointer =
    '/root' + path.map((index) => '/children/' + index).join('');
  if (tool === 'navigation') {
    if (!node['navigation']) {
      throw Error('Choose a field with navigation configured.');
    }
    return { node_pointer: nodePointer, data };
  }
  if (!['choice', 'user', 'group'].includes(String(node['component']))) {
    throw Error('Choose a choice, user or group field to preview options.');
  }
  const page = parseNumberText(input.page);
  const count = scopeRowCount(String(node['scope'] ?? ''));
  const rows = input.rows.map(parseNumberText);
  if (
    page === undefined ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    input.search.length > 100 ||
    count > 8 ||
    rows.length !== count ||
    rows.some(
      (row) =>
        row === undefined || !Number.isInteger(row) || row < 1 || row > 256,
    )
  ) {
    throw Error(
      'Enter a valid page and row position before previewing options.',
    );
  }
  return {
    node_pointer: nodePointer,
    data,
    page,
    size: 20,
    search: input.search || null,
    row_indices: rows.map((row) => row! - 1),
    selected_keys: [],
    generation: 0,
  };
}
