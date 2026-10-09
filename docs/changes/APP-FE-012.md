# APP-FE-012 — Notification filters and authoritative unread totals

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Reuse and implementation

Extended the existing notification inbox with applied read-status/subject filters and server-reported totals. The shell preview requests unread rows and uses the server total independently of page length. Opening a detail is read-only; explicit mark-read rereads the current mutation reference. Abort/generation fences and actor cleanup protect lists, details and polling.

Changed/reused: src/app/features/operations/application/personal-services-port.ts; operations/infrastructure/personal-services.ts and spec; operations/presentation/personal-services; core/notifications/notification-preview.ts and spec; core/layout/workspace-notifications. No parallel state, transport, identity or storage architecture was introduced.

## Verification and compatibility

Meaningful unit regressions cover explicit help actions/locale/revision/actor/focus, required readiness aggregation, typed notification queries/server totals, safe exact reference copying and calendar Gregorian/DST/microsecond/actor semantics. The expanded focused Angular run passed 404 tests in 69 files. Development browser foundations exercise Help, current-ref mark-read, support-reference copying, calendar views, English/Persian RTL and accessibility with isolated fixtures. Production isolation is checked by the deterministic delivery gate.

Final local evidence is the final `mise run check` result in `artifacts/check/manifest.json` and its command logs; only exit 0 with zero diagnostic counts and unchanged source hashes establishes that result. This record does not claim a real backend pass for new capabilities. Focused logs, including intermediate failures, are retained under `/tmp/app-fe-wave5/`; the failure history is in docs/delivery/GATES.md.

No dependencies, migrations, seeds, shared data, paid calls or deployment were changed. Peer files were read only. The graph is refreshed with AST-only `graphify update .` after final edits. Frontend release metadata contains keys/revisions/locales only and validates the copied producer schema hash.

## Remaining acceptance and blocker

APP-BE-014 remains BLOCKED / NOT_RUN; APP-BE-013 is map/design evidence only. C07 unified event taxonomy, MAP-01–14 coverage, per-event deep links and durable resolver binding remain incomplete. C03 has a frozen wave-four proposal, but its producer APP-BE-008 remains BLOCKED / IMPLEMENTED. Current links continue using existing fixed Angular routes and current detail refs.

The parent remains BLOCKED until full acceptance and required real-service evidence pass. Local slices, fallback behavior and fixtures do not close the parent task.
