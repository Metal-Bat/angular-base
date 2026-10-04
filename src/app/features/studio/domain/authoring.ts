import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
export type ResourceKey =
  | 'forms'
  | 'form-versions'
  | 'workflows'
  | 'workflow-versions'
  | 'clients'
  | 'client-releases'
  | 'request-types'
  | 'form-components'
  | 'form-component-versions'
  | 'form-data-types'
  | 'form-data-type-versions';
export type FieldSpec = {
  key: string;
  title: string;
  type: 'text' | 'number' | 'boolean' | 'json';
  required: boolean;
  nullable: boolean;
  options: readonly string[];
  initial: JsonValue | undefined;
  schema: JsonObject;
};
export type ResourceSpec = {
  key: ResourceKey;
  title: string;
  permission: string;
  editor: 'form' | 'workflow' | null;
  fields: readonly FieldSpec[];
  createFields: readonly FieldSpec[];
  queryFields: readonly FieldSpec[];
  actions: readonly string[];
};
export type Point = { x: number; y: number };
export type Workspace = {
  dialect: 'bpms.workspace/1';
  graph: JsonObject;
  positions: Record<string, Point>;
  viewport: Point & { zoom: number };
  collapsed: string[];
  routing: Record<string, Point[]>;
};
export type WorkspaceState = {
  reference: string | null;
  version: string;
  document: Workspace;
  promoted: string | null;
};
export function parseDocument(text: string): JsonObject {
  if (text.length > 262144) {
    throw Error('Document is too large');
  }
  const value: unknown = JSON.parse(text);
  let count = 0;
  const visit = (node: unknown, depth: number): void => {
    if (typeof node === 'number' && !Number.isFinite(node)) {
      throw Error('Nonfinite number');
    }
    if (++count > 10000 || depth > 32) {
      throw Error('Document is too complex');
    }
    if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) {
          throw Error('Unsafe property');
        }
        visit(child, depth + 1);
      }
    }
  };
  visit(value, 0);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Error('An object is required');
  }
  return value as JsonObject;
}
export function projectFields(
  fields: readonly FieldSpec[],
  value: JsonObject,
): JsonObject {
  const output: Record<string, JsonValue> = {};
  for (const field of fields) {
    const item = value[field.key];
    if (item === undefined) {
      if (field.required) {
        throw Error('Required: ' + field.title);
      }
      continue;
    }
    if (item === null) {
      if (!field.nullable) {
        throw Error('Null is not allowed: ' + field.title);
      }
      output[field.key] = null;
      continue;
    }
    if (
      field.type === 'text' &&
      (typeof item !== 'string' || (field.required && !item.trim()))
    ) {
      throw Error('Invalid: ' + field.title);
    }
    if (
      field.type === 'number' &&
      (typeof item !== 'number' || !Number.isFinite(item))
    ) {
      throw Error('Invalid: ' + field.title);
    }
    if (field.type === 'boolean' && typeof item !== 'boolean') {
      throw Error('Invalid: ' + field.title);
    }
    if (field.options.length && !field.options.includes(String(item))) {
      throw Error('Invalid choice: ' + field.title);
    }
    output[field.key] = item;
  }
  return output;
}
export function emptyWorkspace(): Workspace {
  return {
    dialect: 'bpms.workspace/1',
    graph: { steps: [], bindings: [], targets: [], transitions: [] },
    positions: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    collapsed: [],
    routing: {},
  };
}
