import { nodeLabel } from '../../forms/domain/node-label';
import {
  JsonObject,
  RenderNode,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
import {
  indicesFromPath,
  keysAt,
  writableScope,
} from '../../forms/domain/row-values';

export type AttachmentTarget = {
  scope: string;
  rows: readonly string[];
  label: string;
};

/** Revalidate the original canonical field/row without retargeting an upload. */
export function attachmentTarget(
  document: RuntimeDocument,
  path: string,
  requireWritable = true,
): AttachmentTarget | null {
  if (requireWritable && !['edit', 'correction'].includes(document.purpose)) {
    return null;
  }
  const visit = (node: RenderNode): AttachmentTarget | null => {
    const state = (node.display['runtime_state'] ?? {}) as JsonObject;
    if (state['visible'] === false) {
      return null;
    }
    if (
      node.component === 'attachment_collection' &&
      node.scope &&
      (!requireWritable ||
        (state['enabled'] !== false &&
          writableScope(document, node.scope) &&
          (node.display['options'] as JsonObject | undefined)?.['read_only'] !==
            true))
    ) {
      try {
        const indices = indicesFromPath(node.scope, path);
        return {
          scope: node.scope,
          rows: keysAt(document, node.scope, indices),
          label: nodeLabel(node),
        };
      } catch {
        // Another placement may own this path; malformed/moved rows cannot match.
      }
    }
    for (const child of node.children) {
      const target = visit(child);
      if (target) {
        return target;
      }
    }
    return null;
  };
  return visit(document.render);
}

export function sameAttachmentTarget(
  left: AttachmentTarget | null,
  right: AttachmentTarget | null,
): boolean {
  return (
    !!left &&
    !!right &&
    left.scope === right.scope &&
    left.rows.length === right.rows.length &&
    left.rows.every((key, index) => key === right.rows[index])
  );
}
