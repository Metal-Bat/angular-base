import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { authoredNode, outline, reorderAuthored } from './form-authoring';
import { FormEditState, renderOf } from './form-editing';
import { freshPlacement } from './fresh-placement';

const containers = ['vertical', 'horizontal', 'grid', 'repeater', 'table'];
const layouts = ['vertical', 'horizontal', 'grid'];
const prefix = (parent: readonly number[], path: readonly number[]): boolean =>
  parent.every((index, depth) => path[depth] === index);

// Moving a placement never changes its canonical binding or collection ancestry.
function collectionContext(
  render: JsonObject,
  path: readonly number[],
): string {
  return path
    .map((_, depth) => authoredNode(render, path.slice(0, depth)))
    .filter((node) => ['repeater', 'table'].includes(String(node['component'])))
    .map((node) => String(node['scope']))
    .join('|');
}

export function canReparent(
  documents: JsonObject,
  source: readonly number[],
  destination: readonly number[],
): boolean {
  const render = renderOf(documents);
  return (
    source.length > 0 &&
    !prefix(source, destination) &&
    containers.includes(
      String(authoredNode(render, destination)['component']),
    ) &&
    collectionContext(render, source) ===
      collectionContext(render, [...destination, 0])
  );
}

function checkBounds(render: JsonObject): void {
  for (const item of outline(render)) {
    const children = authoredNode(render, item.path)['children'];
    if (Array.isArray(children) && children.length > 100) {
      throw Error('A layout supports at most 100 children');
    }
  }
}

export function reparentPlacement(
  documents: JsonObject,
  source: readonly number[],
  destination: readonly number[],
  insertionIndex?: number,
): FormEditState {
  if (!canReparent(documents, source, destination)) {
    throw Error('Choose a layout in the same collection context');
  }
  const next = structuredClone(documents);
  const render = renderOf(next);
  // Keep the destination object before removal: its numeric path can shift.
  const target = authoredNode(render, destination) as Record<string, JsonValue>;
  const siblings = authoredNode(render, source.slice(0, -1))[
    'children'
  ] as JsonObject[];
  const originalChildren = (target['children'] ?? []) as JsonObject[];
  if (
    insertionIndex !== undefined &&
    (!Number.isInteger(insertionIndex) ||
      insertionIndex < 0 ||
      insertionIndex > originalChildren.length)
  ) {
    throw Error('Choose a valid insertion position');
  }
  let index = insertionIndex ?? originalChildren.length;
  if (
    target === authoredNode(render, source.slice(0, -1)) &&
    source.at(-1)! < index
  ) {
    index--;
  }
  const [node] = siblings.splice(source.at(-1)!, 1);
  const children = (target['children'] ?? []) as JsonObject[];
  children.splice(index, 0, node);
  target['children'] = children;
  checkBounds(render);
  const adjusted = [...destination];
  const depth = source.length - 1;
  if (
    prefix(source.slice(0, -1), destination) &&
    adjusted[depth] > source[depth]
  ) {
    adjusted[depth]--;
  }
  return { documents: next, selection: [...adjusted, index] };
}

export function canDuplicateLayout(
  documents: JsonObject,
  path: readonly number[],
): boolean {
  return (
    path.length > 0 &&
    layouts.includes(
      String(authoredNode(renderOf(documents), path)['component']),
    )
  );
}

// Placement-only duplication: fields, scopes, localization and collection data stay shared.
export function duplicateLayout(
  documents: JsonObject,
  path: readonly number[],
): FormEditState {
  if (!canDuplicateLayout(documents, path)) {
    throw Error('Select a nested layout to duplicate');
  }
  const next = structuredClone(documents);
  const render = renderOf(next);
  const copy = freshPlacement(render, authoredNode(render, path));
  const siblings = authoredNode(render, path.slice(0, -1))[
    'children'
  ] as JsonObject[];
  const index = path.at(-1)! + 1;
  siblings.splice(index, 0, copy);
  checkBounds(render);
  return { documents: next, selection: [...path.slice(0, -1), index] };
}

/** Reorder one placement and its selected path as one local history transaction. */
export function reorderPlacement(
  documents: JsonObject,
  path: readonly number[],
  offset: number,
): FormEditState | null {
  if (!path.length) {
    return null;
  }
  const render = renderOf(documents);
  const parent = authoredNode(render, path.slice(0, -1));
  const target = path.at(-1)! + offset;
  if (target < 0 || target >= (parent['children'] as JsonObject[]).length) {
    return null;
  }
  return {
    documents: {
      ...documents,
      render_schema: reorderAuthored(render, path, offset),
    },
    selection: [...path.slice(0, -1), target],
  };
}
