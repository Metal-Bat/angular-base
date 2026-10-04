# Frontend-readiness review: async-fast-api-base

**Repository:** `Metal-Bat/async-fast-api-base`  
**Reviewed branch snapshot:** `main` at `8921841a866c190d794f41af7a41389400fea26b`  
**Review date:** October 2, 2026  
**Requested frontend:** Angular, PrimeNG, and a canvas board  
**Scope:** Read-only review. No backend changes, commits, issues, or frontend project were created.

## 1. Executive assessment

This repository implements a versioned forms-and-workflow platform, not merely an asynchronous FastAPI starter. The frontend should be designed around three distinct experiences: an operational workspace, an authoring studio, and administration. Its central interaction is a version-pinned business request progressing through a durable process and human work items, not a set of independent CRUD tables.

The reviewed code provides a substantial base: authenticated sessions, role permissions, client/release binding, immutable publication, graph validation, typed form presentation, dynamic options, repeated-row identities, governed attachments, task actions, correction feedback, process timelines, notifications, AI tool approvals, and background-operation controls.

**Readiness conclusion:** The core product model is sufficiently understood to define a grounded frontend architecture and screen map. It is not appropriate to declare production integration ready or “no open questions.” Three concrete data-handling defects require remediation, and several missing runtime/editor contracts need to be agreed before implementation. These are identified below with proposed defaults rather than hidden assumptions.

### Evidence and limits

The accompanying `review-manifest.json` records the individual files and inspected ranges. The review covers critical routes, DTOs, services, authorization, state machines, source registries, the development stack, and the HTTP journey regression. Some secondary areas were reviewed at route/contract level rather than through every implementation adapter.

Four isolated local source-logic probes were executed. They use transcribed functions and explicitly documented substitutes for external types/database access. They reproduce a filtered-save failure, its negative control, missing write-policy presentation annotations, and the request-type target serialization omission. They are **not** the repository's pytest suite, a live security exploit, or database-backed integration tests.

The full test suite, migrations, live API, browser, object storage, brokers/workers, and reverse proxy were not run. OpenAPI was not regenerated. A whole-repository line-by-line security or performance audit was not completed. No correctness claim is made for uninspected runtime adapters or infrastructure.

The repository's dated OpenAPI inventory reports **302 operations and 401 component schemas**. Those are repository-reported inventory counts, not independently regenerated counts from this review. The inventory itself explicitly warns that it is not a replacement for route/service/test review.

**Sources:** `docs/project-overview.md`; `docs/api/openapi-coverage.md`; `src/apps/users/presentation/main.py`; `review-manifest.json`.

## 2. Product and domain map

### 2.1 Core relationships

```text
Form definition ──────> Form version
                       data schema + render schema + behavior dialect
                       + localization + client design variants
                               │
Workflow definition ─> Workflow version
                       steps + transitions + input bindings + assignment targets
                               │
Request type ─────────> references the form and workflow definitions
                               │
Business request ─────> pins a published workflow version when its draft is created
       │
       ├─────────────> Initial form submission pins its form version and presentation
       │
       └─────────────> Process instance
                              │
                              └─> execution tokens / step executions
                                       │
                                       └─> work items / candidates / task submissions
```

The definition/version distinction is fundamental. A definition is the editable catalog identity; a version is the authored snapshot used for execution. A request is a user's case. A process is execution state. A work item is a human's actionable step. They have different references, statuses, permissions, and commands.

Creating a business-request draft resolves the latest published form and workflow versions for the configured definitions and pins them. Publishing a new version afterward does not silently move that existing draft or its running process onto the new version. The UI must display the relevant pinned version, not simply request the newest definition.

**Sources:** `src/apps/requests/application/service.py:create_draft,_published_form,_published_workflow`; `src/apps/requests/domain/dto.py`; `src/apps/workflows/application/service.py:publish`; `docs/project-overview.md`.

### 2.2 Functional areas

