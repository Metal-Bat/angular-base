# APP-FE-025 — Governed node configuration boundaries

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

025.1 preserves existing integration pins while offering only the frozen scalar configuration fields. 025.2 preserves exact agent pins, shows declared ports/outcomes/capabilities and an unavailable approved-selector state. The UI distinguishes configuration from connection verification and operation dispatch. It neither asks for credentials nor starts vendor calls.

Changed/reused: studio/domain/node-inspector, node-inspectors.json, node-models, graph-controls and subprocess-pin with specs; node-inspector/node-details/studio-choice/graph-connections/subprocess-pin presentation components; workflow-editor-pane/workflow-board/state/interactions; authoring translations and shared field labels; scripts/generate-node-inspectors.mjs and delivery UI gate; server/workflow-canvas-fixture.mjs. See the coverage matrix for the per-handler and task boundaries.

## Verification and compatibility

Focused checks: `npm run test:ci` (438 tests in 80 files before the final gate), `npm run lint`, `npm run api:check`, `npm run delivery:check`, production `npm run build` and `npm run test:browser-canvas`. These check frontend code and isolated fixtures, not real backend acceptance. Final local evidence is exclusively the subsequent complete `mise run check`, its twelve command logs, `artifacts/check/manifest.json` and serialized browser reports: exit zero, zero diagnostics and identical start/end source hashes are required. Incomplete axe items remain manual-review evidence, not manual accessibility acceptance.

Intermediate failures under `/tmp/steps25-*.log` include component/template size limits, formatter warnings, readonly JSON typing, schema-label typing, extracted-model shadowing and missing translation keys. They were corrected through normal extraction, typing, localization and formatting, without suppression, weakened thresholds or skipped assertions. The existing initial bundle warning budget remains 500 kB.

C03/C11 use existing StudioPort/catalog/selectors/completion/current-reference workspace persistence. HumanTaskContract/GraphFlow use the exact frozen APP-BE-001 OpenAPI; new handler schemas use the producer-hashed public C11 artifact. The generated transport remains 314 operations / 425 schemas with source hash 24609294ec8e087f84f2ab0b302b6abf8e0bd9e57d85366721400bba3f90ca7f. The new deterministic generator checks those small owned projections. No proposed endpoint is invented and no unverified peer API is regenerated.

No dependencies, migrations, seeds, shared/backend data, credentials, paid calls, commits or deployment changed. The peer was read only. Graph refresh is AST-only `graphify update .`. Scope and producer statuses are recorded in docs/delivery/NODE-INSPECTOR-COVERAGE.md. IMPLEMENTED describes the available slice; parent completion still requires all actual acceptance, including remaining frontend work and paired services.

## Remaining acceptance and blockers

025.1 approved operation/version/compatible connection selection and receipt/retry/reconcile policy; 025.2 approved agent-version/projection/choices/human review/budget/tool policy; 025.3 actual sandbox receipts/supervised outputs remain incomplete. APP-BE-022/023/025 and C12 are unverified. No governed operation or human-approval enforcement is claimed implemented by these legacy configuration controls.

The parent remains BLOCKED; the available implementation does not constitute complete normal authoring or integrated execution.

## Independent continuation — 2026-10-10

025.1 consumes the registered business-operation catalog and exposes its approval/retry/reconciliation metadata without dispatching operations. Existing subtask IDs are reused; parent status remains BLOCKED / IMPLEMENTED. Current backend capabilities and producer/client were reconciled before use; historical results above are preserved.

Delivered files, actual satisfied acceptance, all commands/results (including intermediate failures), exact source/contract identities, remaining criteria and owners are recorded in [APP-FE-021–025 continuation acceptance](../delivery/APP-FE-021-025-ACCEPTANCE.md). This slice does not establish full parent publication/execution or strict paired readiness.

## Agent administration editor continuation — 2026-10-16

[APP-FE-030.UX01](APP-FE-030.UX01.md) owns the dedicated agent detail/editor, meaningful decisions/policy/limits and current acceptance. It reuses the existing authorized selectors, model metadata, exact pins and command lifecycle. The [capability/producer handoff](../delivery/AGENT-EDITOR-CAPABILITIES.md) records exact off-page connection-name, workflow choice-shape/sample, retrieval catalog/preview and approved standalone-test gaps. Those gaps remain blocked capabilities; they do not erase supported typed filters, static/input choices or policy editing. No provider execution, backend source/migration, published payload or required human approval changes. This continuation does not close the broader APP-FE-025 parent.

# 2026-10-27 Agent metadata and producer continuation

The existing actor-fenced Agent metadata adapter now requires the producer's
use-authorized `connection_name` and the existing capability view displays it using
the localized Connection label. Focused Angular acceptance proves the current name
is visible and retains actor cleanup/late-response privacy. No credential is exposed.

The current single-producer intake contains 384 operations and 580 schemas,
including five new owned Agent authoring/evaluation operations. Generated transport
and API/UI source inventories are refreshed; an operation's owning screen is not
proof of a usable consumer. Workflow-context, retrieval-preview and governed
evaluation controls remain with APP-FE-025/030. The producer requires a published
Agent plus an eligible immutable workflow/request and delegates normal submission;
its evaluation response is submission identity, not a model verdict.

Actual paired workflow/browser smoke passes with an exact live paths/schema match,
unchanged functional source and no service diagnostics. Focused backend tests use
the real database/process path with a synthetic model; no live provider test or human
acceptance is claimed. Full current-source gates are recorded separately in
`artifacts/seed-processes-2026-10-27/`. Initial inventory drift and the superseded
export using local display-title settings are retained as failed/partial evidence;
final exports use the existing synthetic exporter settings and deterministic checks.
The complete final receipt governs verification; parent UI/demo/deployment tasks
remain open. No permission, replay, approval or published-pin policy is changed.

Local seed usability is also exercised against actual running services: the
development boundary uses the v3 profile's public client/release, and an existing
seeded requester opens/edits the leave draft and reloads its unchanged saved data.
This performs no request submission or human approval. The unrelated foundations
fixture synchronization failure and its strict repair belong to APP-FE-026.

## Integration continuation — 2026-10-28

The selected current consumer/producer gap is implemented in the [integration record](APP-FE-INTEGRATION-2026-10-28.md). That record and its final current-source receipt govern this scoped acceptance; historical results and broader parent/external acceptance remain unchanged.
