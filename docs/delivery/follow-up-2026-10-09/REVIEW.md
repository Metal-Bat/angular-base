# Updated repositories: app completeness and connected workflow review

Date: 2026-10-09. Review scope: changed-file inventories, delivery/status records, current contracts, and selected risk-bearing code paths in both repositories.

Backend: `9999641f8e37077829ebbe7159a6cd794fb94b91`  
Frontend: `95f88dce6f1a48da87294929041378c174e6b39c`

## Recommendation

Retain the new implementations. The immediate critical path is a frozen, compatible frontend/backend contract pair, real consumption of the backend's new services, and completion of the existing semantic editors. Add rich seed scenarios through the current bootstrap owner. Treat private conversation-to-action workflows as genuinely new product scope.

**Verdict: substantial implementation progress; not a complete integrated or demo-ready application.** Backend records 21 of 32 APP tasks complete, with explicit exceptions; frontend records local completion of APP-FE-001–005 and partial/blocked work for APP-FE-006–038. Traversing the backlog to its final ID did not complete its outstanding acceptance.

No application test, migration, browser, model request, worker execution, deployment, or reset ran during this review. GitHub reads succeeded; local GitHub DNS access, mise, graphify and the pinned toolchains were unavailable. Repository test counts below are reported evidence, not independent reproduction. Do not describe this as a line-by-line certification of both entire repositories. See SOURCES.md for pinned file paths.

## What has improved and should not be rebuilt

| Capability                                 | Current evidence                                                                                                                                                | Action                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Supported seed/bootstrap                   | `scripts/bootstrap_application.py` uses existing owners, an installation manifest, guarded local demo mode, ordinary users, templates/cases and private assets. | Extend profiles and expose mise aliases; do not create a parallel installer.                                                     |
| Live-only ordinary lists                   | `paginate_entities(..., live_only=True)` prepends the same live predicate to item and count queries. Explicit historical resolution remains separate.           | Retain; add regressions for new projection owners and paired UI counts.                                                          |
| Preferences                                | Backend preference contracts and frontend `Preferences` implement actual theme/language GET/PATCH coordination.                                                 | Complete the remaining profile/timezone/density/workspace settings and integration tests; do not replace autosave/actor fencing. |
| Calendar/reminders                         | Backend calendar ownership, date-range rules, reminders and scheduler/outbox integration are documented and implemented.                                        | Wire the frontend and verify with the actual broker/deployment profile.                                                          |
| Analytics                                  | Authorized metric definitions and query services are documented in the producer handoff.                                                                        | Consume the real service; do not count fixture cards as dashboards.                                                              |
| Notifications/support                      | Unified inbox/event mapping and safe support incident APIs exist on the producer side.                                                                          | Connect the existing UI patterns to the new transport and durability fields.                                                     |
| Resource links, saved views and help state | Producer contracts now exist.                                                                                                                                   | Replace obsolete frontend 'backend missing' blockers with contract-intake/integration tasks.                                     |
| Workflow restoration                       | Read-only default preview, signed apply intent and draft layout reset are implemented through the existing workflow owners.                                     | Build the corresponding frontend journey; keep restoration separate from demo-environment reset.                                 |
| Visual authoring                           | More scalar typed controls, pickers, transition controls, canvas edits and structured execution-path views exist.                                               | Complete missing scopes, structured/list mappings, connection/agent choices and execution inspection.                            |
| Transfer boundary                          | Frontend now streams responses with backpressure and disconnect handling; uploads remain bounded buffers.                                                       | Retain repairs and close accepted-size/oversize/concurrency/recovery tests.                                                      |
| Quality tooling                            | Backend runs explicit service profiles; frontend captures diagnostics and source hashes.                                                                        | Complete paired CI and distinguish local, exception-approved, integrated and accepted statuses.                                  |

## Findings, ordered by delivery consequence

### R01 — The frontend and backend are not an established compatible pair (P0)

**Evidence:** frontend `docs/delivery/END-OF-BACKLOG.md` records a failed paired HTTP rehearsal before browser execution: 53 changed paths and 121 changed schemas at that rehearsal. `scripts/check-peer-contract.mjs` validates copied APP-BE-001 paths/schemas against another copied platform snapshot and imports only selected wave-four metadata. The generated transport remains the older 314-operation/425-schema baseline.

