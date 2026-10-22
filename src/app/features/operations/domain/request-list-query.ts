import {
  emptyQuery,
  ListQuery,
  QueryField,
} from '../../../shared/domain/list-query';
import { JsonObject } from '../../../shared/domain/json-value';

/** Frozen BusinessRequestQuery allowlist, reconciled with requests/domain/dto.py. */
export const requestQueryFields: readonly QueryField[] = [
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'priority', label: 'Priority', type: 'number' },
  { key: 'created_at', label: 'Created At', type: 'datetime' },
  {
    key: 'submitted_at',
    label: 'Submitted At',
    type: 'datetime',
    nullable: true,
  },
  { key: 'closed_at', label: 'Closed At', type: 'datetime', nullable: true },
];
/** The applied query has already passed the owning endpoint/saved-view validation. */
export function requestListQuery(applied: JsonObject | null): ListQuery {
  return {
    ...emptyQuery(),
    ...applied,
    extras: {},
  } as unknown as ListQuery;
}
