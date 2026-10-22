import { JsonObject } from '../../../shared/domain/json-value';

export const taskStatuses = [
  'OPEN',
  'CLAIMED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'RETURNED',
  'CANCELLED',
  'EXPIRED',
] as const;
export type CartableDraft = {
  status: string;
  time: string;
  after: string;
  before: string;
  overdue: string;
  size: number;
};
function instant(value: string): string | null {
  if (!value) {
    return null;
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw Error('Use a datetime with a timezone.');
  }
  return value;
}
/** CartableQueryDTO is not SearchRequest: no generic filters or sorts are sent. */
export function cartableQuery(
  base: JsonObject | null,
  draft: CartableDraft,
): JsonObject {
  if (!Number.isInteger(draft.size) || draft.size < 1 || draft.size > 100) {
    throw Error('Page size must be between 1 and 100.');
  }
  if (
    !['created_at', 'closed_at'].includes(draft.time) ||
    (draft.status && !taskStatuses.some((status) => status === draft.status))
  ) {
    throw Error('Choose a supported value.');
  }
  const after = instant(draft.after);
  const before = instant(draft.before);
  if (after && before && Date.parse(after) >= Date.parse(before)) {
    throw Error('The end must be after the start.');
  }
  return {
    cartable: base?.['cartable'] ?? 'available',
    page: 1,
    size: draft.size,
    time_field: draft.time,
    status: draft.status || null,
    after,
    before,
    overdue_before: instant(draft.overdue),
  };
}