**Consequence:** the presence of both implementations does not mean a user can use the new producer capabilities. Updating only inventory numbers or hashes would conceal, not solve, contract incompatibility.

**Required delta:** freeze a producer export at the exact current commit; classify each difference (additive versus breaking/behavioral); regenerate the main client and metadata; update affected decoders/adapters; run real per-service HTTP and browser contracts. Backend APP-BE-031; frontend APP-FE-005/033/037. The 53/121 figures are recorded historical evidence, not a newly computed diff of today's exact pair.

### R02 — Several application services exist only as frontend slices (P1)

**Evidence:** `FoundationPreview` explicitly contains hardcoded calendar/readiness/metric fixtures and is excluded from production routing. `HelpPage` holds viewed/dismissed topics in in-memory signals and labels them 'this session'. APP-FE-009 records saved-view domain snapshots but no real save/default/favorites UI. Some frontend blockers still describe already-delivered producer contracts as absent.

**Required delta:** real production routes, typed domain ports/adapters, loading/empty/forbidden/conflict/error states, mutation/reload evidence and permission-aware navigation. Preserve the components and local tests; add integration, not duplicates. Owners: APP-FE-009–015.

### R03 — Support-reference UI is not durable failure recording (P1)

**Evidence:** frontend `RequestErrors` currently classifies errors and exposes request correlation; APP-FE-013 explicitly leaves incident intake/operator screens unfinished. Backend C08 now has `support_persisted`, nullable `support_ref`, safe authenticated client-failure intake, deduplication and incident APIs.

**Required delta:** show 'recorded incident' only for a positive persistence receipt, otherwise show a correlation reference with an honest nonpersisted state. Wire bounded client failure intake, avoid recursion when intake fails, and implement authorized operator views. Do not log messages, prompts, attachments, credentials, form fields or exception stacks. Owners: APP-FE-013/032, extending APP-BE-015 only where new client error classes are needed.

### R04 — Rich workflows are not supplied by the basic seeder (P1)

**Evidence:** `demo_templates.py` declares two templates: purchase and service. Their form fields are simple strings. Each uses four nodes: START, human review, human correction, FINISH. `install_demo` resolves only START/HUMAN_TASK/FINISH built-ins. No rich suite/chat mise task exists in `.mise.toml`.

**Required delta:** extend APP-BE-005/028/029 with the versioned scenario registry described in the companion specification. Reuse publication/eligibility/workspace services. Keep the basic templates as regression references. Seeding creates definitions and deliberate fixture cases; it must not unexpectedly execute vendor effects or paid AI.

### R05 — Seed convergence needs richer version semantics (P1)

**Evidence:** the current installer refuses an existing demo root with operator-added versions; its recorded template hash is derived from form documents, not the complete form+graph+layout scenario package.

**Required delta:** introduce a scenario-manifest version/hash over all authored inputs and dependency symbols; distinguish immutable baseline, editable copy, active case, and template upgrade. Repeated seed must not destroy edits or publish successor drafts automatically. `--check` should detect baseline mismatch; restoring a changed copy is a separate preview/confirm/apply operation. A refused change is safer than overwrite but not sufficient for a polished repeatable designer demo.

### R06 — Setup readiness has no path to a fully measured ready state (P1)

**Evidence:** `SetupService.inspect()` always appends required `worker_execution` and `scheduler_execution` checks with status `unknown`. This is honest, but the aggregate cannot report ready even when those services work.

**Required delta:** add an explicit authorized bounded diagnostic/probe flow with durable receipts and freshness, or consume a trustworthy current verification receipt. A read-only checklist must not dispatch expensive work or fake execution readiness. Checks must be profile-aware: basic approval demo, connected sandbox and assistant demo do not have identical requirements. Owner: extend APP-BE-011 and APP-FE-011; use existing task/outbox machinery.

### R07 — Ordinary JSON-free authoring is not complete (P1)

**Evidence:** the JSON register contains 56 source matches, including legitimate textareas and advanced panels. The node coverage record explicitly says some shapes still require expert JSON. Human field policy/scopes, candidates after reopen/removal, list/structured mappings, approved connection/operation/agent selectors and some subprocess bindings are incomplete.

**Required delta:** classify each match and each schema field. Do not delete genuine comments/long text or equate the match count with defects. Complete normal domain controls first; no unapproved loss of API capability. Require one ordinary browser path per supported shape without JSON or opaque-ID entry. Owners: APP-FE-016–025/030–033.

