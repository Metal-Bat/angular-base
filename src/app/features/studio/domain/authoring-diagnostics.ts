import { JsonObject } from '../../forms/domain/runtime-document';
import { outline } from './form-authoring';
import { graphSteps } from './workflow-authoring';
export type AuthorIssue = {
  pointer: string;
  code: string;
  node: string | null;
  path: readonly number[] | null;
  edge: string | null;
};
export function authorIssues(
  value: unknown,
  document: JsonObject,
  form = false,
): AuthorIssue[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  const input = value as { issues?: unknown };
  if (!Array.isArray(input.issues)) {
    return [];
  }
  return input.issues.slice(0, 256).flatMap((issue: unknown) => {
    if (!issue || typeof issue !== 'object') {
      return [];
    }
    const entry = issue as { pointer?: unknown; code?: unknown };
    if (typeof entry.pointer !== 'string' || typeof entry.code !== 'string') {
      return [];
    }
    const pointer = entry.pointer.replace(/^\/graph/, '');
    let path: readonly number[] | null = null;
    let node: string | null = null;
    let edge: string | null = null;
    if (form) {
      path = formIssuePath(pointer, document);
    } else {
      const tokens = pointer.split('/');
      if (tokens[1] === 'steps') {
        node =
          String(graphSteps(document)[Number(tokens[2])]?.['key'] ?? '') ||
          null;
      }
      if (['transitions', 'bindings'].includes(tokens[1])) {
        const rows = document[tokens[1]] as readonly JsonObject[] | undefined;
        const row = rows?.[Number(tokens[2])];
        edge = tokens[1] + '/' + tokens[2];
        node =
          typeof row?.['source'] === 'string'
            ? row['source']
            : typeof row?.['step'] === 'string'
              ? row['step']
              : null;
      }
    }
    return [{ pointer: entry.pointer, code: entry.code, node, path, edge }];
  });
}

function formIssuePath(
  pointer: string,
  document: JsonObject,
): readonly number[] | null {
  const items = outline(document['render_schema'] as JsonObject);
  const matched = [...items].reverse().find((item) => {
    const location =
      '/render_schema/root' +
      item.path.map((index) => '/children/' + index).join('');
    return (
      pointer.startsWith(location + '/') ||
      pointer === location ||
      (item.scope !== null && pointer.endsWith(item.scope))
    );
  });
  return matched?.path ?? null;
}
