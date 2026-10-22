import { JsonObject } from '../../forms/domain/runtime-document';
import { interfaceDocument } from './interface-document';
export function subprocessRouteChoices(
  graph: JsonObject,
  step: JsonObject,
  children: readonly JsonObject[],
): { available: boolean; outcomes: string[] } {
  if (step['type_code'] !== 'SUBPROCESS') {
    return { available: true, outcomes: [] };
  }
  const pin = (step['subprocess'] as JsonObject | undefined)?.[
    'workflow_version_ref'
  ];
  const child = children.find(
    (row) =>
      row['category'] === 'subprocess' &&
      (row['metadata'] as JsonObject | undefined)?.['workflow_version_ref'] ===
        pin,
  );
  const metadata = child?.['metadata'] as JsonObject | undefined;
  const contract = metadata?.['interface'];
  if (
    child &&
    metadata?.['runtime_available'] !== false &&
    interfaceDocument(contract)
  ) {
    return {
      available: true,
      outcomes: [
        ...Object.keys((contract['outcomes'] ?? {}) as JsonObject),
        'failure',
      ],
    };
  }
  return {
    available: false,
    outcomes: ((graph['transitions'] ?? []) as JsonObject[])
      .filter((edge) => edge['source'] === step['key'])
      .map((edge) => String(edge['outcome'])),
  };
}