### R08 — New business effects and approval fences remain open (P0 for connected action claims)

**Evidence:** `protected-effect-policy.md` is owner-review pending. It proposes `sandbox.order.create/1` and an explicit human approval bound to exact payload; the operation is not established as implemented by that proposal. APP-BE-021–025 remain open.

**Required delta:** freeze the exact protected action mapping, then implement publication/runtime/dispatch fences, a real sandbox operation, receipts, uncertainty reconciliation and supported compensation. Preserve the distinction between AI lookup approval, user confirmation, workflow human approval and administrative authority. Do not delay independent frontend help/calendar wiring behind this unrelated policy decision.

### R09 — Current migration policy and older instructions disagree (P0 for existing-data rollout)

**Evidence:** DB-002 records an explicit owner request for two frozen revisions: `0001_schema` then `0002_required_data`, replacing the prior chain. Fresh installation equivalence is reported. Existing legacy markers are not automatically compatible. The frontend still carries D01 as unresolved and several backend handoffs still mention superseded `i015/j016/k026` heads.

**Required delta:** publish one current migration/contract handoff and label older evidence historical. Existing databases require backup, isolated comparison and deliberate approved transition; no blind stamp, replay, or data reset. Future conversation tables need an upgrade strategy compatible with the current two-file policy. Do not silently reintroduce a third migration or modify an applied baseline and claim upgrade safety. Owner: APP-BE-003/031, DB-002 follow-up; frontend consumes only the resulting capability/schema manifest.

### R10 — A successful command is not strict exception-free product readiness (P1)

**Evidence:** backend `run_check.py` validates two exact D07 filters and returns success labeled `VERIFIED_WITH_EXCEPTION`. This is a recorded exception policy, not evidence of secretly broadened warning suppression. Frontend `check-project.mjs` runs paired smoke only when `DELIVERY_BACKEND_ROOT` is supplied.

**Required delta:** preserve the approved exceptions and truthful labels until genuinely removed; do not reset owner decisions. Keep local check behavior explicit. A demo/release gate must require the peer, current migrations, mandatory real-service scenarios, source identity and final status checks. Missing peer/configuration must fail that gate, not pass a fixture-only substitute. Reconcile old 'zero-warning' statements with the accepted exception policy. Owners: APP-BE-002/031/032 and APP-FE-002/037/038.

### R11 — Default restoration is backend-complete but not a complete product journey (P1)

**Evidence:** `default-preview`, `default-apply` and `layout-reset` exist. Frontend end-of-backlog still lists frozen default plans and competing-editor tests as missing.

**Required delta:** expose source/baseline, dependency substitutions, human-readable changes, blockers, expiry, exact confirmation and fresh result refs. Published content and live pins must survive; successor remains a draft. Environmental reset still belongs to APP-BE-029 and may not call shared-volume reset. Owners: APP-FE-027 and APP-BE-029, reusing APP-BE-026.

### R12 — Chat-to-action is new scope, not a prompt or sample graph alone (P1)

**Evidence:** the reviewed current domain tree and changed-code inventory did not establish a durable user conversation/typed proposal system. Existing AI decisions and read-only tool approvals do not provide all message ordering, conversational memory, confirmation, ordinary-user task creation, or long-delay ownership rules.

**Required delta:** a private owner+assistant conversation, bounded per-turn workflow runs, typed action proposals, explicit confirmation, an allowlisted application-action registry and owned scheduling. Keep messages out of logs/process-event payloads. See proposed C15–C17 and new APP-BE-033–038 / APP-FE-039–043. No multiparty chat or public-room sharing is implied.

### R13 — User-scheduled work needs a narrower authorization boundary (P0 within chat scope)

**Evidence:** existing schedule creation is `POST /api/v1/tasks/schedules`, guarded by `admin.tasks.manage`; its input names registered task/queue/args/kwargs. Clocked schedules require `one_off=true`. Its update DTO does not expose `clocked_at`. `system.ping` is an existing safe worker probe.

**Required delta:** ordinary chat users may schedule only explicitly permitted application operations on their own resources. They must not receive task-admin access or choose task names, queues, credentials, arbitrary Python, SQL, URLs or kwargs. A durable action record maps an approved operation to the existing clocked scheduler/outbox. Add a specific authorized reschedule command, not an invented PUT field. Recheck authority on confirmation and execution; give late/missed/unknown outcomes explicit treatment.

