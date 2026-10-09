# APP-FE-010 — Help topics and release metadata

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Reuse and implementation

Typed eleven-topic English/Farsi static catalog, permission-filtered Help page, contextual links, explicit open/dismiss/revisit/help-only reset, locale/revision identities and focus restoration. Status is explicitly session-only and clears on actor change; rendering the list alone never records a view.

Changed/reused: src/app/features/help/domain/help-catalog.json and help-catalog.ts; help/presentation/help-page; app.routes.ts; core/layout/app-shell; operations-guide.html; scripts/check-help-catalog.mjs; docs/delivery/help-release-metadata.json. No parallel state, transport, identity or storage architecture was introduced.

## Verification and compatibility

Meaningful unit regressions cover explicit help actions/locale/revision/actor/focus, required readiness aggregation, typed notification queries/server totals, safe exact reference copying and calendar Gregorian/DST/microsecond/actor semantics. The expanded focused Angular run passed 404 tests in 69 files. Development browser foundations exercise Help, current-ref mark-read, support-reference copying, calendar views, English/Persian RTL and accessibility with isolated fixtures. Production isolation is checked by the deterministic delivery gate.

Final local evidence is the final `mise run check` result in `artifacts/check/manifest.json` and its command logs; only exit 0 with zero diagnostic counts and unchanged source hashes establishes that result. This record does not claim a real backend pass for new capabilities. Focused logs, including intermediate failures, are retained under `/tmp/app-fe-wave5/`; the failure history is in docs/delivery/GATES.md.

No dependencies, migrations, seeds, shared data, paid calls or deployment were changed. Peer files were read only. The graph is refreshed with AST-only `graphify update .` after final edits. Frontend release metadata contains keys/revisions/locales only and validates the copied producer schema hash.

## Remaining acceptance and blocker

C05 / APP-BE-010 now has a frozen wave-four handoff and focused backend evidence, but remains BLOCKED / IMPLEMENTED pending its full gate. Persisted self-only state, compatibility responses and paired seen/dismiss/reset acceptance await a verified producer and client reconciliation.

The parent remains BLOCKED until full acceptance and required real-service evidence pass. Local slices, fallback behavior and fixtures do not close the parent task.
