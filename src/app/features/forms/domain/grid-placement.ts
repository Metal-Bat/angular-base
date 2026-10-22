import { JsonObject, RenderNode } from './runtime-document';
/** Responsive presentation stays within the parent's current track count. */
export function gridPlacement(
  node: Pick<RenderNode, 'display'>,
  columns: number,
): { column: string; row: string } {
  const value = node.display['grid'];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { column: 'auto', row: 'auto' };
  }
  const grid = value as JsonObject;
  const column = grid['column'] ?? 1;
  const span = grid['span'] ?? 12;
  const row = grid['row'] ?? 1;
  if (
    typeof column !== 'number' ||
    typeof span !== 'number' ||
    typeof row !== 'number' ||
    !Number.isInteger(column) ||
    !Number.isInteger(span) ||
    !Number.isInteger(row) ||
    column < 1 ||
    span < 1 ||
    column + span > 13 ||
    row < 1 ||
    row > 256
  ) {
    return { column: 'auto', row: 'auto' };
  }
  const start = Math.min(column, columns);
  return {
    column: start + ' / span ' + Math.min(span, columns - start + 1),
    row: String(row),
  };
}
