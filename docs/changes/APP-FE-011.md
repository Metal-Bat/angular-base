# APP-FE-011 — Readable definition validation and readiness presentation

Current status (2026-10-10): **DONE / VERIFIED_INTEGRATED**. See the ordered closure below and [current acceptance](../delivery/APP-FE-006-015-ACCEPTANCE.md). Earlier dated entries retain their historical statuses and limitations.

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

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C06: Actual installation readiness and definition dependency inspection replace the missing-contract assumption. Setup uses a current superuser check; author readiness remains distinct from requester eligibility. Required unknown checks prevent a ready result. Dependency pin summaries, timestamps and permission-aware repair destinations are read-only.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Actual blocker/repair/return/revalidate, client-release compatibility and operator-only setup acceptance remain required. Worker/scheduler execution is not inferred from read-only connectivity checks. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

### Additional current-contract repairs

Author readiness now accepts the implemented client-release selector through a documented presentation seam. Repair routes carry bounded return context to the existing workflow catalog and require an explicit readiness recheck after return; they never treat a repair action as proof of readiness.

Focused suite `/tmp/frontend-015-unit20.log`: 477 tests in 92 files passed. Production build `/tmp/frontend-015-build27.log` passed the unchanged budget with zero warnings. These remain focused evidence; full final verification and expanded paired acceptance are recorded separately. Failed/partial runs are retained.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered repair continuation — 2026-10-09

Reuse the existing setup/dependency panels, authorized catalog and read-only graph. A bounded `repair_node` now selects only a node present in the currently authorized graph; return navigation opens its Display tab. Repair URL context reacts to same-route query changes. Changing the client context invalidates the previous readiness result and pending callback, clears its timer and permits a fresh explicit check.

The actual C06 producer categorizes `human.user.unknown` under `work_groups`, and `human.work_group.inactive` under the generic workflow repair category. The frontend preserves those DTOs and stable codes, while mapping these two codes to the existing permission-checked user/group screens. `human.form.not_published` offers the existing form-root screen, which owns active-state repair and published-version navigation. `step_types` uses the existing immutable step-version destination. These compatibility mappings do not grant authority, change a pin, or execute a command. The producer categorization discrepancy is recorded for peer follow-up rather than repaired by changing backend files.

Regression-before evidence: `/tmp/ordered-011-regression-before.log` exposed the missing node input; `/tmp/ordered-011-unit.log` retained the selection timing failure. The corrected focused regression passed six cases, and `/tmp/ordered-011-unit2.log` passed 499 tests in 97 files. Subsequent timer invalidation and actual browser acceptance remain subject to the full final gate; no parent completion is claimed here.

The first ordered paired attempt did not run because the backend root argument was missing (`/tmp/ordered-011-paired1.log`). The next failed before browser startup on actual HTTP contract drift (`/tmp/ordered-011-paired2.log`, retained timestamped manifest). Comparison against the current peer consistency producer found exactly three GET description changes for private file/image/report downloads, with no operation ID, parameter, response, schema or binary transport change. The en/fa source files, main producer manifest and generated transport were refreshed together; the prior intake record remains intact. The peer source changed independently during that failed run; each later run freezes its own immutable backend snapshot and records both identities.

`/tmp/ordered-011-paired3.log` reached the real inactive-form repair screen but failed on a test lookup for Save under the catalog instead of the existing PrimeNG dialog appended to the page body. Its partial evidence and diagnostics are retained. The lookup was corrected without changing product behavior or increasing deadlines.

The fourth paired run proved UI repair and enabled/disabled client compatibility, then failed because its ordinary 15-second UI wait was incorrectly used to observe a 30-second freshness period. The fifth explicitly observed that unchanged period and proved expiry/recheck, then exposed a test navigation issue: the catalog retained its previous selected record on a same-route query change. The stale-plan scenario now leaves that route, loads the current owned draft, performs a genuine competing update, and rechecks the displayed old reference. These partial runs remain retained; overall browser and runner deadlines were not increased. `/tmp/ordered-011-context-test.log` separately passed the regression for reactive bounded return context and permission/logout removal.

The sixth run proved ordinary denial, setup unknown, immutable form repair, node return, enabled/disabled release compatibility, expiry and actual competing-update rejection. It then failed because the shared privileged-user login helper tried to open the request catalog for the deliberately unprivileged account. The scoped journey now authenticates that account without assuming catalog permission before checking the real API denial. Its complete partial browser evidence is retained. `/tmp/ordered-011-dependency-test.log` passed both authorization-aware compatibility routing and pending-context invalidation regressions; ordinary request protections and published payloads are unchanged.

## Ordered APP-FE-011 actual acceptance — 2026-10-10

`/tmp/ordered-011-paired7.log` and `artifacts/paired-foundations-011/manifest.json` record exit 0: 7 actual production-Firefox scenarios, no browser or service diagnostics. The real UI repaired an inactive owned form, returned to the authorized graph node, required an explicit server recheck and preserved the exact published graph, checksum, reference and pins. Actual enabled/disabled client compatibility, 30-second expiry, competing-draft stale rejection, ordinary setup denial, unprivileged projection denial and logout/private-storage cleanup passed. No provider probe, publication, approval, claim or execution command was substituted.

Backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`; frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. Immutable backend source start/end: `27d12719ec82ca02ae462ad079e16a6b9cafdaff26d8735208d73a1215901ce1`; frontend source start/end: `8047f8b776052c48a91ba4099a16a42105bf670f6f59373d7150adb5eefcf29d`. Actual HTTP paths/components match: `228c1b09299fcb585fbd1e9a2ead8cf5ce229ccca00ffb27923d8466c6be3725`. Historical failed/partial runs are retained. Full final `mise run check` remains required before parent completion. Read-only setup does not establish vendor execution, deployment, manual assistive-technology acceptance or demo readiness.

## Ordered closure — 2026-10-10

Current APP-FE-011 status is DONE / VERIFIED_INTEGRATED. The actual task-specific evidence above and the complete zero-warning pre-closure gate establish this status; the dated missing-producer and pending-gate prose above is historical. [The consolidated closure](../delivery/APP-FE-006-015-ACCEPTANCE.md) records the twelve exit-0 commands, 507 tests, ten Firefox scopes, source identity, retained failures and exact acceptance boundaries. The final post-documentation gate is `artifacts/check/manifest.json` with its complete command logs; it must pass on the unchanged final tree.
