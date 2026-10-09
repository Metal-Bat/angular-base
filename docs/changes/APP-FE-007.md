# APP-FE-007 — Semantic record summaries and typed editing patterns

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Implemented and reused

Extended existing read-only record presentation with named PrimeNG collection tables, unioned columns, distinct missing/null values and preserved false/zero/exact decimal strings. Singular/plural opaque references and secrets are hidden from display without altering source or command data. Shared RecordSummary delegates collections to RecordCollections while retaining the existing before/after history comparison.

Existing typed create/edit/search/report/history and confirmation flows are retained. RecordFields now carries picker labels and preserves unrelated nested fields/client restrictions. Reused shared/domain/record-presentation.ts, shared/ui/record-summary and the existing records, Studio catalogs and operational/admin editors. Specialized node, identity and integration redesign stays with APP-FE-016–032; full no-JSON coverage stays with APP-FE-033.

## Verification

Focused specs cover cancellation/revocation, actor cleanup, immutable edits, redacted collection presentation, missing/null/false/zero, system-mode lifecycle and applied-query repair as relevant to this task. Browser records, Studio catalogs and administration scenarios exercise existing CRUD and picker interaction; profile appearance is checked in the auth reload journey. Browser fixtures never contact the user's backend.

Final local verification is `mise run check`; evidence is `artifacts/check/manifest.json` and per-command logs. A valid run requires exit 0, zero diagnostic counts and identical starting/ending source hashes. This validates implemented local slices only. Required new-contract real API/browser acceptance is not claimed. Focused run logs are under `/tmp/app-fe-wave4/`.

No dependency, database migration, seed, production/shared-data, deployment or paid-call changes. Peer code was read only. `graphify update .` refreshes the graph after final source changes.

## Remaining work and exact blocker

The shared presenter/editing slice is implemented and locally tested. Parent APP-FE-007 remains BLOCKED by APP-FE-006: full reference/version resolution and every-kind selector adoption cannot be closed without C03. This record does not claim total product completion or full specialized editor coverage.

The task remains BLOCKED until its entire acceptance criteria and required integration evidence pass. This record is not permission to mark the parent DONE based on fixture/local quality.
