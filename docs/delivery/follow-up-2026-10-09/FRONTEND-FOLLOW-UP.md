# Frontend follow-up — connect shipped services and deliver assistant workflows

Repository: Metal-Bat/angular-base  
Reviewed commit: `95f88dce6f1a48da87294929041378c174e6b39c`  
Date: 2026-10-09. Proposed additive handoff; no source or remote backlog changes made here.

## Execution instructions

Read AGENTS.md, docs/BACKLOG.md, the current delivery backlog/decisions/change records, REVIEW.md and WORKFLOW-SCENARIOS-AND-CONTRACTS.md. Keep the existing APP IDs and completed history. Reconcile the latest actual producer snapshot before selecting one bounded task. Do not infer backend absence from old frontend blocker text: many producer contracts now exist.

Reuse the session boundary, generated transport, actor cleanup, command coordination, runtime renderer, record/list patterns, PrimeNG-first tokens and Foblex adapter. Domain models and application ports stay independent of UI/transport libraries. Add a feature adapter only where the current port lacks the actual domain behavior; do not build a universal CRUD/JSON console as the product UI.

Every task requires loading/empty/invalid/forbidden/revoked/stale/conflicting/failed/uncertain/successful states, current references, privacy cleanup, English/Farsi and keyboard behavior. Use source-specific Angular/PrimeNG reviews at the repository's pinned versions, not an unplanned framework migration. Preserve exact decimal strings, false/zero/empty, null versus absent, stable rows and original schema meanings.

### Completion rule

Run full final `mise run check` with no frontend diagnostics and unchanged source hashes, plus task-required actual backend/browser/service scenarios. Current check includes paired smoke only when DELIVERY_BACKEND_ROOT is set: a local pass without it is not integration. The integrated demo gate must require a peer and current contract manifest. Missing test services or browser must remain a reported blocker, never a mock fallback or suppressed warning.

Backend D07 explicitly permits two SDK warnings under VERIFIED_WITH_EXCEPTION. Do not silently reject that recorded owner policy or relabel it exception-free. Report backend, frontend, integrated and manual/user acceptance independently. A ticket can have a working local slice and still fail full acceptance. Do not mark all children/parent tasks DONE because the last numbered task was visited.

## A. Existing task amendments

### APP-FE-001 / 005 / 033 / 037 — Reconcile the actual current pair

**Reuse:** existing generation, inventory, typed adapters, manifest/source digests and paired-smoke runner.

**Steps:** freeze the producer snapshot at the agreed current commit; inspect every changed request/response/security/error field; update copied source plus main generated client; rebuild affected domain adapters and compile fixtures; import the complete ready service slices; run real HTTP smoke BEFORE fixture browser summaries are considered integrated. Fix one authoritative status ledger and convert duplicates to pointers or deterministic copies.

**Acceptance:** the previous 53-path/121-schema recorded mismatch is replaced by a fresh deliberate diff and a successful comparison/call sequence for the exact pair. Do not merely overwrite expected hashes until checks pass. New operations appear in API-to-UX inventory with actual persona/screen/disposition. Existing IDs are not renumbered; production paths are not blocked by an obsolete producer status.

### APP-FE-006 / 007 — Current pickers and domain presentation

**Reuse:** existing reference picker/StudioChoice, record summaries, query state and typed schema controls.

**Steps:** complete contextual selectors for forms, users/groups, published agent versions, operations and eligible connections. Use current semantic/stable links internally and refresh mutation refs; no manual ref entry. Retain selected items not present on the current page; handle deleted/revoked/stale choices. Use domain-specific labels/meaningful fields and default results, not raw response dumps.

**Acceptance:** search/pagination/cancellation/reopen, old async result after actor change, invalid selected item, authorized replacement and explicit clearing are tested with real API. Unknown schema fields are preserved/rejected through a compatibility state, never silently erased.

### APP-FE-008 — Complete preferences beyond working theme/language

**Reuse:** `core/auth/preferences.ts` already performs GET/PATCH, current-ref updates and actor fencing.

