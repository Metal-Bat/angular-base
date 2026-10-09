# APP-FE-014 — Gregorian calendar projections and date semantics

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Reuse and implementation

Reusable accessible agenda/week/month presentation from the same immutable projection, explicit loading/failure/empty/stale states, timezone captions, Gregorian labels in English/Farsi/Arabic and read-only workflow deadlines. Half-open date windows are bounded to 93 days; all-day dates remain civil dates with exclusive ends; timed instants retain microsecond ordering, valid IANA zones and explicit DST gap/fold handling. Actor reset invalidates old projections.

Changed/reused: src/app/features/calendar/domain/calendar-dates.ts, calendar-events.ts and calendar-dates.spec.ts; calendar/presentation/calendar-views and spec; development-only foundation-preview component via runtime-preview.routes.ts. Production replaces that route array with an empty array. No parallel state, transport, identity or storage architecture was introduced.

## Verification and compatibility

Meaningful unit regressions cover explicit help actions/locale/revision/actor/focus, required readiness aggregation, typed notification queries/server totals, safe exact reference copying and calendar Gregorian/DST/microsecond/actor semantics. The expanded focused Angular run passed 404 tests in 69 files. Development browser foundations exercise Help, current-ref mark-read, support-reference copying, calendar views, English/Persian RTL and accessibility with isolated fixtures. Production isolation is checked by the deterministic delivery gate.

Final local evidence is the final `mise run check` result in `artifacts/check/manifest.json` and its command logs; only exit 0 with zero diagnostic counts and unchanged source hashes establishes that result. This record does not claim a real backend pass for new capabilities. Focused logs, including intermediate failures, are retained under `/tmp/app-fe-wave5/`; the failure history is in docs/delivery/GATES.md.

No dependencies, migrations, seeds, shared data, paid calls or deployment were changed. Peer files were read only. The graph is refreshed with AST-only `graphify update .` after final edits. Frontend release metadata contains keys/revisions/locales only and validates the copied producer schema hash.

## Remaining acceptance and blocker

APP-BE-016/017 remain BLOCKED / NOT_RUN; C09 events/reminder APIs are absent. The component is not exposed as a working business calendar. Server list/range binding, navigation to workflow resources, personal event editor/CRUD/conflicts, reminder worker outcomes and two-tab real-service acceptance remain unimplemented. C02 timezone persistence and C03 links await verified producer reconciliation. D03 remains Gregorian; no Jalali claim is made.

The parent remains BLOCKED until full acceptance and required real-service evidence pass. Local slices, fallback behavior and fixtures do not close the parent task.
