import { RenderNode } from './runtime-document';
const owners = new WeakMap<
  RenderNode,
  ReadonlyMap<string, { key: string | null; path: string }>
>();
/** Keep canonical validation focus on the first visible placement; distinguish repeats. */
export function placementInstance(
  root: RenderNode,
  node: RenderNode,
  path: string,
): string {
  if (!node.scope) {
    return '';
  }
  let indexed = owners.get(root);
  if (!indexed) {
    const found = new Map<string, { key: string | null; path: string }>();
    const visit = (current: RenderNode, pointer: string): void => {
      if (
        (
          current.display['runtime_state'] as
            Record<string, unknown> | undefined
        )?.['visible'] === false
      ) {
        return;
      }
      if (
        current.scope &&
        ![
          'vertical',
          'horizontal',
          'grid',
          'repeater',
          'table',
          'action',
          'display',
        ].includes(current.component) &&
        !found.has(current.scope)
      ) {
        found.set(current.scope, { key: current.key, path: pointer });
      }
      current.children.forEach((child, index) =>
        visit(child, pointer + '/children/' + index),
      );
    };
    visit(root, '/root');
    indexed = found;
    owners.set(root, indexed);
  }
  const first = indexed.get(node.scope);
  return (node.key ? first?.key === node.key : first?.path === path)
    ? ''
    : (node.key ?? path);
}
