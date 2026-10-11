# APP-FE-010 — Help topics and release metadata

Current status (2026-10-10): **DONE / VERIFIED_INTEGRATED**. See the ordered closure below and [current acceptance](../delivery/APP-FE-006-015-ACCEPTANCE.md). Earlier dated entries retain their historical statuses and limitations.

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

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C05: Static bilingual help is reused. Minimal metadata-only account acknowledgments are serialized; list reads never write. Seen/dismiss/reset use the actual contract and missing/stale metadata is shown as unsaved.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Actual persisted seen/dismiss/reset across users/locales, release mismatch/outage and contextual help acceptance remain required. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered APP-FE-010 actual acceptance

Inventory confirmed that the typed eleven-topic en/fa manifest, explicit opening/dismiss/revisit/reset, metadata-only generated client, release compatibility fallback and actor/locale/revision ownership were already implemented. No replacement help framework or application feature code was added for this task. Existing manifest/component/service tests cover complete translations, unknown release/nonblocking static help, focus and late-account write cancellation.

`/tmp/ordered-010-paired1.log` and timestamped `artifacts/paired-foundations-010/` evidence passed five actual-backend scenarios: an owned historical revision does not acknowledge the current topic; list rendering does not mark seen; explicit viewing persists and restores focus; English/Farsi state remains distinct with readable RTL content; dismiss/revisit and two-user/re-login isolation work; and Help-only reset preserves business-record count and empty browser storage. Service/browser diagnostics were empty. Source start/end SHA-256: `4b00a4f1e5eb5f7e96ffe79d30363b653f6e626bc7ee58515711656e3c00540b`; backend remained `dc21adc51b85cf34870ef0e6b0c26ad2ac81909e46d48d38be722e0d120bc060` and actual HTTP contract matched `7757e54756a096fd69f708733ee3fb1c16a49ef732f427c81b7a2fdebf444b8c`. Exact revisions remain those of the current intake.

Only an owned historical acknowledgment was added to the guarded disposable fixture; no peer schema/source or shared data was changed. The complete final local gate remains pending. Manual assistive-technology, vendor, deployment and user acceptance are separate evidence levels. Historical missing-producer prose is preserved as history, not a current blocker.

## Ordered closure — 2026-10-10

Current APP-FE-010 status is DONE / VERIFIED_INTEGRATED. The actual task-specific evidence above and the complete zero-warning pre-closure gate establish this status; the dated missing-producer and pending-gate prose above is historical. [The consolidated closure](../delivery/APP-FE-006-015-ACCEPTANCE.md) records the twelve exit-0 commands, 507 tests, ten Firefox scopes, source identity, retained failures and exact acceptance boundaries. The final post-documentation gate is `artifacts/check/manifest.json` with its complete command logs; it must pass on the unchanged final tree.
