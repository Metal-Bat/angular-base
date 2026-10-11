# APP-FE-015 — Metric cards and strict frozen-catalog projection

Current status (2026-10-10): **DONE / VERIFIED_INTEGRATED**. See the ordered closure below and [current acceptance](../delivery/APP-FE-006-015-ACCEPTANCE.md). Earlier dated entries retain their historical statuses and limitations.

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

Reuse existing list/query and localization infrastructure. Add a presentation-only metric adapter and PrimeNG table/card with owned CSS bars, exact units, exclusive dates, as-of/stale/failure/empty states, null distinct from zero, and a guarded cloned drilldown descriptor. Nine approved definitions are copied semantically from C10; no analytics endpoint or home dashboard is connected.

Changed/reused: src/app/features/analytics/domain/metrics.ts, metric-catalog.json and metrics.spec.ts; analytics/presentation/metric-card and spec; development foundation preview.

## Verification and compatibility

The focused Angular suite passed 422 tests in 75 files. Focused production build passed the unchanged 500 kB initial warning budget. Expanded Firefox foundations check typed properties, preserved keys/schema, current-reference save/save/reopen, en/fa presentation/accessibility, metric zero/table and read-only measured canvases. The production canvas scope exercises existing placement/persistence/pending fences plus selected-group keyboard movement, duplication, connection removal/undo and find-node navigation. These are isolated fixture checks.

Final local gate evidence is `artifacts/check/manifest.json`, its twelve command logs and the serialized `artifacts/firefox-*-quality.json` reports. Only a complete exit-0 `mise run check` with zero diagnostic counts and identical start/end source hashes establishes the final local result. Focused commands never substitute for that gate. Intermediate failures remain under `/tmp/steps20-*.log` and are described in docs/delivery/GATES.md.

The deterministic delivery check validates the copied inspector and metric dictionary bytes against the public producer manifest, all twenty option schemas and semantic metric copy against those artifacts, translations of touched authoring/metric templates, and both production preview route replacements. The generated API still uses the exact APP-BE-001 source (314 operations / 425 shared schemas); newly copied wave-four metadata does not attest completed producer integration. The peer was read only. No dependencies, migrations, seeds, shared data, paid calls, commits or deployment were changed. Graph refresh uses AST-only `graphify update .` after final edits.

Axe violations and captured browser diagnostics remain strict failures. Any incomplete axe items remain in the browser JSON for manual review; they do not establish manual accessibility acceptance.

## Remaining acceptance and blockers

APP-BE-018 remains BLOCKED / IMPLEMENTED. Generated-client reconciliation, actual query/catalog transport, home/work/request/integration views, authorized list navigation, mutation refresh/polling and real data totals/denied-dimension tests remain pending. Integration/business metrics are unavailable in the supplied dictionary; no result is fabricated. D05 broader chart/performance acceptance remains open.

The parent remains BLOCKED until its full required acceptance and real-service evidence are supplied. IMPLEMENTED refers only to the available slice above, not the complete parent deliverable.

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C10: Actual catalog/query transport uses the frozen metric definitions. Dashboard controls preserve canonical date/timezone/dimension values; zero remains distinct from unknown/unavailable. Accessible metric tables and server-provided authorized drill-downs use existing list ownership. Notification refresh retains applied filters and unsaved dashboard input.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Actual controlled aggregate/list equivalence, deletion/date/denied-dimension, unavailable/failed/stale, resize/mobile/RTL and mutation-refresh acceptance remain required. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

### Additional current-contract repairs

Dashboard labels now map actual canonical metric keys to readable translated titles without adding invented DTO fields. The actual contract provides authorized aggregate data and producer-owned drilldown descriptors; loaded table pages never supply totals.

Focused suite `/tmp/frontend-015-unit20.log`: 477 tests in 92 files passed. Production build `/tmp/frontend-015-build27.log` passed the unchanged budget with zero warnings. These remain focused evidence; full final verification and expanded paired acceptance are recorded separately. Failed/partial runs are retained.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered metric continuation — 2026-10-10

