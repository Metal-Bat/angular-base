import { JsonObject, RenderNode, RuntimeDocument } from './runtime-document';
import { behaviorNodes } from './resolved-behavior';
export function visibleScopes(root: RenderNode): readonly string[] {
  if (
    (root.display['runtime_state'] as JsonObject | undefined)?.['visible'] ===
    false
  ) {
    return [];
  }
  return [
    ...(root.scope ? [root.scope] : []),
    ...root.children.flatMap(visibleScopes),
  ];
}
export function hasVisibleScope(root: RenderNode, scope: string): boolean {
  return visibleScopes(root).includes(scope);
}
export type FormPage = {
  key: string;
  title: string;
  scopes: readonly string[];
};
export function formPages(document: RuntimeDocument): readonly FormPage[] {
  const declared = document.page['pages'];
  if (!Array.isArray(declared) || declared.length > 32) {
    return [];
  }
  const allowed = new Set(
    behaviorNodes(document.render).flatMap((node) =>
      node.scope ? [node.scope] : [],
    ),
  );
  const keys = new Set<string>();
  return declared.flatMap((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return [];
    }
    const { key, title, scopes } = raw;
    if (
      typeof key !== 'string' ||
      keys.has(key) ||
      typeof title !== 'string' ||
      !Array.isArray(scopes) ||
      scopes.length > 256 ||
      !scopes.every(
        (scope): scope is string =>
          typeof scope === 'string' && allowed.has(scope),
      )
    ) {
      return [];
    }
    keys.add(key);
    return [{ key, title, scopes }];
  });
}
/** Shared page membership for runtime rendering and the authoring surface. */
export function pageIncludesScope(
  scope: string,
  scopes: readonly string[],
): boolean {
  return scopes.some(
    (allowed) =>
      scope === allowed ||
      scope.startsWith(allowed + '/') ||
      allowed.startsWith(scope + '/'),
  );
}
export function pageRender(
  root: RenderNode,
  scopes: readonly string[],
): RenderNode {
  const visit = (node: RenderNode): RenderNode => ({
    ...node,
    // Keep original child positions: option/navigation APIs use document pointers.
    display:
      node.scope && !pageIncludesScope(node.scope, scopes)
        ? {
            ...node.display,
            runtime_state: {
              ...((node.display['runtime_state'] ?? {}) as Record<
                string,
                unknown
              >),
              visible: false,
            },
          }
        : node.display,
    children: node.children.map(visit),
  });
  return visit(root);
}
