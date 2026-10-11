export type DependencyReport = {
  ready: boolean;
  checked_at: string;
  client_readiness: 'not_checked' | 'ready' | 'blocked';
  issues: readonly {
    code: string;
    node_key: string | null;
    pointer: string;
    repair_key: string;
  }[];
  pins: readonly {
    pointer: string;
    resource: { label: string; kind: string; number?: number | null };
  }[];
};
function object(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw Error('Invalid readiness projection');
  }
  return raw as Record<string, unknown>;
}
export function readDependencies(raw: unknown): DependencyReport {
  const row = object(raw);
  if (
    row['schema_version'] !== 1 ||
    row['scope'] !== 'author_publication' ||
    row['requester_eligibility'] !== 'not_checked' ||
    typeof row['ready'] !== 'boolean' ||
    typeof row['checked_at'] !== 'string' ||
    !['not_checked', 'ready', 'blocked'].includes(
      String(row['client_readiness']),
    ) ||
    !Array.isArray(row['issues']) ||
    row['issues'].length > 256 ||
    !Array.isArray(row['pins']) ||
    row['pins'].length > 256
  ) {
    throw Error('Invalid readiness projection');
  }
  return {
    ready: row['ready'],
    checked_at: row['checked_at'],
    client_readiness: row[
      'client_readiness'
    ] as DependencyReport['client_readiness'],
    issues: row['issues'].map((rawIssue) => {
      const issue = object(rawIssue);
      if (
        typeof issue['code'] !== 'string' ||
        typeof issue['pointer'] !== 'string' ||
        typeof issue['repair_key'] !== 'string' ||
        (issue['node_key'] !== null && typeof issue['node_key'] !== 'string')
      ) {
        throw Error('Invalid repair issue');
      }
      return issue as DependencyReport['issues'][number];
    }),
    pins: row['pins'].map((rawPin) => {
      const pin = object(rawPin);
      const resource = object(pin['resource']);
      if (
        typeof pin['pointer'] !== 'string' ||
        typeof resource['label'] !== 'string' ||
        typeof resource['kind'] !== 'string'
      ) {
        throw Error('Invalid dependency');
      }
      return {
        pointer: pin['pointer'],
        resource: {
          label: resource['label'],
          kind: resource['kind'],
          ...(typeof resource['number'] === 'number'
            ? { number: resource['number'] }
            : {}),
        },
      };
    }),
  };
}
