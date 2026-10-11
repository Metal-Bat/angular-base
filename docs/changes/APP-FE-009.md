# APP-FE-009 — Validated applied-query snapshot preparation

Current status (2026-10-10): **DONE / VERIFIED_INTEGRATED**. See the ordered closure below and [current acceptance](../delivery/APP-FE-006-015-ACCEPTANCE.md). Earlier dated entries retain their historical statuses and limitations.

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Implemented and reused

Added framework-independent saved-list-view domain functions for capturing the applied query and restoring page one. Snapshots retain ordered filters/sorts, page size and allowlisted columns/extras; they omit the current page and response data, clone canonical values and validate the scope/schema. Removed fields, invalid operators/types, missing columns or unsupported schema versions require explicit repair; restrictive filters are never silently discarded. Revision-sensitive reference filters and private credential extras are rejected pending durable resolution.

Added records/domain/saved-list-view.ts and focused serialization tests; reused shared/domain/list-query.ts. This is a frontend domain model, explicitly not a guessed C04 wire DTO.

## Verification

Focused specs cover cancellation/revocation, actor cleanup, immutable edits, redacted collection presentation, missing/null/false/zero, system-mode lifecycle and applied-query repair as relevant to this task. Browser records, Studio catalogs and administration scenarios exercise existing CRUD and picker interaction; profile appearance is checked in the auth reload journey. Browser fixtures never contact the user's backend.

Final local verification is `mise run check`; evidence is `artifacts/check/manifest.json` and per-command logs. A valid run requires exit 0, zero diagnostic counts and identical starting/ending source hashes. This validates implemented local slices only. Required new-contract real API/browser acceptance is not claimed. Focused run logs are under `/tmp/app-fe-wave4/`.

No dependency, database migration, seed, production/shared-data, deployment or paid-call changes. Peer code was read only. `graphify update .` refreshes the graph after final source changes.

## Remaining work and exact blocker

APP-BE-009 remains BLOCKED / NOT_RUN and the frozen delivery contract contains no saved-view/favorite/resolver operations. Save/update/rename/delete/default UI, favorites navigation, durable current links, two-tab conflicts and real API/browser persistence remain blocked on C04/C03. No pretend persistence, arbitrary href or stale-ref browser bookmark is introduced.

The task remains BLOCKED until its entire acceptance criteria and required integration evidence pass. This record is not permission to mark the parent DONE based on fixture/local quality.

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C04/C03: Typed saved-view create/update/apply/default/delete and favorites use the actual generated operations. Applied query snapshots exclude page offsets; columns/page size are restored. Incompatible views require explicit replacement or deletion. Uncertain writes retain their command key/body/reference. Favorites reauthorize through current resource resolution.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Actual two-tab/user conflicts, schema repair, out-of-page/revoked favorite and complete supported-destination acceptance remain required. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

### Additional current-contract repairs

Saved-view writes retain the exact command/ref for uncertain retries. Confirmed 4xx rejections release that command while preserving edits, and a read reload obtains the current reference without automatically writing. An explicit repair dialog compares original and replacement restrictions before an incompatible view can be updated. Favorite destinations resolve current authorization through the existing resource-link contract.

Focused suite `/tmp/frontend-015-unit20.log`: 477 tests in 92 files passed. Production build `/tmp/frontend-015-build27.log` passed the unchanged budget with zero warnings. These remain focused evidence; full final verification and expanded paired acceptance are recorded separately. Failed/partial runs are retained.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered task continuation

Reused PersonalCollections, ResourceLinks, SavedViews, SavedViewRepair, the read-only record screen and its generated contract adapter. Confirmed revision conflicts now require a successful authoritative read before another write; name drafts remain intact, and uncertain writes still replay exactly the original operation-specific command. Repair comparison includes canonical compound sort direction, columns and page size instead of concealing part of the original intent. Failed favorite resolution refreshes the authorized list so a deleted target's cached label leaves normal navigation.

The actual StepTypeVersionDTO/StepTypeQuery GET/search operations and workflows.manage authorization were reconciled before registering `/administration/step-types`. This is a read-only destination for C03 step_versions, with no publish/edit command. The adapter rejects unsupported restrictions rather than silently dropping them, and uses the real bounded page/size query. Shared PrimeNG tables and semantic tokens are retained.

`/tmp/ordered-009-regression-before.log` proves a stale view update was retried before a read. After repair, `/tmp/ordered-009-unit3.log` records 498 passing tests in 97 files; `/tmp/ordered-009-lint4.log` and `/tmp/ordered-009-build2.log` pass without warnings. Failed lint and translation checks remain in `/tmp/ordered-009-lint.log`, `/tmp/ordered-009-lint2.log` and `/tmp/ordered-009-unit.log`; no limits or assertions were weakened.

The existing guarded disposable harness now supports the explicit APP-FE-009 acceptance scope, with separate `artifacts/paired-foundations-009/` evidence and unchanged deadlines/source-identity protection. It opens two actual application windows, seeds only an owned historical incompatible view in the disposable database, and exercises competing updates, duplicate saves/default changes, explicit schema repair, page-two/current/deleted favorites, step metadata and account isolation. Other foundation scopes and their required avatar assertion remain intact. This owned browser profile permits opening the test's second window; application/session protections are unchanged. Actual acceptance and the complete final gate remain pending.

## Ordered actual task acceptance

`/tmp/ordered-009-paired4.log` and timestamped `artifacts/paired-foundations-009/` evidence passed 8 actual scenarios: two real application windows with competing updates/defaults/duplicate saves; owned historical schema repair preserving restrictive intent until explicit replacement; typed filters/sorts/columns/page-size restoration reaching the real search endpoint; locale-invariant machine values; page-two/current/deleted favorites; a registered immutable step destination; and a second user's denied old-account locator and private-view isolation. Browser/service diagnostics were empty. Source start/end SHA-256: `c3832c06015b8ac4d5d6832b021bf28bd0c6bf949690ed2f08ea611f9cab5f51`. Backend peer/start/end source stayed `dc21adc51b85cf34870ef0e6b0c26ad2ac81909e46d48d38be722e0d120bc060`; actual HTTP contract matched `7757e54756a096fd69f708733ee3fb1c16a49ef732f427c81b7a2fdebf444b8c`. Exact revisions are those of the current intake above.

Failed `/tmp/ordered-009-paired1.log` exposed a pagination assumption in the test; the helper now returns to the first page deliberately. Paired2 passed seven scenarios before the typed/locale extension. Paired3 failed because JSON object key order was compared as query meaning; the corrected comparator preserves array order while canonicalizing object keys. All failures and diagnostics remain retained. No assertion, deadline, threshold or implementation requirement was skipped. The complete final gate remains pending; parent completion is not yet claimed.

## Ordered closure — 2026-10-10

Current APP-FE-009 status is DONE / VERIFIED_INTEGRATED. The actual task-specific evidence above and the complete zero-warning pre-closure gate establish this status; the dated missing-producer and pending-gate prose above is historical. [The consolidated closure](../delivery/APP-FE-006-015-ACCEPTANCE.md) records the twelve exit-0 commands, 507 tests, ten Firefox scopes, source identity, retained failures and exact acceptance boundaries. The final post-documentation gate is `artifacts/check/manifest.json` with its complete command logs; it must pass on the unchanged final tree.
