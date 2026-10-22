import { JsonObject, RenderNode } from './runtime-document';

/** Authorized, already-resolved presentation text shared by runtime and Studio. */
export function nodeDescription(node: Pick<RenderNode, 'display'>): string {
  const text = (node.display['localized_text'] ?? {}) as JsonObject;
  const accessibility = (node.display['accessibility'] ?? {}) as JsonObject;
  return [
    ...new Set([
      text['help'],
      accessibility['description'] ?? text['description'],
    ]),
  ]
    .filter((value): value is string => typeof value === 'string' && !!value)
    .join('\n');
}
