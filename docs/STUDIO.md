# Authoring studio: Steps 29–33

The studio provides permission-checked form and workflow definition/version catalogs, authoring editors, clients/releases, request types and reusable definitions. Open `/studio` after signing in. Forms, clients and releases require `forms.manage`; workflows require `workflows.manage`; request types require `requests.manage`. The backend checks authorization independently of navigation.

## Catalogs and lifecycle

Catalogs now open with named tables, typed filters and ordered sorts using the [shared CRUD design](design/BACKEND-CRUD.md). Create is a top-end action; Create/Edit open PrimeNG dialogs, and Open reads current details. Version/release pages choose a parent from a paginated searchable modal, or retain the parent supplied by a root detail link. Refresh and pagination preserve the applied query; reports send that query and show a queued notice without replacing the table. Reusable library discovery also uses a table.

Catalog controls derive writable fields and operations from the checked-in platform OpenAPI. They support paged search, authorized reads, creation/update, history/report and the lifecycle actions that each actual endpoint exposes. Workflow grants read current paged state. Published versions are read-only; retirement and deletion remain separate commands. Required query fields are preserved. Request-type client/release restrictions survive unrelated edits; deliberately clearing a nonempty restriction list requires confirmation.

Confidential client secrets appear only in a one-time in-memory reveal. Dismissal, resource selection, actor change and component destruction clear the reveal. Secrets never enter configuration, browser storage or fixtures. Client releases use the actual renderer/API capability and release-bound fields.

## Form builder

Open a draft form version's Edit link. The palette uses 20 code-owned primitive kinds, a nested outline, keyboard reorder controls, a data-schema inspector and separate render/settings JSON editors. Nested repeater bindings retain collection scopes. JSON edits must be explicitly applied before saving; invalid buffers remain available for correction. Server diagnostics map to the deepest matching outline node. Schema/render definitions remain distinct and are validated by the server.

Behavior, options, navigation, field catalog and render-schema tools call actual author-only endpoints. The runtime preview calls `/forms/runtime-preview`, then uses the same renderer as operational forms. Choose edit, summary, print or correction, English/Farsi, synthetic data and optional policy/before-data/stable row identities. An omitted policy grants declared synthetic scopes; an explicit empty policy grants none. Hidden fields are projected out by the backend. Exact numeric strings and typed option keys remain canonical. Author option queries propagate locale, paging, selected keys and cancellation.

Preview is explicitly simulated. It performs no workflow execution or real uploads. Backend supported expressions evaluate behavior; authored JSON is never evaluated as browser JavaScript. Detailed schema/behavior settings currently use JSON inspectors rather than dedicated visual controls for every setting.

## Workflow board

Open a draft workflow version's Edit link. Registered server metadata provides typed ports and step configuration. Control transitions and data bindings have distinct visuals and identities. Use canvas dragging/pan/zoom, arrow-key node movement, connection controls, routing waypoints, collapse and bounded undo/redo. The raw graph inspector can retain incomplete drafts; invalid visual entries remain recoverable through JSON.

Save workspace persists `bpms.workspace/1`: graph WIP, stable-key positions, viewport, collapsed keys and routing. It has its own opaque revision, independent of the executable version. Validation does not promote. Promote explicitly validates and atomically replaces the executable graph, and publish separately confirms publication. A checksum binds promoted WIP to the resolved executable graph. Layout-only changes preserve promotion; executable edits through another endpoint invalidate it. Invalid promotion retains WIP. Published graph/workspace edits fail.

A 409 preserves current edits for deliberate reconciliation; mutation retries are never automatic. Unsaved navigation is guarded. Async results are fenced by actor generation. Logout and actor changes clear private editor state and bounded history.

## Reusable definitions

Component/data-type catalogs and versions use their actual lifecycle operations. Library tools provide paged search/select, dependencies, where-used, comparison, guidance, template creation and explanation. Upgrade preview freezes exact references/payload; changing it invalidates approval. Apply requires a compatible preview and confirmation, with the backend rechecking authorization and version immutability. Execution pins are not silently changed.

## Contracts and repeatable checks

`npm run api:generate` regenerates the typed API, owned authoring catalog and all 20 primitive fixtures. `npm run api:check` verifies provenance and regeneration. The backend studio patch is incremental after the four earlier platform patches; run the backend migration to create workspace/history tables. The platform snapshot has 314 operations and 425 schemas.

