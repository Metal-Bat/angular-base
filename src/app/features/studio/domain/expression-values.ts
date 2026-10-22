import { JsonObject } from '../../forms/domain/runtime-document';
import { mappingSources } from './mapping-sources';
/** Server-authorized value paths; prior outputs must still dominate in the current draft. */
export function expressionValues(
  rows: readonly JsonObject[],
  graph: JsonObject,
  selected: string,
): string[] {
  const prior = new Set(
    mappingSources(rows, graph, selected)
      .filter((row) => row.binding['source_kind'] === 'STEP_OUTPUT')
      .map((row) => row.key),
  );
  const declared = ((graph['bindings'] ?? []) as JsonObject[])
    .filter(
      (binding) =>
        binding['source_kind'] === 'REQUEST' &&
        !!binding['source_schema'] &&
        Object.keys(binding['source_schema'] as JsonObject).length &&
        !!binding['source_path'],
    )
    .map(
      (binding) =>
        'request.' +
        String(binding['source_path'])
          .replace(/^\//, '')
          .split('/')
          .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
          .join('.'),
    );
  return [
    ...new Set(
      rows
        .filter(
          (row) =>
            typeof row['path'] === 'string' &&
            (row['source'] !== 'request' ||
              declared.some(
                (path) =>
                  row['path'] === path ||
                  String(row['path']).startsWith(path + '.'),
              )) &&
            (row['source'] === 'step_output'
              ? prior.has(String(row['path']))
              : ['request', 'process', 'client', 'current_user'].some(
                  (source) =>
                    row['source'] === source &&
                    String(row['path']).startsWith(source + '.'),
                )),
        )
        .map((row) => String(row['path'])),
    ),
  ];
}
