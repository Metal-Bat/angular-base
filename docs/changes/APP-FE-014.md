# APP-FE-014 — Gregorian calendar projections and date semantics

Current status (2026-10-10): **BLOCKED / IMPLEMENTED (verified integrated slice; parent incomplete)**. See the ordered closure below and [current acceptance](../delivery/APP-FE-006-015-ACCEPTANCE.md). Earlier dated entries retain their historical statuses and limitations.

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

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C09: Actual calendar CRUD, bounded authorized range paging, agenda/month/week, point deadlines and work-reminder configuration/cancellation are connected. UTC timestamps and exclusive all-day dates use the existing DST-aware date adapter. Unchanged schedules retain exact original timestamps. Reminder replacement is explicit rather than inferred from historical deliveries; uncertain commands retry unchanged.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Actual all-day/DST/team/work-deadline access and worker-fired/cancelled/revised reminder acceptance remain required. The current output DTO omits stored offsets/revision; no preservation claim is made from reminder history. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

### Additional current-contract repairs

Event and work-reminder writes retain frozen commands for uncertain retries. Confirmed event rejection preserves editable input for repair. Work-reminder scheduling preserves current references and offset intent across retry and clears actor-owned pending state on logout. Existing-event reminder replacement remains explicit because the producer omits authoritative current offsets.

Focused suite `/tmp/frontend-015-unit20.log`: 477 tests in 92 files passed. Production build `/tmp/frontend-015-build27.log` passed the unchanged budget with zero warnings. These remain focused evidence; full final verification and expanded paired acceptance are recorded separately. Failed/partial runs are retained.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered conflict/replay continuation — 2026-10-10

Reuse the current accessible owned agenda/month/week views, typed editor, Gregorian/explicit-offset adapter and reminder owners. A definite stale event now fences Save until the current event is read. The new PrimeNG reload action asks the existing unsaved-change confirmation before accepting authoritative values; cancel preserves the draft. Unknown outcomes retain the exact original payload/key/reference for the existing unchanged replay contract. Work-reminder conflicts likewise require a current read while preserving chosen offsets; an uncertain cancellation is fenced until read, and a removed deadline cannot be saved.

`/tmp/ordered-014-regression-before.log` exposed repeated stale submission. `/tmp/ordered-014-regression-after.log` passed four editor/reminder cases; `/tmp/ordered-014-page-test.log` passed explicit reload/cancel/current-reference behavior. These focused results do not replace actual acceptance or the full final gate.

The scoped paired browser adds competing personal event edits, explicit reminder replacement, deleted-source cancellation and a lost response after the actual backend has committed. Test-boundary response loss does not change the session boundary or rewrite a business payload; hashes prove unchanged replay and real persisted counts prove single event/reminder creation. A guarded owned-database read confirms pending reminder cancellation after the public deleted source becomes unavailable. No peer source, migration, shared record or published pin is changed.

The membership-aware team selector remains unavailable under the current producer contract, as recorded in the peer handoff. No administration selector, copied reference or invented membership authority is substituted. Full parent completion is not claimed.

## Ordered APP-FE-014 actual acceptance — 2026-10-10

`/tmp/ordered-014-paired1.log` and `artifacts/paired-foundations-014/manifest.json` record exit 0 for 4 actual production-Firefox scenarios, with no browser/service diagnostics. Agenda/week/month agree on an owned timed event; competing edit retains the draft and fences stale submission; canceled reload preserves input and confirmed reload reads current authority. Explicit reminder replacement cancels obsolete pending rows and a title edit preserves fractional timestamp precision. Actual source deletion cancels its pending reminder. A response lost after backend commit resolves through the exact unchanged command hash/key, producing one source and one reminder. Actual en/fa, actor cleanup and foreign-source authorization passed. Prior actual UTC+04, all-day, DST and clocked worker delivery evidence remains distinct and preserved.

Backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`; frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`; immutable backend source start/end `27d12719ec82ca02ae462ad079e16a6b9cafdaff26d8735208d73a1215901ce1`; frontend source start/end `db6487fd2c029c8b9a09b5770456331985405cc81aa2d2748b7e039ac43699a4`; actual HTTP contract match `228c1b09299fcb585fbd1e9a2ead8cf5ce229ccca00ffb27923d8466c6be3725`. `/tmp/ordered-014-lint3.log` and `/tmp/ordered-014-build2.log` pass without warnings; focused work-reminder conflict/current-read/deadline-removal tests also passed. Full final `mise run check` remains required.

Parent APP-FE-014 remains open: the producer lacks a membership-aware team selector, and the full workflow-derived deadline/source-cancellation matrix is not established by these personal-event scenarios. No invented selector, copied reference, automatic deadline mutation or inferred configured reminder offsets is used. No full parent/demo/deployment/manual assistive-technology acceptance is claimed.

## Ordered closure — 2026-10-10

Current APP-FE-014 status is BLOCKED / IMPLEMENTED (verified integrated slice; parent incomplete). The actual task-specific evidence above and the complete zero-warning pre-closure gate establish this status; the dated missing-producer and pending-gate prose above is historical. [The consolidated closure](../delivery/APP-FE-006-015-ACCEPTANCE.md) records the twelve exit-0 commands, 507 tests, ten Firefox scopes, source identity, retained failures and exact acceptance boundaries. The final post-documentation gate is `artifacts/check/manifest.json` with its complete command logs; it must pass on the unchanged final tree.

The current producer has no suitable membership-aware team selector, and the full workflow-derived deadline/source matrix is not verified. Personal event/reminder conflict, current-read recovery, cancellation and unchanged committed-response replay acceptance passed.
