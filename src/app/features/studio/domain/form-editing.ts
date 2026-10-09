import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { authoredNode, replaceAuthored } from './form-authoring';
export type FormEditState = {
  documents: JsonObject;
  selection: readonly number[];
};
export class FormHistory {
  private past: FormEditState[] = [];
  private future: FormEditState[] = [];
  record(state: FormEditState): void {
    this.past.push(structuredClone(state));
    if (this.past.length > 20) {
      this.past.shift();
    }
    this.future = [];
  }
  take(state: FormEditState, redo = false): FormEditState | null {
    const next = (redo ? this.future : this.past).pop();
    if (next) {
      (redo ? this.past : this.future).push(structuredClone(state));
    }
    return next ?? null;
  }
  clear(): void {
    this.past = [];
    this.future = [];
  }
}
export function renderOf(documents: JsonObject): JsonObject {
  return documents['render_schema'] as JsonObject;
}
export function schemaAt(documents: JsonObject, scope: string): JsonObject {
  let value: JsonValue | undefined = documents['data_schema'];
  for (const token of scope.split('/').slice(1)) {
    if (['__proto__', 'constructor', 'prototype'].includes(token)) {
      throw Error('Invalid field scope');
    }
    value =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as JsonObject)[token]
        : undefined;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Error('Invalid field scope');
  }
  return value as JsonObject;
}
export function patchNode(
  documents: JsonObject,
  path: readonly number[],
  patch: JsonObject,
): JsonObject {
  const node = authoredNode(renderOf(documents), path);
  if (
    patch['scope'] !== undefined ||
    patch['component'] !== undefined ||
    patch['node_key'] !== undefined
  ) {
    throw Error('Stable field identity cannot be changed');
  }
  return {
    ...documents,
    render_schema: replaceAuthored(renderOf(documents), path, {
      ...node,
      ...patch,
    }),
  };
}
export function patchConstraints(
  documents: JsonObject,
  scope: string,
  constraints: JsonObject,
  required: boolean,
): JsonObject {
  const result = structuredClone(documents);
  const field = schemaAt(result, scope) as Record<string, JsonValue>;
  const allowed = [
    'minLength',
    'maxLength',
    'pattern',
    'minimum',
    'maximum',
    'minItems',
    'maxItems',
  ];
  validateConstraints(constraints, allowed);
  for (const key of allowed) {
    delete field[key];
    if (constraints[key] !== undefined) {
      field[key] = constraints[key];
    }
  }
  for (const [minimum, maximum] of [
    ['minLength', 'maxLength'],
    ['minimum', 'maximum'],
    ['minItems', 'maxItems'],
  ]) {
    if (
      typeof field[minimum] === 'number' &&
      typeof field[maximum] === 'number' &&
      field[minimum] > field[maximum]
    ) {
      throw Error('Minimum cannot exceed maximum');
    }
  }
  const tokens = scope.split('/');
  const parent = schemaAt(result, tokens.slice(0, -2).join('/')) as Record<
    string,
    JsonValue
  >;
  const name = tokens.at(-1)!;
  const names = ((parent['required'] ?? []) as string[]).filter(
    (key) => key !== name,
  );
  if (required) {
    names.push(name);
  }
  if (names.length) {
    parent['required'] = names;
  } else {
    delete parent['required'];
  }
  return result;
}
export function fieldRequired(documents: JsonObject, scope: string): boolean {
  const parts = scope.split('/');
  const parent = schemaAt(documents, parts.slice(0, -2).join('/'));
  return ((parent['required'] ?? []) as string[]).includes(parts.at(-1)!);
}
export function removePlacement(
  documents: JsonObject,
  path: readonly number[],
): JsonObject {
  if (!path.length) {
    throw Error('The root layout cannot be removed');
  }
  const result = structuredClone(documents);
  const parent = authoredNode(renderOf(result), path.slice(0, -1)) as Record<
    string,
    JsonValue
  >;
  const children = [...(parent['children'] as JsonObject[])];
  if (!children[path.at(-1)!]) {
    throw Error('Selected component no longer exists');
  }
  children.splice(path.at(-1)!, 1);
  parent['children'] = children;
  return result;
}

function validateConstraints(
  constraints: JsonObject,
  keys: readonly string[],
): void {
  for (const key of keys) {
    const value = constraints[key];
    if (value === undefined) {
      continue;
    }
    if (key === 'pattern') {
      if (typeof value !== 'string' || value.length > 1024) {
        throw Error('Invalid validation constraint');
      }
    } else if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      (['minLength', 'maxLength', 'minItems', 'maxItems'].includes(key) &&
        (!Number.isInteger(value) || value < 0)) ||
      (['minItems', 'maxItems'].includes(key) && value > 256)
    ) {
      throw Error('Invalid validation constraint');
    }
  }
}