**Steps:** inventory actual profile/appearance/locale/workspace fields; add controls for permitted profile/avatar, timezone, density and supported default/list settings. Apply loaded density to rendering, not only response validation. Retain conservative save failure/reload behavior; no automatic unsafe retries or multiple theme state owners. Distinguish backend-persisted language from explicitly session-only choices.

**Acceptance:** two users, two tabs, reload/new login, permission/session expiry and server failure. Unrelated preference fields survive partial edits. Success is shown only for the persisted value and supported application behavior. Test actual private avatar transfer separately.

### APP-FE-009 — Persist saved views and favorites

**Reuse:** `records/domain/saved-list-view.ts` and query serialization tests; existing backend C03/C04.

**Steps:** add saved-view list/save/rename/update/delete/default UX, with current revision and an immutable snapshot of the APPLIED query rather than unsaved filter controls. Add favorites navigation using durable resource links. On schema drift or lost access, show repair/remove rather than silently dropping restrictive filters or retaining private labels forever.

**Acceptance:** actual save/reload across sessions, renamed/deleted record link, role revocation, two-tab update conflict, removed fields/operator types and no stale-ref URL storage. The old 'APP-BE-009 absent' blocker is historical, not a reason to stop.

### APP-FE-010 — Persist lightweight multilingual help acknowledgments

**Reuse:** current frontend-owned help catalog, help list, focus restoration, metadata generator and backend small state table.

**Steps:** replace session-only viewed/dismissed state with typed GET/write/reset calls for this actor and exact help key/content revision/locale. Publish the matching metadata catalog; do not add a help CMS. Mark viewed after explicit successful open, not merely after a preload. Preserve help reading when state persistence fails, with an honest unsaved-state indication.

**Acceptance:** reload/second login retains history; a new revision or locale has defined visibility; reset clears only the actor's state; forbidden help remains inaccessible; late responses after logout cannot update another actor. No marketing-tour framework or arbitrary HTML.

### APP-FE-011 — Live setup/dependency readiness and repair

**Reuse:** existing ReadinessPanel, domain aggregation and code-owned repair destinations.

**Steps:** add production setup/definition readiness routes connected to real producer contracts. Render required/optional/unknown/blocked/stale separately. Show measured probe result/freshness where the backend adds it; never infer worker execution from health connectivity. Provide authorized contextual repair navigation and retain the originating form/workflow selection.

**Acceptance:** missing published dependency, inactive group/connection, current schema mismatch, actual worker probe pending/failure/complete, and revoked repair authority all render correctly. Keep private topology/secrets out of ordinary-user responses. Development fixture 'ready' is not a production certification.

### APP-FE-012 / 013 / 032 — Unified inbox and durable support

**Reuse:** notification previews/current-ref reads, Feedback/RequestErrors and backend C07/C08.

**Steps:** consume unified notification rows/targets through a typed adapter; maintain unread/filter/paging semantics and exact current mark-read refs. Resolve deep links after authentication, then recheck resource authority. Add bounded global client-error intake with dedup/rate controls; render backend `support_persisted`/`support_ref` separately from request correlation. Build authorized incident search/detail/acknowledge/resolve using domain UI.

**Acceptance:** notice points to changed/deleted/forbidden resource; duplicate read/expiry; notification content redaction; persisted and unavailable support sink; repeated technical error coalescing; no recursive incident loop or private payload logging. Expected validation/stale errors do not become endless incident noise. No foreign incident access through a correlation UUID.

### APP-FE-014 / 015 — Real calendar and dashboards

**Reuse:** existing CalendarViews/date functions/metric cards and backend calendar/reminder/analytics services.

**Steps:** production calendar route with bounded range navigation, agenda/week/month as supported, authorized event form, source work-item links, creator/team rules, reminders and conflict recovery. Calendar drag is not allowed to silently modify a workflow deadline. Add metrics endpoint adapter, date/timezone filters, units/as-of time, unavailable/unknown/zero distinctions and exact drill-down queries. Provide chart and accessible table presentation; choose the pinned chart adapter deliberately rather than an unreviewed dependency upgrade.

