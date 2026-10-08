export const supportedLanguages = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'fa', name: 'فارسی', direction: 'rtl' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
] as const;
export type SupportedLocale = (typeof supportedLanguages)[number]['code'];
export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLanguages.some((language) => language.code === value);
}
export function languageDirection(language: SupportedLocale): 'ltr' | 'rtl' {
  return supportedLanguages.find((option) => option.code === language)!
    .direction;
}
