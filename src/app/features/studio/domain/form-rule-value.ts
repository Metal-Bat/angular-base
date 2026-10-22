import { parseNumberText } from '../../../shared/domain/number-text';
import { JsonValue } from '../../forms/domain/runtime-document';

/** Parse only the explicit comparison type, retaining invalid text in the composer. */
export function parseRuleValue(
  type: string,
  text: string,
): JsonValue | undefined {
  if (type === 'null') {
    return null;
  }
  if (type === 'string') {
    return text;
  }
  if (type === 'boolean') {
    return ['true', 'false'].includes(text) ? text === 'true' : undefined;
  }
  if (!['integer', 'number'].includes(type)) {
    return undefined;
  }
  const value = parseNumberText(text);
  return value !== undefined &&
    (type !== 'integer' || Number.isSafeInteger(value))
    ? value
    : undefined;
}