| Area | Implemented role | Frontend consequence |
|---|---|---|
| Users, sessions, roles and permissions | Authenticate actors and gate operations. | Account screens, permission-aware navigation, session handling. |
| Work groups | Assign operational eligibility through current membership. | Assignment controls and group-aware task availability; not a substitute for role permissions. |
| Clients and releases | Bind renderer capabilities and application identity to a session. | Explicit frontend release registration and a supported authentication boundary. |
| Forms and reusable definitions | Author and publish data/render documents and reuse components. | A form builder and a separate runtime form renderer. |
| Workflows, step types and designer | Validate graphs, discover trusted handler contracts, publish versions. | A semantic workflow canvas with typed ports, mappings and validation feedback. |
| Requests, processes and work items | Own cases, execution, human decisions and corrections. | Request workspace, task inbox, task detail and process inspection. |
| Integration connections and AI agents | Govern connection use, agent definitions, capabilities and approvals. | Restricted configuration screens; separate AI approval detail for form-less tasks. |
| Notifications, media and reporting | Deliver notices, private content and owned report artifacts. | Notification center, authenticated upload/download adapters, report center. |
| Background tasks | Manage task definitions, schedules and execution controls. | An administrator-only operations area, not the ordinary human-task inbox. |

This table describes existing responsibilities, not a claim that every proposed screen already has a complete end-to-end read model.

**Sources:** router registrations in `src/apps/users/presentation/main.py`; inspected domain routes listed in `review-manifest.json`.

## 3. Actual user journeys

### 3.1 Requester journey

The requester signs in, resolves permissions, selects an eligible request type, creates a draft, renders its pinned form, saves canonical data, and submits the saved draft using a `submit_key`. The current implementation lacks a general requester-facing request-type picker: the configured request-type search is management-only.

Draft creation is not idempotent. Ordinary request saves replace `data`, use the current revision-bearing `ref_id`, and have no command key. Submitting accepts a key, not a new form-data payload. Submission validates saved values, materializes attachment references, checks options, and starts the process transactionally. The returned request may already be `RUNNING` or `COMPLETED`; the UI must not insist on observing an intermediate `SUBMITTED` response.

The business-request cancellation endpoint is for an owned **draft**. It is not the running-process cancellation command.

**Sources:** `src/apps/requests/presentation/routes.py`; `src/apps/requests/application/service.py`; `docs/guides/frontend-journey.md`.

### 3.2 Reviewer journey

The reviewer queries the appropriate inbox, claims a visible eligible item using a command key, and opens its task view. Claiming uses an atomic revision/state check. The task view supplies localized, policy-filtered data and render nodes, declared actions, prior data, and correction feedback. An observer or a closed task gets no actionable completion buttons.

A reviewer may save an incomplete draft, complete it, reject it, or return it for correction, subject to the pinned action contract. These are not interchangeable button labels: action kind, canonical outcome, comment requirements, required field scopes, validation mode and workflow transitions are checked by the backend.

Forwarding creates a new work item sharing the execution/submission context and returns that new item's reference. It does not merely edit an assignee field on the same item. Correction handling links a new draft to the prior immutable submission and preserves governed row/attachment context.

**Sources:** `src/apps/work_items/application/service.py`; `src/apps/work_items/domain/task_contract.py`; `src/apps/work_items/presentation/routes.py`.

### 3.3 AI tool approvals

Some AI approvals are **form-less work items**. The user first claims the work item and then reads/decides through the AI tool-approval endpoints. These expose the registered tool and validated arguments rather than an ordinary form document. The backend does not expose prompts or conversation history through this approval view. Tool approvals cannot be forwarded through the normal form-task forwarding path.

Therefore, a nullable `form_version_ref_id` is meaningful. The frontend must not automatically call the ordinary form-view endpoint for every inbox item. A dedicated work-item kind/discriminator would make this contract clearer than relying on nullable fields alone.

**Sources:** `src/apps/ai/presentation/routes.py:tool_approval_detail,decide_tool_approval`; `src/apps/work_items/domain/dto.py`; `src/apps/work_items/application/service.py:forward`.

### 3.4 Authoring journey

Authors discover the code-owned field and step catalogs, create draft versions, author forms/graphs, validate, preview, publish and retire versions. Workflow transitions and data bindings are different structures. Human-task views and actions are authored contracts. Published versions are immutable execution inputs.

The workflow service validates a graph before replacing the draft graph and validates again before publication. Thus a half-drawn disconnected graph cannot automatically be treated as a successfully saved executable draft.

**Sources:** `src/apps/designer/presentation/routes.py`; `src/apps/forms/presentation/routes.py`; `src/apps/workflows/application/service.py:replace_graph,publish`.

## 4. High-priority findings

### F01 — Task collection and override responses bypass task-view projection

