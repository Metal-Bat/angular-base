# APP-FE-020 — Canvas interaction and lifecycle improvements

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

APP-FE-020.1: extend the owned graph model with bounded atomic group movement, internal-reference duplication and exact connection removal/reconnection. APP-FE-020.2: add checkbox/Shift selection, duplicate/remove controls, find-node centering and guarded reassignment callbacks. Existing WIP/history/pan/zoom/typed port architecture is retained. APP-FE-020.3: expand production browser interactions and development 25/100/250-node measurements. Auto-fit now uses the actual fNodesRendered lifecycle; capture bounded FF/NG codes without private console arguments.

Changed/reused: studio/domain/canvas-editing.ts and spec; workflow-interactions.ts, workflow-board and diagnostics; workflow-canvas/toolbar; server/workflow-canvas-fixture.mjs; foundation measurement fixture; server/browser-diagnostics and spec.

## Verification and compatibility

The focused Angular suite passed 422 tests in 75 files. Focused production build passed the unchanged 500 kB initial warning budget. Expanded Firefox foundations check typed properties, preserved keys/schema, current-reference save/save/reopen, en/fa presentation/accessibility, metric zero/table and read-only measured canvases. The production canvas scope exercises existing placement/persistence/pending fences plus selected-group keyboard movement, duplication, connection removal/undo and find-node navigation. These are isolated fixture checks.

Final local gate evidence is `artifacts/check/manifest.json`, its twelve command logs and the serialized `artifacts/firefox-*-quality.json` reports. Only a complete exit-0 `mise run check` with zero diagnostic counts and identical start/end source hashes establishes the final local result. Focused commands never substitute for that gate. Intermediate failures remain under `/tmp/steps20-*.log` and are described in docs/delivery/GATES.md.

The deterministic delivery check validates the copied inspector and metric dictionary bytes against the public producer manifest, all twenty option schemas and semantic metric copy against those artifacts, translations of touched authoring/metric templates, and both production preview route replacements. The generated API still uses the exact APP-BE-001 source (314 operations / 425 shared schemas); newly copied wave-four metadata does not attest completed producer integration. The peer was read only. No dependencies, migrations, seeds, shared data, paid calls, commits or deployment were changed. Graph refresh uses AST-only `graphify update .` after final edits.

Axe violations and captured browser diagnostics remain strict failures. Any incomplete axe items remain in the browser JSON for manual review; they do not establish manual accessibility acceptance.

## Remaining acceptance and blockers

See docs/delivery/CANVAS-CAPABILITIES.md. Grouped pointer drag, native marquee synchronization, multi-step deletion, normal keyboard port/reconnect selectors and dedicated reassignment gesture acceptance remain uncovered. Metadata/category and real-service WIP/promotion/publication acceptance, D05 budgets and manual device/assistive-technology acceptance remain required. No library switch, graph execution or publication is performed.

The parent remains BLOCKED until its full required acceptance and real-service evidence are supplied. IMPLEMENTED refers only to the available slice above, not the complete parent deliverable.
