import { arabicFieldTranslations } from '../../shared/domain/field-label';
import messages from './arabic-messages.json';
export const arabicMessages: Readonly<Record<string, string>> = {
  ...arabicFieldTranslations,
  ...messages,
};