**Classification:** High-priority confidentiality defect from static source tracing. Not exercised against a live server.

The normal task view projects `data`, `item_identity`, render nodes and feedback through the task's read policy. In contrast, the work-item collection mutation calls the collection service on the complete submission and returns its complete `result.data` and identity map. The override path similarly returns the complete changed document and provenance without the task-view projection.

Permission to edit one authorized collection or calculation should not imply permission to read unrelated hidden fields. A permitted root-level collection can coexist with another hidden root-level field; filtering descendants of the collection alone does not solve this.

**Required fix:** Reuse an actor/view-aware runtime response assembler for these mutations. Return only readable data, identities, provenance and issues, plus the current work-item/submission reference. Keep the full canonical document exclusively on the server. Audit error details for unauthorized field disclosure too.

**Regression gate:** A task contains an editable collection and a separate hidden field. The claimant edits the collection successfully. No hidden value, hidden identity path, hidden provenance or inappropriate issue detail appears in the response. Repeat for a permitted manual override.

**Sources:** `src/apps/work_items/presentation/routes.py:edit_work_item_collection,override_calculation`; `src/apps/work_items/application/service.py:task_view,edit_collection,apply_override`; `src/apps/forms/application/collections.py:edit_submission_collection`.

### F02 — A filtered task view cannot safely round-trip replacement saves

**Classification:** Functional contract defect; reproduced with isolated source-logic probes.

The server filters a task view but compares a save's replacement `data` against the complete stored submission. `changed_paths` treats a missing key as a change, and `enforce_writes` rejects changes outside writable scopes. A frontend cannot send an undisclosed field back, so a legitimate save can look like an unauthorized deletion.

```json
Stored submission:       {"amount":"100.00","internal_note":"hidden"}
Authorized view:         {"amount":"100.00"}
User's edited payload:   {"amount":"125.00"}
Observed guard failure:  {"pointer":"/data/internal_note","code":"task.field.read_only"}
```

The same full-document comparison is used on task completion. This also affects named views that expose only a subset of otherwise stored fields, not only explicitly hidden fields.

**Required fix:** Define server-side permission-aware merge or patch semantics. Preserve undisclosed values, define explicit deletion of writable fields, reject actual unauthorized writes, and validate the merged canonical document before completion. Do not solve this by granting the browser access to hidden data.

**Regression gate:** Open the filtered edit view, change one allowed value, save and complete. The authorized change persists; hidden values stay unchanged and never appear in the response. Repeat with nested objects, named view subsets and repeated rows.

**Sources:** `src/apps/work_items/application/task_views.py:project_data,changed_paths,enforce_writes`; `src/apps/work_items/application/service.py:save,finish,task_view`; local `audit_probes.py` and `probe-results.json`.

### F03 — Request-type responses drop stored client restrictions

**Classification:** Response round-trip defect with access-policy impact; mapper/default behavior reproduced locally.

`RequestTypeDTO` inherits `client_targets` with an empty-list default. The `type_dto` response mapper does not populate that field. An existing restricted request type consequently serializes as having no targets. The update service replaces the targets with those supplied by the caller, and an empty target policy permits legacy access.

A routine load–edit-name–save form could therefore remove a real restriction without the operator intending to change it.

**Required fix:** Load and return active client target policies with their current client references and release bounds. Require an explicit intentional policy change when clearing restrictions, or define safe update semantics that distinguish omission from removal. Review other policy collections for similar read/write asymmetry.

**Regression gate:** Create a restricted request type; read it; update an unrelated property using the returned representation; verify its stored restrictions and ordinary/public-client denial are unchanged.

**Sources:** `src/apps/requests/presentation/routes.py:type_dto`; `src/apps/requests/domain/dto.py:RequestTypeCreateDTO`; `src/apps/requests/application/service.py:update_type,_replace_client_targets`; `src/apps/clients/domain/contracts.py:matches_client_targets`; local probes.

## 5. Missing or incomplete frontend contracts

### C01 — Authorized runtime form metadata

Form authoring exposes a full JSON Schema document. Business-request and work-item runtime responses instead provide render JSON and data, but do not expose the pinned instance's data schema. The reviewed generic field catalog and form-version reads require `forms.manage`, which is not an appropriate permission to give every requester or reviewer.

