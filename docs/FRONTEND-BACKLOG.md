# FRONTEND — Complete application and connected-workflow backlog

Delivery pack: 1.0.0  
Prepared: 2026-10-08  
Repository: `Metal-Bat/angular-base`  
Reviewed commit: `afe4bbe5f566c80e7eb45f6ef9f12c041d60139d`  
Companion: `BACKEND-BACKLOG.md` in the other repository pack  
Primary goal: **fully usable application and a repeatable, truthful connected-system demonstration**  
Implementation status: **APP-FE-001–005 delivered locally; available slices through APP-FE-020 implemented; blocked acceptance remains explicit. See change records and verification manifests.**

## How to use this file

Place this file at `docs/delivery/FRONTEND-BACKLOG.md`. Keep the current `docs/BACKLOG.md` intact and add a link to this delivery supplement. Apply `AGENTS.addendum.md` by merging its section into existing AGENTS.md, never replacing the original instructions. The optional product-delivery skill references the same rules and does not replace existing skills.

This main file is self-contained: task specs, shared contracts, acceptance, execution rules and timing are embedded below. Companion copies of the shared rules/ledger/timing are supplied for convenient reuse. Keep their version/hash synchronized; editing one contract in one repo requires a paired handoff, not silent divergence.

Recommended agent instruction: “Read AGENTS.md, the existing backlog and this file. Execute APP-FE-001 first; then select the next dependency-ready task. Reuse existing code and preserve IDs. Do not mark implementation complete without the full warning-free mise run check and the task’s actual acceptance evidence.”

## Contents

1. Status, evidence and current architecture.
2. Decisions and exact gates.
3. Requirement traceability and milestones.
4. Task index and detailed implementation tickets.
5. Shared proposed contracts and notification map.
6. Agent execution rules.
7. Detailed effort/timing model.
8. Source evidence.

## Status and starting instructions

Wave 1–3 records: [intake](INTAKE.md), [gate](GATES.md), [Angular review](ANGULAR-REVIEW.md), [UI policy](../UI-LIBRARIES.md), [adapter handoff](ADAPTER-CONTRACTS.md). The final gate artifacts and scope limits are recorded in docs/changes/APP-FE-001–005.md. Remaining tasks are selected only after their actual frontend/backend prerequisites hold.

This is a proposed, source-grounded delivery backlog. No task is marked implemented or verified merely because this file exists. `Status: READY` means ready to START; deliverable readiness requires the verification gates below. `Verification: NOT_RUN` is the initial evidence state for new tasks; APP-FE-001–005 now have task-specific local evidence. Real HTTP evidence covers the existing requester/reviewer journey, not all later capabilities. Existing completed work is reused, not reset.

The first agent executes task 001 for its repository, records the actual local baseline and selects a dependency-ready unit. Do not execute the entire file as one unreviewable change. Large tasks are subdivided using suffixes (for example APP-FE-016a) with their own acceptance, without renumbering the parent. One worker owns migrations, lockfiles and generated contracts at a time.

These files do not authorize repository pushes, production changes, provider spend or destructive shared-data operations. Installation is additive. Existing backlog IDs remain authoritative for their old scope; add a link to this supplement and maintain APP status here, not a second duplicated task body.

## Current implementation to preserve

| Area               | Evidence and exact delta direction                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack              | package.json pins Angular 21.2.25, PrimeNG 21.1.10 and Foblex 19.3.0. Verify package-lock/toolchain at intake; current web guidance may describe newer versions [F04].                        |
| Structure          | Lazy Operations/Studio/Administration, domain/application/infrastructure/presentation boundaries and shared UI already exist. Keep them; do not start a new app shell [F02/F06].              |
| Security/transport | Same-origin Node session boundary, server-held tokens, refresh coordination and command replay protection are implemented. Extend, do not switch to browser token storage [F14–F16].          |
| Runtime            | Shared runtime document/renderer, requester/reviewer, rows/attachments/corrections and prior backend patch/projection fixes exist. Finish coverage and UX, not another form engine [F02/F06]. |
| Studio             | Real Foblex board/viewer, WIP save/promote/publish and form palette exist. The semantic inspectors still rely on JSON in important places [F07–F10].                                          |
| Administration     | Lists/detail/dialog improvements and broad API administration exist; nested generic configuration still needs typed domain interfaces [F12].                                                  |
| Design system      | Material/PrimeNG/native coexist by recorded design. New policy is PrimeNG-first for touched business UI with explicit exceptions, not wholesale uninstall [F05].                              |
| Evidence           | Local browser/runtime/accessibility checks are documented with limits; the check script does not by itself prove deployed browser/provider integration [F03/F11/F13].                         |

This planning session read current GitHub files but did not run your frontend, tests, graphify, browsers or build. No current deployment or acceptance is inferred. Existing feature/test evidence is input to intake, not a reason to rerun implementation from scratch.

## Repository-specific implementation contract

All normal API inputs/outputs receive purposeful domain UI. A code-generated typed client is necessary but does not prove feature support. Every operation in the coverage matrix needs its intended treatment: normal UI, legitimate advanced admin UI, server boundary, internal/non-UI or explicitly owner-approved exclusion. No agent may hide a missing normal workflow behind a generic JSON console.

Use PrimeNG-first public APIs/tokens for ordinary new or redesigned controls, Tailwind for layout and documented Material/CDK/native/canvas exceptions. Do not introduce a paid calendar/chart product or a wholesale new state framework without approval. A semantic wrapper should encode real app behavior, not become an all-purpose schema renderer. Keep Foblex and chart/calendar imports in infrastructure/presentation adapters, not domain models.

Preserve signal/OnPush/zoneless behavior actually used in the repo. Prefer typed data flow and cohesive components; use lifecycle cleanup and context fencing for every subscription/promise. Do not perform server authorization or workflow execution in the browser. Exact decimal/typed option and null/missing/disabled semantics outrank cosmetic component uniformity.

At every screen test loading, empty, invalid, forbidden/revoked, stale/conflicting, uncertain, failed and successful states; actor change, route teardown, unsaved navigation and localization. Expected operation-result data is displayed as meaningful fields/tables/receipts, not a raw dump. An optional expert inspector must be redacted, clearly advanced and unnecessary for the complete normal demo.

Initial test paths/runners referenced in tasks are either existing package.json commands or explicitly proposed extensions. Never claim a proposed script exists until created and verified; current repository commands are authoritative.

## Decisions, defaults and scope boundaries

User-confirmed scope: application bootstrap/permissions; calendar/chart services; persisted profile/theme/preferences; no deleted objects in ordinary lists; complete relevant API UI coverage; Angular/code/PrimeNG review; rich linked workflow authoring; setup checklist; shared pickers; dependency repair; saved views/favorites; notification map; demo harness/default restoration; small multilingual help with seen state; recorded supportable failures; strict warning-free checks. These are user requirements, not invented prior approvals of technical choices below.

| ID                                | Choice and proposed default                                                                                                                                                                                                    | Why it matters / blocked work                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 — **owner decision required** | Keep applied consolidated migration b13a0c7d2e44 immutable; allow new additive revisions on one linear chain. Alternative: retain one-file mandate only with a separately designed/versioned upgrade mechanism.                | Existing DB-001 explicitly mandates one revision. New tables cannot silently edit it. APP-BE-003 is CONFLICT until approved; persistence implementation and its dependent integration gates wait.         |
| D02 — integration and AI          | First connected-system demo uses a clearly labeled separate HTTP sandbox with an actual durable receipt and deterministic AI fixtures. Select a named vendor sandbox and approved live AI agent/data/cost cap for live claims. | Allows useful genuine network/worker demonstration without inventing vendor access. Named-vendor/live-AI acceptance remains blocked until access and evidence exist; no hidden automatic purchases/calls. |
| D03 — calendar                    | Preserve implemented Gregorian canonical wire dates and deliver English/Farsi UI. Jalali input/conversion is a separate explicitly approved extension, not automatically implied by Farsi.                                     | Current backend rejects persian calendar. Do not offer a nonfunctional UI toggle or silently change date interpretation.                                                                                  |
| D04 — execution authority         | Least-change demo retains existing publisher-bound execution identity with a dedicated non-superuser demo publisher and tested fail-closed offboarding. A service-principal redesign requires explicit approval.               | Do not silently elevate or change active-case pins. APP-BE-022 documents the exact pilot policy; only a new authority model is blocked on further decision.                                               |
| D05 — browser/performance         | Use the provisional C14 desktop/mobile, Chromium/Firefox, en/fa/light/dark profile; identify actual test device and agree performance budgets before pass/fail certification.                                                  | Implementation/measurement can proceed; supported-device/performance/user acceptance cannot be invented. No untested “works on all browsers” claim.                                                       |
| D06 — session/deployment          | Retain same-origin server-held tokens. A single-process, restart-signout demo is the minimal existing topology; multiple replicas require a protected shared session design and separate validation.                           | No automatic browser-token-store switch, new auth architecture or unverified HA claim. Production topology is not established by this plan.                                                               |

No assumption is made about tenants, staffing, deadlines, compliance, production scale or recovery commitments. Do not treat clients/work groups as a tenant model. New business approvals, quorum, self-approval restrictions, monetary units or holiday policies need explicit domain requirements.

Later-release candidates, **not silently added to this initial scope**: external calendar sync/invitations/recurrence/holiday engine; Jalali conversion; team-shared views; multi-user collaborative canvas/offline drafts; general bulk commands; arbitrary connector marketplace; BPMN interoperability; enterprise SSO/tenancy; new HA session store. A current existing API cannot be excluded under this list just to avoid finishing its legitimate UI.

## Exact frontend gate and evidence ladder

**Current baseline command:** `mise run check` [F03]. It runs format:check, api:check, typecheck, lint, test:ci, test:boundary, test:deployment, build and release:evidence. Preserve these and add strict diagnostic checks, no-JSON/translation/map checks and the non-paid paired browser smoke as delivered. No worker/backend absence may be silently replaced by mocked browser responses in an integrated gate.

Existing browser commands include test:browser-boundary, auth, ui, workspace, backend, canvas, studio, admin, records, catalogs, performance, accessibility and test:browser-quality [F04]. Choose relevant ones during development; the final matrix includes all mandatory surfaces. Use the pinned available browser runner; do not swap test engines without reporting it. Run serially where the repository harness requires isolated state.

Before an implementation task is DONE: full check passes zero warnings from the final tree; relevant actual API/browser tests pass; no required scenario is skipped. Collect browser console diagnostics, network assertions, failed/expected-failure states and screenshots with synthetic data. Manual screen-reader/device acceptance cannot be fabricated from automated axe output. Unsupported or fixture-only parts remain explicit.

A generated API snapshot that matches itself is not paired verification. Record exact backend SHA, schema hash, client/release, boundary mode, service identities and browser version. A local HTTPS/static rollback check is not proof of a deployed production proxy. A default reset demonstration must show the same actual backend template/pin semantics, not a frontend reinitialization of local arrays.

## User-requirement traceability

| Requirement                                      | Backend producer                  | Frontend consumer                 | Acceptance          |
| ------------------------------------------------ | --------------------------------- | --------------------------------- | ------------------- |
| Seed data and permissions                        | APP-BE-004/005                    | APP-FE-001/011/031/037            | A01/A02             |
| No deleted records in ordinary lists             | APP-BE-006                        | APP-FE-006/007/009/031            | A02/A05/A09         |
| Profile/themes/preferences                       | APP-BE-007                        | APP-FE-008                        | A03                 |
| Reusable resource pickers                        | APP-BE-008                        | APP-FE-006                        | A02/A11             |
| Saved views and favorites                        | APP-BE-009                        | APP-FE-009                        | A03/A05             |
| Small multilingual help + seen table/list        | APP-BE-010                        | APP-FE-010                        | A03/A04             |
| Setup/readiness checklist                        | APP-BE-011                        | APP-FE-011                        | A06                 |
| Dependency readiness/repair                      | APP-BE-012/019                    | APP-FE-011/021/027                | A06/A11/A12         |
| Notification map, inbox and deep links           | APP-BE-013/014                    | APP-FE-012                        | A07                 |
| Recorded supportable failures                    | APP-BE-015                        | APP-FE-013/032                    | A20                 |
| Calendar + reminders                             | APP-BE-016/017                    | APP-FE-014                        | A08                 |
| Charts/analytics                                 | APP-BE-018                        | APP-FE-015                        | A09                 |
| All relevant API/UI support; no normal JSON      | APP-BE-019/020 + owning contracts | APP-FE-001/005/007/016–033        | A10/A11/A14/A15/A24 |
| Code review and Angular best practice            | APP-BE-030                        | APP-FE-003                        | A22/A23/A24         |
| PrimeNG-first design audit/adoption              | APP-BE-019 metadata only          | APP-FE-004/007 and domain editors | A23                 |
| Rich linked workflow canvas                      | APP-BE-019/021/022/024/026        | APP-FE-020–027                    | A11/A12/A16/A17/A18 |
| Required approval and useful integrations        | APP-BE-021–025/028                | APP-FE-022/025/026/028–030        | A16/A17/A18/A26     |
| Safe return-to-default workflows                 | APP-BE-026                        | APP-FE-027                        | A13                 |
| Demonstration harness + environment reset        | APP-BE-005/028/029                | APP-FE-037                        | A25/A26             |
| Zero-warning mise run check and actual readiness | APP-BE-002/031/032                | APP-FE-002/034–038                | A24/A26             |
| Private attachments, reports, sessions, recovery | APP-BE-024/027/028/032            | APP-FE-028/029/032/036/037        | A19/A21/A22         |

## Milestones and what the demonstration must show

| Milestone | User-visible result                                                                                                                              | Do not confuse with                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| M0        | Audited baseline, scoped deltas, exact contracts and honest strict check behavior.                                                               | A complete application or a ready production deployment.                                   |
| M1        | Seeded usable accounts, live-only lists, readable shared records, profile/preferences, saved views/favorites, help and support foundations.      | Finishing all visual authoring or the connected case.                                      |
| M2        | Normal visual form/workflow editing, typed mappings/semantics, publication/dependency repair and safe default restoration.                       | Arbitrary scripting, all BPMN/n8n features or collaborative editing.                       |
| M3        | Actual requester/reviewer + supervised AI policy + branches + HTTP sandbox business receipt + notification/report/private transfer and recovery. | A named vendor or live model having been verified when a local sandbox/simulator was used. |
| M4        | Operational calendar/reminders and real authorized dashboards that reflect case activity.                                                        | Recurrence/external sync/Jalali/BI platform unless separately approved.                    |
| M5        | Full API/UI/no-JSON closure, repeatable reset, real-service/browser/manual/performance evidence and acceptance handoff.                          | Automatic production/user acceptance from tests alone.                                     |

Numbers organize outcomes, not an instruction to serialize independent teams. Use actual dependency edges. Deliver incremental demonstrations after meaningful slices, while reserving FULL_DEMO_READY for the whole mandatory requested scope and evidence. Purchase approval is the reference journey; the smaller service-request template demonstrates configurability without building a second business domain application.

## Task index and dependency map

Effort includes implementation, focused review, tests and task documentation. It excludes decision/vendor waiting and the separate contingency in the timing section. An existing fulfilled criterion removes work after intake; do not spend the estimate recreating it.

