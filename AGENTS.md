## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Complete application delivery (APP-FE)

For APP-FE-* work, read `docs/BACKLOG.md`, `docs/delivery/FRONTEND-BACKLOG.md` and the relevant current contracts, execution rules and evidence. New APP task status lives in this supplement; the original backlog links to it and retains all existing IDs/history. Follow `.agents/skills/product-delivery/SKILL.md` when installed, plus applicable existing skills.

- Inventory and reuse existing code before implementing. A changed wording in old documentation does not justify rebuilding working auth, forms, workflow canvas, CRUD, notification delivery or execution infrastructure.
- Proposed API paths/fields in the delivery pack must be reconciled and frozen against the real backend before use. No invented endpoints, lifecycle transitions or operation outcomes.
- A task may be READY to start while unverified; do not call its deliverable ready. Implementation completion requires the full final `mise run check` with zero emitted warnings and its actual acceptance tests. No blanket suppression, skip-based verification, weakened thresholds, masked exit codes or fixture-only integration claims.
- Keep immutable published versions, pinned active cases, server authorization, live-record list filtering, private data, current refs and unchanged operation-specific replay payloads. AI never substitutes for required human approval.
- Normal UI workflows require purposeful input/output controls, not raw JSON or copied reference IDs. PrimeNG-first applies to new/redesigned business UI with documented Material/CDK/native/canvas exceptions; no unapproved framework or paid-library replacement.
- Workflow default restoration is separate from demo-environment reset. Never alter active pins, published payloads or shared/production data; use only the guarded disposable harness for environmental reset.
- Reconcile the current backend `docs/delivery/approved-decisions.json` and `docs/changes/DB-002.md` before schema or verification changes. DB-002 supersedes DB-001's single-file strategy and the earlier additive-only repository file policy; their historical evidence remains intact. It does not authorize shared resets, blind stamping or repeated edits to applied revisions. Preserve a safe reviewed upgrade path.
- Record failures with safe support/correlation metadata, never private payloads/secrets; record sink outages honestly. Keep multilingual help frontend-owned with only minimal user seen/dismissed state persisted.
- Changes close with actual logs/results, a docs/changes/TASK-ID.md record, peer contract handoff where relevant and graphify refresh according to existing instructions. Local verification, integration, demo readiness, deployment and user acceptance remain separate evidence levels.

These rules supplement the repository's existing AGENTS.md. If another instruction permits completion with an accepted limitation, that does not satisfy this delivery plan's stricter zero-warning/demo gate; report VERIFIED_WITH_EXCEPTION or BLOCKED instead of strict readiness.

## Cross-layer software consistency and repair work

For CONS-FE-* and affected APP work, read `docs/BACKLOG.md`, `docs/delivery/FRONTEND-BACKLOG.md`, `docs/delivery/follow-up-2026-10-09/FRONTEND-FOLLOW-UP.md`, and `docs/delivery/consistency-2026-10-09/FRONTEND-CONSISTENCY-BACKLOG.md`. Follow `.agents/skills/contract-consistency/SKILL.md` in addition to existing skills.

- Reuse current implementations and preserve existing APP/assistant IDs and historical verification. The new CONS tasks own only cross-cutting consistency checks; concrete feature repairs remain with their actual APP owner.
- Follow the software design contract and repair register in `docs/delivery/consistency-2026-10-09/`. Private entities, public DTOs and UI models share meaning through explicit mappings; they are not required to be the same class or expose identical fields.
- Fixed public JSON, including nested models and computed fields, follows BaseDTO/snake_case with documented validation-only aliases; dynamic document keys and HTTP headers have separate existing contracts. Preserve current envelopes, operation IDs, selectors, private binary APIs and stable error values.
- Existing PATCH self-profile/preferences routes are compatibility exceptions to conventional resource PUT. Preserve their semantics; review SKILL-AMENDMENTS.md rather than breaking the API to match older prose.
- Reconcile current backend recorded DB-002/D07 decisions before changing migrations or readiness labels. Never rewrite applied revisions, blindly stamp or reset shared data. Exact accepted SDK exceptions remain VERIFIED_WITH_EXCEPTION, not strict exception-free or full demo readiness. Do not expand exceptions or suppress new diagnostics.
- Keep clear application ownership, atomic invariants, authorized projections, immutable published pins, current refs, unchanged replay payloads and required human approval. No new parallel workflow engine, scheduler, generic action executor, permission system or JSON-console product UI.
- Frontend design is PrimeNG-first for standard touched business UI, with semantic tokens and explicit tested exceptions. Persisted/reset defaults and canonical values must agree with the backend; neutral actor cleanup is distinct. Preserve en/fa, RTL, accessibility, unsaved input and uncertain-result recovery.
- Full final `mise run check` and actual task-specific acceptance are required. Compare start/end source identity, retain failed/partial evidence and scope deadlines. Missing peer/services or required skips prevent integrated completion. No local fixture result is promoted to real-service/browser/deployed/user acceptance.

This section supplements the existing rules. If a newer repository decision conflicts, record it and preserve working contracts until resolved; do not silently choose a breaking cleanup.

### Scoped consistency instruction reconciliation (2026-10-09)

Read [SKILL-AMENDMENTS.md](docs/delivery/consistency-2026-10-09/SKILL-AMENDMENTS.md) and the [installation record](docs/delivery/consistency-2026-10-09/INSTALLATION-RECORD.md). These are instruction amendments, not business approvals or evidence that a repair has run.

- Conventional mutable resources retain the project's PUT-by-ref contract. The implemented GET/PATCH `/api/v1/me/preferences` and `/api/v1/me/profile` singleton self-service contracts are explicit compatibility exceptions; preserve omitted/null/partial-update semantics. Do not convert them to PUT or permit additional generic PATCH routes without their own recorded contract decision and tests.
- HTTP status and public application error number are separate tested fields. Preserve the backend's current `utils.errors` catalog and `utils.presenter` envelopes; do not replace established application codes with HTTP numbers to match older prose.
- When reviewing contracts, verify route-reachable fixed JSON models recursively, including nested and computed output fields and serialization-mode schemas, against BaseDTO. Distinguish fixed DTO fields from bounded dynamic keys. Review examples and effective generated OpenAPI after localization/header/tag enrichment; entity metadata never authorizes exposing private storage fields.
- D07 records two exact accepted backend SDK warnings. A result under that policy remains VERIFIED_WITH_EXCEPTION, never strict exception-free or full demo readiness. New exceptions require approval. Backend exceptions do not excuse frontend warnings, required skipped tests, hidden output or fixture-only integration claims. Keep the complete final check and task-required scenarios, exit codes and failure evidence.
- Standard touched business UI is PrimeNG-first with semantic tokens and explicit tested exceptions. Reuse shared controls. Cross-feature imports require a documented public seam and no domain/presentation inversion; do not duplicate Administration schema controls into Studio or replace domain-specific configuration with them.
- One frozen producer manifest must govern the main transport and reviewed metadata slices. Backend persisted defaults govern explicit preference reset; neutral actor-cleanup defaults are separate. Existing discrepancies stay with their repair owner and are not repaired by installing these instructions.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
