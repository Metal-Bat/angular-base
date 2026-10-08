import { JsonObject, RenderNode, RuntimeDocument } from './runtime-document';
export function behaviorNodes(root: RenderNode): readonly RenderNode[] {
  return [root, ...root.children.flatMap(behaviorNodes)];
}
export function effectiveRequired(
  document: RuntimeDocument,
): readonly string[] {
  const nodes = behaviorNodes(document.render);
  return [
    ...new Set([
      ...document.policy.required,
      ...nodes
        .filter(
          (node) =>
            (node.display['runtime_state'] as JsonObject | undefined)?.[
              'required'
            ] === true,
        )
        .map((node) => node.scope ?? ''),
    ]),
  ].filter(
    (scope) =>
      !!scope &&
      !nodes.some(
        (node) =>
          node.scope === scope &&
          (node.display['runtime_state'] as JsonObject | undefined)?.[
            'visible'
          ] === false,
      ),
  );
}
export function overrideFields(
  document: RuntimeDocument,
): readonly RenderNode[] {
  return behaviorNodes(document.render).filter(
    (node) =>
      node.component === 'calculated' &&
      node.scope &&
      document.policy.writable.includes(node.scope) &&
      (node.display['runtime_state'] as JsonObject | undefined)?.[
        'overridable'
      ] === true,
  );
}
