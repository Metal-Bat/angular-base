# APP-FE-009 — Validated applied-query snapshot preparation

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Implemented and reused

Added framework-independent saved-list-view domain functions for capturing the applied query and restoring page one. Snapshots retain ordered filters/sorts, page size and allowlisted columns/extras; they omit the current page and response data, clone canonical values and validate the scope/schema. Removed fields, invalid operators/types, missing columns or unsupported schema versions require explicit repair; restrictive filters are never silently discarded. Revision-sensitive reference filters and private credential extras are rejected pending durable resolution.

Added records/domain/saved-list-view.ts and focused serialization tests; reused shared/domain/list-query.ts. This is a frontend domain model, explicitly not a guessed C04 wire DTO.

## Verification

Focused specs cover cancellation/revocation, actor cleanup, immutable edits, redacted collection presentation, missing/null/false/zero, system-mode lifecycle and applied-query repair as relevant to this task. Browser records, Studio catalogs and administration scenarios exercise existing CRUD and picker interaction; profile appearance is checked in the auth reload journey. Browser fixtures never contact the user's backend.

Final local verification is `mise run check`; evidence is `artifacts/check/manifest.json` and per-command logs. A valid run requires exit 0, zero diagnostic counts and identical starting/ending source hashes. This validates implemented local slices only. Required new-contract real API/browser acceptance is not claimed. Focused run logs are under `/tmp/app-fe-wave4/`.

No dependency, database migration, seed, production/shared-data, deployment or paid-call changes. Peer code was read only. `graphify update .` refreshes the graph after final source changes.

## Remaining work and exact blocker

APP-BE-009 remains BLOCKED / NOT_RUN and the frozen delivery contract contains no saved-view/favorite/resolver operations. Save/update/rename/delete/default UI, favorites navigation, durable current links, two-tab conflicts and real API/browser persistence remain blocked on C04/C03. No pretend persistence, arbitrary href or stale-ref browser bookmark is introduced.

The task remains BLOCKED until its entire acceptance criteria and required integration evidence pass. This record is not permission to mark the parent DONE based on fixture/local quality.
