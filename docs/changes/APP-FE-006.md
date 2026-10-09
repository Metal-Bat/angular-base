# APP-FE-006 — Permission-aware picker foundation

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Implemented and reused

The existing ReferencePicker now uses every permitted command group, passes AbortSignal into the existing transport, debounces search, cancels/fences page/context/locale/actor reads and rechecks the exact applied page before emitting a selected key. Display labels are validated separately from authoritative keys; name-only responses and forged rows are rejected. Known selector fields are read-only with lookup/clear controls. Labels survive unrelated edits in RecordFields and ResourceActions; plural reference fields are redacted only in presentation. Nested picker dismissal restores focus after the PrimeNG hide transition; actor reset discards the old focus target.

Reused files: administration ReferencePicker, SchemaInput/SchemaObject/SchemaArray, ResourceActions, AdminPort/AdminApi, records RecordFields. Added shared/ui/reference-labels.ts and focused picker regressions. Existing identity, AI connection/model, integration, agent and task/queue paths are taken from the frozen generated contract. No replacement selector endpoint is invented.

## Verification

Focused specs cover cancellation/revocation, actor cleanup, immutable edits, redacted collection presentation, missing/null/false/zero, system-mode lifecycle and applied-query repair as relevant to this task. Browser records, Studio catalogs and administration scenarios exercise existing CRUD and picker interaction; profile appearance is checked in the auth reload journey. Browser fixtures never contact the user's backend.

Final local verification is `mise run check`; evidence is `artifacts/check/manifest.json` and per-command logs. A valid run requires exit 0, zero diagnostic counts and identical starting/ending source hashes. This validates implemented local slices only. Required new-contract real API/browser acceptance is not claimed. Focused run logs are under `/tmp/app-fe-wave4/`.

No dependency, database migration, seed, production/shared-data, deployment or paid-call changes. Peer code was read only. `graphify update .` refreshes the graph after final source changes.

## Remaining work and exact blocker

APP-BE-008 remains BLOCKED / NOT_RUN. C03 still lacks the frozen durable resolver and selected-value lookup needed for all kinds, out-of-page initial resolution, version/root metadata and safe revision refresh. Multi-select and client/release/form/workflow/step/request-type coverage remain required. Rechecking a page deliberately rejects a removed/revised key instead of substituting another object. The representative real identity/form/connection selector acceptance has not run; fixture browser interaction is not that evidence.

The task remains BLOCKED until its entire acceptance criteria and required integration evidence pass. This record is not permission to mark the parent DONE based on fixture/local quality.
