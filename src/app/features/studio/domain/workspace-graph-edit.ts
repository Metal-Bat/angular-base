import { JsonObject } from '../../forms/domain/runtime-document';
import { Workspace } from './authoring';
import { connectionKey } from './workflow-authoring';

/** Priority/condition edits change the rendered identity, not an owned route. */
export function workspaceGraphEdit(
  workspace: Workspace,
  graph: JsonObject,
): { workspace: Workspace; identities: Readonly<Record<string, string>> } {
  const oldRows = (workspace.graph['transitions'] ??
    []) as readonly JsonObject[];
  const rows = (graph['transitions'] ?? []) as readonly JsonObject[];
  const routing = { ...workspace.routing };
  const identities: Record<string, string> = {};
  oldRows.forEach((old, index) => {
    const next = rows[index];
    if (
      oldRows.length !== rows.length ||
      !next ||
      ['source', 'target', 'outcome'].some((key) => old[key] !== next[key])
    ) {
      return;
    }
    const from = connectionKey('transition', old);
    const to = connectionKey('transition', next);
    if (from === to) {
      return;
    }
    identities[from] = to;
    if (routing[from] && !routing[to]) {
      routing[to] = routing[from].map((point) => ({ ...point }));
      delete routing[from];
    }
  });
  remapBindingRoutes(workspace, graph, routing, identities);
  return { workspace: { ...workspace, graph, routing }, identities };
}

function remapBindingRoutes(
  workspace: Workspace,
  graph: JsonObject,
  routing: Workspace['routing'],
  identities: Record<string, string>,
): void {
  const oldRows = (workspace.graph['bindings'] ?? []) as JsonObject[];
  const rows = (graph['bindings'] ?? []) as JsonObject[];
  const canonical = (row: JsonObject): string =>
    JSON.stringify(
      Object.entries(row)
        .filter(([key]) => key !== 'ordinal')
        .sort(([a], [b]) => a.localeCompare(b)),
    );
  const available = new Set(rows);
  const assignments = new Map<JsonObject, JsonObject>();
  for (const old of oldRows) {
    const next = [...available].find(
      (row) => row === old || canonical(row) === canonical(old),
    );
    if (next) {
      assignments.set(old, next);
      available.delete(next);
    }
  }
  // An edit retains its array position. Reorders/removals are matched by content above.
  if (oldRows.length === rows.length) {
    oldRows.forEach((old, index) => {
      const next = rows[index];
      if (
        !assignments.has(old) &&
        available.has(next) &&
        old['step'] === next['step'] &&
        old['target_port'] === next['target_port']
      ) {
        assignments.set(old, next);
        available.delete(next);
      }
    });
  }
  oldRows.forEach((row) => {
    delete routing[connectionKey('binding', row)];
  });
  assignments.forEach((next, old) => {
    const from = connectionKey('binding', old);
    const to = connectionKey('binding', next);
    identities[from] = to;
    if (workspace.routing[from]) {
      routing[to] = workspace.routing[from].map((point) => ({ ...point }));
    }
  });
}
