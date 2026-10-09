# APP-FE-018 — Behavior rules, approved option sources and expressions

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

Reuse existing server validation/options/behavior/preview paths. Add purposeful controls for bounded eq/ne/present rules and effects, typed scalar values, custom/schema/domain sources, dependency names and schema-scope selection, authorized user/work-group selector choices and constrained expression entry. Remote sources are preserved and not replaced by arbitrary URL editing. Existing runtime option cancellation/generation remains in charge; no JavaScript evaluator is added.

Changed/reused: presentation/form-inspector and form-behavior; domain/form-inspector-schema.ts; existing studio-api/runtime option coordinator and authoring diagnostics; regression tests for missing rule scope, bounds and typed zero/false.

## Verification and compatibility

The focused Angular suite passed 422 tests in 75 files. Focused production build passed the unchanged 500 kB initial warning budget. Expanded Firefox foundations check typed properties, preserved keys/schema, current-reference save/save/reopen, en/fa presentation/accessibility, metric zero/table and read-only measured canvases. The production canvas scope exercises existing placement/persistence/pending fences plus selected-group keyboard movement, duplication, connection removal/undo and find-node navigation. These are isolated fixture checks.

Final local gate evidence is `artifacts/check/manifest.json`, its twelve command logs and the serialized `artifacts/firefox-*-quality.json` reports. Only a complete exit-0 `mise run check` with zero diagnostic counts and identical start/end source hashes establishes the final local result. Focused commands never substitute for that gate. Intermediate failures remain under `/tmp/steps20-*.log` and are described in docs/delivery/GATES.md.

The deterministic delivery check validates the copied inspector and metric dictionary bytes against the public producer manifest, all twenty option schemas and semantic metric copy against those artifacts, translations of touched authoring/metric templates, and both production preview route replacements. The generated API still uses the exact APP-BE-001 source (314 operations / 425 shared schemas); newly copied wave-four metadata does not attest completed producer integration. The peer was read only. No dependencies, migrations, seeds, shared data, paid calls, commits or deployment were changed. Graph refresh uses AST-only `graphify update .` after final edits.

Axe violations and captured browser diagnostics remain strict failures. Any incomplete axe items remain in the browser JSON for manual review; they do not establish manual accessibility acceptance.

## Remaining acceptance and blockers

Verified producer C11 reconciliation and APP-BE-020 are pending. Approved remote-source editing, registered-function/completion UI, generalized navigation contracts, dependency preview/cancellation acceptance and all server publication constraints remain uncovered. Existing expert tools are retained; this slice does not close every no-JSON authoring journey.

The parent remains BLOCKED until its full required acceptance and real-service evidence are supplied. IMPLEMENTED refers only to the available slice above, not the complete parent deliverable.
