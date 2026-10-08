import { JsonObject, JsonValue } from './runtime-document';
import { MISSING } from './canonical-values';
import { rowPath } from './row-values';
export function correctionValue(
  data: JsonObject | null,
  scope: string,
  item: string | null,
  identities: Readonly<Record<string, readonly string[]>> | null,
): JsonValue | typeof MISSING {
  if (!data || (item && !identities)) {
    return MISSING;
  }
  const tokens = scope.split('/').slice(1);
  if (!item) {
    if (tokens.includes('items')) {
      return MISSING;
    }
    let value: JsonValue = data;
    for (const key of rowPath(scope)) {
      if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) {
        return MISSING;
      }
      value = (value as JsonObject)[key];
    }
    return value;
  }
  const visit = (
    value: JsonValue,
    position: number,
    path: string,
    matched: boolean,
  ): JsonValue | typeof MISSING => {
    if (position >= tokens.length) {
      return matched ? value : MISSING;
    }
    if (tokens[position] === 'items') {
      if (!Array.isArray(value)) {
        return MISSING;
      }
      for (let index = 0; index < value.length; index++) {
        const found = visit(
          value[index],
          position + 1,
          path + '/' + index,
          matched || identities?.[path]?.[index] === item,
        );
        if (found !== MISSING) {
          return found;
        }
      }
      return MISSING;
    }
    const encoded = tokens[position + 1];
    const key = encoded?.replace(/~1/g, '/').replace(/~0/g, '~');
    if (
      tokens[position] !== 'properties' ||
      !key ||
      !value ||
      typeof value !== 'object' ||
      !Object.hasOwn(value, key)
    ) {
      return MISSING;
    }
    return visit(
      (value as JsonObject)[key],
      position + 2,
      path + '/' + encoded,
      matched,
    );
  };
  return visit(data, 0, '', false);
}
