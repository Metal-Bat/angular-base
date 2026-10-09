/** Presentation model; C06 installation/definition wire binding awaits its producer. */
export type ReadinessStatus =
  'ready' | 'blocked' | 'unknown' | 'not_applicable';
export type ReadinessCheck = {
  key: string;
  label: string;
  category: string;
  required: boolean;
  status: ReadinessStatus;
  reason: string;
};
export function readinessStatus(
  checks: readonly ReadinessCheck[],
): ReadinessStatus {
  const required = checks.filter((check) => check.required);
  if (required.some((check) => check.status === 'blocked')) {
    return 'blocked';
  }
  if (
    !required.length ||
    required.some(
      (check) => !['ready', 'not_applicable'].includes(check.status),
    )
  ) {
    return 'unknown';
  }
  return 'ready';
}
export const readinessLabels: Record<ReadinessStatus, string> = {
  ready: 'Ready',
  blocked: 'Blocked',
  unknown: 'Unknown',
  not_applicable: 'Not applicable',
};
