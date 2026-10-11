# APP-FE-017 — Typed component properties and constraints

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

Reuse SchemaInput and the shared runtime/document model. Every supported primitive has its exact options_schema copied from the C11 inspector artifact. Normal controls edit labels/renderers, requiredness and scalar/collection constraints; attachment MIME/kind/size/ordering capabilities use typed option controls. Field identity, hidden reuse metadata, canonical zero/false and unedited schema keys remain intact. Existing authorIssues consumes server pointers.

Changed/reused: studio/domain/form-inspector-schema.ts and form-options.json; presentation/form-inspector and spec; typed schema input reused; public field-label catalog and authoring translations.

## Verification and compatibility

The focused Angular suite passed 422 tests in 75 files. Focused production build passed the unchanged 500 kB initial warning budget. Expanded Firefox foundations check typed properties, preserved keys/schema, current-reference save/save/reopen, en/fa presentation/accessibility, metric zero/table and read-only measured canvases. The production canvas scope exercises existing placement/persistence/pending fences plus selected-group keyboard movement, duplication, connection removal/undo and find-node navigation. These are isolated fixture checks.

Final local gate evidence is `artifacts/check/manifest.json`, its twelve command logs and the serialized `artifacts/firefox-*-quality.json` reports. Only a complete exit-0 `mise run check` with zero diagnostic counts and identical start/end source hashes establishes the final local result. Focused commands never substitute for that gate. Intermediate failures remain under `/tmp/steps20-*.log` and are described in docs/delivery/GATES.md.

The deterministic delivery check validates the copied inspector and metric dictionary bytes against the public producer manifest, all twenty option schemas and semantic metric copy against those artifacts, translations of touched authoring/metric templates, and both production preview route replacements. The generated API still uses the exact APP-BE-001 source (314 operations / 425 shared schemas); newly copied wave-four metadata does not attest completed producer integration. The peer was read only. No dependencies, migrations, seeds, shared data, paid calls, commits or deployment were changed. Graph refresh uses AST-only `graphify update .` after final edits.

Axe violations and captured browser diagnostics remain strict failures. Any incomplete axe items remain in the browser JSON for manual review; they do not establish manual accessibility acceptance.

## Remaining acceptance and blockers

APP-BE-020 conformance is not delivered. Full grid/accessibility/formatting and complex attachment behavior, nested collection identity/media roundtrip, and actual deepest-pointer server acceptance remain incomplete. Unsupported components keep their existing settings and a compatibility notice. Generated transports stay on the previously frozen APP-BE-001 source.

The parent remains BLOCKED until its full required acceptance and real-service evidence are supplied. IMPLEMENTED refers only to the available slice above, not the complete parent deliverable.

## CURRENT five-scope continuation — 2026-10-10

Existing APP-FE-017.1: grid and accessibility properties.

Purpose-built shared schema controls edit real GridPlacement column/span/row and Accessibility label/description. Local apply retains invalid draft values and rejects coordinates outside the backend bounds, column+span >13 or invalid accessibility labels. Explicit removal serializes null. Runtime child positioning uses the configured track count, clamps presentation to available tracks, and stacks in document order on mobile; it never alters authored coordinates or canonical values. Existing field-wrapper labels/hints consume the authorized accessibility projection.

Changed/reused: `presentation/form-geometry/*; form-inspector.ts/.html/.spec.ts; domain/form-editing.ts; forms/domain/grid-placement.ts/.spec.ts; forms/presentation/runtime-node/*`.

Current remaining criteria: Collection/media inspectors, deepest-pointer corrections, exact numeric/null/omission and complex attachment conformance remain APP-FE-017.2/.3 implementation/verification work. Full device/assistive-technology acceptance remains pending. Implemented APP-BE-020 is available, not missing.

The backend protected-operations handoff now records APP-BE-021/022/024/025 DONE / VERIFIED_WITH_EXCEPTION and APP-BE-023 implemented with actual-browser acceptance pending. The former APP-BE-022 unfrozen-metadata blocker is historical. The new frozen English producer was compared and reconciled (379 operations / 565 schemas), preserving all existing operation IDs and unchanged form/workspace contracts; see [intake](../reference/app-fe-016-020/contract-intake.json). No backend source/shared data/dependencies/mise/environment files were changed. Backend DB-002/D07 decisions remain scoped; SDK exceptions do not establish strict exception-free demo readiness.

Actual source identities, tests, failures and final gate: [five-scope acceptance](../delivery/APP-FE-016-020-ACCEPTANCE.md). Parent remains **BLOCKED / IMPLEMENTED** for its full acceptance. This continuation supersedes the historical producer-unavailability blocker above; it does not rewrite prior evidence or mark the parent DONE. APP-FE-012/014 remain unrelated to this work.
