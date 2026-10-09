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
- DB-001's applied single-initial-migration policy is a real constraint: resolve D01 explicitly before adding schema. Never rewrite an applied revision, stamp away drift or use shared-data downgrade/reset to make checks pass.
- Record failures with safe support/correlation metadata, never private payloads/secrets; record sink outages honestly. Keep multilingual help frontend-owned with only minimal user seen/dismissed state persisted.
- Changes close with actual logs/results, a docs/changes/TASK-ID.md record, peer contract handoff where relevant and graphify refresh according to existing instructions. Local verification, integration, demo readiness, deployment and user acceptance remain separate evidence levels.

These rules supplement the repository's existing AGENTS.md. If another instruction permits completion with an accepted limitation, that does not satisfy this delivery plan's stricter zero-warning/demo gate; report VERIFIED_WITH_EXCEPTION or BLOCKED instead of strict readiness.
