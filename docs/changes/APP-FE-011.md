# APP-FE-011 — Readable definition validation and readiness presentation

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Reuse and implementation

PrimeNG readiness table with required-check aggregation, explicit unknown/blocked/non-applicable states and stale hints. Existing workflow graph validation feeds a structure-only panel; the scope notice separates graph validation from installation/provider/worker readiness. Existing issue controls retain their node/edge context and recheck calls the existing read-only validation command.

Changed/reused: src/app/features/readiness/domain/readiness.ts and spec; readiness/presentation/readiness-panel; studio/presentation/workflow-board/workflow-diagnostics.ts/.html. Reused WorkflowBoard validation and issue selection. No parallel state, transport, identity or storage architecture was introduced.

## Verification and compatibility

Meaningful unit regressions cover explicit help actions/locale/revision/actor/focus, required readiness aggregation, typed notification queries/server totals, safe exact reference copying and calendar Gregorian/DST/microsecond/actor semantics. The expanded focused Angular run passed 404 tests in 69 files. Development browser foundations exercise Help, current-ref mark-read, support-reference copying, calendar views, English/Persian RTL and accessibility with isolated fixtures. Production isolation is checked by the deterministic delivery gate.

Final local evidence is the final `mise run check` result in `artifacts/check/manifest.json` and its command logs; only exit 0 with zero diagnostic counts and unchanged source hashes establishes that result. This record does not claim a real backend pass for new capabilities. Focused logs, including intermediate failures, are retained under `/tmp/app-fe-wave5/`; the failure history is in docs/delivery/GATES.md.

No dependencies, migrations, seeds, shared data, paid calls or deployment were changed. Peer files were read only. The graph is refreshed with AST-only `graphify update .` after final edits. Frontend release metadata contains keys/revisions/locales only and validates the copied producer schema hash.

## Remaining acceptance and blocker

APP-BE-011/012 remain BLOCKED / NOT_RUN. C06 installation/definition readiness, authorized repair routes, server checked_at and full repair/revalidate acceptance are unavailable. No provider probe or invented installation result is performed.

The parent remains BLOCKED until full acceptance and required real-service evidence pass. Local slices, fallback behavior and fixtures do not close the parent task.