The work-item view also lacks an explicit effective write-policy projection. `filter_render` removes unreadable nodes but does not annotate readable-only fields as read-only. Author-declared render options do not automatically represent the current task's authorization policy.

**Proposed contract:** A safe runtime form/view response containing the current resource references, exact form/design identity, appropriately projected validation metadata, rendered document, canonical visible values, row identities, effective writable/required fields, available actions, and locale/page context. Do not expose hidden field schemas or private defaults merely to make a generic renderer convenient.

This does not mean basic controls cannot be displayed today. It means a robust generic renderer cannot assume it already has all validation, calculation dependency and effective editability information.

**Sources:** `src/apps/forms/domain/dtos/authoring.py`; `src/apps/forms/domain/dtos/render.py`; `src/apps/forms/presentation/routes.py`; `src/apps/requests/domain/dto.py`; `src/apps/work_items/domain/dto.py`; `src/apps/work_items/application/task_views.py`.

### C02 — Requester-facing request-type discovery

`/request-types/search` requires `requests.manage`; the designer selector is also privileged. The frontend journey documentation explicitly identifies this gap.

**Proposed contract:** An eligibility-filtered requester catalog that accounts for current user/workflow start access, active definitions, publish availability, trusted client/release restrictions and render compatibility. The draft-creation command must independently recheck the same conditions. Do not hardcode opaque references or broaden authoring permissions to make the picker work.

**Sources:** request and designer routes; `docs/guides/frontend-journey.md`.

### C03 — General request-to-process navigation

The request DTO does not contain `process_ref_id`; the ordinary work item contains a step-execution reference rather than a process reference. The process routes require a real process reference. Notifications do expose `process_ref_id`, but not every request necessarily creates a notification, so that is only a conditional discovery route.

A general requester tracking screen needs an authorized request-to-process relation. A workflow authoring graph is not a safe substitute: its endpoint requires `workflows.manage` and can contain authoring/assignment/configuration detail inappropriate for ordinary participants.

**Proposed contract:** An authorized request detail relation to its process and a sanitized runtime graph/timeline projection. Never construct a process reference from a request or execution reference. Request status tracking itself is already possible.

**Sources:** request/work-item DTOs; `src/apps/processes/presentation/routes.py`; `src/apps/notifications/presentation/routes.py`; workflow routes.

### C04 — Editor layout and unfinished-work persistence

`GraphStep`/`GraphSnapshot` have execution structure and `display_order`, but no node coordinates, viewport, zoom, routing or collapsed-group state. Their DTOs forbid undeclared fields. Adding `x` and `y` to the existing DTO payload is not a supported layout solution.

Furthermore, `replace_graph` rejects invalid graphs and recreates persisted step rows. The frontend must use the graph's stable authored `key`, not database step UUIDs, as its node identity.

**Proposed contract:** Separate the persisted editor workspace from the validated executable graph. Store layout and recoverable incomplete authoring state with their own revision/lifecycle rules. Decide explicitly when WIP is persisted, validated and promoted. Moving a node should not silently modify executable semantics or invalidate unrelated process pins.

Until that contract exists, distinguish “unsaved local work” from “saved to server.” Do not claim complete autosave merely because the editor debounces a graph PUT. Browser-only draft persistence also needs an explicit sensitive-data and multi-device policy.

**Sources:** `src/apps/workflows/domain/dtos/graph.py`; `src/apps/workflows/application/service.py:replace_graph`.

### C05 — Mutation results and synchronization

Collection and override commands bump the owning request/work item but their response shapes do not contain its fresh revision-bearing reference. Ordinary work-item saves return a WorkItemDTO rather than the evaluated canonical task data.

**Current integration consequence:** Serialize mutations and refetch the authorized resource/view before subsequent dependent writes. Avoid displaying stale computed data after save. A network timeout creates an uncertain outcome for mutations that lack a documented idempotency key; do not retry blindly.

**Proposed improvement:** Return one canonical actor-filtered runtime state with current references after each state-changing command. This would reduce refetch races and align with the fixes in F01/F02.

**Sources:** request/work-item mutation routes and DTOs.

### C06 — Access-editor and inbox ergonomics

The reviewed workflow and integration-connection routes can add and remove grants but do not expose a corresponding current-grants list in those route files. A current-grants read path was not established in this review and must be verified before building a complete access editor. This is a reviewed-surface gap, not proof that no alternate path exists anywhere in the repository. Historical audit entries are not an appropriate replacement for current authorization state.