### R14 — Final operational/browser acceptance remains unestablished (P1)

**Evidence:** backend records remaining transfer/recovery, real-image, paired CI, new-table restore and combined-demo tasks. Frontend records streaming oversize/recovery limitations, missing current Chromium/manual/device/performance evidence and a failed paired run. Current frontend Actions run 37913345517 completed as CANCELLED, not passed, at 2026-10-09 10:06:01 UTC. Its log reached the browser-quality command after unit, boundary and build checks; no browser-quality or overall success was established. Backend `.github` tree remains the preexisting Dependabot-only tree.

**Required delta:** retain passing scoped evidence but rerun the final committed pair against intended PostgreSQL/cache/AMQP/S3/worker/scheduler/proxy paths. Do not substitute Redis broker fixtures for proof of the configured production AMQP path. Tests may use other transports only with that scope recorded. Release must include actual UI scenarios, failures, bounded performance, recovery, and human acceptance.

### R15 — Agent handoff and duplicate status files can cause repeated or stalled work (P1)

**Evidence:** backend root AGENTS.md remains unchanged while an addendum was copied under docs; frontend merged delivery rules. Both repositories contain duplicate delivery files and stale dependency statements. Producer manifests still name earlier HEAD plus a then-uncommitted worktree.

**Required delta:** choose one authoritative current ledger per repo and make duplicates pointers or byte-identical generated copies. Merge backend delivery rules into AGENTS.md without replacing existing rules; do not assume the product-delivery skill is installed. Freeze source digests and explicit export provenance. A changed producer cannot silently alter a consumer's contract. Historical records remain historical, not current task blockers.

### R16 — Browser-quality orchestration and clean-install diagnostics need closure (P1)

**Evidence:** current run 37913345517/job 113763493592 was cancelled during `npm run test:browser-quality`. `scripts/browser-quality-check.mjs` launches scopes serially and reports a scope only after exit; the parent has no per-scope watchdog or explicit child/process-tree termination on a deadline. The absence of a scope-success line does not prove which internal browser assertion failed, or that cancellation was caused by a hang. The first scope is the boundary runner, making its launch/cleanup the first investigation point, not a proven root cause.

The same hosted installation logs report deprecated packages/actions and an npm summary of 15 high-severity findings. This is an observed audit summary, not proof of 15 independent exploitable production vulnerabilities. A fresh structured production/development advisory triage is needed. Warnings outside `mise run check` must not be concealed by its internal zero-diagnostic summary.

**Required delta:** extend APP-FE-002/033/038. Log bounded scope start/end and durations; add deadlines, cancellation propagation, child cleanup and partial evidence on failure. Reproduce the first incomplete scope using the CI binary/environment before increasing overall timeouts. Retain serial/resource caps unless measurements justify a change. Triage actual advisory paths, resolve compatible fixes, and obtain explicit disposition for remaining exceptions; do not use `npm audit fix --force` or blanket warning suppression. Preserve passing earlier stages while keeping full check status failed/cancelled until a complete run succeeds. See CI-OBSERVATIONS.md.

## Evidence levels and current numbers

DB-002 reports a final fifteen-stage backend gate with 809 default passes, one doctest and 78 required integration-profile passes, no required skips, and 175 documented opt-in exclusions. It labels the result VERIFIED_WITH_EXCEPTION. Earlier `completion-verification.md` reports 808/76 on a pre-rebaseline tree; it must not be quoted as the latest post-DB-002 run. None of those counts demonstrate the full frontend/browser/real-provider journey.

Frontend local gate and selected synthetic browser evidence are not a complete final paired result. The latest hosted workflow completed as CANCELLED. Its retrieved logs show 455 Vitest tests in 84 files, 22 session-boundary tests, 4 HTTP-boundary tests, 2 static-serving tests and 3 diagnostic-capture tests passing, followed by a successful production build. The browser-quality command began at 09:47:37 UTC and had no success summary before cancellation at 10:05:58 UTC. These are observed remote CI results, not tests executed by this review. No overall passing hosted or paired result is established. See CI-OBSERVATIONS.md for the exact evidence boundary.

## Delivery order