| Task                      | Outcome                                                                       | Milestone | Person-days | Required predecessors                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------- | --------- | ----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [APP-FE-001](#app-fe-001) | Reconcile existing screens, API coverage and the no-redo plan                 | M0        |         2–3 | None                                                                                                                                                                                           |
| [APP-FE-002](#app-fe-002) | Make mise run check warning-free and include repeatable UI gates              | M0        |         2–4 | APP-FE-001                                                                                                                                                                                     |
| [APP-FE-003](#app-fe-003) | Perform and close the feature-focused Angular code review                     | M1        |         3–5 | APP-FE-001, APP-FE-002                                                                                                                                                                         |
| [APP-FE-004](#app-fe-004) | Establish PrimeNG-first UI rules, tokens and reusable patterns                | M1        |         3–5 | APP-FE-001, APP-FE-002                                                                                                                                                                         |
| [APP-FE-005](#app-fe-005) | Complete typed API adapters and safe command/read coordination                | M1        |         3–5 | APP-FE-001, APP-FE-002, APP-BE-001                                                                                                                                                             |
| [APP-FE-006](#app-fe-006) | Deliver reusable permission-aware resource pickers                            | M1        |         3–5 | APP-FE-004, APP-FE-005, APP-BE-008                                                                                                                                                             |
| [APP-FE-007](#app-fe-007) | Replace generic record dumps with domain summaries and typed editing patterns | M1        |         4–7 | APP-FE-004, APP-FE-005, APP-FE-006                                                                                                                                                             |
| [APP-FE-008](#app-fe-008) | Build account profile, persisted themes and workspace settings                | M1        |         2–4 | APP-FE-004, APP-FE-005, APP-BE-007                                                                                                                                                             |
| [APP-FE-009](#app-fe-009) | Add saved list views and reusable favorites navigation                        | M1        |         2–4 | APP-FE-004, APP-FE-005, APP-FE-006, APP-BE-009                                                                                                                                                 |
| [APP-FE-010](#app-fe-010) | Implement a simple multilingual Help list and per-user acknowledgments        | M1        |       1.5–3 | APP-FE-004, APP-FE-005, APP-BE-010                                                                                                                                                             |
| [APP-FE-011](#app-fe-011) | Build setup/readiness and dependency repair screens                           | M2        |         2–4 | APP-FE-004, APP-FE-005, APP-FE-006, APP-BE-011, APP-BE-012                                                                                                                                     |
| [APP-FE-012](#app-fe-012) | Implement the unified notification center and safe deep links                 | M3        |         3–5 | APP-FE-004, APP-FE-005, APP-FE-006, APP-BE-014                                                                                                                                                 |
| [APP-FE-013](#app-fe-013) | Show support references and record safe client failures                       | M1        |         2–4 | APP-FE-004, APP-FE-005, APP-BE-015                                                                                                                                                             |
| [APP-FE-014](#app-fe-014) | Deliver the operational calendar and event/reminder experience                | M4        |         4–7 | APP-FE-004, APP-FE-005, APP-FE-006, APP-FE-008, APP-BE-016, APP-BE-017                                                                                                                         |
| [APP-FE-015](#app-fe-015) | Implement real dashboards with metric drill-down and accessible tables        | M4        |         3–5 | APP-FE-004, APP-FE-005, APP-FE-009, APP-BE-018                                                                                                                                                 |
| [APP-FE-016](#app-fe-016) | Create a visual form-layout editor for the existing primitive set             | M2        |         5–8 | APP-FE-004, APP-FE-006, APP-FE-007, APP-BE-019                                                                                                                                                 |
| [APP-FE-017](#app-fe-017) | Build typed field, collection, attachment and validation inspectors           | M2        |         4–7 | APP-FE-016, APP-BE-020                                                                                                                                                                         |
| [APP-FE-018](#app-fe-018) | Deliver behavior, dynamic options and constrained expression editing          | M2        |         5–8 | APP-FE-016, APP-FE-017, APP-FE-006, APP-BE-019, APP-BE-020                                                                                                                                     |
| [APP-FE-019](#app-fe-019) | Finish localized pages, views and shared-runtime preview                      | M2        |         3–5 | APP-FE-016, APP-FE-017, APP-FE-018                                                                                                                                                             |
| [APP-FE-020](#app-fe-020) | Upgrade the existing canvas interaction and navigation experience             | M2        |         4–7 | APP-FE-004, APP-FE-005, APP-FE-006                                                                                                                                                             |
| [APP-FE-021](#app-fe-021) | Build a typed node-inspector system with complete item details                | M2        |         4–6 | APP-FE-020, APP-FE-006, APP-FE-007, APP-BE-019                                                                                                                                                 |
| [APP-FE-022](#app-fe-022) | Deliver human-task, assignment, view and approval inspectors                  | M3        |         4–7 | APP-FE-021, APP-FE-006, APP-FE-019, APP-BE-021                                                                                                                                                 |
| [APP-FE-023](#app-fe-023) | Implement visual data mapping with typed sources and destinations             | M2        |         4–7 | APP-FE-021, APP-FE-006, APP-BE-019                                                                                                                                                             |
| [APP-FE-024](#app-fe-024) | Provide branch, timer, event and subprocess configuration                     | M2        |         4–7 | APP-FE-021, APP-FE-023, APP-FE-006, APP-BE-019, APP-BE-012                                                                                                                                     |
| [APP-FE-025](#app-fe-025) | Create AI and integration node editors with governed connections              | M3        |         4–7 | APP-FE-021, APP-FE-023, APP-FE-006, APP-BE-022, APP-BE-023, APP-BE-025                                                                                                                         |
| [APP-FE-026](#app-fe-026) | Add safe testing, structured execution details and canvas run overlays        | M3        |         4–7 | APP-FE-020, APP-FE-021, APP-FE-023, APP-FE-025, APP-BE-024, APP-BE-028                                                                                                                         |
| [APP-FE-027](#app-fe-027) | Complete publication, comparisons and safe workflow default restoration       | M2        |         3–5 | APP-FE-021, APP-FE-024, APP-FE-011, APP-BE-026                                                                                                                                                 |
| [APP-FE-028](#app-fe-028) | Finish requester-facing creation, private draft and outcome details           | M3        |         3–5 | APP-FE-005, APP-FE-006, APP-FE-007, APP-BE-020, APP-BE-027                                                                                                                                     |
| [APP-FE-029](#app-fe-029) | Finish reviewer work lists, decisions and correction experience               | M3        |         4–6 | APP-FE-005, APP-FE-006, APP-FE-007, APP-FE-022, APP-BE-020, APP-BE-021                                                                                                                         |
| [APP-FE-030](#app-fe-030) | Replace integration and AI administration JSON with domain workflows          | M3        |         4–7 | APP-FE-006, APP-FE-007, APP-FE-025, APP-BE-022, APP-BE-025                                                                                                                                     |
| [APP-FE-031](#app-fe-031) | Complete identity, group, permission, client and request-type administration  | M1        |         3–6 | APP-FE-006, APP-FE-007, APP-BE-004, APP-BE-006                                                                                                                                                 |
| [APP-FE-032](#app-fe-032) | Provide usable operator, schedule, report, audit and recovery screens         | M3        |         3–6 | APP-FE-006, APP-FE-007, APP-FE-013, APP-FE-026, APP-BE-024                                                                                                                                     |
| [APP-FE-033](#app-fe-033) | Close every in-scope API and raw-JSON UX coverage gap                         | M5        |         4–7 | APP-FE-007, APP-FE-019, APP-FE-024, APP-FE-025, APP-FE-027, APP-FE-028, APP-FE-029, APP-FE-030, APP-FE-031, APP-FE-032, APP-FE-014, APP-FE-015, APP-FE-010, APP-FE-012, APP-FE-009, APP-FE-011 |
| [APP-FE-034](#app-fe-034) | Verify full English/Farsi, accessibility and responsive behavior              | M5        |         3–5 | APP-FE-033                                                                                                                                                                                     |
| [APP-FE-035](#app-fe-035) | Measure bounded form/canvas/chart performance and teardown                    | M5        |         3–5 | APP-FE-033, APP-FE-020, APP-FE-014, APP-FE-015                                                                                                                                                 |
| [APP-FE-036](#app-fe-036) | Harden the same-origin boundary for real sessions and private transfers       | M3        |         3–5 | APP-FE-002, APP-FE-005, APP-BE-027                                                                                                                                                             |
| [APP-FE-037](#app-fe-037) | Build the paired application demo and repeatable browser reset rehearsal      | M5        |         4–6 | APP-FE-033, APP-FE-036, APP-BE-029, APP-BE-031                                                                                                                                                 |
| [APP-FE-038](#app-fe-038) | Close zero-warning product acceptance and operator/user handoff               | M5        |         2–4 | APP-FE-034, APP-FE-035, APP-FE-037, APP-BE-032                                                                                                                                                 |

<a id="app-fe-001"></a>

## APP-FE-001 — Reconcile existing screens, API coverage and the no-redo plan

Priority: P1  
Status: DONE  
Verification: VERIFIED_LOCAL  
Area: frontend / M0  
Depends-On: None  
Related: Steps 1–38; ARC-02/04; API-01; all current UI/FORM/STUDIO/ADMIN scopes  
Decisions: None  
Owner: Codex  
Estimate: 2–3 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-001.md

### Goal

Give the agent a screen-by-screen, operation-by-operation delta inventory so it extends the current application instead of starting a new Angular shell.

### Context: preserve and extend

F01–F17. Current reviewed main already has auth, runtime forms, requester/reviewer, studio canvas, catalogs and administration. Historical README/step labels are not a current feature inventory.

### Implementation sequence

1. Read AGENTS, all existing docs/BACKLOG.md entries and relevant code/tests. Record current SHA, local changes, locked tool versions and old/new task crosswalk; use graphify when available locally.
2. Inventory lazy routes, business screens, template files, services/adapters, generic JSON inputs/output dumps, current reusable pickers and feature permissions. Classify REUSE/EXTEND/VERIFY/NEW/CONFLICT per requirement.
3. Build docs/delivery/api-ui-coverage.md from actual peer OpenAPI plus current generated client. Each operation has persona, screen/action, input/output editor, states, permission, test and disposition (normal, advanced, server-boundary, internal, obsolete). Do not let agents exclude normal business APIs merely because they are inconvenient.
4. Audit package.json/package-lock.json/mise and UI-LIBRARIES before recommending libraries. Run current mise run check and record warnings/failures/skips; no clean-run claim without logs.
5. Create docs/delivery/json-ui-register.md with exact template locations and owner tickets. Cross-reference backend APP-BE-001 contract evidence and collect D01–D06 decisions without blocking independent code review.

### Acceptance criteria

- Every relevant existing API and screen has a traceable owner; current implementations are not labeled missing based on old docs.
- Normal raw-JSON interactions have a removal plan and structured replacement; expert-only exceptions are explicit and cannot hide incomplete normal tasks.
- Version/source/readiness records agree across the pair; unknown evidence is not invented.

### Verification and required evidence

Check route/operation manifest coverage, file existence, links, hashes and current check output. This analysis task can finish while gate repair remains APP-FE-002; no feature verification is implied.

### Data, compatibility, rollout and peer handoff

No runtime behavior changes. New APP entries supplement existing IDs and Steps; root docs/BACKLOG.md links to the supplement rather than duplicating status.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-001.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-002"></a>

## APP-FE-002 — Make mise run check warning-free and include repeatable UI gates

Priority: P0  
Status: DONE  
Verification: VERIFIED_LOCAL  
Area: frontend / M0  
Depends-On: APP-FE-001  
Related: ARC-04; QA-01/04/06; existing check/browser scripts  
Decisions: None  
Owner: Codex  
Estimate: 2–4 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-002.md

### Goal

Prevent an agent from declaring the frontend complete on type/build success while ignoring warnings, browser failures, generated drift or missing peer behavior.

### Context: preserve and extend

F03/F04 show the actual scripts; current check includes format/API/types/lint/unit/boundary/deployment/build/evidence, but full browser quality is separate. Preserve every existing step.

### Implementation sequence

1. Reproduce baseline diagnostics and repair their actual causes. Set native lint max-warnings=0 using the pinned Angular builder-supported forwarding; type/build diagnostics and unhandled test errors fail the gate.
2. Capture browser console warnings/errors and unhandled rejections for owned positive smoke journeys. Expected denial/fault-test diagnostics are asserted, not blanket-filtered. No --silent, warning suppression or threshold widening.
3. Extend check with deterministic shared UI/no-JSON contract/translation/notification-map checks as delivered. Add the current non-paid paired smoke when its harness is ready; missing required backend/services must fail or block, not fall back to mocks.
4. Produce a gate manifest with tool versions, exact tree/pair, exit codes, diagnostics and coverage. Record existing third-party warnings for remediation; an approved exception is not strict zero-warning readiness.
5. Run negative probes for lint warning, template/type failure, test failure, missing translation and failing production build. Keep native failure codes and remove temporary probe changes.

### Acceptance criteria

- mise run check ends with exit 0 and zero emitted warnings on the final tree; each intentional warning/failure is rejected.
- Existing security/provenance/bundle budgets are preserved; tests cannot silently skip required browser or peer evidence.
- An artifact clearly distinguishes fixture-only from integrated checks and contains no credential/private payload.

### Verification and required evidence

Extend existing check-ci-gates.mjs and relevant script tests instead of duplicating the runner. A24. Run actual mise run check; browser binary/version and services must be recorded.

### Data, compatibility, rollout and peer handoff

C14 and execution rules govern all tasks. Full live provider/AI calls remain explicit opt-ins, never automatic CI spend.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-002.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-003"></a>

## APP-FE-003 — Perform and close the feature-focused Angular code review

Priority: P1  
Status: DONE  
Verification: VERIFIED_LOCAL  
Area: frontend / M1  
Depends-On: APP-FE-001, APP-FE-002  
Related: ARC-02; current layer boundaries, command coordination and runtime model  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-003.md

### Goal

Repair maintainability and correctness problems that obstruct the product without migrating the framework or rewriting working architecture.

### Context: preserve and extend

F04 pinned Angular 21/TypeScript; O01–O03 are guidance and may describe newer releases. Keep domain/application/adapters/presentation separation rather than mechanically applying a different directory layout.

### Implementation sequence

1. Create a reviewed-file register and findings with location, evidence, impact, smallest repair and regression. Cover current shell, API/session, runtime renderer, studio, admin and shared records—not only new files.
2. Review standalone imports, injection context, OnPush/zoneless updates, state ownership, computed values, stable tracking and template complexity. Preserve consistency within existing files; avoid blanket naming migrations.
3. Review RxJS/signals bridges, cleanup, cancellation, polling, late results, route teardown and actor-generation fences. Do not share mutable command state across resources.
4. Inspect typed forms/custom controls for disabled/null behavior, exact numeric strings, patch semantics and validation. Use reactive forms where useful; do not replace the existing dynamic renderer or adopt newer Signal Forms simply for fashion.
5. Fix critical/high findings in focused changes, link others to owners and rerun affected browser tests. Measure rather than assume a signal/store/virtualization rewrite improves performance.

### Acceptance criteria

- All covered critical/high findings have tested repairs; unresolved ones block affected features rather than hiding behind an audit label.
- No new broad any/$any escape, disabled rule, unmanaged subscription or browser-side authority workaround is introduced.
- No major Angular/PrimeNG/NgRx migration is bundled into this review.

### Verification and required evidence

Use current unit and route suites plus focused regressions for each finding. A22/A23/A24 and mise run check. Include negative actor/route races, not only happy-path component snapshots.

### Data, compatibility, rollout and peer handoff

Review allowance covers identified scope; larger discoveries get suffix/linked tasks with revised estimates. Preserve existing layer boundary tests.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-003.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-004"></a>

## APP-FE-004 — Establish PrimeNG-first UI rules, tokens and reusable patterns

Priority: P1  
Status: DONE  
Verification: VERIFIED_LOCAL  
Area: frontend / M1  
Depends-On: APP-FE-001, APP-FE-002  
Related: UI-01–04; docs/UI-LIBRARIES.md; existing shared records design  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-004.md

### Goal

Make the application a coherent PrimeNG-first product, not an inconsistent mix of unrelated controls and generic developer forms.

### Context: preserve and extend

F05 currently allows Material, PrimeNG and native controls together. Retain installed libraries and the shared theme while recording PrimeNG-first as the new selection policy for touched business screens.

### Implementation sequence

1. Inventory controls and patterns per screen: inputs, selection, table/filter, toolbar, tabs, dialogs, confirmation, feedback, skeleton, status badge, detail and error presentation. Classify retain/migrate/approved exception.
2. Define semantic tokens, typography, density, spacing, contrast, focus, RTL and overlay behavior using pinned public APIs. Check actual root font/rem behavior; do not import current-version theme APIs unsupported by locked PrimeNG.
3. Build/reuse thin wrappers only where application behavior is shared: field label/error/help, searchable selector, table toolbar, confirmation and record summary. Avoid a new universal schema-form framework.
4. Use PrimeNG for new ordinary business controls; Tailwind handles layout; native/CDK/Material and Foblex remain justified exceptions for accessibility, canonical-value or specialist behavior. A custom exact-decimal control is preferable to lossy numeric conversion.
5. Create a small internal style/pattern showcase with light/dark/en/fa/loading/empty/invalid/disabled/focus contexts and visual regressions. Update UI-LIBRARIES.md with precise decisions and exceptions.

### Acceptance criteria

- Every inventoried business screen has a consistent pattern disposition; migration work is attached to its domain ticket.
- Tokens and common controls work across English/Farsi and light/dark without broad internal-DOM style overrides.
- Library installation alone is never the evidence that a screen is compliant.

### Verification and required evidence

Extend test:browser-ui and component tests; A23/A24. Verify keyboard focus restoration, validation links, 390px operational layout and cross-library overlays. mise run check.

### Data, compatibility, rollout and peer handoff

PrimeNG-first does not authorize paid packages, wholesale Material removal or vendor code copying. Chart/canvas libraries remain adapters with lock/license review.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-004.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-005"></a>

## APP-FE-005 — Complete typed API adapters and safe command/read coordination

Priority: P1  
Status: DONE  
Verification: VERIFIED_LOCAL  
Area: frontend / M1  
Depends-On: APP-FE-001, APP-FE-002, APP-BE-001  
Related: API-01–04; AUTH-01–03; existing command coordination  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-005.md

### Goal

Connect all included UI features to verified contracts with correct envelopes, current references, cancellation and uncertain-write recovery.

### Context: preserve and extend

F11 checks committed evidence but is not live compatibility. Preserve existing generated transport/session design and endpoint-specific envelope adapters rather than replacing them with a universal response assumption.

### Implementation sequence

1. Consume exact peer OpenAPI from APP-BE-001; regenerate reproducibly and retain provenance hashes. Audit JSON, page, plain-selector arrays, empty responses and binary/queued operation differences.
2. Create/reuse typed domain adapters for new C02–C13 features as their backend handoffs arrive. During design, fixtures are explicitly labeled; do not mark integration complete or expose unsupported actions.
3. Keep mutations serialized per resource, freeze operation keys and unchanged payloads, replace authoritative refs, and distinguish forbidden/stale/uncertain errors. Never automatically replay unsafe commands after refresh or timeout.
4. Fence all reads against actor/resource/context generation; clear sensitive state on logout. Do not place tokens, private form data or raw responses into localStorage.
5. Add contract compile/runtime fixtures for missing/null/false/zero values, 409, unexpected envelopes and drift. A generated-client change that breaks UI needs a mapped repair, not broad any casts.

### Acceptance criteria

- Every integrated adapter is bound to exact peer contract examples and its relevant route/action tests.
- An uncertain mutation offers reconciliation, not blind retry; fresh refs drive subsequent actions.
- Old actor responses cannot repopulate current UI or private caches.

### Verification and required evidence

Existing API/command/session suites plus contract-specific tests. A03/A12/A14/A15/A22/A24. mise run check, and actual HTTP smoke for completed adapters.

### Data, compatibility, rollout and peer handoff

C01–C14 producer handoffs are consumed incrementally; generated files are never hand-edited. Existing session camelCase fields remain compatible, while new backend JSON DTO names stay snake_case.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-005.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-006"></a>

## APP-FE-006 — Deliver reusable permission-aware resource pickers

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M1  
Depends-On: APP-FE-004, APP-FE-005, APP-BE-008  
Related: Existing selectors, shared forms/records primitives; STUDIO-09/10  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-006](../changes/APP-FE-006.md)

Implemented subset and remaining backend blockers are documented in the change record. Status remains BLOCKED; local verification does not satisfy the missing real-contract acceptance.

### Goal

Users select readable resources and exact versions everywhere instead of copying opaque refs or editing arrays of identifiers.

### Context: preserve and extend

Reuse existing paginated selector controls and C03. Do not create a separate picker implementation in each node inspector or administration form.

### Implementation sequence

1. Implement a typed picker adapter per resource kind with search, page navigation, selected summary, current key and context constraints. Keep labels distinct from keys and machine values.
2. Support selected item outside current page, multi-select where the domain allows it, version metadata, root/child scoping and an accessible clear action. Preserve restrictions when an unrelated field is edited.
3. Debounce/cancel reads, fence stale search/context responses and recheck eligibility before selection/save. Show empty, loading, forbidden, incompatible and unavailable states without exposing hidden titles.
4. Create lookup dialogs/drawers using shared PrimeNG patterns with focus restoration, keyboard operation, translated messages and RTL.
5. Replace manual ref inputs in the current JSON-removal inventory as owning feature tickets land; add fixtures for page-two and revoked selections.

### Acceptance criteria

- No normal flow requires typed ref_id entry; selected root/version identity is visible and correct.
- Out-of-page selections remain stable; context/locale changes do not reuse stale keys or broaden access.
- Deleting/revoking a selected object produces deliberate repair guidance, not silent substitution.

### Verification and required evidence

Picker unit/adapter tests and browser interaction fixtures; A02/A05/A06/A11/A23. Real selector HTTP test for representative identity/form/connection kinds; mise run check.

### Data, compatibility, rollout and peer handoff

C03 → all form/workflow/admin editors. Initial scope covers every kind in the API/UI matrix; unsupported kinds remain blocked, not arbitrary JSON fallback.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-006.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-007"></a>

## APP-FE-007 — Replace generic record dumps with domain summaries and typed editing patterns

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M1  
Depends-On: APP-FE-004, APP-FE-005, APP-FE-006  
Related: Existing records/users/studio catalogs; UI-02/04 and ADMIN/STUDIO detail polish  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-007](../changes/APP-FE-007.md)

Implemented subset and remaining backend blockers are documented in the change record. Status remains BLOCKED; local verification does not satisfy the missing real-contract acceptance.

### Goal

Ordinary list/detail/edit experiences show meaningful domain information rather than API payload dumps while preserving existing reusable CRUD behavior.

### Context: preserve and extend

F06/F12 describe existing list-first records and curated summaries. Extend them where incomplete; do not revert improved details to a schema-generated raw object view.

### Implementation sequence

1. Use APP-FE-001 inventory to classify every nested input/output by its domain owner. Establish semantic presenters for identity/status, dates, amounts, versions, references, assignments and before/after changes.
2. Keep list-first screens, applied filter/sort/paging, top-end create, named details and separate confirmed lifecycle actions. Dialogs retain input on validation/conflict and clear private state on actor change.
3. Replace normal JSON arrays/objects with explicit field groups, tables, chips, selected summaries or domain editor components. Retain expert diagnostics only behind an explicit advanced context and redaction policy.
4. Hide opaque refs/checksums unless specifically useful for support; never remove the actual current ref from command state. Display queued versus complete outcomes accurately.
5. Split .1 presenters/shared patterns, .2 studio catalog adoption, .3 operational/admin adoption; leave specialized node/identity/integration semantics to their owning later tasks rather than one giant generic form.

### Acceptance criteria

- Normal representative create/read/edit/report/history flows have readable fields and no raw JSON input/output requirement.
- Typed edits preserve unrelated fields/client restrictions and cannot erase hidden data from a round-trip.
- All states and confirmations follow common PrimeNG patterns without losing current CRUD/search conventions.

### Verification and required evidence

Extend test:browser-records/catalogs and source-focused specs. A02/A11/A23/A24; verify applied query, canceled edit, server errors and immutable publication. mise run check.

### Data, compatibility, rollout and peer handoff

APP-FE-016–032 own remaining domain-specific editors; APP-FE-033 closes the full no-JSON/API coverage matrix. Do not call this shared-pattern ticket total product completion.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-007.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-008"></a>

## APP-FE-008 — Build account profile, persisted themes and workspace settings

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M1  
Depends-On: APP-FE-004, APP-FE-005, APP-BE-007  
Related: AUTH-04; UI-03; current ColorScheme/session ownership  
Decisions: None  
Owner: Codex  
Estimate: 2–4 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-008](../changes/APP-FE-008.md)

Implemented subset and remaining backend blockers are documented in the change record. Status remains BLOCKED; local verification does not satisfy the missing real-contract acceptance.

### Goal

Users can change appearance, language, timezone and permitted profile details and see them persist safely.

### Context: preserve and extend

F05 documents the existing in-memory theme; F14 auth/security remains in the same-origin boundary. Reuse existing password/session/avatar surfaces where present.

### Implementation sequence

1. Implement profile/settings navigation with grouped typed controls from C02, not a JSON preference editor. Show effective defaults and saved state; keep privilege/security fields out of editable profile.
2. Load server preferences after actor bootstrap and apply theme/density/locale/timezone deterministically. On missing preference use documented app default; failed load does not borrow the previous actor’s settings.
3. Keep locale display distinct from canonical values. Calendar choices show only currently supported backend options; no false Jalali switch.
4. Save with current refs and preserve independent unsaved groups on validation/conflict. Make self reset explicit and limited to preferences, not business data. Integrate private avatar controls and existing security operations.
5. Verify account switch, refresh, reload, system color change, keyboard use and cross-session persistence. Avoid introducing persistent sensitive browser storage for a faster theme flash.

### Acceptance criteria

- A user’s settings survive reload/login and a second user does not inherit them.
- Invalid values/errors are field-level; stale changes remain recoverable.
- Security actions, avatar authorization and machine values are preserved.

### Verification and required evidence

Profile/settings unit tests plus actual-backend browser persistence case; A03/A22/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C02 → account and application shell. Initial appearance scope is approved presets/mode/density, not arbitrary user CSS or a theme design product.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-008.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-009"></a>

## APP-FE-009 — Add saved list views and reusable favorites navigation

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M1  
Depends-On: APP-FE-004, APP-FE-005, APP-FE-006, APP-BE-009  
Related: Existing personal metadata; FUTURE-01 overlapping query work  
Decisions: None  
Owner: Codex  
Estimate: 2–4 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-009](../changes/APP-FE-009.md)

Implemented subset and remaining backend blockers are documented in the change record. Status remains BLOCKED; local verification does not satisfy the missing real-contract acceptance.

### Goal

Users can save their useful applied queries and return to favorite resources while authorization and resource revisions continue to change.

### Context: preserve and extend

C04 and current list-first search/sort patterns. Reuse existing work-item favorite semantics and C03 links, rather than two independent flags.

### Implementation sequence

1. Add save/update/rename/delete/set-default controls to agreed list scopes. Snapshot applied query rather than a partially edited filter form; exclude page number/raw results.
2. Implement a favorites sidebar/list with readable authorized labels, kind/version context, reorder where supported, and no arbitrary href. Open through current link resolution.
3. Handle a saved view with removed fields via a repair dialog that preserves original intent; never silently remove restrictive filters or expose broadened results.
4. Clear private view/favorite state on logout; enforce bounded optimistic updates with authoritative reconciliation. Deleting/revoking a target removes it from normal favorites; offer safe generic cleanup where supported.
5. Keep sharing/team-owned saved views out of this slice; test locale changes without altering stored machine filter values.

### Acceptance criteria

- Applying a view restores columns/page size/filter/sort and yields the same authorized query meaning.
- A favorite survives revision changes but cannot access deleted/revoked data.
- Duplicate saves/default changes behave consistently across two tabs and users.

### Verification and required evidence

View serialization tests and real API/browser cases; A03/A05/A23. Cover query schema change, page-two record and race conflict. mise run check.

### Data, compatibility, rollout and peer handoff

C04/C03. Private saved search text must not enter browser telemetry or publicly shared test artifacts.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-009.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-010"></a>

## APP-FE-010 — Implement a simple multilingual Help list and per-user acknowledgments

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M1  
Depends-On: APP-FE-004, APP-FE-005, APP-BE-010  
Related: UI-03; user-approved simple help approach  
Decisions: None  
Owner: Codex  
Estimate: 1.5–3 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-010.md

Available frontend slice: Typed eleven-topic English/Farsi static catalog, permission-filtered Help page, contextual links, explicit open/dismiss/revisit/help-only reset, locale/revision identities and focus restoration. Status is explicitly session-only and clears on actor change; rendering the list alone never records a view.

Remaining blocker: C05 / APP-BE-010 now has a frozen wave-four handoff and focused backend evidence, but remains BLOCKED / IMPLEMENTED pending its full gate. Persisted self-only state, compatibility responses and paired seen/dismiss/reset acceptance await a verified producer and client reconciliation.

### Goal

Give users concise contextual help they can revisit, with a small seen/dismissed state table and no complex onboarding framework.

### Context: preserve and extend

C05. Frontend owns static content and translation keys; backend stores only state. Reuse existing localization/route authority and shared dialog/list components.

### Implementation sequence

1. Create a typed help manifest with stable keys/revisions, en/fa title/body, route/capability hints and ordering. Initial entries cover create request, review/correction, save/promote/publish, defaults, mappings, notifications, calendar, saved views and support reference.
2. Add an accessible Help page listing relevant topics and seen/unseen status. Add small contextual Help/empty-state hints at agreed screens; links use registered application routes.
3. Persist seen only when the user opens/acknowledges the content; implement dismiss, review again and explicit help-only reset. Track locale/revision as specified.
4. Validate complete translations and manifest metadata in the gate. New revision may appear new; do not hide a changed topic just because an old version was seen.
5. If state persistence is unavailable, show static help and a nonblocking state-save message. No CMS, walkthrough overlays, analytics tracking or runtime arbitrary HTML.

### Acceptance criteria

- Users can see all applicable topics, revisit any topic and reset their acknowledgments.
- English/Farsi content is present and readable; state belongs to the right user/locale/revision.
- Fetching/rendering the Help list alone does not mark topics seen and no help state grants business access.

### Verification and required evidence

Help manifest/schema/i18n tests and browser seen/dismiss/reset case; A03/A04/A23. mise run check.

### Data, compatibility, rollout and peer handoff

Generate allowed help metadata for APP-BE-010 release validation. This intentionally implements the small design requested by the user.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-010.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-011"></a>

## APP-FE-011 — Build setup/readiness and dependency repair screens

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-004, APP-FE-005, APP-FE-006, APP-BE-011, APP-BE-012  
Related: Existing studio diagnostics/definition library; ADMIN operational screens  
Decisions: None  
Owner: Codex  
Estimate: 2–4 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-011.md

Available frontend slice: PrimeNG readiness table with required-check aggregation, explicit unknown/blocked/non-applicable states and stale hints. Existing workflow graph validation feeds a structure-only panel; the scope notice separates graph validation from installation/provider/worker readiness. Existing issue controls retain their node/edge context and recheck calls the existing read-only validation command.

Remaining blocker: APP-BE-011/012 remain BLOCKED / NOT_RUN. C06 installation/definition readiness, authorized repair routes, server checked_at and full repair/revalidate acceptance are unavailable. No provider probe or invented installation result is performed.

### Goal

Administrators and designers can see why setup or publication is blocked and navigate to the correct repair screen without automatic privilege changes.

### Context: preserve and extend

C06; reuse current diagnostics pointers, selectors, catalogs and library tools. Checklist state is not an application lifecycle and green health is not provider execution proof.

### Implementation sequence

1. Create separate installation checklist and definition readiness panels with categories, last checked time, required/optional indicators and ready/blocked/unknown/not-applicable statuses.
2. Display safe localized reasons and authorized repair actions for seeds, roles/client release, published dependencies, connections, worker evidence and renderer compatibility.
3. Preserve selected definition/node/context when navigating to repair. Return and revalidate from the server; never assume the repair succeeded because a dialog closed.
4. Make active connection/worker tests explicit confirmed commands and label cost/side effects; no paid probe on page load. Deny detailed setup data to ordinary unauthorized users.
5. Integrate relevant help and empty states. No auto-grant, auto-publish, invented credentials or spoofed green check based on client-side presence.

### Acceptance criteria

- Each blocker has useful next steps or an explicit authorized-operator requirement, not raw JSON.
- Unknown required checks keep the overall checklist unready; stale results show their timestamp.
- Repair actions preserve context and cannot bypass backend authorization.

### Verification and required evidence

Checklist component tests and actual-backend missing-dependency/repair journey; A06/A12/A23. Test forbidden setup, stale plan, provider unknown and return navigation. mise run check.

### Data, compatibility, rollout and peer handoff

C06 consumers must use actual frozen route keys. Installation-ready, publishable and demo-ready are distinct labels.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-011.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-012"></a>

## APP-FE-012 — Implement the unified notification center and safe deep links

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-004, APP-FE-005, APP-FE-006, APP-BE-014  
Related: OPS-01; existing polling/session/notification APIs  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-012.md

Available frontend slice: Extended the existing notification inbox with applied read-status/subject filters and server-reported totals. The shell preview requests unread rows and uses the server total independently of page length. Opening a detail is read-only; explicit mark-read rereads the current mutation reference. Abort/generation fences and actor cleanup protect lists, details and polling.

Remaining blocker: APP-BE-014 remains BLOCKED / NOT_RUN; APP-BE-013 is map/design evidence only. C07 unified event taxonomy, MAP-01–14 coverage, per-event deep links and durable resolver binding remain incomplete. C03 has a frozen wave-four proposal, but its producer APP-BE-008 remains BLOCKED / IMPLEMENTED. Current links continue using existing fixed Angular routes and current detail refs.

### Goal

Users see one understandable inbox for relevant application events and open the correct current resource across login and permission changes.

### Context: preserve and extend

C07 notification map and C03 stable links; extend existing notification/polling services, do not add a parallel browser event engine or unbounded websocket subscription.

### Implementation sequence

1. Build a localized inbox with unread count, paging, filters, meaningful subject/preview/time/severity and explicit mark-read. Separate provider delivery details into authorized diagnostics.
2. Add one route-key registry and `/open/{link_key}` resolver flow after the server contract exists. Preserve safe return navigation through login; resolve current refs and recheck permissions before opening.
3. Support all MAP-01–MAP-14 included destinations, including correction, AI tool approval, report, calendar and support incident. Notification read does not claim, approve or retry the target.
4. Use bounded polling with visibility/backoff/actor cleanup and coordinate counts after reads or source updates. Do not derive global unread totals from a truncated page.
5. Handle expired/redacted/deleted/forbidden targets with a safe unavailable message and appropriate navigation; never trust arbitrary URLs in notification content. Test both legacy case notices and new generalized inbox records.

### Acceptance criteria

- The notification map’s expected recipients and destinations work in real browser scenarios with en/fa display.
- Opening a link after a target revision change succeeds with current refs; revoked/deleted access does not leak titles.
- Duplicate event delivery does not create duplicate notices, and logout stops polling/private state.

### Verification and required evidence

Existing notifications/polling specs plus MAP contract and actual API/browser tests; A07/A19/A22/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C07/C03 → shell and all destination screens. No push/SMS/calendar external sync promise; channels must be explicitly supported and verified.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-012.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-013"></a>

## APP-FE-013 — Show support references and record safe client failures

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M1  
Depends-On: APP-FE-004, APP-FE-005, APP-BE-015  
Related: Existing safe errors/request IDs; ADMIN-08  
Decisions: None  
Owner: Codex  
Estimate: 2–4 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-013.md

Available frontend slice: Request errors classify field validation, forbidden, stale, uncertain and technical failures. Notices show/copy only bounded returned machine codes and request references, with separate copy feedback and safe actionable text. Actor cleanup and asynchronous notice identity checks prevent an old result from updating a new notice. No arbitrary body, stack or form field value is included.

Remaining blocker: APP-BE-015 remains BLOCKED / NOT_RUN and C08 intake/incident contracts are absent. Bounded global client-error reporting, durable incident storage, deduplication/rate limits and operator incident screens are unimplemented. A returned request correlation reference is never described as a stored support incident.

### Goal

Users can understand a technical failure and give support a useful reference without seeing or transmitting confidential data.

### Context: preserve and extend

C08 and existing error/envelope adapters. Preserve normal validation/conflict feedback; not every failed request is a support incident.

### Implementation sequence

1. Map existing errors into field validation, forbidden, stale, uncertain and technical-failure presentations. Include a copyable safe support/correlation reference only when returned/generated by the approved contract.
2. Add a bounded client failure reporter for approved screen/build/error codes where server traces cannot capture the issue. Never send full response bodies, input values, URL query secrets, arbitrary exception messages or stacks.
3. Build an authorized support failure list/detail with category, occurrences, timestamps, safe linked context, acknowledgment/resolution and execution evidence. Preserve current refs and audit confirmations.
4. Handle diagnostics-store outage without recursive reporting or endless retries. Say local correlation only when a durable record was not confirmed.
5. Link help and approved recovery destinations; a Retry button exists only when the domain contract says it is safe. Preserve unsaved input after failures where allowed.

### Acceptance criteria

- A technical failure yields an understandable message and traceable reference; recorded data passes redaction tests.
- Support actions are permission-aware; ordinary users cannot enumerate global incidents.
- Diagnostics failure does not produce another endless diagnostics failure or unsafe business replay.

### Verification and required evidence

Error/reporting specs, network payload assertions and support UI browser case; A20/A22/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C08 → operational support. Private screenshots or payloads are never attached automatically.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-013.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-014"></a>

## APP-FE-014 — Deliver the operational calendar and event/reminder experience

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M4  
Depends-On: APP-FE-004, APP-FE-005, APP-FE-006, APP-FE-008, APP-BE-016, APP-BE-017  
Related: Existing localization/pickers; new domain calendar scope  
Decisions: D03 for Jalali extension; D05 for supported device profile  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-014.md

Available frontend slice: Reusable accessible agenda/week/month presentation from the same immutable projection, explicit loading/failure/empty/stale states, timezone captions, Gregorian labels in English/Farsi/Arabic and read-only workflow deadlines. Half-open date windows are bounded to 93 days; all-day dates remain civil dates with exclusive ends; timed instants retain microsecond ordering, valid IANA zones and explicit DST gap/fold handling. Actor reset invalidates old projections.

Remaining blocker: APP-BE-016/017 remain BLOCKED / NOT_RUN; C09 events/reminder APIs are absent. The component is not exposed as a working business calendar. Server list/range binding, navigation to workflow resources, personal event editor/CRUD/conflicts, reminder worker outcomes and two-tab real-service acceptance remain unimplemented. C02 timezone persistence and C03 links await verified producer reconciliation. D03 remains Gregorian; no Jalali claim is made.

### Goal

Users can see their events and workflow deadlines, manage permitted events and open related work through an accessible calendar.

### Context: preserve and extend

C09; the backend currently supports Gregorian canonical dates, not automatic Jalali conversion. Choose a pinned compatible calendar adapter or an accessible owned agenda; library adoption requires a short capability/license check.

### Implementation sequence

1. Implement agenda/month/week views and a bounded date-range adapter. Keep the agenda as an accessible alternative; show loading, empty, failed and partially stale results distinctly.
2. Create typed event create/edit/detail dialogs with timed/all-day distinction, timezone, permitted team participants and explicit one-off reminders. Use server validation for ownership and DST issues.
3. Render workflow-derived due items as linked read-only projections; disable drag/edit actions unless a specific domain deadline-change command exists. Visual movement cannot mutate workflow state.
4. Integrate preferences, localized formatting, translated controls, keyboard focus and RTL. Do not advertise a Jalali picker until D03 has implemented and tested both parsing and serialization.
5. Test edits/cancellation after reminder scheduling, range pagination, overlapping/multi-day events, inaccessible targets and open-work deep links. Split .1 agenda/data, .2 visual views/editor, .3 reminders/interaction acceptance.

### Acceptance criteria

- Agenda/month/week agree on the same authorized data and range boundaries.
- All-day and timed events round-trip without timezone date shifts; obsolete reminders are absent.
- Derived deadlines cannot be changed by unsupported UI actions; accessibility and RTL are verified.

### Verification and required evidence

Calendar date adapter/unit tests and real backend browser flows; A08/A07/A23. Include UTC+04 and DST zone fixtures, midnight boundaries and all-day exclusive end. mise run check.

### Data, compatibility, rollout and peer handoff

C09 → notifications/preferences/resource links. Recurrence, external sync, holidays and Jalali are not quietly implemented as incomplete toggles.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-014.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-015"></a>

## APP-FE-015 — Implement real dashboards with metric drill-down and accessible tables

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M4  
Depends-On: APP-FE-004, APP-FE-005, APP-FE-009, APP-BE-018  
Related: Existing reporting/My Reports and operational shell  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: ../changes/APP-FE-015.md

Implementation note: available frontend slice delivered; remaining acceptance and explicit blockers are recorded in docs/changes/APP-FE-015.md. Local fixture results do not establish integrated completion.

### Goal

Home and Insights display reliable authorized metrics backed by the application, not static demonstration numbers.

### Context: preserve and extend

C10 and existing reporting/UI patterns. Keep chart-library details behind a presentation adapter and verify licensing/pinned compatibility; no automatic paid dependency.

### Implementation sequence

1. Create a small chart adapter and standard cards with title, unit, date range, filter, as-of/freshness, empty/error state and tabular alternative. Use metric catalog rather than arbitrary backend query inputs.
2. Build initial home/work/requests/integration metric views with consistent date/locale/timezone filters. Preserve exact values/units and show unknown or unavailable instead of zero.
3. Implement server-authorized drill-down to existing lists using the returned descriptor; preserve applied filters and saved-view behavior without dropping restrictions.
4. Coordinate refresh after relevant mutations and bounded polling. Do not compute total metrics from loaded pages or share cached series across users.
5. Test zero data, denied dimensions, stale data, mixed currency, failed service and mobile/RTL chart labels. Keep full BI/dashboard layout designer out of scope.

### Acceptance criteria

- Chart totals match the controlled data and drill-down lists, including dates and deletion policy.
- Users cannot view unauthorized aggregate series or infer them through cached filters.
- Every chart has readable labels/units and an accessible table, and reflects real case changes.

### Verification and required evidence

Metric adapter/component tests and actual-backend browser changes; A09/A05/A23. Verify chart resize/teardown and zero/unavailable differences; mise run check.

### Data, compatibility, rollout and peer handoff

C10. Proposed chart library/performance acceptance is D05/lock review, not a commitment to vendor API removal or license status.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-015.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-016"></a>

## APP-FE-016 — Create a visual form-layout editor for the existing primitive set

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-004, APP-FE-006, APP-FE-007, APP-BE-019  
Related: STUDIO-01/02; current form-authoring domain and renderer  
Decisions: None  
Owner: Codex  
Estimate: 5–8 person-days; confidence low-to-medium before intake  
Change-Record: ../changes/APP-FE-016.md

Implementation note: available frontend slice delivered; remaining acceptance and explicit blockers are recorded in docs/changes/APP-FE-016.md. Local fixture results do not establish integrated completion.

### Goal

Designers can compose and rearrange the twenty supported form primitives without editing render-schema JSON.

### Context: preserve and extend

F08/F10 define the current code-owned palette/outline; reuse add/replace/reorder helpers and shared preview. Do not invent a new form document dialect or replace the runtime renderer.

### Implementation sequence

1. Create a searchable categorized palette and visual/outline selection for all twenty kinds in C11. Offer drag/drop plus keyboard add/move/remove equivalents, parent constraints and current selection.
2. Separate stable canonical field key from localized label; validate names and collection scopes using the actual contract. Generate only accepted structures, preserving unknown untouched metadata.
3. Provide layout properties for vertical/horizontal/grid, nesting and responsive presentation supported by the backend. Maintain bounded undo/redo and dirty-state behavior.
4. Implement dedicated add/duplicate/delete/reorder actions with stable identity semantics and confirmation for destructive schema effects. Do not use array index as persistent row or graph identity.
5. Split .1 layout/outline and basic scalars, .2 collection/media/action primitives, .3 round-trip/keyboard/preview conformance. JSON remains optional expert inspection, never a required normal editor.

### Acceptance criteria

- Every baseline palette kind has an accessible visual placement/edit entry and a valid round-trip fixture.
- A designer builds the reference form layout without JSON or manual references.
- Published forms remain read-only and failed/stale saves preserve local edits safely.

### Verification and required evidence

Form-authoring domain and component tests plus browser build/save/reopen journey; A10/A12/A23. Pair with backend metadata and actual save; mise run check.

### Data, compatibility, rollout and peer handoff

C11 → APP-FE-017–019. Parent task exceeds one small patch; implement numbered slices sequentially with focused acceptance and preserve existing APIs.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-016.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-017"></a>

## APP-FE-017 — Build typed field, collection, attachment and validation inspectors

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-016, APP-BE-020  
Related: STUDIO-02; FORM-02/03/06/07  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: ../changes/APP-FE-017.md

Implementation note: available frontend slice delivered; remaining acceptance and explicit blockers are recorded in docs/changes/APP-FE-017.md. Local fixture results do not establish integrated completion.

### Goal

Designers configure field rules and complex values through explicit controls, and the runtime preserves canonical values and private data.

### Context: preserve and extend

Reuse current field/row/attachment domain utilities and C11; previous hidden-field patch/projection fixes are not new work to redo.

### Implementation sequence

1. Implement type-specific inspectors for labels, required/nullable, numeric/text constraints, dates, choices, user/group selectors, display/action semantics and attachment rules as actually supported.
2. For repeaters/tables, provide row structure, stable child field scopes and supported row operations. Prevent field rename/removal from silently breaking bindings; show impact and confirm an explicit change.
3. Preserve exact numeric string handling, false/0/empty/null/omission and typed choice keys. Do not bind all values through Number() or automatically drop disabled control data from a patch.
4. Map backend validation pointers to deepest matching field/row and retain invalid edits. Hidden writable scope and private attachment behavior stay server-authorized.
5. Round-trip untouched properties and unknown supported metadata; expert JSON edits require validation before applying and never become the standard route.

### Acceptance criteria

- All applicable primitive properties are configurable without a raw JSON inspector.
- Collection reorder/validation/attachment controls preserve stable identities and authorized data.
- Runtime/preview outcomes match backend conformance fixtures exactly, including edge-value semantics.

### Verification and required evidence

Property editor/codec tests plus actual form save/runtime/correction browser tests; A10/A14/A15/A19. Split .1 scalar, .2 collections/media, .3 pointer/canonical regression. mise run check.

### Data, compatibility, rollout and peer handoff

C11; no schema designer capable of arbitrary unsupported JSON Schema features is implied. Explicit unsupported cases block publication instead of becoming lossy fields.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-017.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-018"></a>

## APP-FE-018 — Deliver behavior, dynamic options and constrained expression editing

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-016, APP-FE-017, APP-FE-006, APP-BE-019, APP-BE-020  
Related: STUDIO-03; FORM-04/05/08; existing expression/option APIs  
Decisions: None  
Owner: Codex  
Estimate: 5–8 person-days; confidence low-to-medium before intake  
Change-Record: ../changes/APP-FE-018.md

Implementation note: available frontend slice delivered; remaining acceptance and explicit blockers are recorded in docs/changes/APP-FE-018.md. Local fixture results do not establish integrated completion.

### Goal

Designers configure supported visibility, requiredness, calculations, options and navigation without writing whole JSON documents or executing browser JavaScript.

### Context: preserve and extend

Reuse backend expression language, field inventory, option-source selectors, completion and preview. Do not build a second expression evaluator with subtly different semantics.

### Implementation sequence

1. Inventory the exact supported behavior clauses and expression operators. Provide rule rows, field/source selection, operator/value controls and a constrained expression editor for the advanced expression language.
2. Implement dynamic-option configuration with authorized source/context, selected-key resolution, dependencies, paging and cancellation. Changing a parent input must invalidate dependent options safely.
3. Add calculation and override policies supported by backend with clear read-only/override labels; malicious user edits to calculated values must still be server-rejected.
4. Provide navigation/page rules using existing supported contracts, and compile/preview diagnostics mapped to the rule/control. Unsupported behavior cannot silently evaluate to false or become arbitrary code.
5. Split .1 conditions, .2 options/calculations, .3 navigation/preview. Retain unsaved buffers and schema-owned properties across edits; actor changes clear private synthetic context.

### Acceptance criteria

- Reference visibility/options/calculation/page behavior can be configured and previewed without raw JSON.
- Canonical data and authorization are unchanged by display-only rules; stale async options never overwrite new context.
- Invalid expressions provide localized diagnostics and no authored input executes as JavaScript.

### Verification and required evidence

Expression/rule codec/option adapter tests plus actual preview/runtime browser journey; A10/A11/A14/A15/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C11 → backend authoritative compile/evaluate APIs. Do not add arbitrary remote URLs for option sources or unsupported general scripting.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-018.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-019"></a>

## APP-FE-019 — Finish localized pages, views and shared-runtime preview

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-016, APP-FE-017, APP-FE-018  
Related: STUDIO-03; UI-03; FORM-08; current simulated preview  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: ../changes/APP-FE-019.md

Implementation note: available frontend slice delivered; remaining acceptance and explicit blockers are recorded in docs/changes/APP-FE-019.md. Local fixture results do not establish integrated completion.

### Goal

Authors manage English/Farsi text, multipage layouts and declared views with a trustworthy preview of the same runtime renderer.

### Context: preserve and extend

F06 current preview already uses /forms/runtime-preview and is explicitly simulated. Preserve that boundary and improve authoring controls rather than adding another renderer.

### Implementation sequence

1. Provide a translation table/editor for labels, help, options, actions and messages with language coverage and source revision. Do not translate canonical field keys or outcome codes.
2. Build page/view editors for declared edit/summary/print/correction contexts using supported backend view/policy definitions. Distinguish synthetic role policy from actual requester permissions.
3. Preview locale, view purpose, synthetic data and allowed policy via the server runtime-preview contract. Offer typed sample-data controls and relevant seeded examples instead of requiring sample JSON.
4. Show unknown dialect/unsupported primitive/invalid policy as compatibility errors, not a partially rendered misleading form. Simulated preview must not upload real files or execute live workflows.
5. Verify focus, navigation, print, validation and RTL behavior, preserving exact data on locale switches. Missing translations in required scope fail the gate.

### Acceptance criteria

- A designer can author complete en/fa pages/views and see the same behavior as authorized runtime fixtures.
- Preview clearly distinguishes simulated context from actual authorization and effects.
- Locale/view changes do not lose canonical values, refs or pending author edits.

### Verification and required evidence

Localization/page/view model tests and server-backed preview/browser case; A10/A11/A23. mise run check with translation manifest validation.

### Data, compatibility, rollout and peer handoff

C11; current Gregorian support remains explicit. This is not adoption of the proposed form-package-v2 document.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-019.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-020"></a>

## APP-FE-020 — Upgrade the existing canvas interaction and navigation experience

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-004, APP-FE-005, APP-FE-006  
Related: STUDIO-04/06; current Foblex adapter  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: ../changes/APP-FE-020.md

Implementation note: available frontend slice delivered; remaining acceptance and explicit blockers are recorded in docs/changes/APP-FE-020.md. Local fixture results do not establish integrated completion.

### Goal

A designer can comfortably build, navigate and edit substantial workflows using the current owned graph models and a polished canvas.

### Context: preserve and extend

F09 already implements Foblex placement/pan/zoom/keyboard/read-only behavior. F05 records adapter isolation; extend it first rather than replacing libraries before measuring a real gap.

### Implementation sequence

1. Create a capability matrix against the requested interaction list: categorized/searchable palette, drag/place, multi-select, move, connect/reconnect/delete, duplicate, undo/redo, fit/zoom, find node and keyboard equivalents.
2. Implement missing interactions in the adapter with stable node/control/data-edge identities and bounded history. Duplication rewrites internal keys/references while preserving only supported config; validate external dependency bindings.
3. Add compact node summaries, distinct control/data connections, selected/invalid/read-only states and inspector navigation. Keep full details out of every node body to preserve readability.
4. Preserve layout/WIP/executable separation and dirty state; pan/zoom on a read-only diagram is local only. Reject unsupported semantic actions instead of drawing nodes the backend cannot execute.
5. Measure 25/100/250-node fixtures and record keyboard/RTL behavior. Split .1 interaction model, .2 adapter features, .3 browser/performance. Only propose a library switch with a measured blocking gap and migration/licensing plan.

### Acceptance criteria

- All committed interactions work by pointer and required keyboard alternatives without losing graph data or layout.
- Control/data identities stay distinct; undo/redo and duplicate preserve valid internal references.
- Read-only and published diagrams cannot mutate definitions; unavailable backend capabilities are not advertised as executable.

### Verification and required evidence

Canvas domain/adapter tests plus existing test:browser-canvas extended; A11/A12/A23. Real workspace save/reopen through the peer is required after related lifecycle work. mise run check.

### Data, compatibility, rollout and peer handoff

C11/C13. n8n is an interaction benchmark, not a source of copied code, credentials model or backend semantics.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-020.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-021"></a>

## APP-FE-021 — Build a typed node-inspector system with complete item details

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-020, APP-FE-006, APP-FE-007, APP-BE-019  
Related: STUDIO-07; existing selected-node JSON inspector  
Decisions: None  
Owner: Codex  
Estimate: 4–6 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-021.md

Available frontend slice implemented; full parent acceptance remains BLOCKED. Per-handler coverage, remaining frontend work, fixture evidence and peer limits: docs/delivery/NODE-INSPECTOR-COVERAGE.md and the change record.

### Goal

Every shipped node can be understood and configured through purpose-built typed controls rather than a large selectedJson textarea.

### Context: preserve and extend

F07 JSON inspector is the concrete replacement target. Reuse the existing graph/domain models and generated authoring metadata; preserve fields the current editor does not own.

### Implementation sequence

1. Create an inspector registry keyed by registered handler/type version, with common identity/version/description/readiness sections and typed domain-specific parameter sections.
2. Render scalar/enumerated/conditional configuration fields from validated metadata using approved controls; reference-bearing fields use C03 pickers. Secrets are connection references, never raw secret input embedded in graphs.
3. Implement visible input/output port schemas, supported outcomes, requirements and help. Show required/missing/incompatible values near the control and jump from diagnostics to node/field.
4. Keep edits in a typed draft model, preserve unknown untouched supported properties and reject unsupported schemas with an explicit compatibility state. An expert panel is optional and cannot satisfy standard support.
5. Round-trip configuration for every registered shipped node version; dedicated human/mapping/branch/AI/service inspectors come in their linked tasks. Record every uncovered type in the coverage matrix.

### Acceptance criteria

- Selecting a node reveals its purpose, version, inputs, outputs, configuration and problems without raw payload dumps.
- Normal common configuration is editable without JSON, and untouched properties survive save/reopen.
- Unknown/incompatible node metadata cannot be silently discarded or published with guessed defaults.

### Verification and required evidence

Inspector codec/registry/component tests plus real save/reopen fixtures; A11/A12/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C11 → APP-FE-022–026. This is a small typed inspector architecture, not a new generic low-code renderer for arbitrary OpenAPI.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-021.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-022"></a>

## APP-FE-022 — Deliver human-task, assignment, view and approval inspectors

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-021, APP-FE-006, APP-FE-019, APP-BE-021  
Related: STUDIO-07; TASK-02–05; human task contracts  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-022.md

Available frontend slice implemented; full parent acceptance remains BLOCKED. Per-handler coverage, remaining frontend work, fixture evidence and peer limits: docs/delivery/NODE-INSPECTOR-COVERAGE.md and the change record.

### Goal

Designers configure legitimate human work and required approval without editing policy JSON or copying form/user/group references.

### Context: preserve and extend

Reuse actual HumanTaskContract, candidate targets, field policy, published-form selectors and C12 approval semantics. Do not invent approve/reject/return transitions absent from the declared contract.

### Implementation sequence

1. Add published form/version selection with compatible form settings and explicit pinned identity. Candidate user/group selection uses current eligibility and clear distinction between groups and permissions.
2. Build field visibility/write/required scope controls, named views, default view and purpose. Use the authorized schema and maintain collection scopes; do not widen hidden access for preview convenience.
3. Create action rows for the actual supported complete/reject/return outcomes, localized labels, comment requirements and required scopes. Display the matching outgoing transitions and missing-route diagnostics.
4. Represent protected-business approval requirements distinctly from generic human completion and AI read-only tool approval. Show correction effects on prior approval and backend readiness blockers.
5. Split .1 form/candidates, .2 views/field policy/actions, .3 required-approval/round-trip. Verify through a real ordinary reviewer, not only synthetic form preview.

### Acceptance criteria

- A designer builds approve/reject/correction work without JSON/manual refs; the correct eligible reviewer receives it.
- Required approval cannot be bypassed by UI configuration or an AI tool approval.
- Hidden fields, empty candidates, stale selected resources and missing transitions produce safe actionable errors.

### Verification and required evidence

Human-task editor unit tests and real create/publish/claim/complete/return browser cases; A11/A15/A16/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C11/C12 → reference workflow. Quorum, self-approval restrictions and delegation extensions require explicit business rules rather than silent UI assumptions.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-022.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-023"></a>

## APP-FE-023 — Implement visual data mapping with typed sources and destinations

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-021, APP-FE-006, APP-BE-019  
Related: STUDIO-07; existing separate bindings/transitions and designer completion  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-023.md

Available frontend slice implemented; full parent acceptance remains BLOCKED. Per-handler coverage, remaining frontend work, fixture evidence and peer limits: docs/delivery/NODE-INSPECTOR-COVERAGE.md and the change record.

### Goal

Designers link the actual available data to step inputs through readable mapping controls and precise compatibility feedback.

### Context: preserve and extend

Reuse backend field inventory/completion, typed ports and transforms. O05 is interaction inspiration only; source availability must follow this backend’s prior-output and permission rules.

### Implementation sequence

1. Provide a source tree for request fields, allowed prior step outputs, supported context and constants, plus typed target ports/fields and existing cardinality rules.
2. Support click/keyboard and drag mapping where suitable, explicit typed constants, nested paths, collection/ordinal behavior and supported conversions. Show source and target type/schema summaries.
3. Represent mappings separately from control-flow edges and maintain stable selection/identity on edits. Changing/removing a node or field must show affected mappings and require deliberate repair.
4. Validate via server graph/type checks and point to expected versus actual types; local hints cannot overrule server acceptance. Future-step or hidden data is not offered as a source.
5. Add authorized sample previews with redacted values and clearly labeled synthetic examples. No automatic extraction of full private execution payloads into the editor.

### Acceptance criteria

- The reference workflow can map all required data without JSON or manually typed opaque refs.
- Invalid paths, incompatible types, inaccessible sources and ambiguous collection mapping produce targeted diagnostics.
- Round-trip preserves exact canonical constants and bindings; control edges are unaffected by mapping edits.

### Verification and required evidence

Mapping codec/type/interaction tests and real graph validate/save/reopen scenario; A11/A12/A16. Split .1 scalar sources, .2 nested/collection/conversions, .3 diagnostics/fixtures. mise run check.

### Data, compatibility, rollout and peer handoff

C11. Do not implement arbitrary JavaScript transforms or visually accept mappings rejected by publication.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-023.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-024"></a>

## APP-FE-024 — Provide branch, timer, event and subprocess configuration

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-021, APP-FE-023, APP-FE-006, APP-BE-019, APP-BE-012  
Related: STUDIO-07/08/09; existing split/join/bounded loops/subprocess  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-024.md

Available frontend slice implemented; full parent acceptance remains BLOCKED. Per-handler coverage, remaining frontend work, fixture evidence and peer limits: docs/delivery/NODE-INSPECTOR-COVERAGE.md and the change record.

### Goal

Make advanced supported workflow semantics understandable and configurable without hand-editing graph JSON.

### Context: preserve and extend

B10/B11 own graph correctness. Read actual registered handler configuration and existing process support before exposing any feature; a diagram shape is not proof a transition is implemented.

### Implementation sequence

1. Build transition condition/outcome/default/priority controls with clear evaluation order and server expression completion. Represent actual else behavior; do not invent multiple default edges.
2. Expose supported split/join settings and branch requirements, with readable branch labels and server diagnostics. Distinguish parallel paths from multiple exclusive conditions.
3. Add bounded loop and actual timer/event-wait settings only where the backend contract supports them. Present timezone/duration/correlation values explicitly and never treat an event wait as an arbitrary webhook URL.
4. Provide authorized subprocess version selection, interface input/output mapping and dependency summary; preserve exact pins and show read-only navigation into the child.
5. Split .1 transitions/conditions, .2 branches/waits, .3 subprocesses. Offer a clear unsupported state for semantics outside the current engine, not a nonfunctional toggle.

### Acceptance criteria

- A designer can configure the reference branches, timer/event wait and pinned child approval without JSON.
- The UI explains defaults/join behavior and points to invalid branches or mappings.
- Child versions and active execution pins do not silently change when successors publish.

### Verification and required evidence

Branch/subprocess codecs plus actual graph publish/execute browser/HTTP cases; A11/A12/A17. mise run check.

### Data, compatibility, rollout and peer handoff

C11/C06 → publication readiness. This is not a BPMN-import/export or full n8n semantics promise.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-024.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-025"></a>

## APP-FE-025 — Create AI and integration node editors with governed connections

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-021, APP-FE-023, APP-FE-006, APP-BE-022, APP-BE-023, APP-BE-025  
Related: STUDIO-07; ADMIN-04/05; TASK-07  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: docs/changes/APP-FE-025.md

Available frontend slice implemented; full parent acceptance remains BLOCKED. Per-handler coverage, remaining frontend work, fixture evidence and peer limits: docs/delivery/NODE-INSPECTOR-COVERAGE.md and the change record.

### Goal

Authors configure approved agents and actual business operations with clear inputs, outputs, authority and side effects.

### Context: preserve and extend

C11/C12 and existing AI/provider/connection catalogs; keep new node editing separate from administrative credential setup while linking to it safely.

### Implementation sequence

1. Build service-node operation/version selector, compatible connection picker, typed input mapping and receipt/output summary. Show whether an operation is diagnostic, read-only, state-changing, retry-safe or reconcile-first.
2. Build AI-node agent/version selection, allowed input projection, output choices, human-review requirements, budget/latency context and optional approved tool configuration.
3. Display configuration/secret-resolution/live-verification distinctions; do not show “connected” merely because a secret exists. Never store credentials in graph state, browser persistence or history.
4. Validate required human next/review routes and missing approval policy using server diagnostics. Human tool approval is explicitly labeled a lookup authorization, not a business decision.
5. Split .1 service operation inspector, .2 AI inspector, .3 actual sandbox/typed outputs. Label deterministic AI and local sandbox test mode visibly; live vendor/provider badges require evidence.

### Acceptance criteria

- Reference service and AI nodes are fully configurable without JSON and only approved versions/connections are selectable.
- Data/credentials remain within granted scopes and required human approval is visible and enforced server-side.
- Users understand queued, unknown, verified and completed states without misleading success indicators.

### Verification and required evidence

Node editor tests plus real publish/dispatch/receipt/human-approval browser journey; A11/A16/A18/A26. mise run check; paid/live provider checks explicit.

### Data, compatibility, rollout and peer handoff

C12 → APP-FE-026/030. No arbitrary URL/SQL/tool input and no automatic live provider test on selecting a node.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-025.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-026"></a>

## APP-FE-026 — Add safe testing, structured execution details and canvas run overlays

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-020, APP-FE-021, APP-FE-023, APP-FE-025, APP-BE-024, APP-BE-028  
Related: PROC-01; existing process timeline; STUDIO preview and diagnostics  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-026](../changes/APP-FE-026.md)

### Goal

Designers and authorized operators can inspect what a node received/produced and why a run stopped, without leaking data or blindly executing effects.

### Context: preserve and extend

Reuse actual process/timeline/budget/receipt APIs and C12. Form runtime preview is simulated; it must not be relabeled as full workflow execution.

### Implementation sequence

1. Design a selected-node workspace with input/context, parameters and output/diagnostics panels. Structured object/tree/table presenters expose only authorized fields; expert JSON is optional and redacted.
2. Provide synthetic input editing and pure transform/expression preview where actual contracts support it. For side-effect tests, require explicit safe sandbox context, confirmation and operation identity.
3. Add execution overlay to read-only diagrams showing actual active positions/attempts/waits/errors and navigation into timelines/child runs. Multiple active branches must be visible; do not collapse them into one current node.
4. Expose actual retry/reconcile/compensate actions only for permitted states and authority. A timeout/lost response becomes an uncertain state with inspection, not an automatic Execute again.
5. Fence responses by actor/run/definition version, lazy load detail, bound payload rendering and clear history on teardown. Split .1 inspectors, .2 preview/test safety, .3 real-run overlay.

### Acceptance criteria

- A user can understand a failed/unknown node and follow safe next steps without reading raw API dumps.
- Execute/test cannot create an unapproved business effect or replay an uncertain non-idempotent action.
- Pinned workflow version, active branches and authorized results match the backend timeline.

### Verification and required evidence

Execution projection/permission tests and actual worker/sandbox browser cases; A16/A17/A18/A20/A22/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C12/C14. A missing single-node test endpoint remains a visible unsupported capability/backend task, not a fake frontend execution implementation.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-026.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-027"></a>

## APP-FE-027 — Complete publication, comparisons and safe workflow default restoration

Priority: P0  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M2  
Depends-On: APP-FE-021, APP-FE-024, APP-FE-011, APP-BE-026  
Related: STUDIO-05/08/09; existing WIP/promote/publish lifecycle  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-027](../changes/APP-FE-027.md)

### Goal

Designers understand editing versus execution and can return to an approved default without accidentally changing active cases.

### Context: preserve and extend

F06/B09 already implement save workspace, validate, explicit promote and publish. Improve the journey without collapsing their independent refs/state or replacing library version tools.

### Implementation sequence

1. Add a publication review summarizing saved WIP, validation, promoted graph checksum/version intent and dependency readiness. Keep separate buttons/states and required confirmations.
2. Provide readable definition/version comparison and immutable/published labels. When selection changes, protect unsaved edits and never replace the authoritative graph with unpromoted workspace content.
3. Implement C13 default preview with named baseline/version, structured diff, target mode, dependency bindings and impact statement. Frozen plan changes invalidate approval; no free-form reset JSON.
4. Apply the reviewed plan explicitly, refresh refs and show the new/replaced DRAFT. Do not auto-publish, retarget request types, clear active cases or reset credentials. Separate local discard, layout reset and definition restore controls.
5. Handle no-associated-default, forbidden dependency, stale plan, concurrent editor and repeated command results while preserving recoverable local edits.

### Acceptance criteria

- Save/validate/promote/publish are understandable and preserve existing backend invariants.
- Default restoration of a published version yields a new draft; existing cases visibly keep their old version.
- No reset or publication depends on copied refs/JSON; changed plans and competing edits are safely reconciled.

### Verification and required evidence

Lifecycle/default-plan component tests and real two-editor/default-restore browser journey; A12/A13/A25. mise run check.

### Data, compatibility, rollout and peer handoff

C13 → demonstration harness. This screen must not expose destructive environment reset to ordinary users.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-027.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-028"></a>

## APP-FE-028 — Finish requester-facing creation, private draft and outcome details

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-005, APP-FE-006, APP-FE-007, APP-BE-020, APP-BE-027  
Related: REQ-01–05; FORM-01–08; PROC-01  
Decisions: None  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-028](../changes/APP-FE-028.md)

### Goal

An ordinary requester can submit and understand a real case without management rights, JSON payloads or manual backend repair.

### Context: preserve and extend

F02 records the existing requester/runtime work as implemented locally. Retain eligible discovery, pinned drafts, save-before-submit, command keys and real process navigation; fill only gaps from the inventory.

### Implementation sequence

1. Review eligible request catalog, draft creation, form runtime, row/attachment controls, save/reopen, review-before-submit, submit and cancellation against actual contracts.
2. Improve detail hierarchy: business summary, current outcome/status, relevant active work, attachments, timeline, versions and allowed actions. Do not infer final approval from process terminal status.
3. Use shared runtime controls and field errors; preserve hidden/omitted values and exact numeric strings. Provide loading/empty/forbidden/stale/uncertain/failed states and protect unsaved edits.
4. Link notifications/calendar/reports where available and keep private downloads on authenticated transport. No form.manage requirement for ordinary runtime rendering.
5. Verify duplicate submission, eligibility change after catalog selection, successor definitions and uncertain response reconciliation through actual backend auth.

### Acceptance criteria

- An ordinary requester completes the documented draft/submit/track journey with private attachments and no JSON/manual refs.
- Duplicate submit creates one case, and a stale or uncertain action preserves user understanding and data.
- The case shows the actual configured business outcome and external receipt where authorized.

### Verification and required evidence

Extend test:browser-backend/workspace and actual request API tests; A14/A19/A22/A23. mise run check.

### Data, compatibility, rollout and peer handoff

Existing REQ/FORM behavior remains the base; not a rewrite of form rendering or request lifecycle.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-028.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-029"></a>

## APP-FE-029 — Finish reviewer work lists, decisions and correction experience

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-005, APP-FE-006, APP-FE-007, APP-FE-022, APP-BE-020, APP-BE-021  
Related: TASK-01–07; existing cartables/claim/view/correction/AI approval  
Decisions: None  
Owner: Codex  
Estimate: 4–6 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-029](../changes/APP-FE-029.md)

### Goal

Reviewers can take work, understand permitted data and AI assistance, make declared decisions, and send actionable corrections safely.

### Context: preserve and extend

Reuse existing six-cartable/inbox semantics, claim/start/release, named views, filtered patch, feedback and dedicated form-less AI approval. Do not invent new states to make a screen simpler.

### Implementation sequence

1. Audit list paging/filter/claim ownership and direct entry. Show who can act and why actions are unavailable without leaking candidate identities beyond permission.
2. Provide clear review layout with authorized values, relevant prior/corrected data, attachments, current human action choices and required comments/scopes. Preserve field/row correction identity across reorder.
3. Separate AI recommendation/evidence display from the human action and read-only tool approval panel. Never label AI confidence an approval.
4. Handle competing claims, stale views, permission revocation, concurrent completion, timeout and uncertain mutation results. No auto-retry of completion/rejection/return.
5. Verify requester correction/resubmission and return-to-review as the actual backend supports it; do not fabricate a loop by creating arbitrary new tasks.

### Acceptance criteria

- Two reviewers cannot both win the same work; losing claim and stale outcomes are recoverable in the UI.
- Hidden fields survive permitted edits without disclosure; corrections are actionable and required comments are enforced.
- Only the declared human action can satisfy protected approval; AI tool approval is visibly distinct.

### Verification and required evidence

Existing reviewer/AI-approval browser suite plus real claim-race/correction tests; A15/A16/A22/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C11/C12. Forwarding and personal metadata reuse existing constraints, including no forwarding of AI tool approvals where prohibited.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-029.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-030"></a>

## APP-FE-030 — Replace integration and AI administration JSON with domain workflows

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-006, APP-FE-007, APP-FE-025, APP-BE-022, APP-BE-025  
Related: ADMIN-04/05; existing connection grants and agent catalogs  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-030](../changes/APP-FE-030.md)

### Goal

Administrators manage governed connections and agent versions through meaningful setup and inspection screens rather than an operation console.

### Context: preserve and extend

F12 current administration is contract-driven with JSON nested configuration. Reuse actual CRUD/lifecycle/secret/grant/budget APIs and one-time-secret clearing behavior.

### Implementation sequence

1. Build connection list/detail/create/edit for each supported provider family using typed field groups and conditional settings. Show safe configured/secret-resolvable/live-verified/active states; do not request credentials in graph editors.
2. Provide grant selection, rotate/revoke and explicit verify/test flows with side-effect/cost confirmation. Secret input/reveal is transient, masked and cleared on success/dismiss/resource/actor change.
3. Build agent draft/version/publish/detail with model choices from approved connections, data policy, typed output/question/choices, supported tools and budget settings. Explain reserved/unknown/actual usage distinctly.
4. Keep operation/template metadata and dependency usage visible; link to impacted workflows and readiness without automatically repinning active cases.
5. Split .1 connection setup, .2 grants/lifecycle, .3 agents/budgets. Use real endpoint behavior rather than generic JSON output cards.

### Acceptance criteria

- Every included provider/agent setting required by the demo has a typed UI and readable result.
- No credentials are persisted in browser storage, URL, graph, screenshot or logs.
- Revoked/incompatible connections and unsupported strict-spend/tool configurations fail with actionable messages.

### Verification and required evidence

Admin editor specs and real non-superuser admin/outsider browser/API checks; A06/A16/A18/A22/A26. mise run check.

### Data, compatibility, rollout and peer handoff

C11/C12. Live-provider credentials/paid tests require D02; a local secret lookup cannot earn a live-verified badge.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-030.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-031"></a>

## APP-FE-031 — Complete identity, group, permission, client and request-type administration

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M1  
Depends-On: APP-FE-006, APP-FE-007, APP-BE-004, APP-BE-006  
Related: ADMIN-01–03; STUDIO-10; existing users/records/dialogs  
Decisions: None  
Owner: Codex  
Estimate: 3–6 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-031](../changes/APP-FE-031.md)

### Goal

Everyday administration uses consistent lists, named selectors, clear authority and safe lifecycle actions rather than arrays of refs or generic commands.

### Context: preserve and extend

Reuse existing Users/roles/permissions/group and client/release/request-type screens. F12/F06 document list-first improvements and preserved client restrictions; do not rebuild those bases.

### Implementation sequence

1. Finish typed CRUD/details for users, roles, permission groups, memberships, clients/releases and request types according to the API/UI matrix. Distinguish account role, work group and client identity.
2. Replace permission/reference arrays with searchable grouped selection and contextual summaries. Separate security-sensitive changes from ordinary profile edits and confirm the exact reviewed target/payload.
3. Exclude deleted objects from normal lists and selectors with backend-enforced policy; provide explicit authorized restore management where supported, not a default include-deleted list.
4. Preserve client/release restrictions on unrelated edits and require explicit clear confirmation. One-time client secrets remain in memory and clear on dismissal/navigation/logout.
5. Maintain history/report/current-reference behavior and field-level conflict/errors; no superuser-only happy-path demo.

### Acceptance criteria

- All inventoried ordinary identity/client/request-type operations have meaningful input/output surfaces without raw JSON.
- Delete/restore and restriction edits respect current refs and cannot expose or accidentally broaden access.
- Least-privilege demo roles and outsider denials work through actual backend APIs.

### Verification and required evidence

Extend test:browser-records/catalogs/admin and actual backend admin checks; A01/A02/A11/A22/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C01/C03. Existing operations requiring superuser remain explicit; a seeded permission label alone does not grant them.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-031.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-032"></a>

## APP-FE-032 — Provide usable operator, schedule, report, audit and recovery screens

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-006, APP-FE-007, APP-FE-013, APP-FE-026, APP-BE-024  
Related: ADMIN-06–08; OPS-02/03; existing process recovery  
Decisions: None  
Owner: Codex  
Estimate: 3–6 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-032](../changes/APP-FE-032.md)

### Goal

Operators can inspect real running/failed work and apply only supported actions, with readable schedules, reports and audit evidence.

### Context: preserve and extend

F12/B17 actual authority and state rules must remain; recovery cannot guess a parallel branch or force a human outcome. Reuse current tasks/reports/audit infrastructure.

### Implementation sequence

1. Build focused schedule/task lists and typed editors for actual interval/crontab/clocked fields, next-run context, executions and queue state. Do not invent a timezone/overlap setting the backend lacks.
2. Show task_id versus version ref distinctions and exact retry/revoke targets; queued/manual-run results stay queued. Confirm actions and reconcile uncertain results.
3. Provide case-centered operator detail with active positions, attempt history, timers, receipts, failure/support records and permitted recovery options. Explain unavailable recovery rather than exposing all generic operations.
4. Finish My Reports/private archive/download and audit/history before/after presenters with applied query, paging, safe redaction and authorization.
5. Document recovery side effects and supported manual handoff. No runtime-row editor, arbitrary event injection or unrestricted compensation button.

### Acceptance criteria

- An operator can diagnose and resolve a supported sandbox incident without JSON or direct database edits.
- Unsupported/unauthorized recoveries are absent or clearly denied; no optimistic false completion.
- Report/audit/task identifiers and payloads remain safe and current.

### Verification and required evidence

Existing admin/operator/report browser and PostgreSQL tests, plus actual worker/sandbox recovery case; A18/A19/A20/A21/A23. mise run check.

### Data, compatibility, rollout and peer handoff

C08/C12. A generic command console may remain in an explicitly advanced diagnostic route, not as completion of ordinary operator tasks.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-032.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-033"></a>

## APP-FE-033 — Close every in-scope API and raw-JSON UX coverage gap

Priority: P0  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M5  
Depends-On: APP-FE-007, APP-FE-019, APP-FE-024, APP-FE-025, APP-FE-027, APP-FE-028, APP-FE-029, APP-FE-030, APP-FE-031, APP-FE-032, APP-FE-014, APP-FE-015, APP-FE-010, APP-FE-012, APP-FE-009, APP-FE-011  
Related: All API/UI/FORM/STUDIO/ADMIN tickets; stable Steps retained  
Decisions: None  
Owner: Codex  
Estimate: 4–7 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-033](../changes/APP-FE-033.md)

### Goal

Prove complete intentional frontend support instead of declaring success because a generated client includes every endpoint.

### Context: preserve and extend

Use APP-FE-001 operation and JSON UI registers. Existing API/auth/binary/internal operations remain classified; no normal feature may be excluded simply to finish faster.

### Implementation sequence

1. Reconcile the final generated OpenAPI operation set and new C contracts with every screen/action. Include search/select/history/report/version/grant/lifecycle operations, not only CRUD.
2. For every normal operation, verify a domain-specific editor/presenter, permission, all states and a test. Server-boundary/internal operations have documented non-UI handling. Any true exclusion requires product approval and is not claimed implemented.
3. Search templates and runtime routes for JSON pipes, stringify/pre blocks, textareas bound to structured payloads, arbitrary ref inputs and generic operation consoles. Classify legitimate document/code/advanced inspectors versus unfinished business UI.
4. Repair uncovered gaps under suffix tickets grouped by domain, retaining exact API semantics. Do not introduce a universal JSON-to-form fallback that hides unsupported constructs.
5. Run complete representative journeys without raw JSON or ref copying and retain screenshots/network assertions; ensure underlying DTO data is preserved by every presenter/editor.

### Acceptance criteria

- Every relevant public operation has a verified disposition and every normal included action has a usable UI.
- No standard workflow requires raw JSON input/output or manual opaque refs.
- All expert-only exceptions and deliberate exclusions are explicit; no missing feature is disguised as a successful empty screen.

### Verification and required evidence

Automated operation/UI register checks and full domain browser matrix; A01–A24 as mapped. mise run check. Estimate is an initial closure allowance; newly discovered major APIs expand the backlog rather than falsely closing it.

### Data, compatibility, rollout and peer handoff

This is a real completeness gate, not permission to waive the user’s API support requirement. Documentation includes exact supported/excluded scopes.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-033.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-034"></a>

## APP-FE-034 — Verify full English/Farsi, accessibility and responsive behavior

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M5  
Depends-On: APP-FE-033  
Related: QA-04; UI-03/04; existing axe/browser suites  
Decisions: D05  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-034](../changes/APP-FE-034.md)

### Goal

The complete product is usable with keyboard, English/Farsi and supported screen sizes, including complex canvas and dialogs.

### Context: preserve and extend

F13 records automated checks and manual gaps. Keep those historical scope limits; automated axe success is not screen-reader acceptance.

### Implementation sequence

1. Complete translation coverage across controls, messages, errors, help, validation, statuses and dialogs. Preserve codes/values, explicit date/calendar semantics and mixed-direction identifiers.
2. Run keyboard/focus/modal/unsaved-dialog checks, linked errors, labels, target sizes and non-color status indicators. Provide list/tree alternatives for complex diagram/chart information.
3. Run automated accessibility across actual key screens and investigate all incomplete results, including focus-trap sentinels. Do not suppress rules to produce a clean report.
4. Perform and record manual screen-reader, zoom and contrast review on the agreed D05 matrix; desktop authoring and mobile requester/reviewer/support surfaces have explicit requirements.
5. Fix violations and rerun. Keep Chromium and Firefox binaries/platforms recorded and do not claim unsupported engines were tested.

### Acceptance criteria

- Required en/fa text is complete and no canonical value changes on locale switch.
- All automated violations and required manual-review findings are resolved with evidence.
- No required operational screen overflows at the agreed mobile width; canvas detail remains navigable without pointer-only interaction.

### Verification and required evidence

Existing test:accessibility/test:browser-quality extended plus manual checklist evidence. A23/A24. mise run check and both supported engine suites; manual completion needs actual tester evidence.

### Data, compatibility, rollout and peer handoff

D05 defines support matrix. Do not invent a screen-reader/browser run or claim universal accessibility compliance.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-034.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-035"></a>

## APP-FE-035 — Measure bounded form/canvas/chart performance and teardown

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M5  
Depends-On: APP-FE-033, APP-FE-020, APP-FE-014, APP-FE-015  
Related: QA-05; existing 16/64/256 runtime and canvas fixtures  
Decisions: D05  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-035](../changes/APP-FE-035.md)

### Goal

Keep rich authoring and operational screens responsive without unbounded memory, polling or transfer work.

### Context: preserve and extend

C14 provisional profile and F13 historical measurements. Reuse existing performance runners; historical DOM teardown is not proof of no heap leak.

### Implementation sequence

1. Agree D05 reference hardware/data sizes and budgets before pass/fail claims. Record cold/warm runs, input sizes, browser/version and backend/network conditions.
2. Measure forms with 16/64/256 fields plus nested rows/attachments; graphs at 25/100/250 nodes with mixed edges; calendar ranges and chart series at defined bounds.
3. Profile repeated mount/edit/navigate-away cycles, heap trend, subscriptions/listeners, retained DOM, pending timers/polling and lazy bundle boundaries. Do not equate zero DOM nodes with zero leaks.
4. Fix demonstrated hot paths with stable tracking, derived-state ownership, incremental rendering or justified virtualization; preserve accessibility, canonical data and existing bundle budgets.
5. Run over-limit input rejection and concurrent transfers with APP-FE-036. If realistic limits cannot be met, propose a narrower supported profile with owner decision rather than silently widening thresholds.

### Acceptance criteria

- Measured accepted profile meets agreed budgets, including sustained teardown behavior and bounded background work.
- Large unsupported input fails safely; no browser freeze is the validation strategy.
- Performance reports contain timings/counts, not private data or raw DOM dumps.

### Verification and required evidence

Existing browser performance/canvas runners with retained structured samples and heap evidence; A23/A24. mise run check plus named hardware runs.

### Data, compatibility, rollout and peer handoff

D05 budgets are proposals until agreed; no fabricated p95/baselines or unvalidated agent-speed claims.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-035.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-036"></a>

## APP-FE-036 — Harden the same-origin boundary for real sessions and private transfers

Priority: P1  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M3  
Depends-On: APP-FE-002, APP-FE-005, APP-BE-027  
Related: ARC-01/03; AUTH-02; API-04; QA-03/07  
Decisions: D06  
Owner: Codex  
Estimate: 3–5 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-036](../changes/APP-FE-036.md)

### Goal

Preserve the accepted server-held token boundary while making its transfer/deadline/restart behavior match the application’s declared limits.

### Context: preserve and extend

F14–F16: in-memory sessions, whole-body buffering and a common upstream deadline are concrete baseline constraints. Do not move tokens to Angular or add a second auth API.

### Implementation sequence

1. Measure current request/response buffering and concurrent memory at agreed attachment/report limits. Implement bounded streaming/backpressure where suitable and operation-specific deadlines, preserving CSRF/origin/token-route restrictions.
2. Connect browser disconnect/cancellation to owned upstream work where safe. Distinguish request not sent from ambiguous mutation sent; abort is not evidence the backend rolled back.
3. Handle errors during response-body consumption, not only fetch header resolution. Preserve safe private errors and required response headers without leaking upstream body/credentials.
4. Record D06 pilot topology: single process with explicit restart-signout may be acceptable for demo; multi-replica needs a protected shared store and cross-replica rotation design, not an unreviewed memory map clone.
5. Test production cookie/cache settings, exact proxy origin, large private files, slow transfer, session expiry, concurrent refresh, cross-tab/logout and secret release identity.

### Acceptance criteria

- The full declared private transfer size succeeds with bounded memory; excess is rejected early and safely.
- Refresh rotation and unsafe-command no-replay remain correct under timeout/disconnect/logout.
- Deployment topology and restart behavior are explicit and demonstrated, not assumed horizontally scalable.

### Verification and required evidence

Extend server/session-boundary.spec.mjs, browser-boundary and actual-backend transfer tests; A19/A22/A24. mise run check plus local HTTPS production-cookie rehearsal.

### Data, compatibility, rollout and peer handoff

C14; preserve legacy session wire fields unless a separate compatibility migration is approved. D06 determines deployment evidence, not unconditional multi-replica scope.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-036.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-037"></a>

## APP-FE-037 — Build the paired application demo and repeatable browser reset rehearsal

Priority: P0  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M5  
Depends-On: APP-FE-033, APP-FE-036, APP-BE-029, APP-BE-031  
Related: QA-02/03/07; existing browser-backend/studio harnesses  
Decisions: None  
Owner: Codex  
Estimate: 4–6 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-037](../changes/APP-FE-037.md)

### Goal

Run the requested application through actual frontend/backend/services with known template defaults and reproducible failures.

### Context: preserve and extend

Reuse existing browser automation and backend demo harness rather than seed a different frontend-only purchase flow. Match C14 pair/template/client manifests.

### Implementation sequence

1. Extend the browser harness to consume the backend’s private accounts/run manifest and current contract, never committed credentials. Register the correct client/release/session boundary and use actual services.
2. Run designer create/edit/publish/default-restore, requester/private draft/submit, reviewer/correction/approval, branch/subprocess, sandbox receipt, notification/calendar/dashboard/report/support and settings/help/favorite flows.
3. Execute fault variants: losing claimant, stale editor, expired session, rejected input, delayed/lost mutation response, accepted-effect/unknown result and safe reconciliation. Capture bounded sanitized evidence.
4. Invoke the guarded demo reset on owned disposable resources, then repeat the demonstration. Verify baseline hashes, no stray pending jobs and unchanged non-demo sentinel resources.
5. Label local HTTP sandbox and deterministic AI distinctly; add live vendor/provider passes only with their actual approvals/evidence. Do not use mock network interception in a run claimed integrated.

### Acceptance criteria

- The entire included application can be demonstrated without Swagger/manual database changes/raw JSON/ref copying.
- Reset twice restores expected defaults and can be followed by another full browser journey.
- The evidence records exact pair, environment, browser and genuine system interactions; missing live-vendor/AI evidence stays explicit.

### Verification and required evidence

Existing test:browser-backend/studio extended into a documented proposed paired-demo script. A01–A26 with actual services; mise run check and integrated browser commands. No destructive default reset task.

### Data, compatibility, rollout and peer handoff

C13/C14. APP-BE-029 owns environment reset mechanics; frontend owns browser orchestration and user-visible acceptance assertions.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-037.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

<a id="app-fe-038"></a>

## APP-FE-038 — Close zero-warning product acceptance and operator/user handoff

Priority: P0  
Status: BLOCKED  
Verification: IMPLEMENTED  
Area: frontend / M5  
Depends-On: APP-FE-034, APP-FE-035, APP-FE-037, APP-BE-032  
Related: QA-03–07; Steps 36/37 remain distinct from optional Step 38  
Decisions: None  
Owner: Codex  
Estimate: 2–4 person-days; confidence low-to-medium before intake  
Change-Record: [APP-FE-038](../changes/APP-FE-038.md)

### Goal

Hand over a demonstrably usable product with clear known limits, no warning-based false completion and real owner acceptance.

### Context: preserve and extend

Reuse release-readiness/runbooks and final task evidence. This new APP-FE-038 ID is not the old numeric Step 38 optional expansion; keep both identities unambiguous.

### Implementation sequence

1. Reconcile the final API/UI/no-JSON map, notification/help manifests, template defaults, supportable failure flows and per-persona scenarios. Ensure no required work is silently deferred behind an expert console.
2. Run final mise run check on both exact repositories through their owners, zero warnings and no skipped required acceptance; record actual browser/manual/performance/service evidence and any pending external checks.
3. Publish demo/run/reset/support instructions with the readiness checklist, current pair/builds, initial safe credential provisioning and operational authority limitations.
4. Have the product owner and representative requester/reviewer/designer/operator execute the agreed acceptance script. Record actual names/roles and decisions only when obtained.
5. Mark capabilities separately as verified, demo-ready, deployed and user-accepted. Rollback/restore/provider unknown outcomes and unsupported calendar/browser features must remain documented.

### Acceptance criteria

- The requested scope has all required acceptance evidence and a repeatable live application demonstration.
- No warnings, waived failures or fixture-only tests are disguised as strict readiness.
- USER_ACCEPTED is recorded only after real signoff; otherwise report DEMO_READY or BLOCKED accurately.

### Verification and required evidence

Final gate manifest, A01–A26 evidence, manual acceptance records and reset rehearsal. Strict check does not perform a paid/live production action automatically.

### Data, compatibility, rollout and peer handoff

No universal reliability, production tenancy/compliance/scale or model-accuracy promise. Remaining ideas stay in a separate later-release register.

### Completion instruction

Follow the full execution rules below. Record exact files reused/changed, contract IDs, migration/seed impact, focused and full commands, warnings/skips, and peer limits. Update the task and docs/changes/APP-FE-038.md only from observed evidence. Do not label a missing service, unresolved warning or required untested action complete.

---

# Appendix A — Shared contracts and acceptance

# Shared contract and acceptance ledger

Version: 1.0.0 · This is a proposed implementation design, not proof of existing endpoints. Both repository packs carry the same ledger. Apply all changes through the owning backend module and existing frontend adapters. If an equivalent already exists, reuse it and freeze its exact name rather than introducing a duplicate endpoint.

## Contract freeze procedure

APP-BE-001 and APP-FE-001 enumerate current OpenAPI and UI coverage. Each contract below is finalized by its producer task, with generated request/response/error examples. Field names below describe required semantics; proposed field bounds are initial safety defaults to be measured, not production scale commitments. The producer validates them with the consumer before integration. Python nested DTOs and envelopes use BaseDTO; JSON field names are snake_case. Existing pagination, errors, headers and success envelopes remain unchanged. Newly proposed error reason codes are distinct from existing numeric public error codes: map them through the existing error catalog instead of inventing numeric codes here.

Published definitions and active case pins remain immutable. Every mutation documents its actual concurrency token, transaction, replay scope and after-write refs. New GETs must not mutate state. New command replays may only repeat the frozen original payload with its operation-specific key.

## C01 — Bootstrap, seeds and capabilities

Producer APP-BE-004/005; consumers APP-FE-001/011/037. Provide a code-owned manifest of stable semantic keys, versions, dependency keys, content hashes, permission requirements and seed ownership. Reuse registered step handlers, permission definitions and templates. Three profiles: system, installation and explicit demo. Migration/bootstrap data cannot contain a default production password, active provider secret or paid connection marked verified without evidence.

Expose only an authenticated, authorized, non-secret summary through readiness (C06), not raw installation internals. Re-running a profile must be idempotent and preserve operator-owned changes. New versions append rather than mutate published seeds. Empty/disabled groups never receive invented members. Provide dry-run and check-only modes and a scoped summary of created/unchanged/conflicting records.

## C02 — Personal profile and preferences

Producer APP-BE-007; consumer APP-FE-008. Candidate paths: GET/PATCH `/api/v1/me/preferences` and existing self-profile endpoints if available; otherwise freeze an additive self-profile route. Ownership is server-derived from authenticated actor, never a trusted body user_id. Suggested typed preference groups: appearance (theme_mode light/dark/system, approved theme_key, density), locale (en/fa, IANA timezone, supported calendar/numbering), workspace (landing_key, bounded page_size), notification preferences (only configurable categories/channels). Unsupported keys and unknown enum values fail validation.

PATCH distinguishes missing from explicit null and preserves unrelated groups. Include current ref_id in responses and an expected preference ref on mutations using the repository convention; 409 preserves client inputs. Keep profile/contact changes separate from account-security actions and authority-bearing identity attributes. No is_superuser, role assignments, verification flags, password or tokens in preferences. No arbitrary CSS or HTML.

## C03 — Authorized pickers and durable resource links

Producer APP-BE-008; consumers APP-FE-006/009/012/014/027. Prefer existing `/select` operations; normalize their varying envelopes at an adapter, not by replacing all endpoints. Display labels are not keys. Show root name, version, kind and safe availability where allowed; permission/client/dependency checks filter before pagination and count.

For durable favorites/notifications use a stable opaque `link_key` or equivalent existing locator separate from revision-sensitive ref_id. The server stores canonical identity internally, delegates authorization to each domain and resolves a fresh `resource_ref_id` plus allowlisted `route_key`. Candidate POST `/api/v1/resource-links/resolve` with `link_key`; never accept an arbitrary URL or model/table name. Only authorized creators can mint links, and possession grants no access. Bind kind/version intent; a definition pin resolves the same definition version with its current reference, not a newer definition.

A deleted/forbidden/unknown target returns the existing non-disclosing public outcome. Angular uses `/open/{link_key}` only after the route contract is registered and re-resolves after login. No decrypting ref_id, browser-fabricated privilege, stored stale version token or unsafe return URL.

## C04 — Saved views and favorites

Producer APP-BE-009; consumer APP-FE-009. Candidate roots `/api/v1/me/saved-views` and `/api/v1/me/favorites`; mirror actual search/select/detail/update conventions after freeze. Saved view: name (1–120 chars), resource_kind, schema_version, validated query (existing filters/sort_orders), allowlisted column_keys, page_size and optional is_default. Do not save page offsets, raw responses, tokens, unsaved form payloads or arbitrary SQL. Treat free-text filters as private user data, excluded from logs.

Favorite stores resource_kind + canonical target server-side, returns current label/link metadata only after authorization. Enforce unique (actor, kind, target), bounded item count (initial 100 per kind) and deterministic ordering. One default view per actor/scope by atomic update. User filter cannot override soft-delete/authorization base predicates. Deleted/revoked targets are absent from normal favorites; a private management view may offer a generic “unavailable item” removal entry without leaking its title. Sharing/team views are later scope.

## C05 — Small multilingual help catalog and seen state

Producer APP-BE-010 for state; APP-FE-010 for content. Frontend code owns a manifest: help_key, content_revision, route_key, audience/capability hints, order, title/body message keys and explicit en/fa text. No CMS, tour engine, runtime arbitrary HTML or dynamic executable content. Include Help list, contextual inline hint and open/review actions. A list row is not marked seen merely because it was fetched.

Backend stores only actor + help_key + revision + locale + first_viewed_at + last_viewed_at + dismissed_at (bounded timestamps assigned server-side); unique actor/key/revision/locale. Candidate GET `/api/v1/me/help-state`, POST `/api/v1/me/help-state/seen`, POST `/api/v1/me/help-state/dismiss`, POST `/api/v1/me/help-state/reset`. Allowed keys/revisions come from release-manifest metadata, not a second hand-maintained translation catalog. Reset is self-only, explicit and idempotent; does not clear app preferences or business data. New content revision can be unseen without deleting prior history. No tracking time-on-page, form values or unnecessary analytics.

## C06 — Setup/readiness and dependency repair

Producers APP-BE-011/012; consumer APP-FE-011. Candidate GET `/api/v1/setup/readiness` (installation-authorized) and a definition-scoped authoring readiness read consistent with existing workflow/form tools. Return checks with stable key, category, status (ready/blocked/unknown/not_applicable), message_code, safe parameters, checked_at and optional repair route_key/target. These statuses describe the checklist only.

Separate installation readiness from definition publishability, requester eligibility, worker liveness and provider credential verification. A successful HTTP health probe is not a executed worker probe. A secret resolving is not a live provider test. Routine reads are bounded and side-effect-free; active tests are explicit commands with audit and no paid call by default. Repair guidance links to the owning screen; it never auto-grants a role, creates secrets or publishes a dependency.

## C07 — Notification map, unified inbox and deep links

Producer APP-BE-013/014; consumer APP-FE-012. Maintain a code-owned map, versioned alongside tests. Required columns: map_key, actual source event/command, audience resolver, template key/version, allowed variables, channels, mandatory/optional policy, dedupe identity, timing, cancellation rule, resource target, permission check, retention and test ID. `MAP-*` rows below are proposed logical mappings, not existing process event names.

| Map    | Trigger meaning                           | Recipient                                                 | Destination               | Dedupe / validity                                                       |
| ------ | ----------------------------------------- | --------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| MAP-01 | Request submission committed              | Requester                                                 | Request detail            | request + submission occurrence; no duplicate on submit replay          |
| MAP-02 | Human work becomes available              | Currently eligible candidates, bounded fan-out            | Inbox/work item           | work item + availability generation + recipient; recheck access         |
| MAP-03 | Claim or assignment changes               | Previous/new affected claimant where appropriate          | Work item                 | assignment event + recipient; suppress obsolete open-work reminder      |
| MAP-04 | Returned for correction                   | Actual correction recipient                               | Correction view           | correction round + recipient; not just original task id                 |
| MAP-05 | Human decision committed                  | Requester and explicit next participants                  | Request/decision timeline | decision event + recipient; approved is not delivery-complete           |
| MAP-06 | Workflow reaches configured final outcome | Requester                                                 | Case outcome              | actual terminal occurrence/outcome, not inferred approval               |
| MAP-07 | External operation fails or is uncertain  | Authorized operators, safe requester notice if configured | Incident/operation result | logical operation + failure episode; rate bounded                       |
| MAP-08 | External business effect confirmed        | Authorized case audience                                  | Receipt/outcome           | stable provider receipt/logical operation; separate from queued         |
| MAP-09 | Report becomes ready or fails             | Report owner                                              | My Reports/detail         | report generation + state; do not expose file URL to outsiders          |
| MAP-10 | Calendar reminder due                     | Event owner/permitted participant                         | Calendar event            | event revision + reminder occurrence + recipient; edits cancel old work |
| MAP-11 | Work deadline/reminder due                | Currently responsible users/escalation if configured      | Work item                 | actual due-time revision + reminder key; no fabricated SLA              |
| MAP-12 | AI read-only tool approval required       | Eligible human approval claimant/candidate                | Dedicated approval panel  | approval instance + recipient; never business approval                  |
| MAP-13 | Support failure recorded/escalated        | Support-authorized actor/group                            | Failure detail            | episode + threshold; no recursive notification-failure storm            |
| MAP-14 | Account/session security event            | Affected user through existing security flow              | Account sessions          | security event; no token/credential content                             |

Keep notifications in the existing notifications domain and delivery infrastructure. Current NotificationDTO/mapper requires request/process refs [B18/B19]; non-case reminders cannot be inserted as fake business requests. Prefer an additive unified inbox projection with discriminated case/calendar/report/support targets, while preserving legacy case-only routes/DTOs for old clients. Candidate new `/api/v1/notifications/inbox/search`, detail and read operations over the same domain storage. If the implementation can safely extend the existing shape without breakage, document the exact alternative and paired-client rollout first. Do not create a second notification worker/engine.

Link ownership/authorization is rechecked at delivery and open. Read is explicit; fetching a notification does not approve a task. Localize mapped templates without changing event keys. The normal inbox is not a provider-debug log. Start with in-app plus one real supported notification channel; SMS, push, marketing campaigns and preference overrides of required approval are excluded.

## C08 — Recorded supportable failures

Producer APP-BE-015; consumer APP-FE-013. Classify expected business validation/conflicts separately from technical incidents. Reuse process/task failures and OTel correlation; add a small support projection/record only where necessary. Suggested record: public opaque support_ref, category, stable safe error_code, severity, first_seen_at, last_seen_at, occurrence_count, affected authorized resource locator, request/trace correlation, release pair, operation identity and state (open/acknowledged/resolved) with audited transitions. These are incident states, not process states.

Record using a transaction independent of a rolled-back business transaction. Bound/deduplicate repeated occurrences. Expected 400/403/409/422 cases are not all incidents. Client intake, if needed, accepts only allowlisted screen_key/build/error_code/request_id with strict size/rate limits; no arbitrary messages/stack/HTML/payload. Records omit secret, prompts, attachments and business field values. Admin search/detail requires a dedicated reviewed authority; self support reference never grants global incident access.

When persistence is down, fall back to sanitized operational logging/metrics and expose a correlation id where safe; never claim durable incident storage succeeded. Do not roll back a successful business commit because support recording failed. Notification failure recording cannot recursively generate infinite alerts. Use outbox/incident dedupe boundaries.

## C09 — Workflow-aware calendar

Producer APP-BE-016/017; consumer APP-FE-014. Scope: personal events plus authorized workflow-derived due items, agenda/month/week views, explicit one-off reminders. Team event ownership uses existing groups and explicit checks, not an invented tenant. Recurrence, invitation RSVP, working-day calendars and external sync are separately gated later increments.

Candidate POST `/api/v1/calendar/events/search`, CRUD by ref, and self/team scopes based on actual policy. Range queries use half-open [start,end) and initial maximum 93-day window with page size ≤100; overlap is event_start < range_end AND event_end > range_start. All-day events use dates and exclusive end date, not midnight UTC pretending to be a timed event. Timed events store UTC instants plus a validated IANA presentation timezone. Clarify DST ambiguous/nonexistent local times rather than guessing.

Workflow-derived due events are projections of actual domain due data, not duplicate mutable deadlines. A calendar drag cannot change work-item state/deadline without a supported authorized domain command. Source edits/cancellation invalidate reminders in the same transactional/outbox scheme; reminders recheck current state on execution. Gregorian canonical wire dates stay intact. Persian UI is required; Jalali conversion/input is an explicit separate contract decision D03, not implied by locale.

## C10 — Chart/analytics query contracts

Producer APP-BE-018; consumer APP-FE-015. Implement a small approved metric catalog within reporting/appropriate existing owner. Candidate POST `/api/v1/analytics/query`. Request: metric_key, approved dimensions, bounded date range/granularity/timezone and allowlisted filters. Response: metric key/version, unit, generated_at/as_of, buckets/series, empty-state meaning, and an authorized drill-down query descriptor. No chart-library options, arbitrary SQL, unrestricted entity names or arbitrary joins.

Initial metrics: submitted requests by time; active requests by actual state; my available/claimed work; overdue work when deadline exists; time from submission to terminal completion with explicit population; correction frequency; failed/unknown integrations; confirmed business outcomes only when a configured outcome mapping exists. Unknown/unavailable is not zero. Do not sum money across currencies or assume “process finished” means “approved”. Apply authorization/deletion semantics consistently to detail and aggregate. Historical audit metrics may intentionally include deleted entities only under a named authorized historical metric, never in ordinary operational charts.

## C11 — Authoring schemas, node inspectors and form controls

Producer APP-BE-019/020; consumers APP-FE-016–026. Prefer existing designer metadata, step catalog, selectors, field inventory, expression completion and runtime-preview tools. Supply versioned metadata for a registered handler: type/version, labels/help, configuration schema, typed input/output ports, supported outcomes, conditional properties, selector roles, read-only/sensitive properties, validation diagnostics and safe samples. No backend HTML or component imports. Actual executable semantics remain server-owned.

Required form primitive coverage at inspected baseline: vertical, horizontal, grid, text, textarea, integer, number, date, datetime, boolean, choice, calculated, display, user, group, repeater, table, media, attachment_collection, action [F10]. All rendered UI must preserve canonical null/missing/false/0/empty/exact-number semantics. Unsupported constructs are explicit compatibility errors, not a fallback raw JSON input in a normal task. General expression text may be authored in a constrained expression editor; never evaluate it as JavaScript.

Control transitions and data bindings have distinct identities. Mapping supports only authoritative available source data, typed targets and supported conversion rules. No copying unauthorized execution snapshots into synthetic preview. No lost hidden properties when a purpose-built editor modifies only its owned fields.

## C12 — Approval, integration effects and execution evidence

Producers APP-BE-021–025/028; consumers APP-FE-022/025/026/028–030. Required human approval cannot be satisfied by an AI output or by approval of a read-only tool call. Publication and execution enforce protected effects for the agreed pilot policy; corrections invalidate approval for changed relevant inputs. Validate all selectable normal/review routes, conditional/default edges, parallel paths and subprocess boundaries. No fabricated human completion payloads.

Registered service operation contracts include immutable version, typed input/output, connection restrictions, operation-specific idempotency, deadline, retry policy, receipt, reconciliation method and explicit compensation capability. Existing connection.status remains a diagnostic operation. The first demo business connector is a code-owned HTTP sandbox order operation with an actual separate service/receipt; a named vendor sandbox is a distinct evidence gate (D02).

The execution-principal policy currently derives authority from publisher [B14]. Before adding durable service identities, decide and test offboarding/revocation semantics (D04); never silently elevate to superuser or change active pins. Ambiguous provider outcomes stay unknown/reconcile-first. Redelivery cannot blindly repeat non-idempotent effects. Preserve existing process enums; map external operation state explicitly rather than optimistic “success”. AI budgets distinguish quote limits, reserved/unknown spend and actual usage. A live evaluation needs explicit provider/credential/cost approval and representative labeled en/fa cases, not only fake outputs.

## C13 — Templates, return to default, and demo reset

Producer APP-BE-026/029; consumers APP-FE-027/037. A default is a named immutable baseline, not “whatever the latest code happens to create”. Template manifest: template_key/version/hash, canonical form/workflow definitions, stable node keys, symbolic dependency keys and allowed installation bindings; secrets/users/client grants are not embedded. Existing root/version lifecycle and library helpers remain authoritative.

Candidate workflow-default preview/restore commands follow existing `/workflow-versions/{ref_id}/...` naming only after contract freeze. Preview resolves exact template, current target/workspace refs and authorized dependency bindings, reports diff and blockers, and issues a bounded expiring plan token/hash. Apply uses the same frozen plan and command_key. Any target, workspace, template or binding change invalidates the plan. Two modes: replace an existing DRAFT after confirmation, or create a successor DRAFT from the baseline. PUBLISHED/RETIRED may only produce a new DRAFT; active cases never change. Do not auto-publish or retarget request types. Layout-only reset and discard-unsaved-local-edits are separate operations.

An unassociated custom workflow has no default: offer explicit template selection/new draft, not silent inference. Repeat restoration replays the same command without creating extra drafts. Restore a multi-definition template transactionally when bounded; otherwise use a staged import with no partially exposed publishable state and a documented repair journal.

Demo reset is a separate CLI/harness operation, unavailable in ordinary production navigation. Verify disposable environment identity, a unique demo run marker and an allowlist of owned DB/bucket/queue resources; refuse unknown/shared/production targets. Stop producers, drain/cancel owned work safely, reconcile effects in the sandbox and rebuild only the isolated demo environment. Never use the repository's unrestricted volume-deleting reset task. Reset credentials are regenerated safely and never printed into public artifacts.

## C14 — Paired verification and performance profile

Producers APP-BE-027/028/031/032; consumers APP-FE-034–038. A release-pair manifest identifies both SHAs, dirty-tree digest when applicable, lock hashes, OpenAPI hash, runtime dialects, migrations, template versions and client release. Generate and compare full relevant schemas/security/error behavior; matching operation IDs alone is insufficient.

Provisional demo acceptance profile (D05, calibrate without silently widening): desktop authoring at 1440×900 and 1024×768, mobile requester/reviewer at 390px width, en/fa and light/dark, latest supported installed Chromium and Firefox versions recorded. Browser/device matrix is a product signoff, not a historical test claim. Runtime fixtures: 16/64/256 scalar fields, realistic nested rows and attachments; graph fixtures: 25/100/250 nodes with mixed bindings. Record node/edge/depth/item limits and refuse over-limit work safely.

Measure p50/p95 interactions over repeated warm and cold runs, request latency, network bytes, heap trend, subscriptions, DOM teardown, polling and transfer memory on named hardware. Candidate goals for discussion: ordinary editing feedback ≤100 ms p95, canvas drag frames near 16.7 ms p95 on the agreed reference device, definition open ≤2 s p95 excluding documented network setup. These are proposed budgets, not evidence; D05 can set realistic values with reasons. Preserve existing stricter build budgets until an explicit reviewed change. No arbitrary perf assertion on an unqualified host.

## Acceptance scenario map

Both backlogs use these scenario IDs. Tests must assert actual state and data, not only HTTP 200 or visible success toast.

| Scenario | Required outcome                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A01      | Clean disposable bootstrap; repeat run has no duplicates or unauthorized grants.                                                        |
| A02      | Ordinary role navigation matches API denial; deleted objects absent before paging/count/export.                                         |
| A03      | Two users' profile/preferences/views/favorites/help state remain isolated across logout/login.                                          |
| A04      | Help content en/fa, explicit seen/dismiss/reset, content revision and offline-safe local display.                                       |
| A05      | Saved view preserves validated applied query; revoked/deleted favorite cannot leak or mutate target.                                    |
| A06      | Readiness distinguishes absent/blocked/unknown; repair routes return to context without implicit mutation.                              |
| A07      | Notification map covers recipient, locale, dedupe, cancellation, read, deep link, and revoked access.                                   |
| A08      | Calendar half-open range, all-day, timezone/DST, source edit/cancel and reminder replay.                                                |
| A09      | Metric fixture totals and drill-down match; unknown data not zero; unauthorized counts do not leak.                                     |
| A10      | All twenty supported form kinds have typed visual editors and shared-runtime conformance.                                               |
| A11      | Node/binding/condition/human/subprocess editing round-trips without JSON or dropped hidden properties.                                  |
| A12      | Save WIP, reopen, invalid promotion, valid promotion, publish, and stale competing editor recovery.                                     |
| A13      | Default restore draft/new draft, changed plan rejection and repeat key; active case pins unchanged.                                     |
| A14      | Eligible requester creates draft with private file, saves, submits twice with same key and gets one case.                               |
| A15      | Competing claims, filtered edits, required comments, rejection and return/correction are correct.                                       |
| A16      | Protected operation cannot run from AI next/review routes without valid human approval; correction invalidates relevant prior approval. |
| A17      | Parallel branches and pinned subprocesses finish as configured; no guessed branch recovery.                                             |
| A18      | Separate HTTP sandbox operation yields receipt; timeout after accepted effect reconciles without duplicate.                             |
| A19      | Notification/report/private bytes work through actual worker/storage and same-origin boundary.                                          |
| A20      | Failure survives business rollback where possible; private diagnostic fields absent; sink outage does not recurse.                      |
| A21      | Worker/broker/scheduler interruption, expired ownership, bounded retry, recovery and restore are actually exercised.                    |
| A22      | Session expiry/refresh rotation, two tabs, in-flight logout and uncertain mutations remain safe.                                        |
| A23      | Required desktop/mobile/keyboard/screen-reader/RTL contexts and bounded performance profile are recorded.                               |
| A24      | Both exact check gates pass zero warnings; generated contracts, positive and negative gate probes retained.                             |
| A25      | Demo reset twice restores known template defaults and scenarios without touching non-demo resources.                                    |
| A26      | Actual owner acceptance distinguishes deterministic demo, live vendor integration and live AI evaluation.                               |

---

# Appendix B — Execution and completion rules

# Product delivery execution rules

Version: 1.0.0 · Prepared 2026-10-08 · Applies to the new APP-BE / APP-FE work only, while preserving existing repository rules.

## 1. Outcome and scope

Deliver the agreed product, not a replacement architecture: a usable seed-backed application, no JSON-dependent normal workflows, visual authoring, actual requests and human decisions, an integration receipt, calendar/analytics, settings, saved views/favorites, help, notifications and recorded supportable failures. “n8n-level” means the enumerated editing capabilities, not feature parity with all n8n integrations.

Do not claim perfect software, general production readiness, or acceptance from passing tests. Make each status evidence-based. The product owner retains business decisions and authority to approve scope changes.

## 2. Mandatory intake and no-redo rule

1. Read AGENTS.md, applicable nested instructions, existing root backlog / docs/BACKLOG.md, the APP backlog, relevant change records, README and tool manifests.
2. Record the exact current commit and local modifications without overwriting them. Read the corresponding peer contract manifest when another repository is involved.
3. When graphify-out/graph.json exists and graphify is available, run a scoped graphify query first; use its wiki for broad navigation. After code changes run graphify update . when required. Record unavailable tooling honestly; do not invent a graph result.
4. Search titles, IDs, code, tests and contract owners. Mark the scope REUSE, EXTEND, VERIFY, NEW or CONFLICT. Existing implementations are not new work merely because old docs call them planned.
5. If acceptance already holds, add missing evidence and close only the uncovered delta. Do not rebuild auth, the form renderer, CRUD/search, the canvas, notification delivery, outbox or process engine.
6. Existing IDs stay unchanged. APP tasks are new delivery deltas; their Related field is a crosswalk, not permission to reset old DONE tasks. The APP backlog is authoritative for APP status; old backlog indexes link to it instead of duplicating full task bodies.

## 3. Status vocabulary

Keep legacy Status values READY / BLOCKED / CONFLICT / IN_PROGRESS / DONE. READY means eligible to start, never verified. Initially every task has Verification: NOT_RUN, Change-Record: None, Owner: TBD.

Track evidence separately: DESIGNED → IMPLEMENTED → VERIFIED_LOCAL → VERIFIED_INTEGRATED → DEMO_READY → DEPLOYED → USER_ACCEPTED. These are capability/evidence labels, not application lifecycle states. Do not add these words to process/work-item enums.

A blocked peer contract, inaccessible service, skipped required test, unresolved warning, or missing user signoff remains visible. A dependency is satisfied by actual verified behavior at the required scope, not only another ticket's label.

## 4. Exact completion gate

Every completed implementation task must pass `mise run check` in its repository, from the final working tree, with exit code 0 and zero emitted toolchain/lint/type/build/test warnings. Record command, start/end, tool versions, commit/tree digest, changed files, return codes, pass/fail/skip totals and sanitized log locations. Fast focused commands are useful while working but do not replace the final gate.

Do not shorten the task, remove test files, relax thresholds, add blanket warning suppression, use `--no-warnings`, discard stderr, mask failures with `|| true`, or claim success from an earlier run. Retain exit status when piping logs. Disable automatic retries of failing test runs as a way to hide flaky behavior; fix and rerun, recording the failure and final evidence.

Use native warning enforcement first: linter warning ceiling, type-checker warnings as errors, pytest warning policy, build diagnostics and captured browser console/runtime diagnostics. A final structured summary verifies categories; a grep for the word “warning” is not sufficient. Expected failure-case diagnostics must be explicitly asserted inside negative tests, not escape as unexplained warnings.

The backend baseline contains two narrowly scoped third-party deprecation filters [B04]. Inventory and remediate them; do not quietly classify masked warnings as absent. An unavoidable existing exception needs a separately recorded owner decision and status VERIFIED_WITH_EXCEPTION, not strict warning-free readiness. Existing test names/skips remain visible. An environmental skip does not prove service integration; a deliberate platform-inapplicable test must have a documented reason and cannot cover an acceptance requirement.

Upgrade `mise run check` additively so new contract, help/map, and affected deterministic browser/HTTP checks become repeatable gates. Preserve baseline checks. Keep paid provider calls and destructive restore tests explicit opt-ins; a demo including their outcomes additionally requires separate recorded runs. Do not trigger paid accounts during ordinary checks.

## 5. Integrated and demo completion

A check pass is necessary, not sufficient. A feature crossing API/DB/worker/storage boundaries also needs its specified real-service tests and both sides of the contract. Fixture-only work must be labeled, and not closed as integrated. An unavailable prerequisite means BLOCKED, with the exact setup needed and no false readiness claim.

DEMO_READY requires a pinned repository pair, current generated contracts, genuine browser/network flow, actual migrated disposable services, required scenario coverage, no unexpected browser/server warnings, a reset rehearsal, documented limits, and an inspectable final outcome. Required human approval and no-duplicate-effect behavior are functional acceptance conditions. USER_ACCEPTED requires a named authorized person's actual signoff, never an agent's assumption.

## 6. Contract and architecture rules

Backend business behavior stays under its existing src/apps owner. Routes adapt HTTP; transactions and side effects belong in application services. Shared infrastructure stays in src/core / src/utils only when truly shared. Use existing query/DTO/error/permission conventions. All Python JSON DTOs—including nested request/response/envelope/page models—inherit core.base_dto.BaseDTO. New JSON/OpenAPI fields are snake_case, no serialization aliases; headers are exempt. Preserve existing machine codes even where their strings are not snake_case. Follow multiline SQLModel Field/Column/ForeignKey formatting in AGENTS.md.

Frontend generated types live at the transport edge. Domain models remain independent of PrimeNG, Material and the canvas library. Keep the existing same-origin session boundary; do not move tokens into browser storage. Preserve legacy session wire names during this plan unless an explicit compatible migration is agreed. Never decode opaque ref_id in Angular. Replace mutation references from authoritative responses; a durable favorite/deep link must resolve fresh refs before action.

Proposed paths and DTOs in this pack are design candidates, not discovered APIs. The responsible backend task must check for an existing equivalent, freeze the exact compatible contract and examples, generate OpenAPI, and supply the peer handoff before frontend integration is marked complete. No endpoint may silently change its envelope. Existing operation-specific idempotency keys stay unchanged; new command keys freeze target and payload and reject reuse with different intent.

## 7. Product/UI rules

PrimeNG-first for new/redesigned business controls, Tailwind for layout, existing Material/CDK and specialist canvas controls retained as documented exceptions. Do not remove established libraries or adopt paid replacements without approval. Use pinned-version public APIs and semantic tokens. A generic payload console is not a finished domain screen. Ordinary users must never need a JSON editor or copied reference to complete an in-scope journey.

Every screen specifies loading, empty, invalid, forbidden/revoked, stale/conflicting, uncertain, failed and successful states; preserves edits where safe; and fences async results after actor/context change. English/Farsi display text, keyboard use and RTL/LTR are acceptance, not optional polish. Do not translate machine codes or alter canonical values. Do not introduce Signal Forms/NgRx/a new component framework merely because current documentation advertises it.

## 8. Data, migration and reset safety

Never edit an already-applied initial migration to add new production schema. DB-001 is an established single-file decision; D01 in the backlogs must be resolved before new schema work. Do not stamp away drift, reset shared data or downgrade a populated database to make tests pass. Use uniquely named disposable DB/bucket/queue resources with explicit ownership.

Default restoration operates on editable definitions or creates a new draft. It never changes published payloads, execution pins, submitted data, users/roles/secrets, or provider side effects. Demo-environment reset is a different, guarded operation. The existing backend `mise run reset` deletes Compose volumes: never use it as the demo harness command [B03].

No secret, token, raw payload, private file content, arbitrary stack trace or personal field belongs in ordinary telemetry, support records, screenshots or public artifacts. Failure recording must survive business rollback where possible, but must not recursively fail the request when the recording store is unavailable. Report fallback limitations honestly.

## 9. Execution rhythm and handoff

Select one coherent ready unit, state its result, implement bounded changes, run focused tests, inspect the diff, run the full gate, then update evidence. A large parent task has numbered implementation substeps; split it into suffix tickets before parallel work. Never renumber or duplicate the parent. Serialize migrations, lockfile updates, generated contracts and shared component changes per repository.

Each cross-repo handoff includes exact SHA/tree digest, contract IDs, path/method/operation IDs, DTO/schema changes, permission mapping, lifecycle/replay rules, sample successes/errors, migration/head, service prerequisites, generated OpenAPI hash, tests and unresolved limits. A handoff request does not prove the peer implemented it.

Use docs/changes/TASK-ID.md and the existing change-journal structure. Include baseline reuse, final behavior, compatibility, commands/results, supported limits, risk/decision/backlog updates and peer readiness. Record execution facts only. No new completion claims without a corresponding evidence record.

## 10. Decision and estimate discipline

Unknown owners are TBD. Calendar dates start only after kickoff/capacity is agreed. Effort ranges are planning estimates, not agent runtime guarantees. Re-estimate after intake and the first three implementation tickets. Do not invent model-specific speed multipliers or fabricate deployment, approval, provider access or browser observations.

When a decision blocks only one branch, continue independent tasks; do not repeatedly ask answered questions. Record the exact unresolved choice, recommended default, consequence and affected tasks. Do not silently choose a tenancy model, external provider, destructive reset or incompatible migration policy.

## Non-negotiable distinction checklist

- Published version vs editable workspace vs promoted executable graph: different states and references.
- Stable resource locator vs optimistic mutation ref_id: favorites/deep links resolve current refs, not stale saved tokens.
- Process finished vs business approved vs external receipt confirmed: different evidence; no invented transition codes.
- Soft-deleted vs inactive/retired/cancelled vs retained history: live lists exclude deletion without erasing audit.
- AI recommendation vs read-only tool approval vs required human business approval: none substitutes for another.
- Secret exists vs provider live-verified vs successful business effect: readiness labels must state the actual check.
- Layout reset vs discard unsaved edits vs restore default definition vs destructive demo-environment reset: separate actions and authority.
- Saved view vs raw case data vs permission grant: private query preferences never grant access.
- Seen help content vs permission or task completion: user acknowledgment has no workflow authority.
- Code implemented vs tests verified vs demo-ready vs deployed vs user-accepted: never promote evidence by wording.

---

# Appendix C — Effort and delivery timing

# Timing, capacity and dependency plan

Prepared 2026-10-08. These are analyst planning ranges for future implementation, not measured delivery speed, commitments, model runtimes or dates when work will be done. No task is running asynchronously. Staffing, budget, availability and start date are unknown.

## Estimation model

One person-day is eight hours of task effort including implementation, focused review, tests and documentation. The calendar illustrations assume **four task-days per person per week**; the fifth day covers general coordination/unplanned interruptions outside task estimates. Design/QA/product review capacity must be available, but people are not assigned here. Parallel agents do not automatically equal independent staffed engineers: review and shared-file ownership remain constraints.

Low/high values are optimistic-to-cautious planning estimates, not statistical P50/P90. The ranges have low-to-medium confidence until APP-BE-001 / APP-FE-001 and the first three implementation tasks provide measured throughput. Do not multiply by an invented Sol/model speed factor.

| Workstream | Tasks | Base effort (person-days) | Base hours |
| ---------- | ----: | ------------------------: | ---------: |
| Backend    |    32 |                  85.5–157 |   684–1256 |
| Frontend   |    38 |                 123.5–213 |   988–1704 |
| Combined   |    70 |                   209–370 |  1672–2960 |

For planning, hold an additional **25% explicit integration/rework reserve**: combined **261.25–462.5 person-days**. This is a separately visible assumption, not effort already included in each task or a calibrated probability. Do not add a second unnamed buffer. External access/approval delays are additional elapsed time and are not estimated as engineer work.

## Work by milestone

| Milestone                                          | Backend person-days | Frontend person-days | Combined |
| -------------------------------------------------- | ------------------: | -------------------: | -------: |
| M0 — Baseline and trustworthy checks               |               4.5–9 |                  4–7 |   8.5–16 |
| M1 — Usable application foundation                 |               23–42 |              26.5–48 |  49.5–90 |
| M2 — Visual authoring and safe defaults            |               12–22 |                38–64 |    50–86 |
| M3 — Connected case and actual system outcome      |               27–50 |                32–55 |   59–105 |
| M4 — Calendar, reminders and business insights     |                9–16 |                 7–12 |    16–28 |
| M5 — Full coverage, repeatable demo and acceptance |               10–18 |                16–27 |    26–45 |

Milestone grouping is not a strict waterfall: a calendar/API contract can advance while an unrelated visual inspector is being built. Dependencies in the task index decide ordering. The complete demo requires every mandatory task, not only early milestones.

## Illustrative elapsed-time scenarios

The model schedules the listed dependency graph onto backend/frontend work slots (one non-preempted task per slot), choosing earliest available work and then milestone/ID. Week zero begins only after kickoff/access. It excludes decision/provider waiting and does not explicitly model every shared-file collision; the 25% reserve addresses some, not all, integration uncertainty. These are planning illustrations, not guaranteed deadlines.

| Hypothetical available delivery capacity | Base modeled weeks | With 25% reserve | Interpretation                                                                 |
| ---------------------------------------- | -----------------: | ---------------: | ------------------------------------------------------------------------------ |
| 1 backend + 1 frontend                   |              32–55 |            40–69 | Design/QA/product support available; frontend scope is substantial.            |
| 1 backend + 2 frontend                   |              23–42 |            29–52 | Backend and shared contract decisions increasingly constrain parallel UI work. |
| 2 backend + 2 frontend                   |              18–31 |            23–39 | Requires real review capacity and serialized migration/lockfile ownership.     |

One person performing both workstreams serially has a base workload floor of **53–93 weeks** at the assumed four task-days/week, before reserve and waiting. This is not a recommendation to staff that way; it prevents treating total effort as instant parallel agent throughput.

## Detailed relative windows — illustrative 1 backend + 2 frontend slots

Rows show separate low/high schedules, rounded to one decimal week. “Start L/H” and “Finish L/H” are each scenario’s modeled positions, not a promise that a task may start anywhere in that interval. No calendar start date is assumed.

| Task       | Base days | Start L/H (week) | Finish L/H (week) |
| ---------- | --------: | ---------------: | ----------------: |
| APP-BE-001 |     1.5–3 |        0.0 / 0.0 |         0.4 / 0.8 |
| APP-BE-002 |       2–4 |        0.4 / 0.8 |         0.9 / 1.8 |
| APP-BE-003 |       1–2 |        0.9 / 1.8 |         1.1 / 2.2 |
| APP-BE-004 |       2–4 |        1.1 / 2.2 |         1.6 / 3.2 |
| APP-BE-005 |       3–5 |        1.6 / 3.2 |         2.4 / 4.5 |
| APP-BE-006 |       3–6 |        2.4 / 4.5 |         3.1 / 6.0 |
| APP-BE-007 |       2–4 |        3.1 / 6.0 |         3.6 / 7.0 |
| APP-BE-008 |       3–5 |        3.6 / 7.0 |         4.4 / 8.2 |
| APP-BE-009 |       3–5 |        4.4 / 8.2 |         5.1 / 9.5 |
| APP-BE-010 |       1–2 |        5.1 / 9.5 |        5.4 / 10.0 |
| APP-BE-011 |       2–4 |       5.4 / 10.0 |        5.9 / 11.0 |
| APP-BE-012 |       2–4 |       7.6 / 14.2 |        8.1 / 15.2 |
| APP-BE-013 |       1–2 |       5.9 / 11.0 |        6.1 / 11.5 |
| APP-BE-014 |       4–7 |       9.9 / 18.2 |       10.9 / 20.0 |
| APP-BE-015 |       3–5 |       6.1 / 11.5 |        6.9 / 12.8 |
| APP-BE-016 |       4–7 |      16.6 / 30.8 |       17.6 / 32.5 |
| APP-BE-017 |       2–4 |      17.6 / 32.5 |       18.1 / 33.5 |
| APP-BE-018 |       3–5 |      18.1 / 33.5 |       18.9 / 34.8 |
| APP-BE-019 |       3–6 |       6.9 / 12.8 |        7.6 / 14.2 |
| APP-BE-020 |       3–5 |       8.1 / 15.2 |        8.9 / 16.5 |
| APP-BE-021 |       4–7 |      10.9 / 20.0 |       11.9 / 21.8 |
| APP-BE-022 |       3–6 |      11.9 / 21.8 |       12.6 / 23.2 |
| APP-BE-023 |       4–7 |      12.6 / 23.2 |       13.6 / 25.0 |
| APP-BE-024 |       3–6 |      13.6 / 25.0 |       14.4 / 26.5 |
| APP-BE-025 |       3–6 |      14.4 / 26.5 |       15.1 / 28.0 |
| APP-BE-026 |       4–7 |       8.9 / 16.5 |        9.9 / 18.2 |
| APP-BE-027 |       2–4 |      15.1 / 28.0 |       15.6 / 29.0 |
| APP-BE-028 |       4–7 |      15.6 / 29.0 |       16.6 / 30.8 |
| APP-BE-029 |       3–5 |      18.9 / 34.8 |       19.6 / 36.0 |
| APP-BE-030 |       2–4 |      19.6 / 36.0 |       20.1 / 37.0 |
| APP-BE-031 |       2–4 |      20.1 / 37.0 |       20.6 / 38.0 |
| APP-BE-032 |       3–5 |      20.6 / 38.0 |       21.4 / 39.2 |
| APP-FE-001 |       2–3 |        0.0 / 0.0 |         0.5 / 0.8 |
| APP-FE-002 |       2–4 |        0.5 / 0.8 |         1.0 / 1.8 |
| APP-FE-003 |       3–5 |        1.0 / 1.8 |         1.8 / 3.0 |
| APP-FE-004 |       3–5 |        1.0 / 1.8 |         1.8 / 3.0 |
| APP-FE-005 |       3–5 |        1.8 / 3.0 |         2.5 / 4.2 |
| APP-FE-006 |       3–5 |        4.4 / 8.2 |         5.1 / 9.5 |
| APP-FE-007 |       4–7 |        5.1 / 9.5 |        6.1 / 11.2 |
| APP-FE-008 |       2–4 |        3.6 / 7.0 |         4.1 / 8.0 |
| APP-FE-009 |       2–4 |        5.1 / 9.5 |        5.6 / 10.5 |
| APP-FE-010 |     1.5–3 |       5.6 / 10.5 |        6.0 / 11.2 |
| APP-FE-011 |       2–4 |       8.6 / 15.8 |        9.1 / 16.8 |
| APP-FE-012 |       3–5 |      11.9 / 21.0 |       12.6 / 22.2 |
| APP-FE-013 |       2–4 |       6.9 / 12.8 |        7.4 / 13.8 |
| APP-FE-014 |       4–7 |      18.1 / 33.5 |       19.1 / 35.2 |
| APP-FE-015 |       3–5 |      18.9 / 34.8 |       19.6 / 36.0 |
| APP-FE-016 |       5–8 |       7.6 / 14.2 |        8.9 / 16.2 |
| APP-FE-017 |       4–7 |       8.9 / 16.8 |        9.9 / 18.5 |
| APP-FE-018 |       5–8 |       9.9 / 18.5 |       11.1 / 20.5 |
| APP-FE-019 |       3–5 |      11.1 / 20.5 |       11.9 / 21.8 |
| APP-FE-020 |       4–7 |       6.0 / 11.2 |        7.0 / 13.0 |
| APP-FE-021 |       4–6 |       7.6 / 14.2 |        8.6 / 15.8 |
| APP-FE-022 |       4–7 |      11.9 / 21.8 |       12.9 / 23.5 |
| APP-FE-023 |       4–7 |       9.1 / 16.2 |       10.1 / 18.0 |
| APP-FE-024 |       4–7 |      10.1 / 18.0 |       11.1 / 19.8 |
| APP-FE-025 |       4–7 |      15.1 / 28.0 |       16.1 / 29.8 |
| APP-FE-026 |       4–7 |      17.1 / 31.5 |       18.1 / 33.2 |
| APP-FE-027 |       3–5 |      11.1 / 19.8 |       11.9 / 21.0 |
| APP-FE-028 |       3–5 |      15.6 / 29.0 |       16.4 / 30.2 |
| APP-FE-029 |       4–6 |      12.9 / 23.5 |       13.9 / 25.0 |
| APP-FE-030 |       4–7 |      16.1 / 29.8 |       17.1 / 31.5 |
| APP-FE-031 |       3–6 |       6.1 / 11.2 |        6.9 / 12.8 |
| APP-FE-032 |       3–6 |      18.1 / 33.2 |       18.9 / 34.8 |
| APP-FE-033 |       4–7 |      19.6 / 36.0 |       20.6 / 37.8 |
| APP-FE-034 |       3–5 |      20.6 / 37.8 |       21.4 / 39.0 |
| APP-FE-035 |       3–5 |      20.6 / 37.8 |       21.4 / 39.0 |
| APP-FE-036 |       3–5 |      16.4 / 30.2 |       17.1 / 31.5 |
| APP-FE-037 |       4–6 |      21.4 / 39.0 |       22.4 / 40.5 |
| APP-FE-038 |       2–4 |      22.4 / 40.5 |       22.9 / 41.5 |

## Key dependencies and parallel-work rules

The principal authoring chain is baseline → typed metadata/pickers → form controls and node inspectors → human/mapping/branch/service configuration → publication/defaults → real case → combined browser demo. Calendar/reminders require their own persistence and notification contracts; dashboards require authorized metric definitions. Default restore depends on exact baseline/dependency readiness, not just a reset button.

Run baseline/review/design-system work in parallel across repos. Frontend may use labeled fixtures while a producer contract is being implemented, but that task stays unintegrated. Backend migration writers serialize through one owner. Contract generation, lockfile changes, shared picker components, route registries and seed/template manifests also need a single integration owner per batch. Do not have agents edit the same generated output concurrently.

Tasks APP-BE-032 and APP-FE-038 record backend and full-product acceptance separately. Backend-only verification does not depend on frontend final signoff, preventing a circular dependency; final frontend/product acceptance consumes the backend record.

## Scope additions not hidden in the base estimate

A named vendor integration, Jalali input/conversion, service-principal redesign, multi-replica session store, calendar sync/recurrence or major newly discovered UI/API gaps need scoped estimates after their contracts/access are known. The base includes the local HTTP sandbox adapter and AI evaluation harness, not unbounded provider certification or paid evaluation campaigns. No paid vendor/security/legal approval is assumed.

## Re-estimation checkpoints

After intake, remove already-satisfied implementation work and retain the relevant verification effort. After the first three implementation tasks, measure review/rework and actual check/setup effort, then update task ranges and rerun the dependency model. Reforecast at the first visual-authoring demo, first sandbox receipt and full reset rehearsal. Every change preserves original estimate, new estimate, reason and scope impact; never quietly revise numbers to make a missed target disappear.

## Suggested first execution batch

Start APP-BE-001 and APP-FE-001 together. Follow with APP-BE-002 and APP-FE-002, resolve D01 through APP-BE-003, then seed/live-query work and the frontend Angular/PrimeNG review. Freeze C02–C05 and C11 early so profile/help/views/pickers and visual authoring can proceed independently. No production rollout, paid calls or destructive demo reset is part of this intake batch.

---

# Appendix D — Evidence

## Evidence references

Repository snapshots reviewed on 2026-10-08. These sources establish baseline behavior, not current deployment or new test passes. Re-read changed files before implementation.

- **[B01]** [AGENTS.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/AGENTS.md) — Existing graphify, BaseDTO, snake_case, Swagger and entity-format rules.
- **[B02]** [BACKLOG.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/BACKLOG.md) — Existing IDs, DB-001 single initial revision, historical checks and REPO-004 rebuild limitation.
- **[B03]** [.mise.toml](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/.mise.toml) — Actual check sequence; reset removes Compose volumes and is not a safe demo reset.
- **[B04]** [pyproject.toml](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/pyproject.toml) — Python/dependency constraints and two narrow SDK warning filters.
- **[B05]** [uv.lock](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/uv.lock) — Current dependency lock. Latest commit changes FastAPI to 0.143.0 and pycparser to 3.1; enumerate other packages during intake.
- **[B06]** [src/core/base_repository.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/core/base_repository.py) — Shared list/count/get/delete behavior; list/count do not themselves add deleted_at filtering.
- **[B07]** [src/utils/pagination.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/utils/pagination.py) — Shared query allowlists, pagination and optional base criteria.
- **[B08]** [scripts/seed_frontend_browser.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/scripts/seed_frontend_browser.py) — Disposable browser seed imports a test fixture; reuse scenario knowledge, not this as production bootstrap.
- **[B09]** [src/apps/workflows/application/workspace.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/workflows/application/workspace.py) — Independent WIP revision, explicit promotion and checksum guard.
- **[B10]** [src/apps/workflows/application/validation.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/workflows/application/validation.py) — Existing graph invariants, typed bindings, reachability, split/join and bounded-loop validation.
- **[B11]** [src/apps/workflows/application/service.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/workflows/application/service.py) — Publication/dependency checks, grants and AI handoff checks; extend existing owner.
- **[B12]** [src/apps/step_types/application/automation.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/step_types/application/automation.py) — Built-in service operation catalog inspected contains connection.status.
- **[B13]** [src/apps/integrations/application/providers.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/integrations/application/providers.py) — Status HEAD adapter, endpoint restrictions and AI secret-resolution verification.
- **[B14]** [src/apps/processes/application/automation.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/processes/application/automation.py) — Durable dispatch and publisher-derived execution actor.
- **[B15]** [docs/architecture/ai-governance.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/docs/architecture/ai-governance.md) — AI budgets, tool approval, stricter human-approval limitation and evaluation limits; dependency prose is historical.
- **[B16]** [docs/roadmap/full-workflow.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/docs/roadmap/full-workflow.md) — Reference journey and boundaries of combined versus separate scenario coverage.
- **[B17]** [docs/operations/bpms-safeguards.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/docs/operations/bpms-safeguards.md) — Recovery/retention/restore semantics; migration numbers in historical text must not override current head.
- **[B18]** [src/apps/notifications/domain/dto.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/notifications/domain/dto.py) — Existing notification DTO requires request/process context.
- **[B19]** [src/apps/notifications/presentation/routes.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/notifications/presentation/routes.py) — Existing search/detail/read operations and context-dependent mapper; report delegates to search.
- **[B20]** [src/apps/notifications/application/templates.py](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/src/apps/notifications/application/templates.py) — Code-owned versioned templates, initially workflow.notice, with en/fa text.
- **[B21]** [docs/api/form-localization.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/docs/api/form-localization.md) — Gregorian-only implemented calendar profile; Persian digits are not Jalali conversion.
- **[B22]** [README.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/README.md) — Setup, local success gate and disposable integration warnings.
- **[B23]** [.agents/skills/smart-backlog/SKILL.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/.agents/skills/smart-backlog/SKILL.md) — Preserve IDs, inspect baseline and avoid duplicate work.
- **[B24]** [.agents/skills/change-journal/SKILL.md](https://github.com/Metal-Bat/async-fast-api-base/blob/995829eebd9483ac6b589c1648fc799c650ad464/.agents/skills/change-journal/SKILL.md) — Change-record format and backlog relationships.
- **[F01]** [AGENTS.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/AGENTS.md) — Existing graphify rules.
- **[F02]** [docs/BACKLOG.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/docs/BACKLOG.md) — Stable Steps 1–38 and existing ARC/API/AUTH/UI/FORM/STUDIO/REQ/TASK/PROC/OPS/ADMIN/QA IDs.
- **[F03]** [mise.toml](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/mise.toml) — Actual frontend check commands; full browser/backend suites are separate at baseline.
- **[F04]** [package.json](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/package.json) — Pinned Angular 21.2.25, PrimeNG 21.1.10, Foblex 19.3.0, and available test scripts.
- **[F05]** [docs/UI-LIBRARIES.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/docs/UI-LIBRARIES.md) — Mixed-library baseline, shared theme, in-memory preferences and adapter boundary.
- **[F06]** [docs/STUDIO.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/docs/STUDIO.md) — Existing catalogs, previews, WIP/promote/publish and historical verification.
- **[F07]** [src/app/features/studio/presentation/workflow-board/workflow-board.html](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/src/app/features/studio/presentation/workflow-board/workflow-board.html) — Existing visual board and JSON-based configuration/graph inspectors.
- **[F08]** [src/app/features/studio/presentation/form-builder/form-builder.html](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/src/app/features/studio/presentation/form-builder/form-builder.html) — Current palette/outline and JSON inspectors.
- **[F09]** [src/app/features/studio/infrastructure/workflow-canvas/workflow-canvas.ts](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/src/app/features/studio/infrastructure/workflow-canvas/workflow-canvas.ts) — Actual Foblex implementation: pan/zoom, placement, keyboard movement and read-only behavior.
- **[F10]** [src/app/features/studio/domain/form-authoring.ts](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/src/app/features/studio/domain/form-authoring.ts) — Twenty code-owned primitive kinds and bounded outline operations.
- **[F11]** [scripts/check-platform-contract.mjs](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/scripts/check-platform-contract.mjs) — Checks checked-in evidence, hashes, IDs and refs; not a live backend compatibility proof.
- **[F12]** [docs/ADMINISTRATION.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/docs/ADMINISTRATION.md) — Existing administration and generic nested-configuration limitations.
- **[F13]** [docs/RELEASE-READINESS.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/docs/RELEASE-READINESS.md) — Local evidence, manual accessibility/heap/staging and external signoff limits.
- **[F14]** [docs/SESSION-BOUNDARY.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/docs/SESSION-BOUNDARY.md) — Accepted same-origin server-held token design; single-process session-store limitations.
- **[F15]** [server/session-boundary.mjs](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/server/session-boundary.mjs) — Refresh/replay safety, timeout, response buffering and legacy session wire names.
- **[F16]** [server/main.mjs](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/server/main.mjs) — Incoming body limit and buffering, loopback listener and static serving integration.
- **[F17]** [README.md](https://github.com/Metal-Bat/angular-base/blob/afe4bbe5f566c80e7eb45f6ef9f12c041d60139d/README.md) — Historical completion/next-step text conflicts; reconcile against code and task evidence.

### Official technical guidance

Consulted 2026-10-08; live documentation can describe versions newer than the locked project. No automatic framework/library upgrade is authorized.

- **[O01]** [Angular style guidance: feature organization, cohesive components and readable templates; verify APIs against pinned v21.](https://angular.dev/style-guide)
- **[O02]** [Typed reactive forms and null/disabled-value semantics; no blanket conversion of the runtime renderer.](https://angular.dev/guide/forms/typed-forms)
- **[O03]** [Lifecycle-aware subscription cleanup.](https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed)
- **[O04]** [Official design-token approach. Live docs redirect to newer-version site: do not import newer-only APIs into pinned v21.](https://primeng.org/theming/styled)
- **[O05]** [Interaction reference for visual mapping; not an instruction to copy n8n code or execution semantics.](https://docs.n8n.io/data/data-mapping/data-mapping-ui/)
- **[O06]** [Warnings-as-errors and explicit assertion of expected warning cases.](https://docs.pytest.org/en/stable/how-to/capture-warnings.html)
- **[O07]** [Native lint warning thresholds, including max-warnings; verify builder forwarding in installed version.](https://eslint.org/docs/latest/use/command-line-interface)
- **[O08]** [Mise task behavior; the repository task configuration remains the command authority.](https://mise.jdx.dev/tasks/)
- **[O09]** [Locked dependency synchronization and lock freshness.](https://docs.astral.sh/uv/concepts/projects/sync/)