**Acceptance:** actual events persist; membership revocation removes visibility; date/DST/all-day round trips work; deleted items/totals agree; reminders become notices; real metric fixture totals equal linked lists. The development-only FoundationPreview is not the product route and must stay out of release navigation. No Jalali claim without an implemented contract.

### APP-FE-016–019 — Close ordinary visual form authoring

**Reuse:** typed field/layout/settings editors, all 20 primitives, current renderer and author/runtime validation.

**Steps:** enumerate each supported field/options/behavior/localization/page/view shape; replace remaining ordinary JSON with typed controls, domain rule builders and resource selectors. Keep expert JSON explicitly exceptional while a shape is unsupported; the parent stays incomplete. Preserve documents/unknown properties across edits and convert invalid buffers into targeted diagnostics rather than dropping data.

**Acceptance:** build the rich purchase/service form visually; repeated rows, exact totals, hidden scopes, private attachments, dynamic options, localized settings and pages work identically in preview and actual requester/reviewer views. No opaque-ref entry or JSON textarea during normal setup. Legitimate text descriptions/comments remain textareas.

### APP-FE-020–025 — Complete the existing canvas semantics

**Reuse:** Foblex infrastructure adapter, current graph/state/undo logic and 17 registered inspector schema versions.

**Steps:** finish multi-select/duplicate/key identity and stable reconnection/routing/keyboard behavior; complete human field policy/required scopes/views/actions/candidate removal and labels after reopen; approved agent/operation/connection selectors; structured/list/ordinal mapping; exact child workflow pin and interface mapping; readable transition conditions/default/priority and supported timer/event semantics. Error pointers focus the correct node/port/property.

**Acceptance:** actual save/reopen/validate/promote/publish for each supported handler configuration. No silent change of canonical port semantics, condition ordering, published pins or active cases. Unknown handler/schema versions retain documents and show compatibility errors. Large graphs have complete context in inspectors rather than every field overcrowded in a node. An arbitrary node never receives an 'execute' shortcut without a safe backend contract.

### APP-FE-026 / 027 — Execution inspection and real default restoration

**Reuse:** existing execution-path summaries and backend default-preview/default-apply/layout-reset.

**Steps:** show selected-node authorized input/output summaries, attempts/waits/receipts and process overlay for the actual pinned execution. Implement pure previews only for supported operations; effect tests need explicit isolated sandbox confirmation. Build baseline/source selection, comparison, repair bindings, expiry and exact apply confirmation. Distinguish unsaved local discard, layout reset, draft replacement and successor creation.

**Acceptance:** data redaction, multiple active branches, uncertainty and late result fencing; concurrent editor conflict; applied-plan replay; expired plan; untouched published baseline and live pins. Source-reference errors are understandable. Current backend restoration is reused, not awaited as nonexistent.

### APP-FE-028–032 — Close real requester, reviewer and administration journeys

**Reuse:** implemented lists/forms/claims/actions, current scope projection and existing admin patterns.

**Steps:** finish human claim/correction/forwarding selectors, real receipt/outcome presentation, provider-specific configuration and grants, actual account/group/client administration and schedule-specific editors. Preserve existing authority: generic admin commands do not become a way for ordinary chat users to create arbitrary worker jobs.

**Acceptance:** real ordinary-user HTTP/browser races and corrections, secrets cleared after input/reveal, no queued-as-completed status, backend-created result links, failed worker/reconciliation states, correct history/report pagination and retained restrictions. All normal provider/schedule settings are understandable without JSON.

### APP-FE-033–038 — Evidence-based closure

**Reuse:** inventory, JSON register, strict gate, browser diagnostics, transfer runner and paired harness.

**Steps:** classify all actual current operations and every JSON-register occurrence (legitimate text, approved expert exception, missing normal editor); finish new-feature keyboard/en/fa/RTL/manual/browser coverage; profile connected graphs and realistic nested forms/attachments; reproduce transfer oversize/backpressure/session issues; run the complete actual pair and owned reset twice.