1. Reconcile current migration decisions, producer/consumer contract snapshots and task statuses. Freeze the exact pair and make the paired failure actionable.
2. Consume already-built services: preferences beyond theme/language, saved views/favorites, persistent help, setup/dependency reports, inbox/deep links, support incidents, calendar/reminders and metrics. These can proceed independently of protected purchasing decisions.
3. Finish the semantic inspectors and default-restoration UI; retain the canvas engine, renderer and transport boundaries.
4. Extend the existing seed owner with rich immutable baselines, editable demonstration copies, deterministic scenarios and safe reset/verify commands. Seed the basic subset before pending integration/chat capabilities exist; missing requested capabilities are blockers, not success labels.
5. Implement private assistant turns, typed confirmed actions and owned delayed background jobs. Reuse requests/work items, AI governance, scheduler/outbox, media/reporting, notifications and support.
6. Demonstrate the whole committed pair with ordinary users, real workers, negative scenarios, restart/duplicate handling and truthful AI/provider labels.

The following matrix reconciles every original APP task. 'Recorded complete' is repository status at the inspected snapshot, not new certification. A complete task may need a specifically named extension; it should not be reopened merely to repeat its original implementation.

## Backend — every original task

| ID         | Original outcome                                                          | Repository status summary                          | Specific remaining delta / no-redo direction                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APP-BE-001 | Reconcile the real baseline, ownership and paired contract inventory      | Recorded complete; exception-approved verification | Freeze current commit/export/schema identifiers; supersede earlier dirty-worktree handoff without losing provenance.                                                                      |
| APP-BE-002 | Enforce the complete warning-free local gate and retain evidence          | Recorded complete; exception-approved verification | Retain exact approved D07 exceptions and VERIFIED_WITH_EXCEPTION label; exception-free readiness is not established.                                                                      |
| APP-BE-003 | Resolve migration policy and establish safe upgrade verification          | Recorded complete; exception-approved verification | Use DB-002 as current policy. Prove legacy-data transition; resolve how later conversation schema changes are delivered.                                                                  |
| APP-BE-004 | Make system catalogs and permission seeds complete and idempotent         | Recorded complete; exception-approved verification | Reuse the permission/handler catalogs. Add only genuinely new conversation/action permissions and tested seed mappings.                                                                   |
| APP-BE-005 | Provide supported bootstrap and realistic demo fixtures                   | Recorded complete; exception-approved verification | Reuse bootstrap/demo owners. Add rich scenario profiles and a complete form+graph+layout version hash; supplied alias exposes only basic seeds.                                           |
| APP-BE-006 | Exclude deleted objects consistently from live queries                    | Recorded complete; exception-approved verification | Retain live-only item/count filtering. Cover every new chat/schedule/calendar/metric projection and restore/caching UI path.                                                              |
| APP-BE-007 | Persist self profile and typed preferences                                | Recorded complete; exception-approved verification | Retain typed preference APIs. Complete consumer profile/timezone/density/workspace settings and account-isolation evidence.                                                               |
| APP-BE-008 | Normalize authorized selectors and add durable resource resolution        | Recorded complete; exception-approved verification | Reuse authorized selectors and durable resource links. Complete current-reference consumption in new pickers and links.                                                                   |
| APP-BE-009 | Add private saved views and favorites without stale-reference storage     | Recorded complete; exception-approved verification | Reuse saved-view/favorite persistence; consume it in the frontend rather than create another storage model.                                                                               |
| APP-BE-010 | Store only the small per-user multilingual help-state table               | Recorded complete; exception-approved verification | Reuse small help-state persistence. Deploy the matching frontend help metadata and integrate viewed/dismissed/reset actions.                                                              |
| APP-BE-011 | Expose truthful setup/readiness checks with safe repair destinations      | Recorded complete; exception-approved verification | Add profile-aware actual worker/scheduler probe receipts. Existing required unknown placeholders never prove execution readiness.                                                         |
| APP-BE-012 | Add definition dependency readiness and guided repair metadata            | Recorded complete; exception-approved verification | Consume existing dependency metadata in real inspectors/publication repair flows; extend only missing contextual schemas.                                                                 |
| APP-BE-013 | Specify the complete notification event map and compatibility design      | Recorded complete; exception-approved verification | Reuse notification-map versioning. Append conversation event mappings only with exact recipient/target/dedup semantics.                                                                   |
| APP-BE-014 | Implement unified notifications and transactional event delivery          | Recorded complete; exception-approved verification | Reuse transactional notice delivery. Verify every implemented trigger and target through current unified inbox UI.                                                                        |
| APP-BE-015 | Record supportable failures and expose a safe incident projection         | Recorded complete; exception-approved verification | Reuse safe incident storage. Connect client receipts/operator UI and add bounded chat/schedule error classes.                                                                             |
| APP-BE-016 | Add a workflow-aware calendar with correct time and ownership semantics   | Recorded complete; exception-approved verification | Reuse event/range/ownership/DST contracts. Finish production calendar UI and actor revocation/overlap/count tests.                                                                        |
| APP-BE-017 | Deliver calendar and work reminders through existing scheduling           | Recorded complete; exception-approved verification | Reuse durable reminder scheduling. Verify deployment AMQP path and avoid inventing a second timer loop for assistant jobs.                                                                |
| APP-BE-018 | Provide authorized metric definitions and chart data                      | Recorded complete; exception-approved verification | Reuse metric definitions/permissions. Wire live chart data/drill-down; add assistant metrics only after populations are defined.                                                          |
| APP-BE-019 | Complete typed authoring metadata instead of generic JSON contracts       | Recorded complete; exception-approved verification | Reuse inspector metadata. Close contextual operation/connection/agent/list mapping gaps without generic JSON fallback.                                                                    |
| APP-BE-020 | Close runtime form and complex-value conformance gaps                     | Recorded complete; exception-approved verification | Keep 20-control backend conformance. Run paired browser complex-row/private-attachment/correction cases on current contract.                                                              |
| APP-BE-021 | Enforce required human approval before protected business effects         | Open / partial / acceptance outstanding            | Freeze pending protected-operation mapping; reject every bypass and recheck exact committed human approval at dispatch.                                                                   |
| APP-BE-022 | Define governed business operations and execution-principal policy        | Open / partial / acceptance outstanding            | Approve an execution-principal policy and allowlisted typed operations; no accidental publisher/admin privilege escalation.                                                               |
| APP-BE-023 | Implement one real HTTP demo business operation with a receipt            | Open / partial / acceptance outstanding            | Implement actual HTTP sandbox create action/receipt. Connection status is not a business operation.                                                                                       |
| APP-BE-024 | Handle unknown outcomes, reconciliation and supported compensation        | Open / partial / acceptance outstanding            | Implement unknown outcome reconciliation, safe recovery and explicit compensation; no blind mutation replay.                                                                              |
| APP-BE-025 | Verify supervised AI behavior and provide an explicit evaluation path     | Open / partial / acceptance outstanding            | Prove supervised AI on representative cases, bounded spend/unknown usage and a manual fallback; paid calls explicit.                                                                      |
| APP-BE-026 | Support immutable template baselines and safe return-to-default           | Recorded complete; exception-approved verification | Reuse preview/apply/layout reset and receipt locks. Complete frontend restoration; never reset active case pins.                                                                          |
| APP-BE-027 | Complete private transfer/report contracts and backend operational bounds | Open / partial / acceptance outstanding            | Close accepted/oversize/concurrent transfer and report recovery across the real proxy/storage pair.                                                                                       |
| APP-BE-028 | Extend one combined workflow regression across all included features      | Open / partial / acceptance outstanding            | Run the combined core purchase/service scenarios; individual subsystem tests are insufficient. New assistant scenarios belong to APP-BE-038, not a prerequisite added back to APP-BE-028. |
| APP-BE-029 | Build the guarded demo harness and reversible scenario reset              | Open / partial / acceptance outstanding            | Implement owned scoped demo verification/reset with external-effect reconciliation; never invoke shared-volume reset.                                                                     |
| APP-BE-030 | Review backend code quality and repair feature-critical issues            | Open / partial / acceptance outstanding            | Review remaining changed hot paths and failures after implementation; preserve source-specific findings and tests.                                                                        |
| APP-BE-031 | Automate paired contracts, hosted checks and rebuilt image verification   | Open / partial / acceptance outstanding            | Add hosted backend checks, fresh pair schema/export/build evidence and rebuilt image verification; require actual peer.                                                                   |
| APP-BE-032 | Close backend demo acceptance, restore and support handoff                | Open / partial / acceptance outstanding            | Close connected demo, new-table restore, operational support and acceptance; do not derive status from exit code alone.                                                                   |

