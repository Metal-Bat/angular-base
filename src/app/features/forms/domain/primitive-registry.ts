import { PrimitiveKind, RenderNode } from './runtime-document';
export const implementedPrimitives: readonly PrimitiveKind[] = [
  'action',
  'boolean',
  'calculated',
  'choice',
  'date',
  'datetime',
  'display',
  'grid',
  'group',
  'horizontal',
  'integer',
  'number',
  'text',
  'textarea',
  'user',
  'vertical',
  'attachment_collection',
  'media',
  'repeater',
  'table',
];
export const deferredPrimitives: readonly PrimitiveKind[] = [];
export function unsupportedNodes(node: RenderNode): readonly PrimitiveKind[] {
  return [
    ...new Set([
      ...(!implementedPrimitives.includes(node.component)
        ? [node.component]
        : []),
      ...node.children.flatMap(unsupportedNodes),
    ]),
  ];
}
export function isLayout(kind: PrimitiveKind): boolean {
  return ['vertical', 'horizontal', 'grid'].includes(kind);
}
