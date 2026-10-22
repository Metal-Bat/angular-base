# APP-FE-007 — Semantic record summaries and typed editing patterns

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Implemented and reused

Extended existing read-only record presentation with named PrimeNG collection tables, unioned columns, distinct missing/null values and preserved false/zero/exact decimal strings. Singular/plural opaque references and secrets are hidden from display without altering source or command data. Shared RecordSummary delegates collections to RecordCollections while retaining the existing before/after history comparison.

Existing typed create/edit/search/report/history and confirmation flows are retained. RecordFields now carries picker labels and preserves unrelated nested fields/client restrictions. Reused shared/domain/record-presentation.ts, shared/ui/record-summary and the existing records, Studio catalogs and operational/admin editors. Specialized node, identity and integration redesign stays with APP-FE-016–032; full no-JSON coverage stays with APP-FE-033.

## Verification

Focused specs cover cancellation/revocation, actor cleanup, immutable edits, redacted collection presentation, missing/null/false/zero, system-mode lifecycle and applied-query repair as relevant to this task. Browser records, Studio catalogs and administration scenarios exercise existing CRUD and picker interaction; profile appearance is checked in the auth reload journey. Browser fixtures never contact the user's backend.

Final local verification is `mise run check`; evidence is `artifacts/check/manifest.json` and per-command logs. A valid run requires exit 0, zero diagnostic counts and identical starting/ending source hashes. This validates implemented local slices only. Required new-contract real API/browser acceptance is not claimed. Focused run logs are under `/tmp/app-fe-wave4/`.

No dependency, database migration, seed, production/shared-data, deployment or paid-call changes. Peer code was read only. `graphify update .` refreshes the graph after final source changes.

## Remaining work and exact blocker

The shared presenter/editing slice is implemented and locally tested. Parent APP-FE-007 remains BLOCKED by APP-FE-006: full reference/version resolution and every-kind selector adoption cannot be closed without C03. This record does not claim total product completion or full specialized editor coverage.

The task remains BLOCKED until its entire acceptance criteria and required integration evidence pass. This record is not permission to mark the parent DONE based on fixture/local quality.

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C01/C03: Request/work-item lists use domain case summaries with readable status, priority and dates. Existing typed Studio/Administration CRUD, private projections and immutable versions are reused.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

The complete representative record/catalog create/edit/history/error/immutable browser matrix remains required. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered execution after APP-FE-006 — 2026-10-09

APP-FE-006's reusable picker scope is now DONE / VERIFIED_INTEGRATED after the complete zero-warning gate and actual all-kind selector/browser acceptance; its historical missing-producer statement no longer blocks this task. Scope classification: REUSE shared semantic RecordSummary/RecordCollections, typed RecordFields and the existing Studio/records CRUD/query/history/report infrastructure; EXTEND command recovery; VERIFY representative actual catalog/user flows. Specialized authoring and complete product no-JSON coverage retain their later owners.

A concrete regression showed that changing an input cleared an uncertain/revision warning and allowed another catalog command without authoritative reconciliation. `CatalogState`/`ResourceCatalog` now retain a reconciliation fence across edits and known no-detail mutation responses. Lifecycle/grant/create actions respect it; authoritative detail/list reads release it only at the applicable scope. The shared `ResourceState`/`ResourcePage` mutation boundary has the same fence before confirmation. Edits remain available for comparison; known 400/422 validation rejection permits explicit correction. No uncertain write is automatically replayed and no input correction silently reuses a stale reference. Current references, unrelated nested restrictions, published immutability and actor cleanup are preserved.

`/tmp/ordered-007-regression-before.log` retains two failing catalog regressions before repair. `/tmp/ordered-007-regression-after.log` passed 488 tests; `/tmp/ordered-007-unit2.log` passed 489 tests / 95 files after shared-record coverage. Lint3 caught a missing braced conditional; lint4 passed without warnings after correction. These focused commands do not replace the final gate.

