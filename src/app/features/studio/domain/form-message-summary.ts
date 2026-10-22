import { JsonObject } from '../../forms/domain/runtime-document';
import { messageRevision } from './form-localization';

export type MessageCell = {
  locale: 'en' | 'fa' | 'ar';
  text: string;
  status:
    | 'Missing translation'
    | 'Current translation'
    | 'Stale translation'
    | 'Contract editor required';
};
export type MessageSummary = { key: string; cells: MessageCell[] };

/** Read-only status for plain messages; structured contracts retain their existing editor. */
export async function summarizeMessages(
  documents: JsonObject,
): Promise<MessageSummary[]> {
  const localization = (documents['localization'] ?? {}) as JsonObject;
  const catalogs = (localization['catalogs'] ?? {}) as JsonObject;
  const locales = ['en', 'fa', 'ar'] as const;
  const catalog = (locale: string): JsonObject =>
    (catalogs[locale] ?? {}) as JsonObject;
  const keys = [
    ...new Set(locales.flatMap((locale) => Object.keys(catalog(locale)))),
  ];
  const sourceLocale = String(localization['default_locale'] ?? 'en');
  return Promise.all(
    keys.map(async (key): Promise<MessageSummary> => {
      const source = catalog(sourceLocale)[key] as JsonObject | undefined;
      const revision = plain(source)
        ? await messageRevision(source!['text'] as string)
        : null;
      return {
        key,
        cells: locales.map((locale): MessageCell => {
          const entry = catalog(locale)[key] as JsonObject | undefined;
          const text = typeof entry?.['text'] === 'string' ? entry['text'] : '';
          const status =
            !entry || (!text.trim() && typeof entry['text'] === 'string')
              ? 'Missing translation'
              : !plain(entry) || (source && !plain(source))
                ? 'Contract editor required'
                : locale === sourceLocale ||
                    (revision && entry['source_revision'] === revision)
                  ? 'Current translation'
                  : 'Stale translation';
          return { locale, text, status };
        }),
      };
    }),
  );
}

function plain(entry: JsonObject | undefined): boolean {
  return (
    typeof entry?.['text'] === 'string' &&
    Object.keys((entry['parameters'] ?? {}) as JsonObject).length === 0
  );
}