## Frontend — every original task

| ID         | Original outcome                                                              | Repository status summary               | Specific remaining delta / no-redo direction                                                                                         |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| APP-FE-001 | Reconcile existing screens, API coverage and the no-redo plan                 | Recorded local completion               | Refresh inventory against the current producer, not only the old 314-operation contract. Keep provenance and actual UX dispositions. |
| APP-FE-002 | Make mise run check warning-free and include repeatable UI gates              | Recorded local completion               | Keep diagnostic/source-hash checks. Require peer for integrated gate; inspect current hosted artifacts and required skips.           |
| APP-FE-003 | Perform and close the feature-focused Angular code review                     | Recorded local completion               | Retain initial review; repeat focused review on new adapters/editors, async ownership, teardown and canonical values.                |
| APP-FE-004 | Establish PrimeNG-first UI rules, tokens and reusable patterns                | Recorded local completion               | Retain PrimeNG-first patterns. Verify remaining controls/overlays/read-only/RTL screens, not merely package installation.            |
| APP-FE-005 | Complete typed API adapters and safe command/read coordination                | Recorded local completion               | Regenerate after deliberate current producer intake; repair decoders and adapters, then pass real paired smoke.                      |
| APP-FE-006 | Deliver reusable permission-aware resource pickers                            | Open / partial / acceptance outstanding | Wire authorized contextual selectors and durable links; cover paged search, retained selections, revocation and reopen labels.       |
| APP-FE-007 | Replace generic record dumps with domain summaries and typed editing patterns | Open / partial / acceptance outstanding | Replace normal technical dumps with domain summaries; retain unknown values safely and classify legitimate expert exceptions.        |
| APP-FE-008 | Build account profile, persisted themes and workspace settings                | Open / partial / acceptance outstanding | Preserve actual theme/language transport. Finish full profile, timezone, density, workspace settings and two-session evidence.       |
| APP-FE-009 | Add saved list views and reusable favorites navigation                        | Open / partial / acceptance outstanding | Domain snapshot functions exist; add persisted save/rename/default/delete/favorites UI and conflict/repair handling.                 |
| APP-FE-010 | Implement a simple multilingual Help list and per-user acknowledgments        | Open / partial / acceptance outstanding | Help content exists; replace in-memory-only acknowledgments with the existing server table and release metadata handshake.           |
| APP-FE-011 | Build setup/readiness and dependency repair screens                           | Open / partial / acceptance outstanding | Move existing readiness panels into product routes with live probes, freshness and authorized repair actions.                        |
| APP-FE-012 | Implement the unified notification center and safe deep links                 | Open / partial / acceptance outstanding | Consume unified inbox/notification map and durable target resolver; current legacy notices do not close this task.                   |
| APP-FE-013 | Show support references and record safe client failures                       | Open / partial / acceptance outstanding | Distinguish request correlation from persisted support receipt; wire bounded client failure intake and incident navigation.          |
| APP-FE-014 | Deliver the operational calendar and event/reminder experience                | Open / partial / acceptance outstanding | Use existing calendar views with live event CRUD, reminders, range navigation, source links and ownership states.                    |
| APP-FE-015 | Implement real dashboards with metric drill-down and accessible tables        | Open / partial / acceptance outstanding | Use existing metric cards with authorized live queries, source definitions, freshness, chart/table display and drill-down.           |
| APP-FE-016 | Create a visual form-layout editor for the existing primitive set             | Open / partial / acceptance outstanding | Finish visual layout and outline actions for all supported primitives without requiring JSON.                                        |
| APP-FE-017 | Build typed field, collection, attachment and validation inspectors           | Open / partial / acceptance outstanding | Finish typed scalar/collection/media/validation properties; preserve exact decimals, null/missing and stable rows.                   |
| APP-FE-018 | Deliver behavior, dynamic options and constrained expression editing          | Open / partial / acceptance outstanding | Complete dynamic option/resource selectors, behavior controls and constrained expression diagnostics.                                |
| APP-FE-019 | Finish localized pages, views and shared-runtime preview                      | Open / partial / acceptance outstanding | Complete translated pages/views/help/settings and the shared runtime preview against the latest backend.                             |
| APP-FE-020 | Upgrade the existing canvas interaction and navigation experience             | Open / partial / acceptance outstanding | Retain canvas interaction work. Complete bounded multi-select/duplicate/routing/navigation/keyboard semantics and tests.             |
| APP-FE-021 | Build a typed node-inspector system with complete item details                | Open / partial / acceptance outstanding | Use actual schemas for complete node inspectors; unsupported shapes must be explicit compatibility states, not hidden data loss.     |
| APP-FE-022 | Deliver human-task, assignment, view and approval inspectors                  | Open / partial / acceptance outstanding | Complete human field policies, actions, candidate changes, current labels and protected approval UX.                                 |
| APP-FE-023 | Implement visual data mapping with typed sources and destinations             | Open / partial / acceptance outstanding | Extend scalar mappings to supported structured/list/ordinal/path mappings with server authority and validation.                      |
| APP-FE-024 | Provide branch, timer, event and subprocess configuration                     | Open / partial / acceptance outstanding | Complete decision/default/timer/event/subprocess settings and real execution; do not invent BPMN semantics.                          |
| APP-FE-025 | Create AI and integration node editors with governed connections              | Open / partial / acceptance outstanding | Add approved agent-version/operation/connection selectors and policy/budget visibility; no arbitrary task or endpoint entry.         |
| APP-FE-026 | Add safe testing, structured execution details and canvas run overlays        | Open / partial / acceptance outstanding | Complete selected-node authorized input/output/results and safe previews/run overlay; no destructive node replay shortcut.           |
| APP-FE-027 | Complete publication, comparisons and safe workflow default restoration       | Open / partial / acceptance outstanding | Consume implemented default-preview/apply/layout-reset; finish comparison, expiry/conflict/immutable-successor journey.              |
| APP-FE-028 | Finish requester-facing creation, private draft and outcome details           | Open / partial / acceptance outstanding | Complete requester complex forms/private files/corrections and business outcome/receipt details on the actual pair.                  |
| APP-FE-029 | Finish reviewer work lists, decisions and correction experience               | Open / partial / acceptance outstanding | Complete claim race, scope-correct reviewer/correction workflow and mandatory human decision evidence.                               |
| APP-FE-030 | Replace integration and AI administration JSON with domain workflows          | Open / partial / acceptance outstanding | Replace generic integration/AI admin JSON inputs with provider-specific setup, secrets, grants and operation controls.               |
| APP-FE-031 | Complete identity, group, permission, client and request-type administration  | Open / partial / acceptance outstanding | Complete contextual user/role/group/client/restriction flows; permission chooser alone is not full administration.                   |
| APP-FE-032 | Provide usable operator, schedule, report, audit and recovery screens         | Open / partial / acceptance outstanding | Complete schedule-specific controls, actual background status/receipt/recovery and private reports/audit.                            |
| APP-FE-033 | Close every in-scope API and raw-JSON UX coverage gap                         | Open / partial / acceptance outstanding | Review all current producer operations and JSON register matches; source counts are not UX coverage.                                 |
| APP-FE-034 | Verify full English/Farsi, accessibility and responsive behavior              | Open / partial / acceptance outstanding | Complete current en/fa, keyboard, screen-reader, zoom/contrast, supported browser and responsive acceptance.                         |
| APP-FE-035 | Measure bounded form/canvas/chart performance and teardown                    | Open / partial / acceptance outstanding | Measure connected 25/100/250-node graphs, nested forms and transfers; isolated empty nodes do not establish graph performance.       |
| APP-FE-036 | Harden the same-origin boundary for real sessions and private transfers       | Open / partial / acceptance outstanding | Retain streaming repairs; reproduce oversize/late-body/session/slow-upload/capacity issues and bound final memory.                   |
| APP-FE-037 | Build the paired application demo and repeatable browser reset rehearsal      | Open / partial / acceptance outstanding | Resolve schema drift then run full paired scenario/fault/reset-twice harness, not fixture substitution.                              |
| APP-FE-038 | Close zero-warning product acceptance and operator/user handoff               | Open / partial / acceptance outstanding | Only current final paired evidence plus manual/user signoff permits demo readiness; no blanket done claim.                           |

## Scope of the new request

Rich seeds extend existing demo/authoring/verification tasks. They are not 32 new backend tasks. Only durable private conversations, typed proposals and user-owned scheduled actions receive new IDs. The detailed next-ticket definitions are in the two follow-up files. New contract names, routes and limits are proposed until recorded by the implementing owner; no executable capability is claimed by this document.