**Acceptance:** final source/contract/migration/image/client identities recorded; no warning suppression, fake screenshots, stale artifact reuse or skipped required test. Manual screen-reader/zoom/contrast/device and user acceptance are independent gates. Backend exception-approved status is not mislabeled frontend zero-warning success. Old core-profile acceptance and the new assistant profile are tracked separately to avoid circular dependencies.

### APP-FE-002 / 033 / 038 — Finish hosted browser orchestration without weakening gates

**Current evidence:** Actions run 37913345517/job 113763493592 was cancelled during `test:browser-quality` after preceding checks and the production build succeeded. The exact logs and stage counts are summarized in CI-OBSERVATIONS.md. This is not a unit-test failure and not a complete check pass.

**Implementation:** instrument a scope-start message, duration, bounded deadline and process-tree cleanup in the existing browser-quality owner. Ensure cancellation writes a partial failed manifest, preserves private-data redaction and exits nonzero. Inspect the first incomplete boundary scope with the same CI browser/configuration; do not assume an unobserved assertion failure or just increase global job timeout. Test intentionally blocked child processes and cleanup of owned ports/profiles. Keep production initial-asset budgets unchanged; the observed 493.71 kB bundle leaves limited headroom below the recorded 500 kB warning budget, so keep new calendar/chat/editor code lazy where appropriate.

**Dependency diagnostics:** refresh structured audit output for the exact lockfile, separately classify development and production paths, and record compatible remediation/remaining dispositions. Installation warnings and action-runtime warnings are outside the current project-check capture and must remain visible. Do not silently use major upgrades, force fixes, disabled checks, or claim zero-warning CI from an internal command result.

**Acceptance:** one complete hosted run reaches browser-quality, paired checks when selected/required, release evidence and final status; failure probes exit and release their resources within bounds. Attach command logs and both source hashes. A cancelled or skipped stage does not pass. These changes extend the existing gate tasks; no new CI framework or task-ID series is required.

## B. New private assistant tasks

Proposed new IDs APP-FE-039–043; inspect actual HEAD for collision before inserting. All inherit the rules above and C15/C16/C17. Do not guess endpoint payloads or hide missing APIs with local fake persistence.

## APP-FE-039 — Private conversation list and durable message workflow

Priority: P1  
Status: BLOCKED by frozen C15 / APP-BE-033 and bounded turn contract  
Area: features/conversations  
Depends-On: APP-FE-005, APP-FE-006, APP-BE-033, APP-BE-034  
Related: APP-FE-010/012/013, C15  
Change-Record: None  
Owner: Frontend role — TBD  
Provisional effort: 3–5 person-days; low-to-medium confidence.

### Goal

A user opens their own private assistant conversation, sends a question and sees a real ordered answer/clarification/proposal with safe context and version information.

### Implementation steps

1. Add permission-aware lazy list/detail routes, typed domain port/adapters and ordinary current-ref pagination. No direct provider client or browser secret.
2. Add accessible message log/composer, load-older control and active-turn state; use stable message IDs, message keys and per-conversation ordering from C15.
3. Preserve unsent text in memory after recoverable failures; do not automatically resubmit uncertain messages with a new key. Reconcile using authorized reads.
4. Render answer text safely, with readable source links; no raw tool history, JSON or hidden reasoning. Pin displayed assistant/workflow version and disclose changes only through explicit new version selection.
5. Coordinate bounded polling/cancellation with route/actor lifecycle. A cancelled or old turn cannot append to a different room or user.
6. Wire translated Help, safe support receipts and empty/failed/missing-provider states. Synthetic mode has a visible label and cannot masquerade as a real AI response.

### Acceptance and checks

A31–A34/A44 with two ordinary actors and actual backend persistence; duplicate send, two-tab race, logout/refresh, route teardown and provider failure. Browser keyboard/RTL/focus/accessibility, no sensitive persistent browser storage, bounded history. Final full `mise run check` plus current-pair tests; no fixture-only completion.

