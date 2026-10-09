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
): Promise<JsonObject> {
  if (
    !/^[A-Za-z0-9_.-]{1,128}$/.test(key) ||
    [en, fa].some((text) => !text.trim() || text.length > 2048)
  ) {
    throw Error('Both languages require bounded text');
  }
  const localization = (documents['localization'] ?? {}) as JsonObject;
  const catalogs = (localization['catalogs'] ?? {}) as JsonObject;
  const english = (catalogs['en'] ?? {}) as JsonObject;
  const persian = (catalogs['fa'] ?? {}) as JsonObject;
  for (const message of [english[key], persian[key]]) {
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
  const defaultLocale = localization['default_locale'] === 'fa' ? 'fa' : 'en';
  const revision = await messageRevision(defaultLocale === 'en' ? en : fa);
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
    ]),
  ];
  return {
    ...documents,
    localization: {
      ...localization,
      dialect: 'bpms.messages/1',
      default_locale: defaultLocale,
      supported_locales: ['en', 'fa'],
      required_locales: required,
      catalogs: {
        ...catalogs,
        en: { ...english, [key]: entry(english[key], en, 'en') },
        fa: { ...persian, [key]: entry(persian[key], fa, 'fa') },
      },
    },
  };
}
