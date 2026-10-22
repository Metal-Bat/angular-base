import { applyChoiceCardinality } from '../../domain/form-choice-cardinality';
import type { FormInspector } from './form-inspector';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { patchConstraints, patchNode } from '../../domain/form-editing';
import { applyCalculationType } from '../../domain/form-calculation';

export function inspectorProperties(
  view: Pick<
    FormInspector,
    'draft' | 'documents' | 'path' | 'scope' | 'constraints' | 'required'
  >,
): JsonObject {
  const patch = { ...view.draft() } as Record<string, JsonValue>;
  for (const key of ['node_key', 'component', 'scope', 'children']) {
    delete patch[key];
  }
  let result = patchNode(view.documents(), view.path(), patch);
  if (view.scope()) {
    result = patchConstraints(
      result,
      view.scope()!,
      view.constraints(),
      view.required(),
    );
  }
  if (view.scope() && view.draft()['calculation']) {
    result = applyCalculationType(
      result,
      view.scope()!,
      view.draft()['calculation'] as JsonObject,
    );
  }
  return view.scope()
    ? applyChoiceCardinality(result, view.scope()!, view.draft())
    : result;
}