`server/records-paired-journey.mjs` extends the owned actual-backend browser harness with typed root creation, server validation/input retention, canceled edits, current-reference updates, readable before/after history, applied-query queued reports, an ordinary user create/edit/delete and a published immutable version. Results remain pending; no fixture result is called actual integration. Exact revisions and frozen producer contract are unchanged from APP-FE-006's pair. All writes target new owned disposable records, with peer/shared source and data unchanged.

Actual acceptance found an additional producer/consumer mismatch: Studio `/report` returned HTTP 200 with the declared `result` page, while the old adapter/fixture expected `data` with a queued report. Backend Forms, version, Clients and other Studio routes were compared to the reconciled OpenAPI; all eleven catalog contracts use the page envelope. The adapter now decodes that exact response. Studio offers a translated PrimeNG current-page report preview, keeps the applied list and unapplied query draft, and makes no queued export/worker claim. The contract generator asserts the actual envelope without changing operation IDs or generated public transport. Administration's queued reports remain unchanged. The [CRUD design clarification](../design/BACKEND-CRUD.md) records this conflict with older blanket queued-report prose without inventing an approval or backend change.

Retained additional failures: `/tmp/ordered-007-paired1.log` used text-only lookup for an accessible-label history button; paired2 read a restored label before its locale request completed; paired3 reproduced an intermittent opening/Escape animation race. The harness now uses accessible labels and rendered opening/hiding synchronization with cancelable key events, retaining every scenario and deadline. Paired4 passed actual creation, validation recovery, canceled/current-reference edits, before/after history and genuine competing-update rejection, then exposed the real report-envelope defect above. `/tmp/ordered-007-report-regression-before.log` reproduced that defect in a focused adapter test. Unit3 passed 489 tests but emitted an unused RouterLink import warning after the report UI changed; the unused import was removed, and strict final verification is still required. These partial/failed results are not completion evidence.

Latest actual acceptance: `/tmp/ordered-007-paired7.log` exited 0 with 33 browser scenarios and no captured browser/service diagnostics. It proves representative ordinary user and Studio root CRUD, known validation/input retention, canceled edits, actual readable history, a real competing update/stale-reference fence, the actual applied-query report preview and a published immutable version, alongside the retained picker/personal/operational scenarios. Production source digest `45de291bc4f16571f731dd51035250ca08e8fe17d4f5138327511547fa682da2` matched at start/end; backend source digest `dc21adc51b85cf34870ef0e6b0c26ad2ac81909e46d48d38be722e0d120bc060` was unchanged. Exact frontend/backend revisions and actual HTTP contract digest remain the pair recorded above. Paired5 expected a detail immediately after user creation even though the existing flow returns to the list; paired6 checked deletion before the authoritative reload finished. Both failed logs are retained; the corrected harness opens the row and waits for reload within unchanged deadlines. Final status awaits the complete final gate.

## Completion of shared-pattern scope

Status: DONE. Verification: VERIFIED_INTEGRATED. `/tmp/ordered-007-final-check.log` and `/tmp/ordered-007-final-manifest.json` record complete `mise run check`, exit 0, all 12 commands with zero emitted diagnostics, 489 passing unit tests / 95 files and all ten Firefox quality scopes. Full-tree start/end SHA-256: `b03586cdd0765730a2e23231b5261d74ecccc9262b5a56b2666f6ba411501935`. Production initial size remained 497,642 bytes under the unchanged budget. The actual paired evidence above supplies representative CRUD/history/error/report/immutable acceptance. Graph refresh passed in `/tmp/ordered-007-graph3.log`. Automated accessibility violations were zero; incomplete manual reviews remain explicitly separate. This closes shared patterns and representative adoption, not specialist editors or full application coverage. The historical APP-FE-006 dependency blocker is superseded by its actual completed scope.

## Filter refresh continuation — 2026-10-18

The native Firefox chooser race, owner refresh repair, complete failed collection run and final scoped verification receipt are recorded in [the editor flow audit](APP-FE-016-EDITOR-FLOW-AUDIT.md). Automatic request/task refresh now waits while filter editing is open; existing explicit loading fences and unchanged payload contracts remain. This continuation does not close parent acceptance.
