# APP-FE-013 — Safe returned request references

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Reuse and implementation

Request errors classify field validation, forbidden, stale, uncertain and technical failures. Notices show/copy only bounded returned machine codes and request references, with separate copy feedback and safe actionable text. Actor cleanup and asynchronous notice identity checks prevent an old result from updating a new notice. No arbitrary body, stack or form field value is included.

Changed/reused: src/app/core/feedback/request-errors.ts and spec; error-notification.ts/.html and spec; core/localization/crud-messages.ts and arabic-messages.json. Reused ApiFailure, authenticated transport, existing clipboard and feedback owners. No parallel state, transport, identity or storage architecture was introduced.

## Verification and compatibility

Meaningful unit regressions cover explicit help actions/locale/revision/actor/focus, required readiness aggregation, typed notification queries/server totals, safe exact reference copying and calendar Gregorian/DST/microsecond/actor semantics. The expanded focused Angular run passed 404 tests in 69 files. Development browser foundations exercise Help, current-ref mark-read, support-reference copying, calendar views, English/Persian RTL and accessibility with isolated fixtures. Production isolation is checked by the deterministic delivery gate.

Final local evidence is the final `mise run check` result in `artifacts/check/manifest.json` and its command logs; only exit 0 with zero diagnostic counts and unchanged source hashes establishes that result. This record does not claim a real backend pass for new capabilities. Focused logs, including intermediate failures, are retained under `/tmp/app-fe-wave5/`; the failure history is in docs/delivery/GATES.md.

No dependencies, migrations, seeds, shared data, paid calls or deployment were changed. Peer files were read only. The graph is refreshed with AST-only `graphify update .` after final edits. Frontend release metadata contains keys/revisions/locales only and validates the copied producer schema hash.

## Remaining acceptance and blocker

APP-BE-015 remains BLOCKED / NOT_RUN and C08 intake/incident contracts are absent. Bounded global client-error reporting, durable incident storage, deduplication/rate limits and operator incident screens are unimplemented. A returned request correlation reference is never described as a stored support incident.

The parent remains BLOCKED until full acceptance and required real-service evidence pass. Local slices, fallback behavior and fixtures do not close the parent task.
