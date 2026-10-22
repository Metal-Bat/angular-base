import { fieldLabel } from '../../../shared/domain/field-label';
import { JsonObject, RenderNode } from './runtime-document';

/** Consume authorized resolved text; message lookup remains the producer's responsibility. */
export function nodeLabel(
  node: Pick<RenderNode, 'label' | 'scope' | 'display'>,
): string {
  const accessibility = (node.display['accessibility'] ?? {}) as JsonObject;
  for (const candidate of [accessibility['label'], node.label]) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  const key = node.scope
    ?.split('/')
    .at(-1)
    ?.replaceAll('~1', '/')
    .replaceAll('~0', '~');
  return key ? fieldLabel(key) : '';
}
