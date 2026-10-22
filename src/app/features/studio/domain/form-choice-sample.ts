import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { authoredNode, outline } from './form-authoring';
import { renderOf, schemaAt } from './form-editing';

/** Only authoring sample values change here; no saved answers or runtime commands. */
export function reconcileChoiceSample(
  previous: JsonObject,
  next: JsonObject,
  data: JsonObject,
): { data: JsonObject; cleared: boolean } {
  const changes = new Map<string, boolean>();
  for (const item of outline(renderOf(next))) {
    if (
      !item.scope ||
      authoredNode(renderOf(next), item.path)['component'] !== 'choice'
    ) {
      continue;
    }
    try {
      const before = schemaAt(previous, item.scope)['type'];
      const after = schemaAt(next, item.scope)['type'];
      const wasList = Array.isArray(before)
        ? before.includes('array')
        : before === 'array';
      const isList = Array.isArray(after)
        ? after.includes('array')
        : after === 'array';
      if (wasList !== isList) {
        changes.set(item.scope, isList);
      }
    } catch {
      /* A new binding has no previous sample to convert. */
    }
  }
  let cleared = false;
  const omitted = Symbol('omitted');
  const visit = (
    value: JsonValue,
    scope: string,
  ): JsonValue | typeof omitted => {
    if (changes.has(scope) && value !== null) {
      if (changes.get(scope)) {
        return Array.isArray(value) ? value : [value];
      }
      if (Array.isArray(value)) {
        if (value.length > 1) {
          cleared = true;
        }
        return value.length === 1 ? value[0] : omitted;
      }
    }
    if (Array.isArray(value)) {
      return value.map((child) => visit(child, scope + '/items') as JsonValue);
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).flatMap(([key, child]) => {
          const result = visit(
            child,
            scope +
              '/properties/' +
              key.replace(/~/g, '~0').replace(/\//g, '~1'),
          );
          return result === omitted ? [] : [[key, result]];
        }),
      );
    }
    return value;
  };
  return {
    data: changes.size ? (visit(data, '') as JsonObject) : data,
    cleared,
  };
}
