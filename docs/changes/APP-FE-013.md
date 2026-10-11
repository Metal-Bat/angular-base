# APP-FE-013 — Safe returned request references

Current status (2026-10-10): **DONE / VERIFIED_INTEGRATED**. See the ordered closure below and [current acceptance](../delivery/APP-FE-006-015-ACCEPTANCE.md). Earlier dated entries retain their historical statuses and limitations.

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

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C08: Safe bounded client intake records only allowlisted screen/build/error/correlation fields. Durable support receipts remain distinct from correlation-only references. Intake outage cannot recursively report itself. Authorized incident search/detail/history and confirmed acknowledge/resolve use actual generated operations.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Actual safe intake/receipt, support actions/audit, ordinary-user denial and diagnostics-store failure acceptance remain required. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered technical-failure continuation — 2026-10-10

Reuse RequestErrors, SupportReporter, the existing safe intake and operator incident UI. A transport failure without a server header now gets a generated UUID correlation under the implemented `ClientFailure.request_id` contract; this same UUID is displayed and passed to the existing bounded reporter. It is never presented as a durable incident identity. The intake still sends exactly screen/build/approved error/request ID, with no URL query, input, stack or arbitrary exception text.

`/tmp/ordered-013-regression-before.log` failed the new headerless-network regression while the existing cases passed. `/tmp/ordered-013-regression-after.log` passed all three cases, including sink-unavailable honesty and actor cleanup. The full final gate remains required.

The scoped actual acceptance harness adds temporary guarded fault triggers only in its owned disposable database, with test/project/loopback/task checks. It does not modify backend source, migrations, applied revisions or shared data. One trigger rejects incident persistence; a separate after-insert trigger rejects only the owned marker form command, proving actual transaction rollback. The triggers are removed by scoped cleanup and the existing harness removes its owned services even after failure. Expected `database.failure` and `support.recording_unavailable` records remain in the manifest with exact counts; unexpected diagnostics still fail the run. They are deliberate failure-test evidence, not a new SDK exception or a zero-error ordinary-service claim.

## Ordered APP-FE-013 actual acceptance — 2026-10-10

`/tmp/ordered-013-paired2.log` and `artifacts/paired-foundations-013/manifest.json` record exit 0 for 5 actual production-Firefox scenarios. Real durable intake, recorder outage, transaction rollback with a retained typed draft and fenced retry, en/fa safe error presentation, recorder recovery, durable support identity, headerless transport failure with matching client correlation, exactly four approved payload fields, no recursive intake, ordinary incident denial, operator acknowledgment/resolution and safe audit passed. Browser diagnostics are empty. The scoped backend log retains exactly two `database.failure` warnings and two `support.recording_unavailable` errors caused by the owned injected faults; no other diagnostics occurred. These records are required failure evidence and are not described as a zero-error ordinary run or an accepted SDK exception.

Backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`; frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`; immutable backend source start/end `27d12719ec82ca02ae462ad079e16a6b9cafdaff26d8735208d73a1215901ce1`; frontend source start/end `18886a35c95dee0a91f2e477d846a98340aaa59a16cea4ac6b66c96ab3ff1df4`; actual HTTP contract match `228c1b09299fcb585fbd1e9a2ead8cf5ce229ccca00ffb27923d8466c6be3725`. `/tmp/ordered-013-lint2.log` and `/tmp/ordered-013-build2.log` passed without warnings. Full final `mise run check` remains required before parent completion.

The first actual run proved sink-outage/rollback/recovery but its network assertion matched the previous toast. That failure is retained under `/tmp/ordered-013-paired1.log` and the timestamped artifacts. The corrected test waits for the newly generated correlation and its actual intake rather than a prior receipt. Future failed fault runs also retain sanitized partial service failure records; the first run retains browser/HTTP evidence but its temporary full service log was not retained.

## Ordered closure — 2026-10-10

Current APP-FE-013 status is DONE / VERIFIED_INTEGRATED. The actual task-specific evidence above and the complete zero-warning pre-closure gate establish this status; the dated missing-producer and pending-gate prose above is historical. [The consolidated closure](../delivery/APP-FE-006-015-ACCEPTANCE.md) records the twelve exit-0 commands, 507 tests, ten Firefox scopes, source identity, retained failures and exact acceptance boundaries. The final post-documentation gate is `artifacts/check/manifest.json` with its complete command logs; it must pass on the unchanged final tree.
