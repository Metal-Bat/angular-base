import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
/** Matches bpms.messages/1 source_revision: sorted compact ASCII JSON, parameters then text. */
export async function messageRevision(text: string): Promise<string> {
  const json = JSON.stringify({ parameters: {}, text }).replace(
    /[\u007f-\uffff]/g,
    (character) =>
      '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'),
  );
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(json),
  );
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
}
export async function translateMessage(
  documents: JsonObject,
  key: string,
  en: string,
  fa: string,
  ar?: string,
): Promise<JsonObject> {
  if (
    !/^[A-Za-z0-9_.-]{1,128}$/.test(key) ||
    [en, fa, ...(ar === undefined ? [] : [ar])].some(
      (text) => !text.trim() || text.length > 2048,
    )
  ) {
    throw Error('Both languages require bounded text');
  }
  const localization = (documents['localization'] ?? {}) as JsonObject;
  const catalogs = (localization['catalogs'] ?? {}) as JsonObject;
  const english = (catalogs['en'] ?? {}) as JsonObject;
  const persian = (catalogs['fa'] ?? {}) as JsonObject;
  const arabic = (catalogs['ar'] ?? {}) as JsonObject;
  for (const message of [english[key], persian[key], arabic[key]]) {
    if (
      message &&
      (typeof (message as JsonObject)['text'] !== 'string' ||
        Object.keys(((message as JsonObject)['parameters'] ?? {}) as JsonObject)
          .length)
    ) {
      throw Error(
        'Parameterized messages require their existing contract editor',
      );
    }
  }
  const defaultLocale = ['fa', 'ar'].includes(
    String(localization['default_locale']),
  )
    ? String(localization['default_locale'])
    : 'en';
  const revision = await messageRevision(
    sourceText(defaultLocale, en, fa, ar, arabic[key]),
  );
  const entry = (
    old: JsonValue | undefined,
    text: string,
    locale: string,
  ): JsonObject => ({
    ...((old ?? {}) as JsonObject),
    text,
    parameters: {},
    source_revision: locale === defaultLocale ? null : revision,
  });
  const required = [
    ...new Set([
      ...((localization['required_locales'] ?? []) as string[]),
      'en',
      'fa',
      ...(ar === undefined ? [] : ['ar']),
    ]),
  ];
  return {
    ...documents,
    localization: {
      ...localization,
      dialect: 'bpms.messages/1',
      default_locale: defaultLocale,
      supported_locales: [
        ...new Set([
          ...((localization['supported_locales'] ?? []) as string[]),
          'en',
          'fa',
          ...(ar === undefined ? [] : ['ar']),
        ]),
      ],
      required_locales: required,
      catalogs: {
        ...catalogs,
        en: { ...english, [key]: entry(english[key], en, 'en') },
        fa: { ...persian, [key]: entry(persian[key], fa, 'fa') },
        ...(ar === undefined
          ? {}
          : { ar: { ...arabic, [key]: entry(arabic[key], ar, 'ar') } }),
      },
    },
  };
}

function sourceText(
  locale: string,
  en: string,
  fa: string,
  ar: string | undefined,
  existing: JsonValue | undefined,
): string {
  const source =
    locale === 'en'
      ? en
      : locale === 'fa'
        ? fa
        : (ar ?? (existing as JsonObject | undefined)?.['text']);
  if (typeof source !== 'string' || !source.trim()) {
    throw Error('Invalid translation');
  }
  return source;
}
