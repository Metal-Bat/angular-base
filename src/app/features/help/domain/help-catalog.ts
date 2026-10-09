import catalog from './help-catalog.json';
export const helpCatalog = catalog;
export type HelpTopic = (typeof helpCatalog)[number];
export type HelpLanguage = 'en' | 'fa';
export const helpRoutes: Readonly<Record<string, string>> = {
  requests: '/operations/catalog',
  tasks: '/operations/tasks',
  studio: '/studio',
  notifications: '/operations/notifications',
};
export function helpIdentity(topic: HelpTopic, locale: HelpLanguage): string {
  return `${topic.help_key}:${topic.revision}:${locale}`;
}
