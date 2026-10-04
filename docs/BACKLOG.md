# Forms and workflow frontend implementation backlog

Prepared October 2, 2026 for this Angular repository. This backlog turns the supplied backend review and OpenAPI snapshot into implementation work for a PrimeNG operational workspace, authoring studio, and administration area. Deliver the ordinary requester and reviewer journey before expanding the editors and administration tools.

## Evidence and current baseline

- [Readiness review](reference/frontend-readiness-review.md): source review of backend commit `8921841a866c190d794f41af7a41389400fea26b`. Its original findings are preserved as supplied evidence. Steps 6–8 now have separately tested local backend corrections; see the platform contract.
- [OpenAPI snapshot](reference/openapi.json): independently counted here as 302 operations and 401 component schemas. [Endpoint inventory](API-INVENTORY.md) maps every operation to a delivery area. A schema does not prove runtime authorization, response projection, workers, or transaction behavior.
- [Source manifest](reference/manifest.json): checksums identify the supplied files. The review's separate manifest and probe artifacts were not supplied. The OpenAPI generation commit is unknown; do not assume it matches the reviewed backend commit.
- The application currently has a standalone root component, lazy Operations/Studio/Administration planning routes within a workspace shell, strict TypeScript, zoneless change detection, and route smoke tests. A GitHub Actions check workflow and dependency update configuration are present as local implementation files; hosted execution is not yet verified. The same-origin session boundary and runtime configuration are implemented, with boundary browser tests. Generated API transport, login/bootstrap, server renewal and authoritative permission navigation are implemented locally in Steps 9–13. The requester/reviewer screens are implemented locally in Steps 22–23; canvas and real integrated journey acceptance remain later work.
- Tooling delivered with this backlog: mise Node/npm pins, Angular 21 and compatible dependencies, PrimeNG theme registration, the official PrimeNG/Tailwind utilities integration with shared dark mode, Vitest configuration, and updated development tasks. PrimeNG, Angular Material, and Tailwind CSS remain available together; UI-01 aligns their design tokens and documents per-feature selection. This is a foundation, not completion of the product stories.

## Planning conventions

Tickets below are **open** unless explicitly marked in progress here or completed in [HISTORICAL-UPGRADE.md](HISTORICAL-UPGRADE.md). ARC-02 and ARC-04 are **in progress**: the first frontend foundation slice connects the shell, lazy area planning pages, unknown-route recovery, route smoke tests, and repeatable CI/dependency-update configuration. ARC-02 now has feature-owned route tables, enforced layer boundaries, framework-independent form/graph models, tested read-only adapters, a shared form identity primitive, and fail-closed navigation with explicit access screens. Live session/permission wiring is now implemented; runtime and development preview now share the FORM-01–FORM-02 renderer; ARC-04 now has local negative-gate evidence and license/security reporting; hosted execution remains unverified. Planning pages do not count as business features. Proposed owners are roles, not assigned people: FE frontend, BE backend, QA quality engineering, UX design, OPS deployment, and PRODUCT product decision maker. Dependencies are exit gates, not just ordering suggestions. Work can proceed against labelled fixtures while a contract is blocked, but cannot be called integrated or released.

Priority: P0 blocks safe integration; P1 delivers the first usable journey; P2 completes product capability; P3 is an optional extension. Size is relative effort including review and tests: S small, M moderate, L substantial. Split L stories into independently demonstrable tasks during refinement; these are not calendar estimates. Every story inherits the definition of done below and adds specific acceptance criteria and validation evidence.

## Numbered implementation steps

Use these stable numbers in requests, for example **“do Step 9”** or **“continue Step 2”**. Each step points to the detailed tickets below; their acceptance criteria and dependencies remain authoritative. Numbers identify delivery slices, not a requirement to wait for every earlier slice: independent work can proceed in parallel. Do not renumber existing steps; append new steps or split them into suffixes such as 9a/9b.

