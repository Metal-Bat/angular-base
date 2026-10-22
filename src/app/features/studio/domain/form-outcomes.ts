import { JsonObject } from '../../forms/domain/runtime-document';
import { authoredNode, outline } from './form-authoring';
import { renderOf } from './form-editing';

/** Change declared form outcomes only; workflow transition semantics remain untouched. */
export function changeFormOutcome(
  documents: JsonObject,
  value: string,
  remove = false,
): JsonObject {
  const render = renderOf(documents);
  const outcomes = render['outcomes'] ?? [];
  if (
    !Array.isArray(outcomes) ||
    outcomes.some((item) => typeof item !== 'string')
  ) {
    throw Error('Existing settings are preserved');
  }
  if (remove) {
    const used = outline(render).some(
      (item) => authoredNode(render, item.path)['outcome'] === value,
    );
    if (used) {
      throw Error('This outcome is used by an action field.');
    }
    if (!outcomes.includes(value)) {
      return documents;
    }
  } else if (
    !value.trim() ||
    value.length > 64 ||
    outcomes.length >= 32 ||
    outcomes.includes(value)
  ) {
    throw Error('Use a unique outcome of at most 64 characters.');
  }
  return {
    ...documents,
    render_schema: {
      ...render,
      outcomes: remove
        ? outcomes.filter((item) => item !== value)
        : [...outcomes, value],
    },
  };
}
