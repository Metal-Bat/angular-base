import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
export type AuthoredPage = {
  key: string;
  title: string;
  scopes: readonly string[];
  source: JsonObject;
};

/** Current producer page_settings.pages shape; keep every unrelated document and page key. */
export function authoredPages(
  documents: JsonObject,
): readonly AuthoredPage[] | null {
  const settings = documents['page_settings'];
  if (
    settings !== null &&
    settings !== undefined &&
    (typeof settings !== 'object' || Array.isArray(settings))
  ) {
    return null;
  }
  const raw = (settings as JsonObject | undefined)?.['pages'];
  if (raw === null || raw === undefined) {
    return [];
  }
  if (!Array.isArray(raw) || raw.length > 32) {
    return null;
  }
  const pages: AuthoredPage[] = [];
  const keys = new Set<string>();
  for (const entry of raw) {
    const page = readPage(entry);
    if (!page || keys.has(page.key)) {
      return null;
    }
    keys.add(page.key);
    pages.push(page);
  }
  return pages;
}
function readPage(entry: JsonValue): AuthoredPage | null {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }
  const source = entry as JsonObject;
  const key = source['key'];
  const title = source['title'];
  const scopes = source['scopes'];
  if (
    typeof key !== 'string' ||
    !key ||
    Array.from(key).length > 64 ||
    typeof title !== 'string' ||
    Array.from(title).length > 256 ||
    !Array.isArray(scopes) ||
    scopes.length > 256 ||
    !scopes.every((scope) => typeof scope === 'string')
  ) {
    return null;
  }
  return { key, title, scopes: scopes as string[], source };
}

export function nextPageKey(pages: readonly AuthoredPage[]): string {
  let index = 1;
  const keys = new Set(pages.map((page) => page.key));
  while (keys.has('page_' + index)) {
    index++;
  }
  return 'page_' + index;
}
function replacePages(
  documents: JsonObject,
  pages: readonly JsonObject[],
): JsonObject {
  return {
    ...documents,
    page_settings: {
      ...((documents['page_settings'] ?? {}) as JsonObject),
      pages,
    },
  };
}
export function savePage(
  documents: JsonObject,
  key: string | null,
  title: string,
  scopes: readonly string[],
  allowed: readonly string[],
): JsonObject {
  const pages = authoredPages(documents);
  if (!pages) {
    throw Error(
      'Existing page settings need advanced inspection. They are preserved.',
    );
  }
  const previous = pages.find((page) => page.key === key);
  if (
    (key && !previous) ||
    !title.trim() ||
    Array.from(title).length > 256 ||
    !scopes.length ||
    scopes.length > 256 ||
    scopes.some(
      (scope) => !allowed.includes(scope) && !previous?.scopes.includes(scope),
    ) ||
    (!previous && pages.length >= 32)
  ) {
    throw Error('Enter a page title and choose its fields.');
  }
  const source: Record<string, JsonValue> = {
    ...(previous?.source ?? {}),
    key: previous?.key ?? nextPageKey(pages),
    title,
    scopes: [...scopes],
  };
  return replacePages(
    documents,
    previous
      ? pages.map((page) => (page.key === key ? source : page.source))
      : [...pages.map((page) => page.source), source],
  );
}
export function reorderPage(
  documents: JsonObject,
  key: string,
  direction: -1 | 1,
): JsonObject {
  const pages = authoredPages(documents);
  if (!pages) {
    throw Error(
      'Existing page settings need advanced inspection. They are preserved.',
    );
  }
  const index = pages.findIndex((page) => page.key === key);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= pages.length) {
    return documents;
  }
  const result = pages.map((page) => page.source);
  [result[index], result[destination]] = [result[destination], result[index]];
  return replacePages(documents, result);
}
export function removePage(documents: JsonObject, key: string): JsonObject {
  const pages = authoredPages(documents);
  if (!pages || !pages.some((page) => page.key === key)) {
    throw Error('This page is unavailable.');
  }
  return replacePages(
    documents,
    pages.filter((page) => page.key !== key).map((page) => page.source),
  );
}
