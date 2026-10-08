import { RenderNode, RuntimeDocument } from './runtime-document';
import { behaviorNodes } from './resolved-behavior';
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
export function pageRender(
  root: RenderNode,
  scopes: readonly string[],
): RenderNode {
  const visit = (node: RenderNode): RenderNode | null => {
    if (
      node.scope &&
      !scopes.some(
        (scope) =>
          node.scope === scope ||
          node.scope!.startsWith(scope + '/') ||
          scope.startsWith(node.scope! + '/'),
      )
    ) {
      return null;
    }
    return {
      ...node,
      children: node.children.flatMap((child) => {
        const projected = visit(child);
        return projected ? [projected] : [];
      }),
    };
  };
  return visit(root) ?? { ...root, scope: null, children: [] };
}