Local verification: 248 frontend unit tests, 664 backend tests (119 existing environment-gated skips), and 12 disposable PostgreSQL integration tests. The Firefox author/outsider journey covers preview, incomplete WIP save/reopen, invalid promotion, typed bindings, explicit promotion/publication, client secret dismissal, restriction-preserving rename/explicit clear, route teardown and sign-out denial.

For a disposable backend, run `scripts/seed_studio_browser.py` with its test PostgreSQL/cache configuration and `PYTHONPATH=src:.`. It writes a private accounts file; never commit or log that file. Build the frontend and run `npm run test:browser-studio` with `STUDIO_BROWSER_ACCOUNTS` pointing to it and the backend on loopback port 58800. Seed fresh accounts before every run because the journey publishes its workflow. The test API uses lifespan off only to avoid unrelated storage startup in this isolated fixture; it does not validate production startup. Remove credentials and disposable services after verification.

See [canvas decision and measurements](CANVAS-ADR.md). Hosted CI, full accessibility/RTL/browser coverage, agreed performance budgets and deployment remain Steps 36–37 gates.

October 4 CRUD verification: the full frontend suite passes 291 tests. `npm run test:browser-catalogs` uses disposable local data and covers creation/update, all 11 catalogs, applied-query reporting, parent selection and immutable publication. Chromium audits report no WCAG violations in nine contexts; the Create dialog has one manual-review result for PrimeNG focus-trap sentinels. Desktop light/dark and 390px Persian RTL layout checks report no page overflow. This fixture run does not validate new writes against the live backend or hosted CI.

## Direct workflow list and detail diagram

The permission-aware Workflows sidebar shortcut opens `/studio/workflows` directly. Open a workflow to see a version selector and an embedded read-only BPMS-style canvas with directed transitions, outcome labels, fit/zoom/pan and a step transition inspector. Version details also embed this view. Open designer remains an explicit navigation action.

The viewer reads the current version reference, then GETs its authoritative `/graph`. It uses `/workspace` only for saved node positions; an unpromoted workspace graph never replaces the version graph. A missing workspace uses deterministic control-flow layout, including cycles and disconnected steps. Version pages are bounded and preserve the workflow parent scope. Diagram state and pending reads are cleared/fenced on actor changes and destruction. Nodes/connections cannot be edited in this view; viewport changes are local and never saved. Canvas code is loaded lazily.

Verification: 296 frontend tests pass, production build stays within budgets, strict typing/API/format checks pass, and lint has zero errors. Disposable Chromium Studio and authoring-canvas journeys pass. The workflow diagram audit and desktop light/dark/mobile Persian RTL checks have no accessibility violations or document overflow. These checks use local synthetic data, not live backend mutations or hosted CI.

## Studio list polish

All 11 resource catalogs retain shared CRUD tables/dialogs. Catalog lifecycle/designer actions now share a consistent toolbar. Reusable library browsing is list-first: compact search, named version table, selected-source notice, top-end Create Template and a modal with Create/Cancel. Dependency, explanation and reviewed-upgrade tools stay under a collapsed advanced section. Search and selector pagination preserve the last applied query in both directions; selection retains its actual resource kind. Template creation freezes the confirmed source/body and is fenced against actor changes. Tables show readable localized UTC timestamps and status badges.

Verification: 299 unit tests, production build, strict typing, formatting and lint with zero errors pass. Disposable Chromium journeys cover all Studio catalogs plus library selection, template cancellation/creation and Users regressions. Library desktop light/dark/mobile Persian RTL checks show no overflow or WCAG violations. The two PrimeNG modal audit contexts retain manual-review results for focus-trap sentinels; live backend mutation and hosted CI evidence are separate.

## Record detail presentation

Studio and shared record details use a curated summary: identity/status, Overview and Activity cards, and separate Edit/History actions. Audit details and before/after changes get their own information groups. Opaque references and internal checksums are omitted; the raw Studio definition dump is removed. Reference IDs remain in state for current-version API calls. Edit dialogs hide the internal `ref_id` and prefilled parent-scope fields while preserving them in submitted DTOs. Designer headers and queued report notices omit opaque IDs too. Workflow details retain their diagram and step inspector.

Verification: 301 unit tests pass, including summary reference/secret omission with original data preserved. Production build, typing, lint with zero errors and formatting checks pass. Studio and Users disposable browser journeys validate the redesigned detail flows; live backend writes and hosted CI remain separate evidence.