The work-item search DTO only accepts inbox kind, page and size. Its ordering is server-defined. There is no general text query or arbitrary sort field in that DTO. The business-request search contract likewise has a bounded field set. An “archive” action does not imply an implemented archived inbox tab.

**Design consequence:** Do not present global search, all-record client-side sorting, unrestricted filter builders, an archived queue, bulk actions or access editors as existing backend capabilities without adding the relevant contracts.

**Sources:** workflow/integration routes; `src/apps/work_items/domain/dto.py:CartableQueryDTO`; `src/apps/work_items/application/service.py:search`; `src/apps/requests/domain/dto.py:BusinessRequestQuery`.

### C07 — Browser authentication boundary

The backend has its own authentication, not an implemented Keycloak frontend flow. Public clients may authenticate without a client secret and receive an untrusted client context. Restricted request types require trusted confidential-client identity. Client context comes from the persisted session, not arbitrary caller-supplied headers.

**Proposed default:** Use a same-origin server-side session/backend-for-frontend boundary when the web application must act as a confidential client. Keep its confidential secret on the server. An intentionally public client is a different supported mode with different eligibility; it cannot be relabeled trusted by a browser header. Cookie, CSRF, session expiry and proxy behavior must be designed and tested if such a boundary is introduced; it is not already implemented merely by this recommendation.

For direct token integration, refresh rotation needs a single coordinated in-flight refresh and a deliberate cross-tab policy. Both tokens must be replaced on success. Reusing an old refresh token revokes its family. The frontend should not automatically replay every failed mutation after refresh.

Forgot-password currently returns administrator-assisted recovery guidance. The UI must not claim a reset email was sent.

**Sources:** `src/apps/clients/application/service.py`; `src/apps/clients/domain/contracts.py`; `src/core/deps.py`; auth routes/service; `docs/guides/frontend-contract.md`.

## 6. API adapter rules that must survive UI design

| Contract | Required treatment |
|---|---|
| Field naming | Preserve `snake_case` on the wire; map deliberately rather than implicitly. |
| Opaque references | Encode the complete route segment; never decode, manufacture or edit a reference. Replace it after guarded mutation. |
| HTTP versus envelope codes | Inspect the actual transport status and declared envelope separately. Some successful HTTP 200 responses carry application code 204. |
| Ordinary success | Usually `data`, but the Swagger token endpoint has its own bare token shape. |
| Search/report pages | Usually `result` containing a Page. Some operations, such as process scheduled-action search, return a Page under `data`. Selectors may return a bounded plain array. |
| Pagination | Common page numbering starts at 1; sizes are bounded. Do not infer unprovided filters. |
| Errors | Structured issues can contain JSON pointers. Preserve request IDs. Proxy/non-JSON failures need a fallback path. |
| Optimistic conflicts | 409 is not only a stale-edit signal; it can mean lifecycle or idempotency mismatch. Preserve edits and reconcile instead of blindly overwriting. |
| Request submission | Save first, then submit the saved draft using a stable key for that logical action. |
| Task commands | Preserve the exact command key and payload for a documented replay; a different payload needs a new intentional action. |
| Dynamic options | Preserve canonical typed values; discard responses with obsolete generation/dependency fingerprints. |
| Repeated rows | Use server-supplied stable item keys and collection commands, not array index as identity. |
| Binary content | Use authenticated download adapters; distinguish media, governed task/request attachments and report archives. |
| Sensitive responses | Respect endpoint no-store policy; explicitly review token storage, local drafts, telemetry and browser persistence. |

Do not normalize every endpoint into one generic CRUD method without retaining these distinctions. A generated client can cover transport DTOs, but it will not replace workflow-specific command orchestration or interpret the custom dynamic-document dialects on its own.

**Sources:** `docs/guides/frontend-contract.md`; request/work-item/process/media/reporting routes; `src/core/ref_id.py`.

## 7. State models for the interface

