// Role permission permits entering Operations. Item eligibility and allowed actions
// must come from the current server projection, never from local group membership.
export type TaskAffordances = {
  readonly status: string;
  readonly isCurrentClaimant: boolean;
  readonly purpose: string;
  readonly actions: readonly {
    readonly key: string;
    readonly kind: 'complete' | 'reject' | 'return';
  }[];
};
export function availableTaskActions(
  value: TaskAffordances,
): TaskAffordances['actions'] {
  return value.isCurrentClaimant &&
    value.purpose === 'edit' &&
    ['CLAIMED', 'IN_PROGRESS'].includes(value.status)
    ? value.actions
    : [];
}
