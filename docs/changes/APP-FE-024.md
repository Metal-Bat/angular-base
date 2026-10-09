# APP-FE-024 — Transitions, waits and subprocess pins

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

024.1 adds typed existing transition conditions, default flags and priorities with conflict checks and documented descending evaluation order. 024.2 exposes the actual GraphFlow structure and registered timer/event controls. 024.3 selects exact authorized published child catalog versions, summarizes their interface, provides typed scalar constant/assignment inputs and refuses a version change that would silently carry old child inputs.

Changed/reused: studio/domain/node-inspector, node-inspectors.json, node-models, graph-controls and subprocess-pin with specs; node-inspector/node-details/studio-choice/graph-connections/subprocess-pin presentation components; workflow-editor-pane/workflow-board/state/interactions; authoring translations and shared field labels; scripts/generate-node-inspectors.mjs and delivery UI gate; server/workflow-canvas-fixture.mjs. See the coverage matrix for the per-handler and task boundaries.

## Verification and compatibility

Focused checks: `npm run test:ci` (438 tests in 80 files before the final gate), `npm run lint`, `npm run api:check`, `npm run delivery:check`, production `npm run build` and `npm run test:browser-canvas`. These check frontend code and isolated fixtures, not real backend acceptance. Final local evidence is exclusively the subsequent complete `mise run check`, its twelve command logs, `artifacts/check/manifest.json` and serialized browser reports: exit zero, zero diagnostics and identical start/end source hashes are required. Incomplete axe items remain manual-review evidence, not manual accessibility acceptance.

Intermediate failures under `/tmp/steps25-*.log` include component/template size limits, formatter warnings, readonly JSON typing, schema-label typing, extracted-model shadowing and missing translation keys. They were corrected through normal extraction, typing, localization and formatting, without suppression, weakened thresholds or skipped assertions. The existing initial bundle warning budget remains 500 kB.

C03/C11 use existing StudioPort/catalog/selectors/completion/current-reference workspace persistence. HumanTaskContract/GraphFlow use the exact frozen APP-BE-001 OpenAPI; new handler schemas use the producer-hashed public C11 artifact. The generated transport remains 314 operations / 425 schemas with source hash 24609294ec8e087f84f2ab0b302b6abf8e0bd9e57d85366721400bba3f90ca7f. The new deterministic generator checks those small owned projections. No proposed endpoint is invented and no unverified peer API is regenerated.

No dependencies, migrations, seeds, shared/backend data, credentials, paid calls, commits or deployment changed. The peer was read only. Graph refresh is AST-only `graphify update .`. Scope and producer statuses are recorded in docs/delivery/NODE-INSPECTOR-COVERAGE.md. IMPLEMENTED describes the available slice; parent completion still requires all actual acceptance, including remaining frontend work and paired services.

## Remaining acceptance and blockers

New route/outcome composition, full branch/join/loop/event/timer lifecycle acceptance, child request/prior-output/structured input and output mapping, dependency summaries/read-only child navigation and real publish/execute remain incomplete. The interface is summarized without exposing sample payloads or silently retargeting existing pins.

The parent remains BLOCKED; the available implementation does not constitute complete normal authoring or integrated execution.
