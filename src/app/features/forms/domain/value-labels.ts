import { RenderNode } from './runtime-document';
import { behaviorNodes } from './resolved-behavior';
import { nodeLabel } from './node-label';
/** Presentation only: canonical scopes and values remain unchanged. */
export function valueLabels(
  root: RenderNode,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    behaviorNodes(root)
      .filter((node) => node.scope)
      .map((node) => [node.scope!, nodeLabel(node)]),
  );
}

export function valueKinds(root: RenderNode): Readonly<Record<string, string>> {
  return Object.fromEntries(
    behaviorNodes(root)
      .filter((node) => node.scope)
      .map((node) => [node.scope!, node.component]),
  );
}