**Current position: Steps 2–35 implemented locally.** Steps 34–35 add [administration](ADMINISTRATION.md). Steps 36–37 have [local QA evidence](RELEASE-READINESS.md) and a [deployment/rollback rehearsal](DEPLOYMENT.md), with external release gates still pending. Step 38 awaits a search/bulk or push/collaboration [choice and contracts](EXPANSION-DECISIONS.md); offline drafts were deferred on October 4. The latest follow-up batch is [36a–36d and 37a](#release-follow-up-substeps). Next: finish Step 36 release signoff. October 4 verification passed the full local check and both browser-engine suites. GitHub CI now includes Chromium quality checks for every push/PR. The supplied `localhost:8000` staging address is not running; hosted CI and integrated staging remain unverified.

Status **Done** applies to the exact scope of the step, not an entire milestone. **Open · backend** requires backend work/evidence outside this frontend repository. Fixtures may support frontend development while contracts are pending; they do not satisfy integrated acceptance. Update this table and its current-position paragraph after each step, recording validation and remaining gates before marking anything done.

| Step | Work                                            | Backlog tickets                                                                                                                                                                                                                                                                       | Status                     | Deliverable / remaining work                                                                                                         |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Toolchain and development tasks                 | [Historical foundation](HISTORICAL-UPGRADE.md)                                                                                                                                                                                                                                        | Done                       | Pinned tooling, UI libraries, API inventory, dev server and test watcher; local checks passed.                                       |
| 2    | Route and architecture foundation               | [ARC-02](#arc-02-establish-feature-and-adapter-boundaries)                                                                                                                                                                                                                            | Done · local               | Feature boundaries and live access are implemented; runtime and development preview share the renderer.                              |
| 3    | Repeatable CI and dependency updates            | [ARC-04](#arc-04-complete-repeatable-ci-and-upgrade-automation)                                                                                                                                                                                                                       | In progress · hosted CI    | Local checks, negative gate probes, license/security reports complete; hosted execution still needs a GitHub workflow run.           |
| 4    | Choose the browser/session boundary             | [ARC-01](#arc-01-decide-the-browser-authentication-boundary)                                                                                                                                                                                                                          | Done · local               | Same-origin server boundary, ADR and Firefox network checks; Auth UI and renewal are now implemented in Steps 11–13.                 |
| 5    | Configuration and sensitive state policy        | [ARC-03](#arc-03-define-configuration-and-sensitive-state-policy)                                                                                                                                                                                                                     | Done · foundation          | Allowlisted startup config, actor cleanup/abort registry, sensitive-state policy and payload-log suppression verified.               |
| 6    | Backend authorization and save fixes            | [BE-01](#be-01-project-collection-and-override-responses-through-task-policy), [BE-02](#be-02-make-filtered-saves-and-completion-preserve-undisclosed-data), [BE-03](#be-03-preserve-request-type-client-restrictions-on-read-and-update)                                             | Done · backend             | Applied tested projection/patch/target-round-trip fixes to the local backend; PostgreSQL regressions pass.                           |
| 7    | Runtime form and mutation contracts             | [BE-04](#be-04-publish-the-authorized-runtime-form-contract), [BE-08](#be-08-standardize-mutation-state-and-reconciliation)                                                                                                                                                           | Done · backend             | Versioned actor-filtered runtime state and current mutation refs implemented; generated English/Farsi contracts verified.            |
| 8    | Discovery, tracking and task-kind contracts     | [BE-05](#be-05-add-eligible-requester-discovery), [BE-06](#be-06-expose-authorized-request-to-process-navigation), [BE-09](#be-09-establish-grants-reads-and-work-item-kind)                                                                                                          | Done · backend             | Eligible catalog, actual process refs, current grant reads and explicit item kinds implemented and tested.                           |
| 9    | Generate the typed API client                   | [API-01](#api-01-generate-a-reproducible-typed-transport-client)                                                                                                                                                                                                                      | Done · local               | Pinned deterministic generation now covers 309 operations; typed domain/root-health clients and compile fixtures pass.               |
| 10   | Response, error and pagination adapters         | [API-02](#api-02-implement-envelopes-errors-and-pagination)                                                                                                                                                                                                                           | Done · local               | Endpoint-specific envelopes, page bounds, safe errors, request IDs and pointer issues are tested.                                    |
| 11   | Login, bootstrap and logout                     | [AUTH-01](#auth-01-login-and-session-bootstrap)                                                                                                                                                                                                                                       | Done · local               | Login/me bootstrap, safe return paths and actor cleanup implemented; Firefox login/reload/logout journeys pass.                      |
| 12   | Refresh and cross-tab expiry                    | [AUTH-02](#auth-02-coordinate-refresh-and-cross-tab-expiry)                                                                                                                                                                                                                           | Done · local               | Server renewal is single-flight; lost responses and logout races close safely; cross-tab logout and no mutation replay verified.     |
| 13   | Permissions and protected navigation            | [AUTH-03](#auth-03-load-permissions-and-enforce-navigation-affordances)                                                                                                                                                                                                               | Done · local               | All permission pages, actual backend capability keys, guarded navigation, revocation and item-action policy are tested.              |
| 14   | Shared UI design foundation                     | [UI-01](#ui-01-establish-the-shared-ui-design-foundation)                                                                                                                                                                                                                             | Implemented locally        | Align PrimeNG/Material tokens, typography, density, focus and local component selection.                                             |
| 15   | Authenticated shell and accessible feedback     | [UI-02](#ui-02-build-the-three-area-application-shell), [UI-04](#ui-04-standardize-accessibility-and-feedback)                                                                                                                                                                        | Implemented locally        | Add permission-aware navigation, account controls, breadcrumbs, feedback and focus handling.                                         |
| 16   | English, Persian and RTL                        | [UI-03](#ui-03-establish-english-and-persian-localization)                                                                                                                                                                                                                            | Implemented locally        | Translate UI and support directional layouts while preserving canonical data.                                                        |
| 17   | Revision-safe command coordination              | [API-03](#api-03-coordinate-revisions-commands-and-retries)                                                                                                                                                                                                                           | Implemented locally        | Serialize mutations, replace returned references and handle conflicts/idempotency/timeouts.                                          |
| 18   | Versioned runtime document model                | [FORM-01](#form-01-build-the-versioned-runtime-document-model)                                                                                                                                                                                                                        | Implemented locally        | Validate the actor-filtered runtime dialect and map it to framework-independent models.                                              |
| 19   | Form primitives, layout and validation          | [FORM-02](#form-02-implement-the-primitive-registry-and-layout-renderer), [FORM-03](#form-03-map-validation-and-canonical-values)                                                                                                                                                     | Done · local               | 16 supported primitives, layouts and canonical validation; collections/attachments explicitly deferred to Steps 25–26.               |
| 20   | Dynamic options and calculated behavior         | [FORM-04](#form-04-implement-dynamic-options-and-dependent-inputs), [FORM-05](#form-05-implement-behavior-and-calculated-value-handling)                                                                                                                                              | Done · local               | Authorized paged options, typed selections and server-resolved scalar behavior/overrides; navigation and remote sources deferred.    |
| 21   | Fixture and contract coverage                   | [QA-01](#qa-01-establish-fixture-and-contract-test-coverage)                                                                                                                                                                                                                          | Done · local               | Versioned actors/pins/contexts/state fixtures, primitive matrix and negative/race command tests; real integration passed in Step 24. |
| 22   | Requester journey                               | [REQ-01](#req-01-browse-eligible-request-types), [REQ-02](#req-02-create-and-edit-pinned-drafts), [REQ-03](#req-03-submit-saved-drafts-safely), [REQ-04](#req-04-show-request-list-and-detail-tracking-entry)                                                                         | Done · local               | Eligible catalog, deliberate pinned drafts, save-before-submit, request list/detail and actual process entry link.                   |
| 23   | Reviewer journey                                | [TASK-01](#task-01-build-the-paginated-task-inbox), [TASK-02](#task-02-claim-and-open-authorized-task-views), [TASK-03](#task-03-save-and-complete-filtered-tasks), [TASK-04](#task-04-reject-and-return-for-correction)                                                              | Done · local               | Six cartables, claim/release/start, named views, filtered save and declared complete/reject/return; AI commands remain Step 28.      |
| 24   | Tracking and first integrated journey           | [PROC-01](#proc-01-implement-process-detail-and-timeline), [QA-02](#qa-02-prove-the-first-vertical-journey-against-the-backend)                                                                                                                                                       | Done · local               | Authorized paged timeline; real Firefox requester/reviewer journey and HTTP race/session checks.                                     |
| 25   | Private binary transport and account management | [API-04](#api-04-build-authenticated-binary-transport), [AUTH-04](#auth-04-account-passwords-and-session-management)                                                                                                                                                                  | Done · local               | Cancellable private byte transfers, safe downloads, owned sessions and change/reset password flows.                                  |
| 26   | Rows, attachments and multipage forms           | [FORM-06](#form-06-implement-repeated-rows-with-stable-identities), [FORM-07](#form-07-implement-governed-attachment-controls), [FORM-08](#form-08-add-multipage-navigation-and-presentation-resume)                                                                                  | Done · local               | Stable nested rows, governed attachments, actor-filtered declared pages and explicit presentation resume.                            |
| 27   | Operational services                            | [PROC-02](#proc-02-coordinate-bounded-polling), [OPS-01](#ops-01-notifications-and-deep-links), [OPS-02](#ops-02-personal-reports-and-archives), [OPS-03](#ops-03-shared-history-and-media-views), [REQ-05](#req-05-cancel-drafts-and-request-reports)                                | Done · local               | Bounded polling, notifications, owned reports, metadata history/media and draft cancellation; real worker/storage checks.            |
| 28   | Advanced reviewer actions                       | [TASK-05](#task-05-resolve-field-and-row-correction-feedback), [TASK-06](#task-06-forward-and-manage-personal-task-metadata), [TASK-07](#task-07-handle-form-less-ai-tool-approvals)                                                                                                  | Done · local               | Stable correction feedback, comments/forwarding/personal metadata and dedicated form-less AI approval commands.                      |
| 29   | Canvas spike and workspace contract             | [STUDIO-04](#studio-04-evaluate-and-choose-the-workflow-canvas-adapter), [BE-07](#be-07-persist-editor-workspace-separately-from-executable-graphs)                                                                                                                                   | Done · local               | Foblex adapter measured; bounded revisioned WIP and explicit atomic promotion tested.                                                |
| 30   | Form authoring studio                           | [STUDIO-01](#studio-01-manage-form-definitions-and-version-lifecycle), [STUDIO-02](#studio-02-build-the-form-layout-and-schema-editor), [STUDIO-03](#studio-03-author-behavior-and-preview-runtime-forms)                                                                             | Done · local               | Catalog/lifecycle, 20 validated primitives, nested outline and shared-runtime simulated previews.                                    |
| 31   | Workflow authoring studio                       | [STUDIO-05](#studio-05-build-workflow-catalog-and-version-lifecycle), [STUDIO-06](#studio-06-implement-the-workflow-board-and-workspace-persistence), [STUDIO-07](#studio-07-author-typed-steps-and-data-bindings), [STUDIO-08](#studio-08-validate-and-publish-executable-workflows) | Done · local               | Typed ports/edges, layout persistence, diagnostics, promotion and immutable publication.                                             |
| 32   | Clients, releases and request-type variants     | [ADMIN-03](#admin-03-manage-clients-and-releases), [STUDIO-10](#studio-10-configure-request-types-and-client-variants)                                                                                                                                                                | Done · local               | Clients/releases, one-time secrets and restriction-preserving request-type edits tested.                                             |
| 33   | Reusable definitions and upgrades               | [STUDIO-09](#studio-09-manage-reusable-definitions-and-upgrades)                                                                                                                                                                                                                      | Done · local               | Library discovery/dependencies/comparison and compatible frozen upgrade preview/apply.                                               |
| 34   | Access and integration administration           | [ADMIN-01](#admin-01-manage-users-roles-and-permissions), [ADMIN-02](#admin-02-manage-work-groups-and-membership), [ADMIN-04](#admin-04-manage-integration-connections-and-grants)                                                                                                    | Done · local               | Ten permission-aware administration groups; user/role/group/integration operations and real HTTP checks.                             |
| 35   | Operational administration                      | [ADMIN-05](#admin-05-manage-ai-agents-and-runtime-budgets), [ADMIN-06](#admin-06-manage-background-tasks-and-schedules), [ADMIN-07](#admin-07-implement-process-controls-and-recovery), [ADMIN-08](#admin-08-add-audit-and-operational-diagnostics)                                   | Done · local               | AI discovery/budgets, schedules/executions, process recovery and audit via declared commands.                                        |
| 36   | Production quality gates                        | [QA-03](#qa-03-exercise-storage-workers-proxy-and-scheduler), [QA-04](#qa-04-verify-accessibility-locale-and-supported-browsers), [QA-05](#qa-05-set-and-measure-performance-budgets), [QA-06](#qa-06-review-data-handling-and-dependency-risk)                                       | Partial · local evidence   | Firefox/Chromium quality suites, accessibility fixes, runtime measurements and dependency review recorded; broader signoff pending.  |
| 37   | Deployment and rollback                         | [QA-07](#qa-07-prepare-deployment-and-rollback)                                                                                                                                                                                                                                       | Prepared · staging pending | Static serving, local HTTP/HTTPS cookie/cache and release rollback pass; staging details required.                                   |
| 38   | Optional expansion                              | [FUTURE-01](#future-01-rich-search-archived-queues-and-bulk-commands), [FUTURE-02](#future-02-push-updates-and-collaborative-authoring), [FUTURE-03](#future-03-offline-draft-recovery)                                                                                               | Awaiting contract choice   | Offline drafts deferred; search/bulk or push/collaboration selection and new contracts pending.                                      |

## Release follow-up substeps

These suffixes preserve the original numbering. The latest five-step batch covers **36a–36d and 37a**. Parent Steps 36–38 retain their external acceptance gates.

| Substep | Work                                                     | Status              | Evidence / remaining scope                                                                                                                                                                                      |
| ------- | -------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 36a     | Refresh dependency remediation and license review        | Done · local review | Current lockfile hash, zero production findings, 13 affected high-severity development packages (October 4 refresh); compatible fix dry-run makes no changes. Maintainer disposition remains pending.           |
| 36b     | Add a second browser engine                              | Done · local        | Reusable Firefox/Chromium launcher; complete serial quality suites and permission-refresh race regression pass. Full batch evidence is recorded in release readiness.                                           |
| 36c     | Automate accessibility checks and repair findings        | Done · local        | Pinned development-only axe-core; fixed error list semantics, translated dialog close label and disclosure targets/focus. Manual screen-reader/focus-sentinel review remains.                                   |
| 36d     | Measure representative runtime forms repeatedly          | Done · local        | 16/64/256 fields, five mount/edit/teardown cycles, exact canonical strings, optional machine-readable reports. Product device/SLO and sustained heap signoff remain.                                            |
| 37a     | Rehearse production cookie/cache policy over local HTTPS | Done · local        | Chromium verifies Secure/__Host/HttpOnly cookie, CSRF, token isolation, deep-link release A → B → A and static cache rules with a temporary certificate. Actual staging/proxy/backend rollback remains pending. |

## Delivery milestones

| Milestone                                | Scope                                                                              | Exit evidence                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 Contract and platform readiness       | BE-01–BE-06, BE-08, ARC-01–ARC-04, API-01–API-04, AUTH-01–AUTH-03, UI-01           | Backend regression gates pass; chosen session boundary and ordinary-user runtime contract are executable; fresh install, lint, tests and production build pass.     |
| M1 First business journey                | UI-02–UI-04, FORM-01–FORM-05, REQ-01–REQ-04, TASK-01–TASK-04, PROC-01, QA-01–QA-02 | Login → eligible type → pinned draft → save → submit → reviewer claim → filtered edit → complete → requester tracking, including conflicts and unauthorized access. |
| M2 Operational workspace                 | BE-09, AUTH-04, FORM-06–FORM-08, REQ-05, TASK-05–TASK-07, PROC-02, OPS-01–OPS-03   | Corrections, attachments, dynamic options, AI approvals, notifications, private reports and waiting/failed outcomes demonstrated.                                   |
| M3 Authoring studio                      | BE-07, STUDIO-01–STUDIO-10                                                         | Form preview uses verified runtime renderer; incomplete canvas work survives reopen; validated publication creates immutable execution versions.                    |
| M4 Administration and production release | ADMIN-01–ADMIN-08, QA-03–QA-07                                                     | Least-privilege administration, worker/scheduler integration, browser coverage, accessibility, RTL, deployment and recovery gates pass.                             |
| M5 Optional expansion                    | FUTURE-01–FUTURE-03                                                                | New server contracts agreed and tested before unsupported search, bulk, push or offline controls are exposed.                                                       |

Milestones describe delivery targets. Pull cross-area prerequisites forward when needed: establish BE-09 task-kind classification before TASK-02, and the ADMIN-03 client/release foundation before STUDIO-10. Complete their remaining administration scope in its listed milestone.

Critical dependency chain: BE-01/BE-02 → BE-04/BE-08 → API-03 → FORM-01 → TASK-03 → QA-02. Requester discovery additionally needs BE-05; general tracking needs BE-06; editor persistence needs BE-07. Authentication boundary ARC-01 precedes production API integration. BE-03 blocks request-type restriction editing independently of the main renderer work.

## Backend fixes and missing contracts

### BE-01 Project collection and override responses through task policy

**Progress (October 2, 2026):** Shared actor projection now filters mutation data, identities, provenance and issues; hidden defaults/dependencies are omitted. PostgreSQL collection/override regressions pass.

**P0 · L · BE with QA · Depends on:** none. **Evidence:** F01; work-item collection and override operations.

Implement a common actor-aware response assembler for data, row identities, provenance and issues. Inspect all mutation/error paths using it; keep undisclosed canonical values on the server.

**Acceptance:** A claimant edits a permitted collection beside a hidden root field without receiving the hidden value, identity path, provenance or issue details. The same holds for a permitted calculation override and for nested hidden data. A fresh work-item/submission reference is available through BE-08.

**Validation:** Database-backed negative authorization regressions and captured response assertions. A frontend filter is not an acceptable fix.

### BE-02 Make filtered saves and completion preserve undisclosed data

**Progress (October 2, 2026):** Restricted saves/completion now merge writable patches and preserve omitted/hidden values, with explicit deletion and named-view checks. Unit and PostgreSQL regressions pass.

**P0 · L · BE with QA · Depends on:** none. **Evidence:** F02; work-item save and complete commands.

Specify permission-aware merge or patch semantics, including explicit deletion of writable fields, null versus missing values, nested objects, named views and repeated rows. Validate the merged canonical submission on completion.

**Acceptance:** Editing visible `amount` preserves undisclosed `internal_note`; unauthorized writes fail; explicit permitted deletion succeeds. Save and complete both obey the same policy. Responses never disclose the preserved fields.

**Validation:** Real integration cases for the example in F02, nested/view-subset variants, row reorder and stale references. Update OpenAPI and command examples.

### BE-03 Preserve request type client restrictions on read and update

**Progress (October 2, 2026):** Authoritative target refs/release bounds round-trip; omitted PUT targets preserve restrictions and explicit [] clears. Confidential/public release-boundary tests pass.

**P0 · M · BE with QA · Depends on:** none. **Evidence:** F03; request-type GET/PUT.

Return current client targets and release bounds. Define omission versus deliberate removal and review other policy collection round trips.

**Acceptance:** Read → rename → save leaves restrictions unchanged; clearing restrictions is an explicit operation; an ordinary/public client remains denied after an unrelated update.

**Validation:** Restricted request-type integration fixture, response mapper assertions and access checks before/after update. Keep the restriction editor disabled until proven.

### BE-04 Publish the authorized runtime form contract

**Progress (October 2, 2026):** bpms.runtime/1 requester/task read contracts carry filtered metadata, pinned identity, scopes, locale and current refs without forms.manage. Runtime edit/observer/summary/print and metadata regressions pass; correction prior data follows the same policy.

**P0 · L · BE and FE · Depends on:** BE-01, BE-02. **Evidence:** C01.

Agree an actor-filtered runtime state carrying pinned form/design identity, visible validation metadata, render document, canonical visible data, row identities, effective writable/required scopes, available actions and locale/page context. Version its dynamic document dialect separately from OpenAPI DTO types.

**Acceptance:** Ordinary requesters/reviewers can render and validate without `forms.manage`; readable-only controls are explicitly noneditable; schemas/defaults for hidden fields stay hidden. Unknown dialect versions fail with a useful compatibility message.

**Validation:** Contract fixtures for edit, summary, print, correction and observer views; runtime authorization integration tests. Do not fetch privileged authoring schemas as a workaround.

### BE-05 Add eligible requester discovery

**Progress (October 2, 2026):** Ordinary eligible discovery filters current authorization/dependencies/release/dialect before pagination and creation rechecks eligibility. PostgreSQL regressions pass.

**P0 · M · BE · Depends on:** ARC-01. **Evidence:** C02.

Define a new requester-facing type catalog; no such ordinary-user operation is established by the supplied search route. Filter workflow start eligibility, active/published dependencies, trusted client/release policy and renderer capabilities.

**Acceptance:** A requester with no management permissions sees only startable choices; draft creation independently rechecks eligibility; empty, disabled and incompatible states have defined reasons safe for that actor.

**Validation:** Public/confidential client and release-boundary tests, including eligibility changing between selection and creation.

### BE-06 Expose authorized request to process navigation

**Progress (October 2, 2026):** Request DTOs expose the actual root-process ref or null. Requester process/timeline reads and cross-owner rejection pass without notification navigation.

**P0 · M · BE · Depends on:** none. **Evidence:** C03.

Return a real authorized process reference for an applicable request, and define a sanitized runtime graph if tracking requires one. Establish requester/participant access to timeline data.

**Acceptance:** A submitted case reaches permitted tracking without a notification or authoring permission; cross-owner reads fail; drafts and missing processes have explicit states. Assignment/configuration secrets never enter the runtime projection.

**Validation:** Ordinary-user journey covering draft, running and completed cases with no notifications. Never derive a process reference from a request or step-execution reference.

### BE-07 Persist editor workspace separately from executable graphs

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P1 · L · BE and FE · Depends on:** STUDIO-04 spike. **Evidence:** C04.

Design workspace DTO/storage for stable authored keys, coordinates, viewport, collapsed groups, routing and incomplete authoring state with revisions, access control and recovery. Define validation and promotion into executable graph snapshots.

**Acceptance:** A disconnected half-drawn graph and its layout survive reopen; publication still rejects it. Moving nodes does not change running process pins. Concurrent workspace edits return a recoverable conflict.

**Validation:** Save/reopen, conflict and publish tests. Existing GraphStep/GraphSnapshot payloads must not be extended with undeclared `x`/`y` fields. Browser draft storage requires ARC-03 first.

### BE-08 Standardize mutation state and reconciliation

**Progress (October 2, 2026):** Collection/override return the authorized runtime state with current owning refs; serialized collection → override → save → completion passes. Non-idempotent timeout reconciliation is documented.

**P0 · M · BE and FE · Depends on:** BE-01, BE-04. **Evidence:** C05.

Inventory every request/task mutation for resource reference changes, evaluated values, identities, idempotency and permissible reconciliation reads. Prefer the canonical authorized runtime response after each mutation; specify a refetch sequence where unavailable.

**Acceptance:** A collection edit/override followed by save uses the latest owning reference and evaluated data. A timeout without command idempotency is represented as uncertain, not silently replayed. Reconciliation works even when the original reference became stale.

**Validation:** Mutation response matrix and serialized multi-command integration sequences, including concurrent updates and delayed responses.

### BE-09 Establish grants reads and work item kind

**Progress (October 2, 2026):** Current workflow/integration grants reads and explicit HUMAN_TASK/AI_APPROVAL/UNSUPPORTED classification implemented; per-connection grant authority tests pass.

**P1 · M · BE and FE · Depends on:** none. **Evidence:** C06 and review section 3.3.

Verify whether a current-grants read exists outside the reviewed routes; add/document it if absent. Define an explicit ordinary-task versus AI-approval discriminator, or document a tested interim classification.

**Acceptance:** Access editors load authoritative current grants rather than reconstructing audit history. An AI item never accidentally requests the ordinary form view; null form identity alone does not silently imply a supported new kind.

**Validation:** Contract examples and permission tests for grant visibility and every work-item kind. Separate endpoint additions from existing snapshot operations.

## Architecture and delivery tooling

### ARC-01 Decide the browser authentication boundary

**Progress (October 2, 2026):** Same-origin boundary and ADR implemented; HttpOnly/server-secret/CSRF/expiry/logout tests and Firefox network checks pass. See [session boundary](SESSION-BOUNDARY.md).

**P0 · M · FE, BE and OPS · Depends on:** none. **Evidence:** C07.

Record an ADR choosing intentionally public-client integration or a same-origin server boundary for confidential-client identity. Proposed product default is the server boundary when restricted request types are required; this repository now implements a local single-process boundary; hosted deployment remains an operations gate.

**Acceptance:** Secrets never enter bundles/browser storage; trusted client identity derives from the authenticated session. If cookies are chosen, specify HttpOnly/Secure/SameSite, CSRF, origin checks, expiry, logout and proxy behavior. Public mode visibly retains its restricted eligibility.

**Validation:** Deployable boundary contract and browser network tests; no invented Keycloak login or header-based confidential identity.

### ARC-02 Establish feature and adapter boundaries

**Progress (October 2, 2026):** Architecture foundation implemented: feature-owned lazy route tables, enforced import rules, core in-memory session context and fail-closed route policy, forbidden/unresolved screens, opaque-reference helper, pure form/version and workflow-topology models, read-only DTO adapters, pin-preserving reader port/use case, and shared form identity presentation. Route/adapter tests use labelled test fixtures and injected session states. Backend transport, authoritative auth/permissions, full actor-filtered form rendering and canvas integration are not implemented. This ticket remains in progress until those integration acceptance gates are demonstrated; see [architecture](ARCHITECTURE.md).

**P1 · M · FE · Depends on:** none.

Create lazy Operations, Studio and Administration route areas, core auth/transport/permissions, shared UI wrappers and framework-independent form/graph models. Presentation components choose PrimeNG or Angular Material locally and can use Tailwind with either. Keep generated DTOs, domain orchestration and view models distinct.

**Acceptance:** Feature imports follow documented boundaries; canvas-specific types stop at its adapter; preview/runtime share rendering primitives. Unknown and unauthorized routes have explicit screens.

**Validation:** Route smoke tests and one example adapter test; avoid empty directory scaffolding presented as implemented functionality.

### ARC-03 Define configuration and sensitive state policy

**Progress (October 2, 2026):** Allowlisted runtime configuration, actor-memory cleanup/abort epochs and storage/logging policy implemented. See [data handling](DATA-HANDLING.md).

**P0 · M · FE and OPS · Depends on:** ARC-01.

Define API origin, trusted release identity source, renderer capabilities and locale configuration. Classify tokens, runtime values, drafts, attachments, report passwords and authoring documents for caching, storage, logging and telemetry.

**Acceptance:** Builds contain no client secrets; runtime responses with no-store semantics bypass persistence; logout clears actor-specific memory and caches. Local recovery drafts are opt-in only under an explicit policy, with expiry and shared-device treatment.

**Validation:** Bundle/storage inspection and account-switch tests; documented redaction and configuration examples.

### ARC-04 Complete repeatable CI and upgrade automation

**Progress (October 2, 2026):** Local positive and deliberate negative gates plus dependency reports pass. Hosted CI remains unverified; see [CI evidence](CI-CHECKS.md).

**P1 · M · FE and OPS · Depends on:** none.

Use committed mise pins and `npm ci` in CI; run lint, type checking, unit tests, formatting of owned files and production build. Cache by toolchain and lockfile. Add dependency update PRs with peer compatibility review and license/security reports.

**Acceptance:** A clean checkout passes without global Angular CLI or Chrome; checks do not rewrite files; build budgets remain enforced. Publishing/release scripts run only in an explicit release workflow.

**Validation:** Successful CI run with artifacts and a deliberately failing lint/test/build change. Current local checks do not count as a deployed CI pipeline.

## API integration

### API-01 Generate a reproducible typed transport client

**Progress (October 3, 2026):** Implemented and tested locally. See [API-CLIENT.md](API-CLIENT.md) for concrete behavior and evidence. Browser tests use the built Angular application with a disposable upstream fixture; deployed/live-backend verification remains a release integration gate.

**P0 · M · FE · Depends on:** backend regeneration after relevant BE changes.

Select and pin an OpenAPI generator; commit generation settings and input checksum, and separate generated files from handwritten adapters. Produce domain clients for the exact `/api/v1` paths and separate root health routes.

**Acceptance:** Generation is deterministic, type-checks on Angular 21 and fails CI on uncommitted drift. Multipart, binary, nullable fields, unions, snake_case and opaque references survive generation. Dynamic render/behavior documents still have explicit runtime validation.

**Validation:** Regeneration diff check and representative request/response compile fixtures. Supplied OpenAPI can bootstrap fixtures; it is not proof of the deployed schema revision.

### API-02 Implement envelopes, errors and pagination

**Progress (October 3, 2026):** Implemented and tested locally. See [API-CLIENT.md](API-CLIENT.md) for concrete behavior and evidence. Browser tests use the built Angular application with a disposable upstream fixture; deployed/live-backend verification remains a release integration gate.

**P0 · M · FE · Depends on:** API-01.

Implement endpoint-aware adapters for `data`, `result` pages, bounded selector arrays and the bare token response. Preserve actual HTTP status separately from envelope application codes, request IDs and JSON-pointer issues.

**Acceptance:** HTTP 200 with envelope code 204 is handled correctly; non-JSON proxy failures produce useful errors; page numbering starts at 1 where declared and honors bounds. Process scheduled-action pages under `data` are covered.

**Validation:** Contract tests for each envelope shape, empty pages, 401/403/409/422 and proxy errors. No generic unwrapping that discards endpoint differences.

### API-03 Coordinate revisions, commands and retries

**Progress (October 3, 2026):** Shared resource queues, immutable command identity, fresh refs, safe 409 categories and explicit uncertain-outcome reconciliation are implemented and race-tested. See [coordination](COMMAND-COORDINATION.md).

**P0 · L · FE · Depends on:** BE-02, BE-08, API-02.

Build one mutation queue per request/task shared by autosave, row edits, overrides, attachment changes and final decisions. Encode whole opaque route segments; never parse or manufacture references. Store a command key and exact payload for each replayable logical command.

**Acceptance:** Concurrent local mutations serialize; returned references replace old ones; changed payloads get a new intentional key. 409 distinguishes stale revision, lifecycle and idempotency mismatch. Unsaved edits survive a reconciliation prompt, and non-idempotent timeouts never auto-retry.

**Validation:** Deterministic race tests for save/row/attachment overlap, network timeout, stale response, changed-payload replay and two competing claimants.

### API-04 Build authenticated binary transport

**P1 · M · FE · Depends on:** ARC-01, API-02.

Implement upload/download adapters with progress, cancellation, safe filename handling, object URL disposal and expired-session behavior. Separate generic media from governed case attachments and report archives.

**Acceptance:** Private content is fetched with the chosen auth boundary; users cannot bypass task access through arbitrary storage URLs; failures do not leave phantom uploaded records. Report archive passwords never enter telemetry.

**Validation:** Multipart/binary fixtures and browser tests for denied, expired, cancelled and successful downloads.

## Authentication and shared interface

### AUTH-01 Login and session bootstrap

**Progress (October 3, 2026):** Implemented and tested locally. See [API-CLIENT.md](API-CLIENT.md) for concrete behavior and evidence. Browser tests use the built Angular application with a disposable upstream fixture; deployed/live-backend verification remains a release integration gate.

**P0 · M · FE · Depends on:** ARC-01, API-02.

Build login, authenticated bootstrap through `/auth/me`, return-path validation, signed-out state and logout. Distinguish invalid credentials, unavailable service and forbidden client/release identity.

**Acceptance:** Protected views do not flash before session resolution; external redirect targets are rejected; logout removes user data and stops pending work. No claim of confidential identity without the server boundary.

**Validation:** Valid/invalid login, reload, expiry and logout browser journeys under the selected transport.

### AUTH-02 Coordinate refresh and cross tab expiry

**Progress (October 3, 2026):** Implemented and tested locally. See [API-CLIENT.md](API-CLIENT.md) for concrete behavior and evidence. Browser tests use the built Angular application with a disposable upstream fixture; deployed/live-backend verification remains a release integration gate.

**P0 · L · FE and BE · Depends on:** AUTH-01.

For direct token mode, use one coordinated refresh and replace both rotated tokens; define cross-tab ownership/notification. For server-boundary mode, test the equivalent server session behavior and client expiry notification.

**Acceptance:** Concurrent expiry does not reuse the old refresh token or revoke the family accidentally; other tabs sign out on logout; uncertain mutations are not automatically replayed after refresh.

**Validation:** Concurrent 401, lost refresh response, family reuse revocation, tab closure and logout-all races.

### AUTH-03 Load permissions and enforce navigation affordances

**Progress (October 3, 2026):** Implemented and tested locally. See [API-CLIENT.md](API-CLIENT.md) for concrete behavior and evidence. Browser tests use the built Angular application with a disposable upstream fixture; deployed/live-backend verification remains a release integration gate.

**P0 · M · FE · Depends on:** AUTH-01, API-02.

Load all pages of `/auth/permissions/search`, model capability checks and permission-aware routes/actions. Keep role permissions distinct from current work-group eligibility and per-item server actions.

**Acceptance:** Permissions beyond page one work; direct unauthorized navigation is handled; observers and closed tasks have no completion controls. Backend denials remain authoritative after permission changes.

**Validation:** Requester, reviewer, author and administrator accounts with disjoint permissions; revoked permission while a screen is open.

### AUTH-04 Account passwords and session management

**P2 · M · FE · Depends on:** AUTH-01, AUTH-02.

Implement own session search/detail/revoke, logout-all and password flows supported by `/auth/*`. Present forgot-password as administrator-assisted guidance, not a promise that an email was sent.

**Acceptance:** Revoking the current session returns to login; session pages respect pagination; reset/change errors preserve no secret values in logs or navigation history.

**Validation:** Password rejection/success, session revocation and multi-tab logout tests.

### UI-01 Establish the shared UI design foundation

**Progress (October 3, 2026):** Public theme tokens, typography, density, focus and local component selection are implemented. Development mixed-library fixtures and production bundle checks cover the foundation; see [UI foundation](UI-FOUNDATION.md).

**P1 · M · FE and UX · Depends on:** ARC-02.

Define consistent tokens, typography, spacing, density, focus, overlays and responsive layouts across PrimeNG and Angular Material. Retain both libraries and their theme configuration, plus the connected Tailwind build entry. Document per-feature component selection and verify utility/component style precedence as screens are added. See [UI library choices](UI-LIBRARIES.md). PrimeNG is pinned to MIT-licensed v21 and requires no activation key. Preserve that key-free choice when updating dependencies; see [license notes](PRIMEUI-LICENSE.md).

**Acceptance:** PrimeNG and Material controls share consistent error/loading/disabled and focus states; both themes coexist without conflicting global overrides; Tailwind utilities work alongside either library; CSS size remains within budgets. Both libraries remain installed and component imports stay local to presentation features. Documentation includes selection examples.

**Validation:** Representative form/dialog/table visual review in light/dark if supported, keyboard traversal and production bundle check.

### UI-02 Build the three area application shell

**Progress (October 3, 2026):** Permission-aware breadcrumbs/navigation, account controls, notification preview, responsive shell and unavailable/denied/missing states are implemented. Full notification actions remain Step 27.

**P1 · M · FE and UX · Depends on:** UI-01, AUTH-03.

Add permission-aware area navigation, breadcrumbs, account menu, notification entry and responsive navigation. Keep operational human tasks separate from administrator background executions.

**Acceptance:** Deep links survive reload and authenticated return; current area is clear; loading, empty, forbidden and not-found states are implemented without placeholder actions.

**Validation:** Route/access matrix tests and small-screen keyboard navigation.

### UI-03 Establish English and Persian localization

**Progress (October 3, 2026):** English/Persian messages and LTR/RTL switching preserve canonical values. Timezone/calendar choices are documented in [UI foundation](UI-FOUNDATION.md). Renderer/canvas coverage follows their implementation; full locale QA remains QA-04.

**P1 · M · FE and UX · Depends on:** UI-01, BE-04.

Implement locale/RTL switching, translated application messages and safe server-localized labels. Keep canonical values independent from displayed dates, digits, currencies, option labels and action text.

**Acceptance:** Locale changes preserve canonical submissions, typed option keys and outcomes; directional layout, focus and mixed-language references remain usable. Timezone/calendar requirements are recorded explicitly before choosing date controls.

**Validation:** English/Persian fixtures, RTL dialogs/tables/forms/canvas checks and submission equality before/after a locale switch.

### UI-04 Standardize accessibility and feedback

**Progress (October 3, 2026):** Field wrappers, pointer-linked summaries, native confirmation, live status and explicit reconciliation are implemented. Browser focus checks pass; assistive-technology and WCAG assessment remain QA-04.

**P1 · M · FE and UX · Depends on:** UI-01.

Create accessible field wrappers, validation summaries, confirmation dialogs, pending/uncertain command feedback and conflict reconciliation views. Define focus restoration and announce async state changes.

**Acceptance:** Every input has a label and linked errors; dialogs trap and restore focus; status is not color-only; screen readers can locate pointer-linked issues. Proposed target is WCAG 2.2 AA, verified in QA-04.

**Validation:** Keyboard and assistive-technology checks on representative interactions, plus automated accessibility tests.

## Runtime forms

### FORM-01 Build the versioned runtime document model

**Progress (October 3, 2026):** The pure model, bounded runtime adapter, pinned reader and compatibility/conformance fixtures are implemented. See [runtime documents](RUNTIME-DOCUMENT.md); rendering is Step 19.

**P1 · L · FE · Depends on:** BE-04, API-01, ARC-02.

Separate canonical values, render tree, authorized schema, behavior state, locale and effective policy. Validate document dialects at the boundary and retain pinned form/design references.

**Acceptance:** Unsupported primitives/dialects show a controlled compatibility state; changing the latest form definition cannot alter an existing request's pinned renderer; invisible fields are never synthesized from authoring metadata.

**Validation:** Conformance fixtures for runtime/edit/summary/print/correction contexts and missing metadata.

### FORM-02 Implement the primitive registry and layout renderer

**Progress (October 3, 2026):** The shared renderer implements 16 scalar/layout/action kinds and explicit compatibility states for the four deferred binary/collection kinds. See [renderer support](RUNTIME-RENDERER.md).

**P1 · L · FE · Depends on:** FORM-01, UI-01, UI-04.

Inventory the backend's declared primitive catalog and define a support matrix for the review's 20 kinds. Implement layout nodes, scalar controls, choices, user/work-group selectors, calculated/read-only values and actions in slices; repeaters/media/attachments follow below.

**Acceptance:** Every advertised client capability has a tested renderer; unsupported kinds are reported rather than silently dropped. Controls honor effective editability and nullable/required semantics; action availability comes from the runtime contract.

**Validation:** A fixture per supported kind, read-only/disabled/empty/error cases and keyboard tests. Do not invent backend semantics for new widget names.

### FORM-03 Map validation and canonical values

**Progress (October 3, 2026):** Canonical nested property edits, distinct missing/null/empty values, exact decimal strings and visible metadata/server-pointer validation are implemented; stable repeated-row mapping is implemented in Step 26.

**P1 · L · FE · Depends on:** FORM-01, FORM-02.

Map server JSON pointers to fields, pages and row identities; define canonical number/decimal/date/boolean serialization. Use projected metadata for immediate hints while treating server validation as authoritative.

**Acceptance:** Nested errors focus the correct control; missing/null/empty remain distinct; Persian formatting never rewrites numeric strings or option keys. Unknown issue pointers remain visible in a safe summary.

**Validation:** Decimal precision, dates, nullable unions, required scopes and server-only validation fixtures.

### FORM-04 Implement dynamic options and dependent inputs

**Progress (October 3, 2026):** Authorized request/task option queries implement debounce, cancellation, generations, locale/source checks, paged candidates and separate typed selected lookup. Remote CLIENT_FETCH is a controlled unsupported state.

**P1 · M · FE · Depends on:** FORM-02, API-02.

Use authorized request/task options endpoints with debounce/cancellation, dependency fingerprints and generation counters. Preserve typed selected values while options load and define invalidated selection handling.

**Acceptance:** Out-of-order responses never replace current options; canonical types survive selection; forbidden sources are not queried through privileged authoring endpoints; empty/loading/failure states differ.

**Validation:** Rapid dependency changes, locale changes, typed values and stale option response tests.

### FORM-05 Implement behavior and calculated value handling

**Progress (October 3, 2026):** The backend resolves pinned scalar visibility/enabled/required/override flags before actor projection. Saves reread evaluated canonical state. Authored navigation and repeated behavior remain later supported slices.

**P1 · L · FE and BE · Depends on:** FORM-01, BE-08, API-03.

Agree the bounded behavior dialect and calculation authority; implement supported visibility/required/navigation dependencies without evaluating authored JavaScript. Reconcile evaluated server values after saves and expose manual overrides only where allowed.

**Acceptance:** Runtime and preview agree for advertised behavior; author-only behavior-preview routes are not called by ordinary users. Calculation cycles/unsupported operations have defined errors; override responses respect BE-01.

**Validation:** Dependency chains, server recalculation, override/reset permissions and hostile authored expression fixtures.

### FORM-06 Implement repeated rows with stable identities

**P2 · L · FE · Depends on:** FORM-03, API-03, BE-08.

Build repeater/table editing through collection commands using server item keys. Support only documented add/delete/reorder/duplicate operations and keep data position separate from identity.

**Acceptance:** Reorder retains row validation/feedback/attachment links; duplicate gets the intended new identity; delete removes only the intended row; queued autosave uses reconciled references.

**Validation:** Nested collections, reorder during validation, duplicate with attachments, stale command and identity-map projection tests.

### FORM-07 Implement governed attachment controls

**P2 · L · FE · Depends on:** API-04, API-03, FORM-06.

Support list, upload/link, metadata edit, removal and content retrieval through request/task attachment routes. Display declared size/type/cardinality rules and preserve row associations.

**Acceptance:** Failed uploads do not submit dangling links; removing/reordering rows preserves policy semantics; unavailable private content has a safe state; all mutations share the form coordinator.

**Validation:** File rejection, cancellation, denied download, correction-copy context and concurrent attachment/save tests against storage integration.

### FORM-08 Add multipage navigation and presentation resume

**P2 · M · FE · Depends on:** FORM-03, FORM-05, API-03.

Implement declared page navigation, summaries and resume-presentation behavior, with unsaved-change guards and authorized read-only/print layouts.

**Acceptance:** Navigation cannot skip required server gates; reload resumes the pinned presentation; print omits inaccessible data and inappropriate action controls; leaving with uncertain writes is explicit.

**Validation:** Back/forward/reload, locale switching, validation across pages and browser print preview.

## Requester workspace

### REQ-01 Browse eligible request types

**Progress (October 3, 2026):** Eligible catalog, paging, empty/error/retry and deliberate create are implemented through the ordinary authorized endpoint.

**P1 · M · FE · Depends on:** BE-05, AUTH-03, UI-02.

Build the requester catalog with only supported filters, eligibility messaging and start actions.

**Acceptance:** No management permission is needed; empty catalog is distinct from transport failure; a type becoming unavailable before creation returns a recoverable message.

**Validation:** Ordinary/public/confidential-client accounts and release-incompatible fixtures.

### REQ-02 Create and edit pinned drafts

**Progress (October 3, 2026):** Pinned runtime edits and explicit saves use canonical values and current references; uncertain creation requires reconciliation.

**P1 · L · FE · Depends on:** REQ-01, FORM-01–FORM-05, API-03.

Create a draft once per deliberate action, open the returned pinned presentation and save canonical data with its current reference. Show pinned form/workflow versions and dirty/saving/saved/uncertain states.

**Acceptance:** Double clicks are suppressed without claiming server idempotency; timeout requires reconciliation before another creation; a new publication does not migrate the open draft.

**Validation:** Draft creation timeout, save conflict, navigation guard and publication-while-editing cases.

### REQ-03 Submit saved drafts safely

**Progress (October 3, 2026):** Submit flushes dirty data, validates evaluated state and sends only a stable submit key after confirmation; failure blocks submit.

**P1 · M · FE · Depends on:** REQ-02.

Flush and confirm save before submit; create a stable `submit_key` for the logical submission. Submit sends the documented key, not an unsaved form payload.

**Acceptance:** Validation returns to relevant fields; documented replay retains the key/payload; immediate RUNNING or COMPLETED responses render correctly without requiring SUBMITTED first.

**Validation:** Duplicate click/replay, changed data, failed save, timeout and immediate process completion.

### REQ-04 Show request list and detail tracking entry

**Progress (October 3, 2026):** Authorized request list/detail show status, pins and the actual process link. The authorized process timeline is implemented and covered by the real Firefox journey (Step 24).

**P1 · M · FE · Depends on:** API-02, BE-06, UI-02.

Implement paged request search and detail using only declared query fields. Display separate request lifecycle states and link to the authorized process when available.

**Acceptance:** Draft/running/completed/failed/cancelled states are meaningful; no fabricated process reference or notification dependency; polling preserves local draft edits.

**Validation:** Empty pages, restricted detail, stale links and cross-owner requests.

### REQ-05 Cancel drafts and request reports

**P2 · S · FE · Depends on:** REQ-04, OPS-02.

Expose owned-draft cancellation with confirmation and supported business-request report initiation. Keep running-process cancellation in its separately authorized screen.

**Acceptance:** A draft that changed state cannot be silently cancelled; report initiation displays pending artifact state and an authorized report link when available.

**Validation:** State-changing cancellation conflict and report worker failure fixtures.

## Reviewer workspace

### TASK-01 Build the paginated task inbox

**Progress (October 3, 2026):** All six declared cartables are paged through the bounded search contract, with separate loading/empty/error states.

**P1 · M · FE · Depends on:** AUTH-03, API-02, UI-02.

Implement available, claimed, completed, watching, submitted and unread inbox kinds. Preserve server ordering; separate personal read/pin/archive/watch metadata from shared lifecycle.

**Acceptance:** Only cartable/page/size are sent by current search; no fake global search, arbitrary sort or archived tab. Empty/forbidden/stale states are usable, and task kind routes correctly.

**Validation:** All six inboxes, pagination, personal state changes and permission loss.

### TASK-02 Claim and open authorized task views

**Progress (October 3, 2026):** Human claim/release/start and authorized named-view reads are implemented. Named option queries select that same view; AI/unsupported kinds have no human controls.

**P1 · M · FE · Depends on:** TASK-01, BE-09, API-03, FORM-01.

Implement claim/release/start orchestration and fetch the correct named view after successful claim. Show observer/closed views without completion controls.

**Acceptance:** Competing claims resolve without overwriting another user; each command retains its documented key; AI items take the dedicated path. Refresh uses the latest reference.

**Validation:** Two-user claim race, release/reclaim, expired item and unauthorized named-view access.

### TASK-03 Save and complete filtered tasks

**Progress (October 3, 2026):** Current claimant decisions and saves serialize frozen commands, send writable values/deletions only and reread the current runtime; conflicts retain edits for explicit reconciliation.

**P1 · L · FE · Depends on:** BE-01, BE-02, BE-04, TASK-02, FORM-03, API-03.

Build task draft saving and completion from declared action contracts, using permission-aware mutation semantics. Refetch/reconcile evaluated canonical values as required.

**Acceptance:** Visible edits save and complete while hidden values remain unchanged and undisclosed; readable-only inputs cannot be edited. Required scopes, comments, action kind and outcome are passed exactly as declared.

**Validation:** F01/F02 browser regressions, incomplete save versus completion validation, conflicting revisions and changed-key payload tests.

### TASK-04 Reject and return for correction

**Progress (October 3, 2026):** Declared reject/return outcomes enforce comments and validation mode; prior correction values use authorized fields. Correction upload/row work remains Steps 25–26.

**P1 · M · FE · Depends on:** TASK-03.

Render reject/return actions only when declared, with required comments, scope and canonical outcomes. Present prior immutable submission and current correction context distinctly.

**Acceptance:** Reject, complete and return are not interchangeable button labels; transition-invalid actions are rejected safely; returned drafts retain their linked context.

**Validation:** Each action kind, missing comment, closed-item attempt and return loop.

### TASK-05 Resolve field and row correction feedback

**P2 · L · FE · Depends on:** TASK-04, FORM-06, FORM-07.

Show prior/current values, scoped feedback and authorized resolution controls bound to stable field/row keys. Preserve governed attachments through correction context.

**Acceptance:** Reordering rows does not move feedback to the wrong item; hidden prior values remain hidden; resolved/unresolved state follows server responses.

**Validation:** Multiple correction cycles, deleted rows, read-only feedback and attachment access tests.

### TASK-06 Forward and manage personal task metadata

**P2 · M · FE · Depends on:** TASK-02, API-03.

Implement permitted forwarding, comments, read, pin, archive and watch commands. Handle authorized cancel/expire separately from personal organization.

**Acceptance:** Forward navigates to the new work-item reference rather than editing the old assignee; AI approvals cannot forward; archiving does not imply an unsupported archived inbox.

**Validation:** Forward/shared submission context, invalid target, personal metadata isolation and lifecycle races.

### TASK-07 Handle form less AI tool approvals

**P2 · M · FE · Depends on:** BE-09, TASK-02, API-03.

After claim, use `/ai-agents/work-items/{work_item_ref}/tool-approval` GET/POST to show registered tool and validated arguments and submit a decision.

**Acceptance:** No ordinary form-view or form-completion call is made; prompts/conversation history are not invented or displayed; denied/expired/already-decided approvals are explicit; forwarding is unavailable.

**Validation:** Approval/denial, stale reference, timeout replay policy and unauthorized argument access tests.

## Process tracking and personal services

### PROC-01 Implement process detail and timeline

**P1 · M · FE · Depends on:** BE-06, REQ-04, API-02.

Render authorized process state and paged timeline, keeping request, process and work-item enums separate. Use sanitized runtime graph data only if BE-06 supplies it.

**Acceptance:** WAITING, PAUSED, COMPENSATING, COMPENSATION_FAILED and COMPENSATED remain meaningful; authored workflow configuration is never fetched as a tracking shortcut. Timeline reports use the report adapter.

**Validation:** Terminal/nonterminal states, denied tracking, no-notification case and pagination.

### PROC-02 Coordinate bounded polling

**P2 · M · FE · Depends on:** PROC-01, AUTH-01.

Implement bounded polling with backoff/jitter, visibility handling and cancellation for request/task/process/report screens. Agree intervals and maximum staleness with OPS.

**Acceptance:** Polling stops on logout/navigation/terminal state as appropriate; it does not overwrite dirty form values or create simultaneous streams. Offline/uncertain state is visible without implying offline execution.

**Validation:** Timer tests, route churn, reconnect and resource-consumption checks. No WebSocket/SSE or collaboration claim without a new contract.

### OPS-01 Notifications and deep links

**P2 · M · FE · Depends on:** UI-02, API-02, PROC-01.

Implement notification search/detail/read and supported report action. Resolve links through resource authorization and refresh unread state using bounded polling.

**Acceptance:** Reading a notice does not imply task completion; stale/deleted targets have useful fallbacks; a provided process reference is used verbatim and is not required for all tracking.

**Validation:** Read command races, forbidden deep links and missing targets.

### OPS-02 Personal reports and archives

**P2 · M · FE · Depends on:** API-04, PROC-02.

Build owned report search/detail/download/history/delete, including pending, failed and ready states and explicit handling of archive passwords.

**Acceptance:** A successful generation request is not shown as completed before the worker finishes; private downloads respect ownership; passwords stay out of telemetry and persistent cache; deletion updates the list.

**Validation:** Actual reporting worker and storage integration, expired auth, missing artifact and failed generation.

### OPS-03 Shared history and media views

**P2 · M · FE · Depends on:** API-02, API-04, AUTH-03.

Implement reusable authorized history/report entry points and generic file/image uploads where the domain allows them. Keep generic media references separate from case attachment access.

**Acceptance:** Resource histories preserve pagination and revisions; arbitrary entity-name history queries are not exposed to ordinary users; filenames/content are rendered safely.

**Validation:** Authorization, malicious filename/content and private image preview cleanup cases.

## Authoring studio

### STUDIO-01 Manage form definitions and version lifecycle

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** AUTH-03, API-01, UI-02.

Build form search/create/edit/history/report and version draft/read/edit/delete/publish/retire flows. Surface validation diagnostics, dependencies and version pinning before publication.

**Acceptance:** Published execution versions are immutable; retirement is distinct from deletion; a new publication does not mutate in-flight requests. Unsaved changes and stale references have reconciliation paths.

**Validation:** Draft → validate → publish → retire lifecycle and unauthorized/published edit attempts.

### STUDIO-02 Build the form layout and schema editor

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE and UX · Depends on:** STUDIO-01, FORM-02, BE-04.

Add component palette, outline, layout surface and data-schema inspector backed by the code-owned catalog. Separate layout/render JSON from canonical data schema and localized labels.

**Acceptance:** Only supported primitives are offered; binding errors map to the selected control; keyboard reordering works; builder output passes server validation. Schema changes show affected bindings.

**Validation:** Round-trip fixtures for each supported primitive and nested layout; malformed schema and binding tests.

### STUDIO-03 Author behavior and preview runtime forms

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** STUDIO-02, FORM-04–FORM-08.

Build behavior/options/calculation/navigation inspectors using supported dialects and authoring preview endpoints. Use the shared renderer for edit, summary, print and correction previews with explicit simulated context.

**Acceptance:** Preview advertises which policies/context are simulated; arbitrary JavaScript is impossible; runtime/preview conformance fixtures agree; locale/client variants do not modify canonical values.

**Validation:** Preview versus runtime fixture comparison, unsupported dialect and malicious expression cases.

### STUDIO-04 Evaluate and choose the workflow canvas adapter

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**Decision:** Foblex Flow 19.3.0 is implemented behind the lazy infrastructure adapter. The [measured ADR](CANVAS-ADR.md) compares Rete, records Firefox results and distinguishes verified DOM teardown from unmeasured heap retention. Broader browser/RTL/accessibility and agreed performance budgets remain QA-04/QA-05.

**P1 · M · FE and UX · Depends on:** ARC-02.

Run a small compatibility spike before selecting a diagram package. Compare maintained Angular-compatible candidates for license, typed ports, separate control/data edges, keyboard access, RTL, pan/zoom, diagnostics, serialization, cleanup and representative graph size.

**Acceptance:** ADR includes measured prototype results and explicit tradeoffs; library node types do not become backend DTOs; the workspace proposal informs BE-07. No package is selected merely because the review says canvas.

**Validation:** Prototype with typed ports, accessible node selection, round-trip graph conversion and teardown/memory measurements. Agree graph-size budgets in QA-05.

### STUDIO-05 Build workflow catalog and version lifecycle

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · M · FE · Depends on:** AUTH-03, API-01, BE-09.

Implement workflows/version search, create/read/update/delete/history/report, published/retired states and authorized grant editing. Surface immutable version identity and dependency access.

**Acceptance:** Definition identity remains distinct from version identity; changing a catalog title does not imply changing a pinned executable snapshot; grants show current authoritative state.

**Validation:** Version lifecycle, stale updates and current-grants access tests.

### STUDIO-06 Implement the workflow board and workspace persistence

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** STUDIO-04, STUDIO-05, BE-07.

Build palette, board, inspector and validation/mapping panel. Use stable authored step keys for node identity and persist layout/WIP through the dedicated workspace contract.

**Acceptance:** Pan/zoom/move/connect/undo are recoverable; incomplete work is labelled distinctly from a validated executable graph; reload preserves workspace and unsaved/conflicting states are explicit.

**Validation:** Reopen invalid WIP, layout-only edits, concurrent saves, undo/redo and graph replacement with recreated database step rows.

### STUDIO-07 Author typed steps and data bindings

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** STUDIO-06.

Use designer catalog/selectors/completion/field-inventory and trusted step-type metadata for inspectors. Separate transitions from data mappings; support declared conditions, assignment targets, subprocess calls and human action/view contracts.

**Acceptance:** Ports and mappings validate against catalog contracts; condition/outcome mismatch is visible at the affected edge; assignment scopes distinguish roles from work groups; unsupported step configs cannot be silently published.

**Validation:** Typed-port mismatch, subprocess dependencies, conditional branches and human action contract fixtures.

### STUDIO-08 Validate and publish executable workflows

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** STUDIO-07, BE-07.

Map graph validation pointers to nodes/ports/edges; provide validation and explicit promotion/publication checkpoints. Preserve invalid WIP separately when graph replacement is rejected.

**Acceptance:** Validation failure never appears as a successful executable save; publication revalidates; published versions remain immutable; running process pins remain unchanged after publication.

**Validation:** Disconnected graph, invalid binding, validation failure during save and immutable publication integration tests.

### STUDIO-09 Manage reusable definitions and upgrades

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** STUDIO-02, STUDIO-07, BE-09.

Implement component/data-type definitions and versions, grants, publication/retirement, library search/select, dependencies, where-used, compare, guidance, templates, explanations and upgrade preview/apply.

**Acceptance:** Reuse remains versioned; upgrades show affected consumers before applying; incompatible dependencies are visible; published consumers are not silently rewritten; reports/history use shared services.

**Validation:** Compatible/incompatible upgrade, cyclic dependency, inaccessible reuse source and stale preview/apply cases.

### STUDIO-10 Configure request types and client variants

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** BE-03, STUDIO-01, STUDIO-05, ADMIN-03.

Build request-type management linking form/workflow definitions and current client/release restrictions. Manage supported client-specific render variants and capability compatibility without confusing the requester picker with administration.

**Acceptance:** Rename/save preserves client targets; clearing policy is deliberate; publish availability and variant compatibility are visible; a public client is not promoted to trusted identity by UI fields.

**Validation:** F03 round-trip browser regression, release boundaries and variant selection on existing pinned drafts.

## Administration and operations

### ADMIN-01 Manage users roles and permissions

**Progress (October 3, 2026):** Implemented locally in Steps 34–35; see [administration contracts, checks and validation limits](ADMINISTRATION.md).

**P2 · L · FE · Depends on:** AUTH-03, API-02, OPS-03.

Implement permitted user search/create/read/update/delete/restore, role assignment and administrator password reset; implement roles and permissions catalogs with history/reports.

**Acceptance:** Destructive/reset actions identify the target and require deliberate confirmation; revoked access refreshes correctly; role and permission edits use current references and do not imply work-group membership.

**Validation:** Administrator/nonadministrator matrix, stale edits, restore and reset-secret redaction.

### ADMIN-02 Manage work groups and membership

**Progress (October 3, 2026):** Implemented locally in Steps 34–35; see [administration contracts, checks and validation limits](ADMINISTRATION.md).

**P2 · M · FE · Depends on:** ADMIN-01.

Implement group catalog/select/history/report, member add/deactivate/remove and current eligibility presentation.

**Acceptance:** Deactivation is distinct from deletion; concurrent membership changes reconcile; removing membership affects newly checked task eligibility without pretending to revoke all role permissions.

**Validation:** Claim before/after membership change and restricted member selectors.

### ADMIN-03 Manage clients and releases

**Progress (October 3, 2026):** Implemented locally in Steps 29–33; see [authoring contracts and verification](STUDIO.md) and [canvas evidence/QA limits](CANVAS-ADR.md).

**P2 · L · FE · Depends on:** ARC-01, AUTH-03.

Implement clients search/select/CRUD/history/report/secret rotation and release create/select/read/history/report/disable. Show renderer capabilities and release bounds from the actual DTOs.

**Acceptance:** Confidential secrets are handled through an authorized server workflow and never embedded in frontend configuration; disabling a release has explicit operational consequences; revisions and restrictions remain intact.

**Validation:** Secret redaction, rotate/disable races and trusted versus untrusted session eligibility.

### ADMIN-04 Manage integration connections and grants

**Progress (October 3, 2026):** Implemented locally in Steps 34–35; see [administration contracts, checks and validation limits](ADMINISTRATION.md).

**P2 · L · FE · Depends on:** BE-09, AUTH-03.

Implement connection catalog/select/CRUD/history/report, verification, credential rotation, revocation and grants with type-specific configuration.

**Acceptance:** Stored secrets are not assumed readable; verification distinguishes pending/failure/success; current grants load from the agreed read model; failed rotation does not claim success.

**Validation:** Missing credentials, inaccessible connection, verify timeout and grant changes.

### ADMIN-05 Manage AI agents and runtime budgets

**Progress (October 3, 2026):** Implemented locally in Steps 34–35; see [administration contracts, checks and validation limits](ADMINISTRATION.md).

**P2 · L · FE · Depends on:** ADMIN-04, STUDIO-07, TASK-07.

Implement agent catalog/CRUD/history/report/publish and provider/connection/model discovery, metadata, suggestions, choices and permitted process execution budget views.

**Acceptance:** Only declared providers/models/tools can be configured; incompatible capabilities are explained; agent publication is deliberate; budget views use real process/execution references and authorization.

**Validation:** Provider unavailable, model metadata change, publication failure and denied budget reads. Tool approval UX remains in the operational workspace.

### ADMIN-06 Manage background tasks and schedules

**Progress (October 3, 2026):** Implemented locally in Steps 34–35; see [administration contracts, checks and validation limits](ADMINISTRATION.md).

**P2 · L · FE and OPS · Depends on:** AUTH-03, API-02, OPS-02.

Build `admin.tasks.manage` screens for task definitions/queues, schedule CRUD, execution search/detail/report, manual run, retry and revoke. Specify timezone, recurrence, overlap and missed-run display from actual server contracts.

**Acceptance:** Retry/revoke use `task_id` where declared rather than entity `ref_id`; a queued task is not displayed as completed; human inbox and background execution screens stay distinct.

**Validation:** Real worker/scheduler run, failed/retried/revoked execution, timezone boundary and permissions tests.

### ADMIN-07 Implement process controls and recovery

**Progress (October 3, 2026):** Implemented locally in Steps 34–35; see [administration contracts, checks and validation limits](ADMINISTRATION.md).

**P2 · L · FE and BE · Depends on:** PROC-01, AUTH-03, API-03.

Add permitted pause/cancel/retry/compensate/resume/timeout, recover and scheduled-action inspection with operation-specific prerequisites and confirmation. Treat event delivery as a controlled integration capability only if authorized for an admin UI.

**Acceptance:** Owner/superuser/recovery-scope rules are verified per command; invalid lifecycle actions are unavailable or recoverably rejected; compensation and uncertain outcomes are not labelled ordinary task completion.

**Validation:** Failure → retry, wait → resume, compensation failure/recovery and duplicate/unauthorized event delivery tests with real workers.

### ADMIN-08 Add audit and operational diagnostics

**Progress (October 3, 2026):** Implemented locally in Steps 34–35; see [administration contracts, checks and validation limits](ADMINISTRATION.md).

**P2 · M · FE and OPS · Depends on:** AUTH-03, OPS-03.

Build authorized audit search/detail/report and useful request-ID support handoff. Decide whether root `/health` and `/ready` feed deployment diagnostics; `/internal/{service_name}` is not a general navigation feature.

**Acceptance:** Audit data remains permission-scoped and redacted; health failure does not leak internals to ordinary users; audit history is not substituted for current access grants.

**Validation:** Restricted audit reads, export access and partial dependency outage.

## Quality and release gates

### QA-01 Establish fixture and contract test coverage

**Progress (October 3, 2026):** Versioned synthetic fixtures and adapter/control/command matrices cover actors, pins, named contexts, typed values, rows/attachments, task kinds and three state machines. Real backend browser acceptance remains QA-02.

**P1 · L · QA and FE · Depends on:** API-01, BE-04.

Create versioned, synthetic fixtures for requesters/reviewers/authors/admins; pinned forms, named views, row identities, attachments, actions, AI items and all three state machines. Add generator drift and adapter tests.

**Acceptance:** Fixtures identify contract version and intentionally hidden values; no production data enters the repository; errors, empty pages and unknown dialects are covered.

**Validation:** Test matrix maps every adapter and supported primitive to assertions. The two starter unit tests alone do not satisfy this story.

### QA-02 Prove the first vertical journey against the backend

**P0 · L · QA, FE and BE · Depends on:** BE-01–BE-06, BE-08, REQ-03, TASK-03, PROC-01.

Add browser automation for the M1 journey using ordinary nonadmin accounts and a real backend/database. Include policy-filtered save/complete, competing claims, stale saves, submit/claim/complete replay and refresh rotation.

**Acceptance:** F01/F02 disclose no hidden data; F03 has its separate manager round-trip regression; the requester tracks the process without notifications; actual backend test results accompany the release gate.

**Validation:** Automated browser traces plus backend regression output. The review's isolated probes and mock-only frontend tests are insufficient substitutes.

### QA-03 Exercise storage workers proxy and scheduler

**P2 · L · QA and OPS · Depends on:** FORM-07, OPS-02, ADMIN-06, ADMIN-07.

Test chosen auth transport, CORS/proxy or same-origin boundary, object storage, ordinary/reporting workers, broker, cache and scheduled waits in the integrated environment.

**Acceptance:** Worker/storage/broker outages produce accurate pending/failed/uncertain UI; private content remains private; synchronous API success never masks missing background completion.

**Validation:** End-to-end fault injection, download/upload and scheduled process wake-up evidence.

### QA-04 Verify accessibility locale and supported browsers

**P2 · L · QA and UX · Depends on:** UI-03, UI-04, STUDIO-06.

Agree a browser/device matrix within Angular's supported baseline; test keyboard and screen-reader flows, focus, contrast, zoom, responsive layout, RTL and locale switching across operations and editors.

**Acceptance:** Proposed WCAG 2.2 AA target has documented automated/manual evidence; canvas has usable keyboard alternatives; canonical payloads remain identical across locale display changes.

**Validation:** Browser matrix report with remaining issues assigned severity and release impact. jsdom unit tests are not real-browser evidence.

### QA-05 Set and measure performance budgets

**P2 · M · FE and QA · Depends on:** UI-02, FORM-06, STUDIO-06, PROC-02.

Retain current build limits (500 kB initial warning/1 MB error; 4 kB component style warning/8 kB error) unless deliberately reviewed. Agree representative large forms, row counts, graph sizes, memory ceilings and interaction targets with PRODUCT before measurement.

**Acceptance:** Studio/canvas code is lazy-loaded; large lists remain paged/virtualized where appropriate; polling and editor teardown do not leak subscriptions/memory. Any budget increase is justified in review.

**Validation:** Production bundle analysis and repeatable form/canvas performance fixtures on an agreed reference device.

### QA-06 Review data handling and dependency risk

**P0 · M · FE, BE and OPS · Depends on:** ARC-03, AUTH-02, API-04, FORM-05.

Test authorization at endpoints, CSRF if cookie-based, refresh behavior, no-store handling, telemetry redaction, private artifacts and untrusted labels/expressions. Triage dependency/license reports and establish update ownership. The October 3 audit has 24 high-severity development-tooling entries and no production vulnerabilities. See [dependency triage](reference/release-dependency-review.json); compatible remediation and release decisions remain maintainer-owned.

**Acceptance:** Tokens, secrets, hidden values and report passwords do not appear in logs/cache/URLs; controls do not rely on frontend permission checks alone; unresolved high-risk findings have explicit release decisions.

**Validation:** Threat-focused tests and documented findings with owner, remediation and verification; no claim of a complete security audit from `npm audit` alone.

### QA-07 Prepare deployment and rollback

**P2 · M · OPS and FE · Depends on:** ARC-04, QA-02–QA-06.

Document SPA fallback routing, static cache policy, runtime configuration, client release registration, capability negotiation, source-map handling, monitoring, incident support and rollback across frontend/backend contract versions.

**Acceptance:** Deep-link reload works; HTML/runtime config refresh while hashed assets cache correctly; incompatible releases fail safely; rollback does not misrepresent existing pinned process/form versions.

**Validation:** Staging deployment and rollback rehearsal, permission-matrix signoff and evidence links for every production gate. Do not release based solely on a successful build.

## Optional contract dependent expansion

### FUTURE-01 Rich search archived queues and bulk commands

**P3 · L · PRODUCT, BE and FE · Depends on:** TASK-01, BE-09.

Specify server-supported full-text search, filters/sort, archived inbox semantics and bulk commands only after product demand is confirmed.

**Acceptance:** Query/order/permission/idempotency/partial-failure contracts exist before controls appear; filtering one loaded page is not presented as global search.

**Validation:** Dataset spanning many pages, mixed-permission bulk outcomes and concurrent lifecycle changes.

### FUTURE-02 Push updates and collaborative authoring

**P3 · L · PRODUCT, BE and FE · Depends on:** BE-07, PROC-02.

Evaluate a real SSE/WebSocket contract with authentication, reconnect, ordering, missed-event recovery, conflict semantics and presence privacy.

**Acceptance:** Collaboration is enabled only when server persistence/concurrency guarantees exist; polling remains a tested fallback; reconnect reconciles authoritative state.

**Validation:** Disconnect/reconnect, duplicate/out-of-order events and simultaneous editor changes.

### FUTURE-03 Offline draft recovery

**P3 · L · PRODUCT, FE and BE · Depends on:** ARC-03, API-03.

Decide whether offline drafts are appropriate for sensitive business data; specify encryption/storage lifetime, shared devices, identity changes and conflict resolution before implementation.

**Acceptance:** Offline storage is opt-in under an agreed policy; queued commands do not imply backend execution; hidden values and credentials are never persisted to reconstruct server documents.

**Validation:** Account switch, logout, stale revisions, storage eviction and reconnect scenarios. Offline submission/execution remains out of scope unless separately contracted.

## Screen and access map

| Area           | Screens                                    | Authority to verify                                       | Contract notes                                                    |
| -------------- | ------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------- |
| Account        | Login, profile, passwords, sessions        | Authenticated self and session ownership                  | Native backend auth; no assumed identity provider.                |
| Operations     | Type catalog, my requests, draft/detail    | Ordinary requester eligibility and ownership              | BE-05 catalog and BE-06 process relation are additions.           |
| Operations     | Inbox, task/correction detail, AI approval | Candidate/claimant/observer plus declared actions         | Membership, permissions and lifecycle are separate checks.        |
| Operations     | Tracking, notifications, reports           | Participant/owner permissions per endpoint                | No privileged workflow graph fallback.                            |
| Studio         | Forms, reusable definitions, versions      | Verified forms/reuse management permissions               | `forms.manage` is not assigned merely to render runtime forms.    |
| Studio         | Workflow canvas, step catalog, library     | Verified workflow/designer/step permissions               | `workflows.manage` for authoring is not a tracking entitlement.   |
| Studio         | Request types and variants                 | `requests.manage` and relevant client/form permissions    | Restriction round trip gated by BE-03.                            |
| Administration | Users, roles, permissions, groups          | Exact backend admin capabilities, to be mapped in AUTH-03 | Work groups do not replace role permissions.                      |
| Administration | Clients, releases, connections, AI agents  | Resource-specific management/grant capabilities           | Secret and current-grant access needs explicit contracts.         |
| Administration | Background tasks and schedules             | `admin.tasks.manage`                                      | Controls may use task IDs rather than entity references.          |
| Administration | Recovery and audit                         | Owner/superuser and/or recovery/audit scope per operation | Do not infer all process controls from one generic admin boolean. |

## Decisions to resolve during refinement

| Decision                 | Proposed direction                                                 | Owner role | Needed by     |
| ------------------------ | ------------------------------------------------------------------ | ---------- | ------------- |
| Browser identity         | Same-origin server boundary for restricted confidential-client use | BE/OPS/FE  | ARC-01, M0    |
| Task mutations           | Server permission-aware merge/patch with explicit deletion         | BE/FE      | BE-02, M0     |
| Runtime dialect          | Versioned actor-filtered metadata and supported primitive matrix   | BE/FE      | BE-04, M0     |
| UI components            | PrimeNG and Material selectable per feature; Tailwind with either  | FE/UX      | UI-01, M1     |
| Canvas library           | Prototype and measure before choosing                              | FE/UX      | STUDIO-04, M3 |
| WIP storage              | Separate revisioned server workspace                               | BE/FE      | BE-07, M3     |
| Locale requirements      | English/Persian and RTL; confirm timezone/calendar behavior        | PRODUCT/UX | UI-03, M1     |
| Offline/push/search      | Defer until explicit contracts and demand                          | PRODUCT/BE | M5            |
| Performance/browser SLOs | Define reference devices and realistic document sizes              | PRODUCT/QA | QA-04/QA-05   |

## Definition of done

Each delivered story includes typed contracts and source references, permission and lifecycle handling, loading/empty/error/uncertain/conflict states where applicable, accessibility and locale treatment, focused automated tests, and a demonstrated acceptance scenario. Backend-dependent stories require real integration evidence before their blocked status is removed. Generated files regenerate cleanly; lint, unit tests, type checking and production budgets pass; no secrets or production data enter fixtures, logs or persistence. Documentation describes actual behavior and unresolved limitations.

No ticket is complete merely because a page renders. The first production release requires backend F01–F03 regressions, the ordinary-user vertical journey, selected auth boundary verification, private storage/worker/scheduler tests, accessible RTL/browser checks and a rehearsed deployment/rollback. Record evidence and owners when tickets move to done; do not turn the review's recommendations into claims of existing capabilities.