Reuse the registered metric dictionary, typed adapter, PrimeNG cards/tables and authorized list-navigation seam. Notification-driven refreshes now coalesce while a query is running; successful refreshes use the applied snapshot and retain draft dates/timezone. Actor cleanup clears queued work. Local invalid windows produce field guidance without a request; a technical query outage is shown as service unavailable, with no invented zero. Series labels use the existing localization pipe; canonical metric keys and query descriptors remain unchanged.

`/tmp/ordered-015-regression-before.log` exposed overlapping notification refreshes. `/tmp/ordered-015-regression-after.log` passed the corrected refresh/polling regressions. `/tmp/ordered-015-unit.log` passed four dashboard/card cases, including outage versus local input validation; `/tmp/ordered-015-lint2.log` and `/tmp/ordered-015-build.log` passed without warnings. Full final `mise run check` remains required.

Actual paired acceptance uses a real UI submission and the current metric/list contracts. For deletion filtering, it constructs one owned historical soft-deleted request fixture using actual create/submit service inputs and the backend's own analytics-test metadata policy; it does not invent a public delete command or reset shared data. The service-outage scenario verifies the owned API process's temporary snapshot directory before pausing only that process, then observes the unchanged 15-second ordinary deadline and restores it. Both runner cleanup paths resume the owned process on failure. The browser also opens a real phone-width window and resizes it, retaining its diagnostics. No application request policy, shared service, vendor or deployment is changed.

Failed/partial actual evidence is retained. `/tmp/ordered-015-paired1.log` proved real zero/submission/dated drill-down, then failed because the owned historical fixture helper did not unpack the producer's `(request, submission)` return tuple. `/tmp/ordered-015-paired2.log` proved live deletion filtering, exclusive dates, denied dimensions, nonexistent-midnight rejection, unavailable outcomes, freshness and owned-backend pause/recovery. Phone-width/resize assertions ran, but its subsequent English switch failed because the test clicked during the previous PrimeNG transition. The reused selection helper now waits for an enabled current control and settled overlay animations before clicking; no product control, deadline or warning threshold was changed. The next run additionally compares all nine frozen registered metric populations and units to their actual authorized dated lists. No monetary metric is registered; mixed-currency aggregation is not offered or inferred.

## Ordered APP-FE-015 actual acceptance — 2026-10-10

`/tmp/ordered-015-paired3.log` and `artifacts/paired-foundations-015/manifest.json` record exit 0 for six actual production-Firefox scenarios. Actual zero and typed request submission, applied dated drill-down, historical live/deleted filtering, exclusive dates, denied dimensions and nonexistent local midnight passed. All nine registered metric units, availability and authorized population counts agree with their actual dated lists. Unavailable results remain null; stale data is labeled; unsaved timezone input does not relabel the applied query. Pausing only the guarded owned backend verifies the unchanged ordinary deadline, unavailable presentation and recovery. A real phone-width window, resize, semantic table headers, Farsi RTL and denied-account cleanup passed. Browser/service diagnostics are empty. No monetary metric is registered, so mixed-currency aggregation is not offered or inferred.

Backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`; frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`; immutable backend source start/end `27d12719ec82ca02ae462ad079e16a6b9cafdaff26d8735208d73a1215901ce1`; frontend source start/end `2cf3dc82c68743aa55b51e27a2133dd5e0a523a12dae7b258d9a3807e1618dbc`; actual HTTP contract match `228c1b09299fcb585fbd1e9a2ead8cf5ce229ccca00ffb27923d8466c6be3725`. Failed/partial pairs 1–2 remain retained and are explained in this record. The full final gate remains required before closure; deployment, vendor execution and manual assistive-technology acceptance remain separate.

## Ordered closure — 2026-10-10

Current APP-FE-015 status is DONE / VERIFIED_INTEGRATED. The actual task-specific evidence above and the complete zero-warning pre-closure gate establish this status; the dated missing-producer and pending-gate prose above is historical. [The consolidated closure](../delivery/APP-FE-006-015-ACCEPTANCE.md) records the twelve exit-0 commands, 507 tests, ten Firefox scopes, source identity, retained failures and exact acceptance boundaries. The final post-documentation gate is `artifacts/check/manifest.json` with its complete command logs; it must pass on the unchanged final tree.
