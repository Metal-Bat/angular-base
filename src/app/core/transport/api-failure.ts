export type FieldIssue = { pointer: string; code: string };
export class ApiFailure extends Error {
  constructor(
    readonly httpStatus: number,
    readonly applicationCode: string | number | null,
    readonly requestId: string | null,
    readonly issues: readonly FieldIssue[],
    readonly uncertain = false,
    readonly conflictKind:
      'revision' | 'lifecycle' | 'idempotency' | 'unknown' | null = null,
  ) {
    super(
      httpStatus === 401
        ? 'Your session ended. Sign in again.'
        : httpStatus === 403
          ? 'You do not have access to this action.'
          : uncertain
            ? 'The outcome is unknown. Check the current state before trying again.'
            : httpStatus >= 500 || httpStatus === 0
              ? 'The service is unavailable.'
              : 'The request could not be completed.',
    );
  }
}
export function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid service response.');
  }
  return value as Record<string, unknown>;
}
export function failure(
  status: number,
  body: unknown,
  requestId: string | null,
): ApiFailure {
  let value: Record<string, unknown> = {};
  try {
    value = record(body);
  } catch {
    /* Proxy HTML is never displayed. */
  }
  const code = value['code'];
  let details: Record<string, unknown> = {};
  try {
    details = record(value['data']);
  } catch {
    /* Optional structured details. */
  }
  const rawIssues = details['issues'] ?? value['issues'];
  const issues: FieldIssue[] = Array.isArray(rawIssues)
    ? rawIssues.flatMap((issue: unknown): FieldIssue[] => {
        try {
          const entry = record(issue);
          return typeof entry['pointer'] === 'string' &&
            typeof entry['code'] === 'string'
            ? [{ pointer: entry['pointer'], code: entry['code'] }]
            : [];
        } catch {
          return [];
        }
      })
    : [];
  return new ApiFailure(
    status,
    typeof code === 'string' || typeof code === 'number' ? code : null,
    requestId ??
      (typeof value['request_id'] === 'string' ? value['request_id'] : null),
    issues,
    value['uncertain'] === true,
    ['revision', 'lifecycle', 'idempotency', 'unknown'].includes(
      String(details['conflict_kind']),
    )
      ? (details['conflict_kind'] as
          'revision' | 'lifecycle' | 'idempotency' | 'unknown')
      : null,
  );
}
