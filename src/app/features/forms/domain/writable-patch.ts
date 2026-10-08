import { JsonObject, JsonValue, RuntimeDocument } from './runtime-document';
import { fieldSchema } from './row-values';
const OMIT = Symbol('omit');
export function writablePatch(
  document: RuntimeDocument,
  data: JsonObject,
): JsonObject {
  const related = (scope: string): boolean =>
    document.policy.writable.some(
      (parent) =>
        parent === scope ||
        parent.startsWith(scope + '/') ||
        scope.startsWith(parent + '/'),
    );
  const covered = (scope: string): boolean =>
    document.policy.writable.some(
      (parent) => parent === scope || scope.startsWith(parent + '/'),
    );
  const visit = (value: JsonValue, scope: string): JsonValue | typeof OMIT => {
    if (
      scope &&
      (!related(scope) || fieldSchema(document, scope)['readOnly'] === true)
    ) {
      return OMIT;
    }
    if (Array.isArray(value)) {
      return value.map((entry) => {
        const projected = visit(entry, scope + '/items');
        return projected === OMIT ? {} : projected;
      });
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, JsonValue> = {};
      for (const [key, entry] of Object.entries(value)) {
        const projected = visit(
          entry,
          scope + '/properties/' + key.replace(/~/g, '~0').replace(/\//g, '~1'),
        );
        if (projected !== OMIT) {
          result[key] = projected;
        }
      }
      return Object.keys(result).length || covered(scope) ? result : OMIT;
    }
    return covered(scope) ? value : OMIT;
  };
  const value = visit(data, '');
  return value === OMIT ? {} : (value as JsonObject);
}
