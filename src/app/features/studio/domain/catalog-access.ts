import { JsonObject } from '../../../shared/domain/json-value';

export type AccessDraft = {
  kind: 'users' | 'work_groups';
  target: string;
  view: boolean;
  start: boolean;
};
export function catalogGrantBody(
  workflow: boolean,
  draft: AccessDraft,
): JsonObject {
  if (!draft.target || !['users', 'work_groups'].includes(draft.kind)) {
    throw Error('Choose a recipient.');
  }
  if (workflow && !draft.view && !draft.start) {
    throw Error('Choose at least one permission.');
  }
  return {
    user_ref_id: draft.kind === 'users' ? draft.target : null,
    work_group_ref_id: draft.kind === 'work_groups' ? draft.target : null,
    ...(workflow ? { can_view: draft.view, can_start: draft.start } : {}),
  };
}
export function accessStateObserved(
  rows: readonly JsonObject[],
  pages: number,
  pending: { body?: JsonObject; ref?: string },
): boolean {
  if (pending.ref) {
    return pages <= 1 && !rows.some((row) => row['ref_id'] === pending.ref);
  }
  const body = pending.body;
  return (
    !!body &&
    rows.some((row) =>
      Object.entries(body).every(([key, value]) => row[key] === value),
    )
  );
}

export type GrantRow = {
  ref: string;
  recipient: string;
  named: boolean;
  view: boolean;
  start: boolean;
  use: boolean;
};
