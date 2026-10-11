import { HelpLanguage, HelpTopic } from '../domain/help-catalog';
export type HelpStatePort = {
  status(): 'loading' | 'saved' | 'unsaved';
  saved(
    topic: HelpTopic,
    locale: HelpLanguage,
  ):
    { dismissed_at?: string | null; last_viewed_at: string | null } | undefined;
  acknowledge(
    topic: HelpTopic,
    locale: HelpLanguage,
    dismiss?: boolean,
  ): Promise<void>;
  reset(): Promise<boolean>;
};
