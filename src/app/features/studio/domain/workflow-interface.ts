import { JsonObject } from '../../forms/domain/runtime-document';
import { graphSteps } from './workflow-authoring';
import { inspectorFor } from './node-inspector';
import { childSourceCompatible } from './subprocess-pin';
export type InterfaceSource = {
  key: string;
  label: string;
  step: string;
  port: string;
  schema: JsonObject;
};
export function interfaceSources(
  graph: JsonObject,
  catalog: readonly JsonObject[],
): InterfaceSource[] {
  return graphSteps(graph).flatMap((step) =>
    (inspectorFor(step, catalog)?.ports ?? [])
      .filter(
        (port) =>
          port['direction'] === 'OUTPUT' &&
          port['value_schema'] &&
          typeof port['value_schema'] === 'object',
      )
      .map((port) => ({
        key: JSON.stringify([step['key'], port['port_key']]),
        label: String(step['key']) + ' · ' + String(port['port_key']),
        step: String(step['key']),
        port: String(port['port_key']),
        schema: port['value_schema'] as JsonObject,
      })),
  );
}
export function interfaceRows(value: JsonObject, key: string): JsonObject[] {
  return (value[key] ?? []) as JsonObject[];
}
/** Mirrors the producer's START-to-FINISH path check; validation remains authoritative. */
function priorToFinish(
  graph: JsonObject,
  source: string,
  target: string,
): boolean {
  const start = graphSteps(graph).find((step) => step['type_code'] === 'START');
  if (!start || source === target) {
    return false;
  }
  const edges = (graph['transitions'] ?? []) as JsonObject[];
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const from = String(edge['source']);
    adjacency.set(from, [
      ...(adjacency.get(from) ?? []),
      String(edge['target']),
    ]);
  }
  const pending = [String(start['key'])];
  const seen = new Set<string>();
  while (pending.length) {
    const current = pending.pop()!;
    if (current === source || seen.has(current)) {
      continue;
    }
    if (current === target) {
      return false;
    }
    seen.add(current);
    pending.push(...(adjacency.get(current) ?? []));
  }
  return true;
}
export function interfaceErrors(
  value: JsonObject,
  graph: JsonObject,
  catalog: readonly JsonObject[],
): string[] {
  const errors: string[] = [];
  const inputs = interfaceRows(value, 'inputs');
  const outputs = interfaceRows(value, 'outputs');
  if (
    !String(value['category'] ?? 'general').trim() ||
    String(value['category'] ?? '').length > 64
  ) {
    errors.push('Enter a category of up to 64 characters.');
  }
  for (const rows of [inputs, outputs]) {
    const names = rows.map((row) => String(row['name'] ?? ''));
    if (
      rows.length > 64 ||
      new Set(names).size !== names.length ||
      names.some((name) => !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name))
    ) {
      errors.push(
        'Use unique port names starting with a Latin letter, up to 64 letters, digits or underscores.',
      );
    }
  }
  const outcomes = Object.entries((value['outcomes'] ?? {}) as JsonObject);
  if (invalidOutcomes(outcomes, graph)) {
    errors.push(
      'Choose a distinct Finish step for each business outcome; failure is reserved.',
    );
  }
  const sources = interfaceSources(graph, catalog);
  for (const output of outputs) {
    const source = sources.find(
      (item) =>
        item.step === output['source_step'] &&
        item.port === output['source_port'],
    );
    if (
      !source ||
      !output['value_schema'] ||
      !childSourceCompatible(
        source.schema,
        output['value_schema'] as JsonObject,
      ) ||
      outcomes.some(
        ([, finish]) => !priorToFinish(graph, source.step, String(finish)),
      )
    ) {
      errors.push(
        'Each output must use a registered port that runs before every declared Finish step.',
      );
    }
  }
  for (const input of inputs) {
    if (
      input['assignment'] &&
      (input['value_schema'] as JsonObject)?.['type'] !== 'string'
    ) {
      errors.push('Assignment inputs require a text schema.');
    }
  }
  return [...new Set(errors)];
}
export function interfaceOutput(
  value: JsonObject,
  index: number,
  source: InterfaceSource,
): JsonObject {
  return {
    ...value,
    outputs: interfaceRows(value, 'outputs').map((row, at) =>
      at === index
        ? {
            ...row,
            source_step: source.step,
            source_port: source.port,
            value_schema: structuredClone(source.schema),
          }
        : row,
    ),
  };
}

function invalidOutcomes(
  outcomes: [string, import('../../forms/domain/runtime-document').JsonValue][],
  graph: JsonObject,
): boolean {
  const finishes = graphSteps(graph)
    .filter((step) => step['type_code'] === 'FINISH')
    .map((step) => step['key']);
  return (
    !outcomes.length ||
    outcomes.length > 16 ||
    outcomes.some(
      ([name, step]) =>
        !name.trim() ||
        name.length > 64 ||
        name === 'failure' ||
        !finishes.includes(step),
    ) ||
    new Set(outcomes.map(([, step]) => step)).size !== outcomes.length
  );
}
