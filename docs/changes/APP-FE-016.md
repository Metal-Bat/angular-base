# APP-FE-016 — Visual form layout, stable keys and bounded history

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

APP-FE-016.1: extend the existing twenty-kind palette with translated names, category/search filters, outline selection, same-parent drag reorder and keyboard add/move/remove. Canonical field names and display labels are separate. APP-FE-016.2: preserve existing collection/media/action defaults and nesting helpers; newly placed nodes receive stable node_key values. APP-FE-016.3: integrate bounded twenty-snapshot undo/redo, pending-edit fences, placement-only removal with confirmation, current-ref saves and confirmed reload cleanup. Published versions stay read-only.

Changed/reused: studio/domain/form-authoring.ts, form-editing.ts and specs; presentation/form-builder, form-palette.ts and form-builder.spec.ts; foundations fixture API save/reopen journey.

## Verification and compatibility

The focused Angular suite passed 422 tests in 75 files. Focused production build passed the unchanged 500 kB initial warning budget. Expanded Firefox foundations check typed properties, preserved keys/schema, current-reference save/save/reopen, en/fa presentation/accessibility, metric zero/table and read-only measured canvases. The production canvas scope exercises existing placement/persistence/pending fences plus selected-group keyboard movement, duplication, connection removal/undo and find-node navigation. These are isolated fixture checks.

Final local gate evidence is `artifacts/check/manifest.json`, its twelve command logs and the serialized `artifacts/firefox-*-quality.json` reports. Only a complete exit-0 `mise run check` with zero diagnostic counts and identical start/end source hashes establishes the final local result. Focused commands never substitute for that gate. Intermediate failures remain under `/tmp/steps20-*.log` and are described in docs/delivery/GATES.md.

The deterministic delivery check validates the copied inspector and metric dictionary bytes against the public producer manifest, all twenty option schemas and semantic metric copy against those artifacts, translations of touched authoring/metric templates, and both production preview route replacements. The generated API still uses the exact APP-BE-001 source (314 operations / 425 shared schemas); newly copied wave-four metadata does not attest completed producer integration. The peer was read only. No dependencies, migrations, seeds, shared data, paid calls, commits or deployment were changed. Graph refresh uses AST-only `graphify update .` after final edits.

Axe violations and captured browser diagnostics remain strict failures. Any incomplete axe items remain in the browser JSON for manual review; they do not establish manual accessibility acceptance.

## Remaining acceptance and blockers

APP-BE-019 remains BLOCKED / IMPLEMENTED and APP-BE-020 remains BLOCKED / NOT_RUN. Full twenty-kind real-service roundtrip/preview conformance, cross-parent drag/reparent, layout duplication and responsive layout semantics remain pending. Removal intentionally retains canonical schema; destructive schema removal is not offered. Local fixtures exercise real frontend transport against an isolated stub, not backend acceptance.

The parent remains BLOCKED until its full required acceptance and real-service evidence are supplied. IMPLEMENTED refers only to the available slice above, not the complete parent deliverable.
