# APP-FE-022 — Human task configuration

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

022.1 adds published-form and candidate user/group selection through existing designer selectors. 022.2 reuses the actual HumanTaskContract for typed view/action structures, and surfaces missing declared action transitions and empty candidates. Existing field policy and pinned references survive edits. Generic human completion is explicitly separate from protected business approval.

Changed/reused: studio/domain/node-inspector, node-inspectors.json, node-models, graph-controls and subprocess-pin with specs; node-inspector/node-details/studio-choice/graph-connections/subprocess-pin presentation components; workflow-editor-pane/workflow-board/state/interactions; authoring translations and shared field labels; scripts/generate-node-inspectors.mjs and delivery UI gate; server/workflow-canvas-fixture.mjs. See the coverage matrix for the per-handler and task boundaries.

## Verification and compatibility

Focused checks: `npm run test:ci` (438 tests in 80 files before the final gate), `npm run lint`, `npm run api:check`, `npm run delivery:check`, production `npm run build` and `npm run test:browser-canvas`. These check frontend code and isolated fixtures, not real backend acceptance. Final local evidence is exclusively the subsequent complete `mise run check`, its twelve command logs, `artifacts/check/manifest.json` and serialized browser reports: exit zero, zero diagnostics and identical start/end source hashes are required. Incomplete axe items remain manual-review evidence, not manual accessibility acceptance.

Intermediate failures under `/tmp/steps25-*.log` include component/template size limits, formatter warnings, readonly JSON typing, schema-label typing, extracted-model shadowing and missing translation keys. They were corrected through normal extraction, typing, localization and formatting, without suppression, weakened thresholds or skipped assertions. The existing initial bundle warning budget remains 500 kB.

C03/C11 use existing StudioPort/catalog/selectors/completion/current-reference workspace persistence. HumanTaskContract/GraphFlow use the exact frozen APP-BE-001 OpenAPI; new handler schemas use the producer-hashed public C11 artifact. The generated transport remains 314 operations / 425 schemas with source hash 24609294ec8e087f84f2ab0b302b6abf8e0bd9e57d85366721400bba3f90ca7f. The new deterministic generator checks those small owned projections. No proposed endpoint is invented and no unverified peer API is regenerated.

No dependencies, migrations, seeds, shared/backend data, credentials, paid calls, commits or deployment changed. The peer was read only. Graph refresh is AST-only `graphify update .`. Scope and producer statuses are recorded in docs/delivery/NODE-INSPECTOR-COVERAGE.md. IMPLEMENTED describes the available slice; parent completion still requires all actual acceptance, including remaining frontend work and paired services.

## Remaining acceptance and blockers

Inventory-driven authorized scope/field-policy controls, named-view/purpose refinement, candidate reconciliation/removal and labels after reopen remain frontend work. 022.3 required approval and real create/publish/claim/complete/return with an ordinary reviewer await APP-BE-021/C12 and paired evidence. No quorum, self-approval or delegation policy is invented.

The parent remains BLOCKED; the available implementation does not constitute complete normal authoring or integrated execution.