Business-request database states are `DRAFT`, `SUBMITTED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`. Process states are more detailed: `RUNNING`, `WAITING`, `PAUSED`, `COMPLETED`, `FAILED`, `CANCELLED`, `COMPENSATING`, `COMPENSATION_FAILED`, `COMPENSATED`. Work-item states are `OPEN`, `CLAIMED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `RETURNED`, `CANCELLED`, `EXPIRED`.

These must not collapse into a single shared “status” enum. For example, a waiting process and an open human item convey different information; compensation is not a normal work-item state. The UI may derive display categories, but commands must use the resource-specific state and server authorization.

The reviewer inbox kinds are `available`, `claimed`, `completed`, `watching`, `submitted`, `unread`. Per-user read, pinned, archived and watching state is separate from the shared task lifecycle.

**Sources:** `src/apps/requests/domain/entities/request.py`; `src/apps/processes/domain/state.py`; `src/apps/work_items/domain/state.py`; work-item DTO/service.

## 8. Frontend direction grounded in the code

This section is a **design proposal**, not a claim that a frontend has been implemented or that all named screens have complete backend support.

### 8.1 Three product areas

**Operational workspace:** My requests, new request, task inbox, task detail/correction workspace, AI approval detail, process tracking, notifications, personal reports and account sessions. Task detail should present the current form/view, available actions, relevant prior values and field/row feedback without exposing authoring controls.

**Authoring studio:** Forms, workflow canvas, reusable definitions, step catalog, request types, client-specific variants and AI agent definitions. Publishing should be an explicit checkpoint with validation output, dependency/version information and permission checks.

**Administration and operations:** Users/roles/permissions, work groups, clients/releases, integration connections, background tasks/schedules, recovery and audit. These are distinct from human business-task handling even when both screens contain the word “task.”

### 8.2 Responsibilities

```text
Angular application
  ├─ Shared shell and PrimeNG-based UI components
  ├─ Authentication, transport, permissions, locale and error handling
  ├─ Operational feature areas
  ├─ Authoring feature areas
  └─ Administration feature areas

Framework-independent application models
  ├─ Form document and runtime state
  ├─ Workflow graph and editor workspace
  ├─ Revision-aware command orchestration
  └─ Explicit API-to-view-model adapters

Replaceable adapters
  ├─ Canvas/diagram implementation
  ├─ Primitive form renderer
  └─ Authenticated media/report download handling
