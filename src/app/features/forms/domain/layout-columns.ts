import { JsonObject, RenderNode } from './runtime-document';

/** C11 RenderOptions.columns is bounded to 1–12; no breakpoint fields exist. */
export function layoutColumns(
  node: Pick<RenderNode, 'component' | 'display'>,
): number {
  if (node.component === 'vertical') {
    return 1;
  }
  const options = node.display['options'];
  const columns =
    options && typeof options === 'object' && !Array.isArray(options)
      ? (options as JsonObject)['columns']
      : null;
  return node.component === 'grid' &&
    typeof columns === 'number' &&
    Number.isInteger(columns) &&
    columns >= 1 &&
    columns <= 12
    ? columns
    : 2;
}
