# APP-FE-015 — Metric cards and strict frozen-catalog projection

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
