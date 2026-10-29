import { JsonObject } from '../../../shared/domain/json-value';
export function missingActionRoutes(
  graph: JsonObject,
  selected: string,
): string[] {
  const step = (graph['steps'] as JsonObject[]).find(
    (item) => item['key'] === selected,
  );
  const actions = ((step?.['task_contract'] as JsonObject | undefined)?.[
    'actions'
  ] ?? []) as JsonObject[];
  const transitions = (graph['transitions'] ?? []) as JsonObject[];
  return actions
    .filter(
      (action) =>
        !transitions.some(
          (edge) =>
            edge['source'] === selected &&
            edge['outcome'] === action['outcome_key'],
        ),
    )
    .map((action) => String(action['outcome_key']));
}