## APP-FE-040 — Typed proposal review and confirmed self-task/draft creation

Priority: P1  
Status: BLOCKED by C15 and implemented action confirmation  
Area: conversations presentation/application; reusable domain form controls  
Depends-On: APP-FE-039, APP-FE-007, APP-BE-035  
Related: APP-FE-028/029, C15  
Change-Record: None  
Owner: Frontend role — TBD  
Provisional effort: 3–5 person-days; low-to-medium confidence.

### Goal

A user understands and deliberately confirms exactly one proposed task/draft/action, then receives a link to an actual created resource.

### Implementation steps

1. Map the frozen operation union to domain-specific cards: self task, eligible service draft, immediate summary and schedule proposal. No generic task-name/args/JSON field.
2. Display scope, title/body, assignee 'You' where applicable, source workflow/version, exact time/due semantics, cost/data information and required policy.
3. Editing produces a revised server proposal or supported domain form; old review/hash approval is invalidated. Confirm freezes exact current proposal and key; explicit dismiss has no business effect.
4. Disable expired, stale, unauthorized, unresolved or busy actions. A free-text 'yes' cannot bypass the structured confirmation contract or independent required human approval.
5. Reconcile lost confirmation results to the same receipt; never retry blindly/new identity. Project known created/queued/scheduled results separately from completed background work.
6. Resolve returned durable resource links with current authorization; clear proposal/private content on actor change.

### Acceptance and checks

A35–A37/A44: edit then confirm, duplicate click, dismiss, revoked actor/target, expired proposal, uncertain response and a required reviewer. Real created request/work item appears in its normal list. Typed unit/HTTP/browser tests plus full gate. No simulation of creation in the chat store.

## APP-FE-041 — Owned scheduled actions and exact time confirmation

Priority: P1  
Status: BLOCKED by C16 / APP-BE-036–037  
Area: conversations, calendar presentation, account-owned scheduled-action views  
Depends-On: APP-FE-039, APP-FE-040, APP-FE-014, APP-BE-036, APP-BE-037  
Related: APP-FE-012/032, C16  
Change-Record: None  
Owner: Frontend role — TBD  
Provisional effort: 3–5 person-days; low confidence.

### Goal

A user schedules a permitted background operation for an exact reviewed instant and can inspect/cancel/reschedule it within the backend's supported lifecycle.

### Implementation steps

1. Implement date/time/timezone selection using current persisted preferences. Show absolute date, named zone and resolved UTC instant; distinguish task due date from background execution time.
2. Show operation/data/output and late policy. Ask for clarification through the dialogue when natural-language time is ambiguous; do not guess a timezone/calendar solely from language.
3. Call confirmed owned-action APIs, not existing administrator schedule endpoints. The normal user cannot choose queue/task_name/kwargs.
4. Add owner-only list/detail and schedule cards for scheduled/queued/running/missed/failed/unknown/completed actual states; show actual execution timestamps/result.
5. Implement exact-target cancel/reschedule with current refs and stable command keys; handle too-late cancellation honestly and reconcile uncertain writes.
6. Link calendar/notifications and result summary without exposing private content. Deleted conversation UI must explain accepted jobs continue unless explicitly cancelled.

### Acceptance and checks

A38–A43/A44: DST gaps/folds, past times, allowed horizon, two-tab reschedule conflict, queued cancellation, permission revocation, worker restart and actual result receipt. Browser tests wait for a real bounded test occurrence; no long sleeps or hardcoded success response. Full local and paired gates.

## APP-FE-042 — Assistant workflow inspectors, readiness and scenario entry

Priority: P1  
Status: BLOCKED by frozen new handler metadata and C15/C16 capability manifest  
Area: studio inspectors, readiness and scenario navigation  
Depends-On: APP-FE-011, APP-FE-021, APP-FE-025, APP-BE-019, APP-BE-034, APP-BE-036  
Related: APP-FE-020/027, C17  
Change-Record: None  
Owner: Frontend/design roles — TBD  
Provisional effort: 2–4 person-days; low confidence.