```

PrimeNG should provide the conventional interface components. The graph editor should sit behind an adapter so its library-specific node, edge and viewport types do not become the backend's business model. The runtime form renderer should be shared by preview and operational form screens where their authorization/context permits, rather than reimplemented separately for every page.

### 8.3 Two different visual editors

A workflow board and a form builder are different products. The workflow board edits typed steps, control transitions, input bindings, assignments and subprocess calls. A form builder edits layout and data-bound controls. They can share shell patterns such as a palette and inspector, but should not share one undifferentiated JSON document.

For the workflow editor, propose a palette on the left, a pan/zoom board in the center, a selected-node/edge inspector on the right, and a validation/field-mapping panel below. Keep control flow and data binding visually distinguishable. Highlight graph issues by their pointers and show the affected node/port/condition rather than only a generic toast.

For the form builder, propose a component palette, layout surface and outline, data-schema inspector, behavior/options editor, and preview using the same runtime rendering rules. The code currently defines 20 primitive kinds, including layout nodes, scalar inputs, choice selectors, user/work-group selectors, repeaters/tables, calculated values, media, actions and attachment collections. Do not invent unsupported primitive types as though they already have backend semantics.

The exact canvas package is deliberately not selected in this review. Selection should follow the editor persistence contract and a small compatibility/accessibility test: typed ports, separate graph/binding relationships, keyboard interaction, pan/zoom, diagnostics, serialization, document size limits, lifecycle cleanup, and alignment with the chosen Angular/PrimeNG versions. “Canvas board” is treated here as a workflow graph editor, not proof that every control must be painted onto a raw HTML canvas.

**Source basis:** graph DTOs; `src/apps/step_types/application/registry.py`; `src/apps/forms/domain/fields.py`; render DTOs; designer routes.

### 8.4 Form rendering discipline

Keep canonical data, render documents, behavior evaluation, locale formatting and effective task policy separate. A Persian label or display value must not rewrite a canonical option key, outcome or date. The code includes English/Farsi task text and locale-aware presentation; treat RTL layout as a planned implementation/testing concern, not an already verified frontend feature.

Repeated object rows have separate stable identities. Those identities connect row-level feedback, validation and attachments even when positions change. Autosave, collection edits, overrides and attachment commands must share one mutation coordinator so two operations do not both use a stale reference.

Do not evaluate arbitrary authored JavaScript. Build against the bounded declared form contracts and server validation. Runtime behavior/preview parity needs an explicit supported contract; an author-only behavior preview endpoint is not automatically a runtime endpoint for all users.

### 8.5 Live state and operations

Use bounded polling for an initial implementation unless a real push contract is added. The reviewed routes do not establish a WebSocket/SSE collaboration protocol. Do not promise live collaborative graph editing, offline execution or background job completion based on local browser timers.

The development Compose stack separates the API, ordinary worker, reporting worker and scheduler, plus PostgreSQL, cache, object storage and broker. A working synchronous API response does not prove workers or scheduled waits are functioning. The frontend must represent pending, waiting, failed and uncertain outcomes without inventing completion.

**Sources:** process and task routes; `docker-compose.yml`; README reviewed range.

## 9. Critical endpoint map

Paths below are relative to the application prefix, normally `/api/v1`. This is a reviewed core map, **not** an exhaustive replacement for generated OpenAPI.

| Purpose | Existing route family or operation | Important qualification |
|---|---|---|
| Login/session | `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/permissions/search`, sessions routes | Native token/session contract; permissions are paginated. |
| Request-type administration | `/request-types/search`, create/read/update/delete | Requires `requests.manage`; not the missing requester catalog. |
| Draft creation/save | `POST /business-requests`, `PUT /business-requests/{ref_id}` | Owner, client context and current revision; no creation/save command key. |
| Submit | `POST /business-requests/{ref_id}/submit` | `submit_key`; validates saved state and starts execution. |
| Draft interaction | Request collections, overrides, attachments, options and resume-presentation | Distinct mutation semantics and fresh-reference gaps. |
| Inbox | `POST /work-items/search` | `cartable`, `page`, `size`; fixed server ordering. |
| Human task detail | `GET /work-items/{ref_id}/view` | Named filtered view; contract gaps and save defect described above. |
| Human task commands | claim, release, start, save, complete, reject, return, forward | Lifecycle and idempotency rules differ by command. |
| AI tool approval | `/ai-agents/work-items/{work_item_ref}/tool-approval` | Dedicated GET/POST after claim; not the ordinary form completion path. |
| Process inspection | `GET /processes/{ref_id}`, timeline and timeline/report | Needs a real process reference and view authorization. |
| Process control/recovery | pause/cancel/retry/compensate/resume/timeout; recover and scheduled actions | Owner/superuser and/or recovery scope; not ordinary task completion. |
| Form authoring | `/forms`, `/form-versions`, validate/preview/field-catalog/render-schema/options | Authoring permission; exact dynamic document dialects. |
| Workflow authoring | `/workflows`, `/workflow-versions/{ref_id}/graph`, validation/publication | Separate executable graph from missing editor-workspace persistence. |
| Discovery | `/designer/catalog`, selectors, completion, field-inventory | Authoring permissions; discovery is not runtime authorization. |
| Notifications | `/notifications/search`, detail/read | Can include a process reference when a notification exists. |
| Media | `/media/files`, `/media/images`, respective reference downloads | Authenticated multipart upload and private binary responses. |
| Governed attachments | Request/task attachment routes | Use these access paths for linked case content, not arbitrary storage URLs. |
| Personal reports | `/reports/search`, detail/download/history/delete | Owned report artifacts; detail can include an archive password. |
| Background operations | `/tasks/definitions`, schedules, run, executions | Requires `admin.tasks.manage`; some controls use `task_id`, not an entity `ref_id`. |

## 10. Decisions and acceptance gates before implementation

| Decision | Proposed default | Acceptance gate |
|---|---|---|
| Frontend product shape | Operations, Studio and Administration share one shell with permission-aware entry points. | Screen/permission/API matrix reviewed against ordinary-user accounts. |
| Runtime form contract | One actor-filtered canonical runtime response, including effective editability and current references. | View/save/complete with hidden fields succeeds without disclosure. |
| Mutation semantics | Server-side permission-aware merge/patch for task views; no hidden-field round-tripping. | Explicit writable deletion, nested/repeated data and conflict tests. |
| Confidential web identity | Server-side boundary for confidential clients; public-client mode remains explicitly different. | Client-secret handling, cookie/CSRF policy if used, refresh coordination and logout tested. |
| Requester discovery | Dedicated eligibility-filtered catalog. | Ineligible clients/users never receive a startable entry; create independently rechecks. |
| Tracking | Explicit authorized request-to-process linkage and a safe runtime graph projection. | Every submitted case can reach its own permitted status/timeline without admin rights. |
| Canvas persistence | Separate editor workspace/layout from executable graph. | Unfinished draft and coordinates survive reopen; publish still rejects invalid execution graphs. |
| Dynamic form support | Code-owned primitive registry plus explicit behavior/options/locale support matrix. | Renderer conformance examples pass in edit, summary, print and correction views. |
| Live updates | Bounded polling initially. | Polling stops on navigation/logout, respects terminal states and does not overwrite unsaved edits. |
| Broad search and bulk actions | Expose only what the current server contract supports. | Additional query/command APIs are defined before those controls appear. |

These are recommendations to close decisions, not claimed changes to the repository. Branding, exact component library versions, exact diagram library and visual polish remain later design choices; they do not need to be guessed to identify the integration defects above.

## 11. Verification plan

The inspected HTTP journey regression uses real authentication and PostgreSQL through ASGI transport, gated by `RUN_INTEGRATION=1`. It covers login failure, lack of permission, unauthorized reads/claims, draft validation, stale saves, idempotent submission/claim/completion, changed-payload conflict, completion tracking, refresh rotation/reuse revocation and logout. It deliberately does not start the S3 lifespan and is not a browser test. Its one-field form does not establish the hidden-field mutation guarantees raised by this review.

Before frontend production integration, add and run the following focused cases:

1. Policy-filtered task view → save → complete with hidden and readable-only fields; nested/view-specific variants included.
2. Permitted collection edit and override return only authorized data, identities, provenance and issue detail.
3. Request-type GET → unrelated PUT preserves client restrictions and release bounds.
4. Ordinary requester catalog and runtime-schema access do not require authoring/admin permissions.
5. Every applicable mutation returns the latest reference and evaluated visible data, or the client performs a controlled reconciliation/refetch.
6. Repeated row reorder/duplicate/delete preserves or intentionally regenerates identities and moves attachment/feedback links correctly.
7. Competing claims, stale editor saves, idempotent replay and changed command payloads behave predictably.
8. Refresh races/cross-tab behavior and uncertain network outcomes do not cause silent duplicate mutations or accidental family revocation.
9. A process can be discovered and tracked by its authorized requester without a notification or privileged workflow read.
10. Form-less AI approvals, expired approvals, denied approvals and non-forwardability work in the inbox.
11. Graph WIP, layout persistence and immutable publication are tested separately.
12. Browser integration covers actual authentication transport, reverse proxy/CORS, private downloads, workers/scheduler, accessibility, RTL, locale changes and recovery from partial failures.

The local probe results are useful narrow evidence, not a substitute for these gates. No full-suite pass rate or production safety certification is asserted by this review.

## 12. Implementation order

**First:** Repair F01–F03 and add real integration regressions. Finalize the actor-filtered runtime response and mutation semantics.

**Second:** Close requester discovery, process linkage, fresh-reference handling, and the public-versus-confidential browser session design. Generate and type-check a client against the actual pinned OpenAPI output rather than the documentation inventory.

**Third:** Implement one vertical user journey: login → eligible request type → draft form → save → submit → reviewer claim → filtered edit/decision → requester tracking. Include ordinary non-admin users and conflict/error paths from the beginning.

**Fourth:** Establish editor-workspace/layout persistence and build the form authoring studio and workflow canvas around the verified runtime renderer and graph semantics.

**Fifth:** Expand reuse libraries, client variants, corrections, AI/integrations, reports, schedules and recovery. Add richer searches/bulk operations only with corresponding backend contracts.

This sequence avoids building a visually elaborate UI around assumptions that the current backend cannot safely or completely satisfy.

---

## Appendix: evidence files in this handoff

- `frontend-readiness-review.md`: this review and decision/verification plan.
- `review-manifest.json`: immutable commit, inspected files/ranges, source permalinks and exclusions.
- `audit_probes.py`: runnable isolated source-logic probes with explicit stubs and limitations.
- `probe-results.json`: actual output captured from those local probes.

The repository remains unchanged. All proposed fixes, API additions, screen structures and implementation milestones are recommendations, not delivered application features.
