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

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C03: Existing StudioChoice now resolves selected values outside the current search page through the implemented selected-summary operation and rechecks eligibility before emitting a current reference. Administration ReferencePicker remains the reusable paged selector for its existing scopes.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Representative actual identity/form/connection selectors, nested restored selections and complete kind/context/revocation acceptance remain to be recorded. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered execution — 2026-10-09

Scope classification: REUSE the existing Administration ReferencePicker, shared SelectControl and StudioChoice; EXTEND StudioChoice's typed adapter, selected-summary restoration and node/catalog adoption; VERIFY the actual producer's sixteen resource kinds. No parallel picker, inbox, authentication or workflow engine is introduced.

The new `features/studio/infrastructure/choice-request.ts` maps the sixteen C03 kinds to existing generated operations. Designer selectors retain their typed paged query; clients use their existing selector; client releases require the selected parent; connections require an explicit SERVICE/NOTIFICATION kind; executable steps and published agent versions use their existing selectors. Library roots use LibraryQuery with canonical `equal`/`contains` filters, while published component/data-type pins use the library version selector. Roots and immutable version pins remain distinct.

StudioChoice retains its applied query/context while rechecking a candidate, cancels superseded page and summary reads, debounces search, rejects unavailable candidates without substitution and exposes deliberate clearing. Restored out-of-page values use the current C03 summary. CatalogExtras adds the parent client selector before release selection. Existing workflow node fields for published forms, connections and published agents reuse StudioChoice. Shared `reference-choice.ts` owns the framework-free key/label decoder; the former Administration export remains compatible. ResourceLinks now checks bounded request size, response kind and actor cancellation.

Observed actual-backend evidence: `/tmp/ordered-006-paired3.log` passed all sixteen paged HTTP kinds and available selected summaries, page-two selection, off-page restoration, client-scoped release selection, explicit clearing, and deletion of an owned candidate before selection. Its production source digest was `3dfd53ea3f462f03ce8056f0e2cfb096c4810afff8991e7f2cb8341b954f20c9`, unchanged across the run. Exact revisions remain the frontend/backend pair above. Actual HTTP paths/components digest `7757e54756a096fd69f708733ee3fb1c16a49ef732f427c81b7a2fdebf444b8c` matched the client. The latest run adds keyboard focus and English/Farsi RTL acceptance; final status awaits those results and the complete zero-warning gate.

Retained failed evidence: paired2 exposed the invalid `eq` root filter; it was corrected to the backend's actual `equal` enum with a regression assertion. Paired4 failed its keyboard-close scenario; the next run explicitly waits for the options and opening/hiding animations. Failed logs/manifests remain available. Unit runs 1/2 exposed test synchronization and lint1 exposed attribute order/shadowing; these failures are retained rather than hidden. No timeout, threshold, skip or warning policy was relaxed.

Later specialized editor adoption remains with APP-FE-016–032 as specified in this ticket's sequence. A standalone favorite step-version destination belongs to APP-FE-009, rather than the picker transport. Full application no-JSON closure, manual assistive-technology acceptance, deployment and user acceptance retain their separate owners/evidence levels. The disposable acceptance harness changes only owned test data in its copied backend runtime, including owned clients and one release; peer/shared source and data are unchanged.

Latest paired result: `/tmp/ordered-006-paired5.log` exited 0, with 27 actual browser scenarios and no captured browser/service diagnostics. Keyboard open/Escape/focus and en/fa RTL selection stability passed. Production source digest `d90b0a27888f9c57688d410e2c37298a75dd1ec155ee6339ae518f378f98c28c` was identical at start/end; the backend peer/source digest `dc21adc51b85cf34870ef0e6b0c26ad2ac81909e46d48d38be722e0d120bc060` was unchanged. Paired4's failure was test synchronization before overlay animation completion; the successful rerun retains the same assertions and deadlines. Final local status is governed by the complete check manifest, not the earlier focused results.

## Completion of reusable picker scope

Status: DONE. Verification: VERIFIED_INTEGRATED. `/tmp/ordered-006-final-check.log` and `/tmp/ordered-006-final-manifest.json` record complete `mise run check`, exit 0, all 12 commands with zero emitted diagnostics, 485 passing unit tests / 95 files and all ten Firefox quality scopes. Starting/ending full-tree SHA-256: `a57d387efb97c4808f19829e26e954cea81d5533257e436ad2a7cc00e6d31b63`. Initial production bundle: 497,642 bytes under the unchanged 500 kB gate. Graph refresh passed in `/tmp/ordered-006-graph.log`. Actual paired evidence above supplies the required selector HTTP and browser acceptance. Automated accessibility violations were zero; recorded incomplete assistive-technology checks remain separate manual evidence with their existing owners. This closes the reusable picker task and supersedes its historical missing-producer blocker; it does not close specialist editors or full product acceptance.