### Goal

A designer can inspect/configure the allowed assistant workflow using the same canvas and understand whether a seeded scenario is runnable.

### Implementation steps

1. Consume registered versioned assistant/action inspector schemas only after producer handoff. Keep ordinary data/control bindings and version-pinning rules; do not invent executable chat node types in the browser.
2. Add approved agent-version, context/action allowlist, budget, fallback and scheduling-policy controls. No arbitrary prompts granting tools, provider secrets, URL or code entry.
3. Show schema/permission/model/connection/worker readiness with safe repair links, and distinguish definition-only/synthetic/local-sandbox/live modes.
4. Add scenario entry to start an eligible private conversation or open an editable workflow copy. Use current resource selectors, not hardcoded seed IDs.
5. Reuse default-preview/apply for restoration; never reset a running conversation/process by changing its pinned graph.

### Acceptance and checks

A28/A29/A34/A44: unknown handler preserved as compatibility state, missing model denies run, exact action list survives edit/save/reopen, ordinary user cannot access designer configuration, no ordinary JSON. Real publication/eligibility check and browser evidence plus full gate.

## APP-FE-043 — Paired assistant demonstration and failure acceptance

Priority: P1  
Status: BLOCKED by implemented new frontend/backend paths  
Area: browser/service QA, demo documentation  
Depends-On: APP-FE-037, APP-FE-039, APP-FE-040, APP-FE-041, APP-FE-042, APP-BE-038  
Related: APP-FE-034/035/036/038, C17  
Change-Record: None  
Owner: Frontend/QA roles — TBD  
Provisional effort: 4–7 person-days; low confidence.

### Goal

The current committed app pair demonstrates private help, confirmed self task/draft and a scheduled background result with honest errors, defaults and repeatability.

### Implementation steps

1. Extend existing real paired harness with ordinary user/designer/operator fixtures from the versioned scenario registry. Do not import a browser-only success fixture for integrated evidence.
2. Run A27–A46 through actual database/API/session boundary/browser/workers/scheduler/storage/sandbox as relevant; run synthetic and approved paid-provider variants as distinctly labeled profiles.
3. Include duplicate message/confirmation, actor revocation, timing ambiguity, cancellation race, restart, unknown dispatch and recorded failure UI.
4. Verify private storage redaction, en/fa/RTL/keyboard/manual accessibility, connected graph/form performance and route teardown.
5. Exercise immutable default restoration and authorized owned reset twice, retaining foreign-resource denial tests and actual result receipts.
6. Capture source/contract/migration/client/build hashes, exceptions, required passes/skips and operator/user signoff. The original core profile and new assistant profile remain separately identifiable.

### Acceptance and checks

A44–A46 and all required prior scenarios. A fresh operator follows the documented seed/verify steps and completes the demo without Swagger, manually copied opaque refs or ordinary JSON editing. Missing services/credentials/browser or failing verification prevent DEMO_READY for that profile. Full strict frontend check plus actual paired evidence and truthful backend D07 status.

## C. Suggested execution and effort

Do current producer intake and integration of already-built services first. Private Help, preferences, calendar, dashboards and error recording should not be held behind pending procurement policy. Rich scenario navigation can show truthful blockers while new assistant operations are implemented.

The five new conversation frontend tasks total 15–26 person-days of provisional design/implementation/review/test work. This excludes the existing partial 006–038 closure, backend work, environment access and production rollout. Combined new conversation scope is 40–71 person-days across both repositories, before discovery reserve, not elapsed calendar time or an agent speed promise. Re-estimate after the first real turn and self-task confirmation are verified.

## Agent starting instruction

"Read the current repository rules and delivery ledger. Reconcile the backend handoff at the agreed commit, preserve existing working slices, and implement the smallest coherent missing consumer path under its existing APP-FE ID. Do not mark it complete until its real backend/browser scenario and full final gate pass. Then select a new assistant task only after its precise contract dependencies are available."
