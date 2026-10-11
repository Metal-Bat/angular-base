# APP-FE-012 — Notification filters and authoritative unread totals

Current status (2026-10-10): **BLOCKED / IMPLEMENTED (verified integrated slice; parent incomplete)**. See the ordered closure below and [current acceptance](../delivery/APP-FE-006-015-ACCEPTANCE.md). Earlier dated entries retain their historical statuses and limitations.

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

## 2026-10-09 extension — Unified live inbox and authoritative reconciliation

Extended the existing implementation for the backend's implemented unified inbox and live stream. Exact contracts, reused/changed ownership, stream limits, actual paired command, source identity, focused/final evidence, retained failures and remaining acceptance are recorded in [NOTIFICATION-PUSH-ACCEPTANCE.md](../delivery/NOTIFICATION-PUSH-ACCEPTANCE.md). Historical results above remain unchanged. Parent status remains BLOCKED / IMPLEMENTED until its broader required acceptance passes.

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C07: Existing unified inbox/SSE ownership is retained. Current authorized calendar and support destinations now join existing case/work/report/account routes. Reads/opening remain metadata-only.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

The prior passing actual SSE push slice does not prove full MAP-01–14 recipient/destination acceptance; reserved operation targets remain unavailable under the producer contract. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered APP-FE-012 actual acceptance — 2026-10-10

`/tmp/ordered-012-paired1.log` and `artifacts/paired-notifications/manifest.json` record exit 0 for the reused actual worker/Redis/SSE production-Firefox journey. Complete main HTTP and scoped inbox contracts match; browser/service diagnostics are empty. Persisted account and submitted-request notices, duplicate suppression, en/fa RTL/theme preservation, recent/full inbox and unread count, cartable filter preservation, unsaved input/detail preservation, metadata-only reading/opening, offline reconciliation without historical popups, current authorized destination, logout/account fencing and backend connection cleanup passed. No browser signal was fabricated.

Backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`; frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`; immutable backend source start/end `27d12719ec82ca02ae462ad079e16a6b9cafdaff26d8735208d73a1215901ce1`; frontend source start/end `8047f8b776052c48a91ba4099a16a42105bf670f6f59373d7150adb5eefcf29d`. Full final `mise run check` remains required. Parent APP-FE-012 remains open because the current producer reserves MAP-07/08 operation destinations with `route_key: null`; full MAP recipient/destination acceptance is not proved by this transport slice. This is a concrete producer/destination gap, not the historical claim that the unified inbox is absent. Other MAP coverage remains explicitly unverified.

## Ordered closure — 2026-10-10

Current APP-FE-012 status is BLOCKED / IMPLEMENTED (verified integrated slice; parent incomplete). The actual task-specific evidence above and the complete zero-warning pre-closure gate establish this status; the dated missing-producer and pending-gate prose above is historical. [The consolidated closure](../delivery/APP-FE-006-015-ACCEPTANCE.md) records the twelve exit-0 commands, 507 tests, ten Firefox scopes, source identity, retained failures and exact acceptance boundaries. The final post-documentation gate is `artifacts/check/manifest.json` with its complete command logs; it must pass on the unchanged final tree.

Reserved MAP-07/08 operation destinations have `route_key: null`; full MAP recipient/destination acceptance remains unverified. Actual unified inbox/worker/Redis/SSE delivery is verified; opening remains metadata-only and server-authorized.
