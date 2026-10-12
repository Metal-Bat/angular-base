import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { addPrimitive, authoredNode, palette } from './form-authoring';
import { FormEditState, renderOf } from './form-editing';
import { nextFieldName } from './form-documents';

export function addQuickField(
  documents: JsonObject,
  selected: readonly number[],
  kind: (typeof palette)[number],
  label: string,
): FormEditState {
  const render = renderOf(documents);
  let parent = selected;
  while (
    parent.length &&
    !['vertical', 'horizontal', 'grid', 'repeater', 'table'].includes(
      String(authoredNode(render, parent)['component']),
    )
  ) {
    parent = parent.slice(0, -1);
  }
  const next = addPrimitive(documents, parent, kind, nextFieldName(documents));
  const children = authoredNode(renderOf(next), parent)[
    'children'
  ] as JsonObject[];
  (children.at(-1)! as Record<string, JsonValue>)['label'] = label;
  return { documents: next, selection: [...parent, children.length - 1] };
}
