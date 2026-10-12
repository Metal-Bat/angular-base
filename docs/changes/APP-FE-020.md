# APP-FE-020 — Canvas interaction and lifecycle improvements

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## User-requested designer interaction repair — 2026-10-12

The reported issue is in Open designer. The existing canvas limited pointer dragging to the heading and had no context menu. This follow-up makes the whole node card a drag handle, retains connector ownership of port gestures, and adds right-click/visible Step actions for inspection, single-step duplication and starting a control connection. Click-to-connect highlights the source and uses the existing control-port/domain connection callback when a target is selected. Cancel, pending edits, read-only mode and removal of the source clear this transient state. A pending-editor notice explains why movement and linking are locked.

PrimeNG ContextMenu is encapsulated in the shared `ContextMenuControl` public seam, preserving the Foblex infrastructure boundary. Keyboard invocations position the menu at the trigger; closing returns focus to the trigger. Canvas node/action controls retain the existing tested native canvas exception; standard menu behavior remains PrimeNG and styling uses existing semantic Tailwind tokens. No engine, library replacement, endpoint, execution outcome, publication, active pin or operation replay payload is changed. Duplicate and connection actions reuse existing guarded workspace commands and undo history; saving remains explicit.

Focused Angular checks passed three canvas-placement/connection tests. The expanded Firefox fixture passed whole-card drag with exact undo restoration, right-click duplication, visible actions/click-to-connect, existing control/data port dragging, save/reload, pending fences, themes, RTL and accessibility. `/tmp/workflow-actions-browser.json` and `/tmp/workflow-actions-browser.log` retain this focused pass before the final keyboard-anchor/focus refinements; the complete final gate exercises the final source and adds an open-menu accessibility audit.

Failed/partial evidence remains at `/tmp/workflow-actions-{first,second,third,fourth}-failed.{json,log}`. The fixture first needed to await the canvas measurement lifecycle, then to click PrimeNG's actual item link, restore the original zoom baseline after its added gestures, and select persisted nodes by stable key rather than DOM order. Real dragging changes stacking order. These repairs retain the original persistence/zoom/connection assertions; no retry or weakened threshold counts as acceptance. An intermediate build emitted the unchanged 4 kB component-style budget warning; the added controls now use existing semantic utilities, and the subsequent build passed without warnings. No suppression or budget change was introduced.

Final local verification requires the complete unchanged-source `mise run check`, zero diagnostics and native exit 0 in `artifacts/check/manifest.json`. Browser evidence is `artifacts/firefox-canvas-quality.json`, with complete logs under `artifacts/check/`. AST-only graph refresh follows the changes. These disposable fixture checks do not establish real-backend, deployed, manual device/assistive-technology or whole-product acceptance; this follow-up does not close the parent's remaining scope. Prior form/boundary work and unrelated contract-manifest edits remain intact.

The first full gate stopped at foundations accessibility: the added action buttons became undersized in a heavily zoomed-out read-only diagram. Its native failure, report and full stage output are preserved in `/tmp/workflow-first-final-gate/`. Editing action buttons are now confined to designer canvases, while read-only diagrams retain their previous heading hit areas, selection, inspection and context inspection. Cursor affordances also distinguish movement from read-only inspection. The subsequent complete final gate must pass against this repaired source; no target-size rule or audit scope was disabled.

The next full gate reached the new open-menu audit and exposed the installed PrimeNG ContextMenu's unsupported `aria-level` attribute on `menuitem` roles. Evidence remains in `/tmp/workflow-second-final-gate/`. The shared wrapper removes precisely that attribute through supported item passthrough; menu roles, keyboard behavior, other attributes and audit rules remain intact. The final focused Firefox run passed with the open-menu audit enabled, at `/tmp/workflow-actions-final.{json,log}`. Its overlay-obscured contrast incomplete items remain for manual review. The following complete gate is the final evidence for this source.

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

## CURRENT five-scope continuation — 2026-10-10

Existing APP-FE-020.2: keyboard connection selectors.

The canvas exposes named current source/target ports and existing edges through shared PrimeNG selectors. Normal connection/reconnection no longer requires copied port identifiers. Source kind filters target choices; stale/disabled selections are fenced. Valid edge/port selections survive equivalent late catalog refreshes rather than being cleared; a regression and actual browser retry cover this case. Commands use existing connectWorkspace/reconnect/history and draft/pending guards, preserving control condition/priority/default and data ordinal/schema semantics. Expert graph inspection remains optional.

Changed/reused: `domain/canvas-ports.ts; presentation/canvas-connections/*; existing workflow-board.ts/.html`.

Current remaining criteria: Group pointer drag, native marquee synchronization, multi-step deletion, dedicated pointer reassignment, actual data-port keyboard pairing, full real WIP/promotion/publication and manual input-device/AT acceptance remain APP-FE-020.1/.2/.3. D05/performance acceptance remains with its existing owner; no new approval required for these selectors.

The backend protected-operations handoff now records APP-BE-021/022/024/025 DONE / VERIFIED_WITH_EXCEPTION and APP-BE-023 implemented with actual-browser acceptance pending. The former APP-BE-022 unfrozen-metadata blocker is historical. The new frozen English producer was compared and reconciled (379 operations / 565 schemas), preserving all existing operation IDs and unchanged form/workspace contracts; see [intake](../reference/app-fe-016-020/contract-intake.json). No backend source/shared data/dependencies/mise/environment files were changed. Backend DB-002/D07 decisions remain scoped; SDK exceptions do not establish strict exception-free demo readiness.

Actual source identities, tests, failures and final gate: [five-scope acceptance](../delivery/APP-FE-016-020-ACCEPTANCE.md). Parent remains **BLOCKED / IMPLEMENTED** for its full acceptance. This continuation supersedes the historical producer-unavailability blocker above; it does not rewrite prior evidence or mark the parent DONE. APP-FE-012/014 remain unrelated to this work.
