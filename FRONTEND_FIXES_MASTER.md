# Frontend fixes — single-file master backlog

**Revision:** 3.3 — rebased against the newer frontend source, 13 October 2026  
**Frontend reviewed:** `Metal-Bat/angular-base`, `main` resolved to `f12efc443bfb9d073594c12567d9088d55687c66`  
**Commit:** `feat(studio): improve form authoring and workflow interactions`, committed 12 October 2026 at 19:03:02 UTC  
**Deliverable:** updated repair/verification plan, not a code patch  
**Application verification performed in this review:** NOT_RUN

## Local implementation continuation — 13 October 2026

The reviewed plan above remains historical review evidence. Current work extends the first-priority selection, navigation, direct connections, card placement and adjacent preview slices and introduces pinned Chromium/Firefox Playwright pilots. See the [implementation/evidence record](docs/changes/APP-FE-020.UX01.md). These are partial slices of existing IDs; the remaining main and nested acceptance is open. No parent is closed and no fixture result establishes real-service readiness. Final check and browser artifacts, including failed attempts, govern actual verification.

## Start here

**Do not execute the previous backlog as 58 missing features. The newer frontend already implements material parts of that work.** Retain the existing canvas, field-card surface, typed inspectors, runtime, shared controls, sessions and paired harness. Prioritize the remaining direct-manipulation gaps and a genuinely adjacent live client preview, with Playwright checks using the current pnpm toolchain.

This file supersedes revision 3.2 as an implementation input. It retains **58 main repair/verification IDs: 52 frontend and 6 conditional backend**, plus **24 nested authoring units and 8 nested Playwright units**. The nested units are not additional features or additive estimates. No canonical repository ticket was changed, closed or reopened by this review.

The repository's APP parent roadmap is a different counting level. The inspected receipts continuation reports **38 original APP-FE parents: 13 DONE and 25 open** at that record's scope/date; that is not 38 more tasks to add to this file. Its newer consistency and assistant follow-ups also retain their own IDs and are not silently absorbed into this repair count. See [R14](#source-r14), [R15](#source-r15), [R20](#source-r20).

### Evidence limits

All frontend reads in this recheck are pinned to the commit above. I inspected selected current source, the latest commit diff, relevant contracts/decisions and delivery records; I did not inspect every route, provider, test or dependency. The uploaded `openapi.json` was read and counted, but is not assumed to identify the current deployed API. The backend was not freshly code-audited here. Unpushed local frontend changes are outside the reviewed commit.

No application build, browser/Playwright run, full `mise run check`, live API/worker test, migration, deployment or user acceptance was executed. A local clone attempt failed because `github.com` could not resolve; the GitHub connector remained usable. The local runtime had Node 22.16.0, not the repository's required Node 24 toolchain; mise and graphify were not available. The ignored local graph was not queried, and no graph refresh is claimed. The repository product-delivery skill path returned 404; its available contract-consistency skill and relevant instructions were read. Existing recorded test passes are attributed to repository records, not to this review.

### How to use the updated classifications

| Disposition                   | Meaning                                                                                                                     |  Items |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -----: |
| EXTEND                        | There is current code or a documented delivered slice; implement only the remaining behavior and regression coverage.       |     29 |
| REGRESSION                    | Shared scope is recorded delivered; reuse it and verify touched integrations. This review does not reopen it for a rebuild. |      6 |
| VERIFY                        | The task is principally evidence/conformance or current-pair validation; repair only reproduced failures.                   |     10 |
| REVIEW                        | Full current feature source was not re-audited; inspect before estimating or claiming missing implementation.               |      7 |
| CONDITIONAL                   | Backend investigation only; a new implementation requires a confirmed existing-service gap.                                 |      6 |
| **Total main tracking items** | **Not a reproduced-bug count or a remaining-effort measure.**                                                               | **58** |

These are review dispositions, not replacements for `PROPOSED`, `IMPLEMENTED`, `VERIFIED_INTEGRATED`, `BLOCKED`, `DEPLOYED` or `USER_ACCEPTED` in the repository. A prior acceptance record at another source identity remains valuable historical evidence, not automatic acceptance of this commit.

## What changed since the earlier review

| Earlier assumption or plan                                        | New source/evidence                                                                                                             | Updated action                                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| No canvas context menu                                            | Current adapter has node Inspect / Connect / Duplicate and blank Fit / Reset. [R08](#source-r08)                                | Extend to the missing edge/group/node/blank actions; retain the existing shared menu seam.                        |
| Dragging confined to the heading; no click-to-connect             | Latest change record/diff describes whole-card dragging and click-to-connect with visible actions. [R16](#source-r16)           | Regress these through actual gestures; complete group and outcome-aware behavior.                                 |
| Only dropdown/outline form editing                                | A selectable field-card canvas and six quick-add controls now exist. [R05](#source-r05), [R11](#source-r11)                     | Improve this surface rather than starting another builder.                                                        |
| No field reparenting or layout duplication                        | Both are implemented with safe scope/identity rules and recorded scoped acceptance. [R12](#source-r12), [R13](#source-r13)      | Reuse transforms; finish direct surface insertion and ergonomics.                                                 |
| Grid columns/coordinates/accessibility settings absent            | Current continuation records those controls and runtime interpretation delivered. [R13](#source-r13)                            | Retain; verify exact preview/runtime and laptop/mobile behavior.                                                  |
| No simple draft creation or saved-form display                    | Latest form record adds Create draft and a saved-version Display tab. [R16](#source-r16)                                        | Preserve; do not confuse saved-version display with adjacent unsaved-design preview.                              |
| Every inspector edit requires reloading                           | WorkflowInteractions now has panel-specific discardPending. [R10](#source-r10)                                                  | Reuse discard; fix broad navigation disabling and local buffers.                                                  |
| Component inspector accessible name is untranslated               | The current properties section has a localized bound accessible name. [R05](#source-r05)                                        | Remove that specific fix; address remaining literal preview/diagnostic accessible names.                          |
| Frontend remains on 314 operations / 425 schemas                  | Later acceptance records 379 operations / 565 schemas and newer intake lineage. [R13](#source-r13), [R19](#source-r19)          | Withdraw the old blanket drift claim; compare the exact current pair. Matching counts alone are insufficient.     |
| Shared settings/pickers/help/analytics must be built              | Current shared handoff records scoped DONE results. [R14](#source-r14)                                                          | Reuse and regress; keep remaining specialist adoption with its owner.                                             |
| Receipt/recovery APIs and runtime conformance are missing         | Newer records describe implemented, consumed contracts and scoped real-service evidence. [R13](#source-r13), [R15](#source-r15) | Narrow conditional backend proposals; keep true destination/eligibility gaps separate.                            |
| npm/package-lock are the active tooling                           | Current repo uses pnpm@12.11.2, pnpm-lock.yaml and strict pnpm-workspace settings. [R03](#source-r03)                           | Use the existing toolchain for Playwright; no second lockfile.                                                    |
| D01/DB-001 blocks persistence; all backend warnings are forbidden | Current AGENTS references DB-002 and exact D07 backend exceptions. [R02](#source-r02)                                           | Reconcile actual current decisions. Keep frontend zero-warning gates; do not widen or relabel backend exceptions. |

## First fixes to implement now

These are priorities inside existing tasks, **not additional tickets**.

### 1. Fix the canvas selection model — APP-FE-020.UX01.d

**Source-derived logic finding, not browser-reproduced here:** a normal `WorkflowCanvas.select()` calls `selectNode`, while `WorkflowBoard.select()` updates only `selected`. Existing `selectionKeys` can survive. `WorkflowInteractions.duplicate()` prefers those keys. Selecting a single different node after selecting a group can therefore leave the toolbar command targeting the previous group. Starting Shift-selection from a lone selected node also needs a defined anchor. [R08](#source-r08), [R09](#source-r09), [R10](#source-r10).

**Fix:** one authoritative selection transition for ordinary click, modifier click, blank click, keyboard and context actions. Keep current guarded duplication; avoid fixing the toolbar by hiding the stale selection.

**Regression:** select A+B, ordinary-click C, assert only C is active, Duplicate selection creates only C's copy, and undo restores the exact graph. Repeat using visible node actions, Shift anchor and cleared selection. Right-clicking another node must never mutate an unrelated old group.

### 2. Keep navigation usable during editing — APP-FE-020.UX01.b / APP-FE-021.UX01.a

The board still supplies `disabled: readonly() || pending().length > 0`; the canvas checks it for menu opening, zoom, fit, reset and transforms. Distinguish disabled mutation, read-only inspection and navigation. Keep existing panel discard and invalid-input guards. Pan/zoom must not call the semantic-history path or mark a published graph modified. [R08](#source-r08), [R09](#source-r09), [R10](#source-r10).

**Acceptance:** leave a typed property incomplete, pan/zoom/find/inspect safely, return with the buffer preserved; no definition write occurs. Read-only graph navigation works without enabling edits. One drag/reconnection is one undo step; navigation does not consume semantic undo history.

### 3. Make direct connections explicit and editable — APP-FE-020.UX01.e/f/g

Preserve port dragging, click-to-connect and the already implemented keyboard connection controls. Direct canvas callbacks still pass only source/target; the board falls back to its separate `outcome`. Bring outcome/type choice to the connection point. Add direct edge inspection, safe rewiring/deletion/insertion and context actions using actual supported outcomes and data contracts. [R08](#source-r08), [R09](#source-r09), [R13](#source-r13).

**Acceptance:** the designer deliberately chooses an outcome, sees it on the wire, and save/reopen retains it. Invalid rewiring leaves the original edge untouched. Insertion does not change branch meaning or silently bypass human approval. Edge/group menus act on their visible target; keyboard/non-drag alternatives remain.

### 4. Turn the current field-card surface into efficient visual editing — APP-FE-016.UX01/02 and APP-FE-017.UX02

Keep FormCanvas, quickAdd, fresh keys, reparentPlacement, configured field placement and typed inspectors. Current cards are flattened indented buttons with decorative answer lines, not live client controls; their inspected template has no card insertion/drag handlers. Add real before/after/inside drop targets, empty-container guidance and contextual field placement without changing canonical scope. [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12).

**Acceptance:** add a common field without typing a key, insert between existing fields, move between allowed containers by drag or explicit command, and save/reopen. Invalid collection crossing is rejected without data loss. Placement duplication remains labelled shared-binding behavior.

### 5. Keep a real client preview beside the current design — APP-FE-019.UX02.a/b

The new card canvas is not the client preview. The actual RuntimeForm is still below the workspace, triggered by Preview; document edits clear it and the shared busy flag can disable the editor during its request. Build the requested adjacent dock using the existing preview API/renderer. The saved-version Display tab is reusable, but must not substitute a saved version for unsaved design. [R05](#source-r05), [R06](#source-r06), [R07](#source-r07), [R16](#source-r16).

**Acceptance:** change label/required/geometry, see bounded automatic refresh, retain compatible synthetic answers, and continue editing during preview loading. Fence by document generation, locale, purpose, width-relevant presentation and actor; a late result cannot restore an older form. Show preview freshness/invalid design honestly. No request creation, live upload, approval or provider call occurs from preview.

### 6. Finish complex form authoring, not the already delivered basics — APP-FE-017–019

Keep typed geometry/accessibility, scalar constraints, configured media/collection placement, sum/concat/count and simple localized catalog repair. Complete complex collection/media/action configuration, approved dynamic source/context choices, overrides, real PageSettings/views/actions and parameterized messages. Use the existing twenty-kind contracts for actual conformance. [R13](#source-r13), [R15](#source-r15).

**Acceptance:** construct the reference form without normal JSON/copied refs, including repeated rows, private attachments, dynamic options and permitted corrections. Preserve exact numeric strings, zero/false, null/absence, row IDs and authorization across designer/preview/requester/reviewer.

### 7. Add Playwright against the current runner and toolchain — APP-FE-002.UX01.PW01–PW08

Use pnpm and the same-origin production application boundary. Preserve the current fixture harness, browser sandbox, temporal scope, diagnostics, screenshots and recorded real-service journeys. Pilot actual canvas pointer/menu/save interactions and form-edit/live-preview/save interactions first; migrate remaining browser scopes only after a coverage crosswalk. Do not silently replace actual gestures with graph injection or fixture APIs with integration claims. [R03](#source-r03), [R16](#source-r16), [R17](#source-r17).

**Acceptance:** current-source Chromium and Firefox evidence, safe isolated actors/data, no required skips or retry-only passes, typed/linted Playwright config/tests, retained failure traces with synthetic/redacted data. Compare runtime at equivalent coverage on the same environment before claiming speed gains. Existing timing/teardown test failures require diagnosis, not raised thresholds or suppressed warnings.

## Updated main task index

Numbers below match the previous understandable 1–58 list. IDs remain unchanged. Each card later in this file includes the current delta and retained target acceptance. Source labels link to pinned evidence. `REVIEW` does not mean missing; `REGRESSION` does not mean freshly reverified.

### A — Shared foundations

| No. | Existing ID                         | Outcome                                                      | Current disposition |
| --: | ----------------------------------- | ------------------------------------------------------------ | ------------------- |
|   1 | [APP-FE-001.UX01](#app-fe-001-ux01) | Reconcile the current frontend/backend baseline              | VERIFY              |
|   2 | [APP-FE-001.UX02](#app-fe-001-ux02) | Create a reproducible visual and usability baseline          | VERIFY              |
|   3 | [APP-FE-004.UX01](#app-fe-004-ux01) | Unify design tokens and action hierarchy                     | EXTEND              |
|   4 | [APP-FE-007.UX01](#app-fe-007-ux01) | Make navigation and record screens task-oriented             | REGRESSION          |
|   5 | [APP-FE-007.UX02](#app-fe-007-ux02) | Standardize field controls and recovery states               | REGRESSION          |
|   6 | [APP-FE-006.UX01](#app-fe-006-ux01) | Reuse authorized resource pickers and verify editor adoption | REGRESSION          |
|   7 | [APP-FE-005.UX01](#app-fe-005-ux01) | Recover safely from stale and uncertain mutations            | EXTEND              |
|   8 | [APP-FE-036.UX01](#app-fe-036-ux01) | Preserve the session boundary and private transfers          | VERIFY              |

### B — Form builder

| No. | Existing ID                         | Outcome                                                            | Current disposition |
| --: | ----------------------------------- | ------------------------------------------------------------------ | ------------------- |
|   9 | [APP-FE-016.UX01](#app-fe-016-ux01) | Deliver a visual form workspace with a live client-preview dock    | EXTEND              |
|  10 | [APP-FE-016.UX02](#app-fe-016-ux02) | Finish safe cross-parent field and layout movement                 | EXTEND              |
|  11 | [APP-FE-016.UX03](#app-fe-016-ux03) | Complete placement duplication without changing canonical bindings | EXTEND              |
|  12 | [APP-FE-016.UX04](#app-fe-016-ux04) | Finish responsive editor and runtime layout parity                 | EXTEND              |
|  13 | [APP-FE-016.UX05](#app-fe-016-ux05) | Clarify pending edits, Apply, Save, Undo and Publish               | EXTEND              |
|  14 | [APP-FE-017.UX01](#app-fe-017-ux01) | Verify every declared form primitive end to end                    | VERIFY              |
|  15 | [APP-FE-017.UX02](#app-fe-017-ux02) | Provide typed canonical-field creation and binding                 | EXTEND              |
|  16 | [APP-FE-017.UX03](#app-fe-017-ux03) | Build typed validation controls and actionable errors              | EXTEND              |
|  17 | [APP-FE-017.UX04](#app-fe-017-ux04) | Complete collection and table configuration                        | EXTEND              |
|  18 | [APP-FE-017.UX05](#app-fe-017-ux05) | Finish attachment configuration and transfer feedback              | EXTEND              |
|  19 | [APP-FE-018.UX01](#app-fe-018-ux01) | Replace ordinary behavior JSON with constrained rules              | EXTEND              |
|  20 | [APP-FE-018.UX02](#app-fe-018-ux02) | Make dynamic choices type-safe and race-safe                       | EXTEND              |
|  21 | [APP-FE-018.UX03](#app-fe-018-ux03) | Clarify calculations and manual overrides                          | EXTEND              |
|  22 | [APP-FE-019.UX01](#app-fe-019-ux01) | Build typed pages, views, variants and localization                | EXTEND              |
|  23 | [APP-FE-019.UX02](#app-fe-019-ux02) | Deliver live side-by-side preview conforming to the shared runtime | EXTEND              |
|  24 | [APP-FE-019.UX03](#app-fe-019-ux03) | Make sample input and diagnostics navigable                        | EXTEND              |

### C — Requester/reviewer

| No. | Existing ID                         | Outcome                                                          | Current disposition |
| --: | ----------------------------------- | ---------------------------------------------------------------- | ------------------- |
|  25 | [APP-FE-028.UX01](#app-fe-028-ux01) | Complete eligible creation and resumable private drafts          | REVIEW              |
|  26 | [APP-FE-028.UX02](#app-fe-028-ux02) | Redesign the runtime form for understandable completion          | REVIEW              |
|  27 | [APP-FE-028.UX03](#app-fe-028-ux03) | Protect runtime patch, row and attachment semantics              | VERIFY              |
|  28 | [APP-FE-028.UX04](#app-fe-028-ux04) | Show truthful progress, history and final outcomes               | EXTEND              |
|  29 | [APP-FE-029.UX01](#app-fe-029-ux01) | Complete work queues and claim-race recovery                     | VERIFY              |
|  30 | [APP-FE-029.UX02](#app-fe-029-ux02) | Render exact configured human decisions                          | VERIFY              |
|  31 | [APP-FE-029.UX03](#app-fe-029-ux03) | Complete targeted return and linked correction                   | REVIEW              |
|  32 | [APP-FE-029.UX04](#app-fe-029-ux04) | Separate AI recommendations, tool approval and business approval | EXTEND              |

### D — Workflow canvas and configuration

| No. | Existing ID                         | Outcome                                                        | Current disposition |
| --: | ----------------------------------- | -------------------------------------------------------------- | ------------------- |
|  33 | [APP-FE-020.UX01](#app-fe-020-ux01) | Make the workflow canvas a usable direct-manipulation editor   | EXTEND              |
|  34 | [APP-FE-021.UX01](#app-fe-021-ux01) | Build exact-version typed node inspectors                      | EXTEND              |
|  35 | [APP-FE-022.UX01](#app-fe-022-ux01) | Finish assignment and human-task inspectors                    | REVIEW              |
|  36 | [APP-FE-023.UX01](#app-fe-023-ux01) | Provide typed visual data mapping                              | EXTEND              |
|  37 | [APP-FE-024.UX01](#app-fe-024-ux01) | Complete supported branch, timer, event and subprocess editors | REVIEW              |
|  38 | [APP-FE-025.UX01](#app-fe-025-ux01) | Finish governed integration and AI configuration               | EXTEND              |
|  39 | [APP-FE-027.UX01](#app-fe-027-ux01) | Make publication, repair and version comparison understandable | EXTEND              |

### E — Supporting screens

| No. | Existing ID                         | Outcome                                                        | Current disposition |
| --: | ----------------------------------- | -------------------------------------------------------------- | ------------------- |
|  40 | [APP-FE-012.UX01](#app-fe-012-ux01) | Finish unified inbox and authenticated SSE behavior            | EXTEND              |
|  41 | [APP-FE-014.UX01](#app-fe-014-ux01) | Complete calendar team selection, dates and reminders          | EXTEND              |
|  42 | [APP-FE-015.UX01](#app-fe-015-ux01) | Preserve and regress the implemented analytics experience      | REGRESSION          |
|  43 | [APP-FE-030.UX01](#app-fe-030-ux01) | Replace generic integration/AI administration JSON             | REVIEW              |
|  44 | [APP-FE-031.UX01](#app-fe-031-ux01) | Finish identity, group, client and request-type administration | REVIEW              |
|  45 | [APP-FE-032.UX01](#app-fe-032-ux01) | Make reports, execution receipts and recovery usable           | EXTEND              |
|  46 | [APP-FE-013.UX01](#app-fe-013-ux01) | Preserve and regress safe support/error handling               | REGRESSION          |
|  47 | [APP-FE-008.UX01](#app-fe-008-ux01) | Preserve preferences, saved views, favorites and help          | REGRESSION          |

### F — Verification and release

| No. | Existing ID                         | Outcome                                                          | Current disposition |
| --: | ----------------------------------- | ---------------------------------------------------------------- | ------------------- |
|  48 | [APP-FE-033.UX01](#app-fe-033-ux01) | Close real API/UI coverage and correct the JSON register         | VERIFY              |
|  49 | [APP-FE-034.UX01](#app-fe-034-ux01) | Verify remaining accessible names and multilingual authoring     | EXTEND              |
|  50 | [APP-FE-035.UX01](#app-fe-035-ux01) | Measure bounded performance and lifecycle cleanup                | VERIFY              |
|  51 | [APP-FE-037.UX01](#app-fe-037-ux01) | Prove the connected reference journey and a second configuration | VERIFY              |
|  52 | [APP-FE-002.UX01](#app-fe-002-ux01) | Adopt Playwright and complete current-tree evidence gates        | EXTEND              |

### G — Conditional backend work

| No. | Existing ID                         | Outcome                                                                    | Current disposition |
| --: | ----------------------------------- | -------------------------------------------------------------------------- | ------------------- |
|  53 | [APP-BE-008.UX01](#app-be-008-ux01) | Verify or provide actor-eligible team selection                            | CONDITIONAL         |
|  54 | [APP-BE-014.UX01](#app-be-014-ux01) | Reconcile inbox destination producers and documentation                    | CONDITIONAL         |
|  55 | [APP-BE-019.UX01](#app-be-019-ux01) | Fill only demonstrated designer metadata or diagnostic gaps                | CONDITIONAL         |
|  56 | [APP-BE-020.UX01](#app-be-020-ux01) | Verify existing runtime conformance; repair proven backend mismatches only | CONDITIONAL         |
|  57 | [APP-BE-027.UX01](#app-be-027-ux01) | Close proven outcome and reconciliation projection gaps                    | CONDITIONAL         |
|  58 | [APP-BE-028.UX01](#app-be-028-ux01) | Adapt the existing disposable paired harness for browser acceptance        | CONDITIONAL         |

## Workload and implementation order

**The earlier baseline and Sol-assisted effort figures are superseded as current remaining-work estimates.** They were uncalibrated planning scenarios over older evidence, not measured agent speed. This recheck has not run timed implementation or acceptance, so it does not justify a replacement number or a completion percentage. Task count is not effort; recorded delivery may reduce implementation while newly exposed regression work still needs capacity.

Re-estimate only the residual criteria after current-source reproduction. Separate hands-on effort, unattended test time, environment/access waiting and rework. Do not add 24 authoring units or eight Playwright units to the 58 parent-level budgets. Do not apply another AI discount to already AI-assisted effort. The prior 3–6-day Playwright setup allowance is likewise historical/unvalidated until the current pnpm/sandbox migration is scoped.

**Order:** reconcile current source/contracts and pilot Playwright; fix selection/navigation and outcome/menu behavior; finish the form workspace and adjacent preview; close complex form and reference-journey conformance; then remaining specialist/supporting scope and release evidence. Canvas and form workers may proceed on independent slices, but one worker owns generated contracts/lockfiles/shared mutations at a time. Named owners and capacity remain TBD. No calendar deadline is invented.

Calendar membership selection and reserved operation notification targets block only their owning user actions. They do not block local canvas navigation, context menus, visual form placement or the existing unsaved-document preview. Backend D07 exceptions do not block safe frontend implementation or excuse frontend warnings. Preserve deployment/user acceptance as separate decisions.

## Cross-repository decisions and true backend deltas

The six conditional IDs remain available; they are not six approved new backend features. Current frontend records describe both existing form/operation support and two specific remaining gaps: ordinary active-membership team selection and MAP-07/08 operation destinations. Reminder configuration projection and dispatch-age/compensation-state hints are narrower candidates under their current owners, not reasons to create generic UI APIs. Validate all against the actual latest backend before writing new contracts. [R14](#source-r14), [R15](#source-r15).

Follow current AGENTS and the backend approved-decisions/DB-002 records before any migration. Preserve actual GET/PATCH self-profile/preferences compatibility, BaseDTO/snake_case, server-owned eligibility/permission, opaque current refs, immutable published pins, exact operation-specific unchanged replay intent and required human approval. Do not reset shared data, alter applied revisions or stamp away drift. Keep NG-ZORRO and the documented display-calendar behavior; neither requires changing canonical wire dates or the default PrimeNG business UI policy.

The upload has 379 operations/565 schemas; the later editor intake records those same counts, but the upload's byte hash is different from the current manifest's English hash. **Equal counts do not establish equal contracts; differing bytes alone do not establish a breaking semantic mismatch.** Choose one acknowledged current producer, compare operation/schema/security/localization changes and retain history rather than selecting an old `current_operations` field. [R19](#source-r19), [R21](#source-r21).

## Updated detailed task cards

All inherited requirements below are target/preservation criteria, not proof that the feature is absent. The **current delta** controls remaining implementation; existing completed slices and their acceptance must not be rebuilt. Carry forward the original IDs, priority semantics and unknown named owners. New execution/verification during this review: NOT_RUN for every card.

<a id="app-fe-001-ux01"></a>

### 1. APP-FE-001.UX01 — Reconcile the current frontend/backend baseline

**Priority:** P0 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** The old 314-operation assertion is historical. The 016–020 acceptance records a 379-operation/565-schema generated client and exact paired equality for that tested candidate. The current manifest also has a later en/fa/ar intake. Freeze the actual current pair and semantic diff; do not overwrite it with the uploaded snapshot merely because counts match. Repair stale current-status prose, including README next-step and migration statements.

**Current evidence:** [R01](#source-r01), [R02](#source-r02), [R13](#source-r13), [R19](#source-r19), [R21](#source-r21).

**Retained target / preservation criteria.** Read the authoritative backlogs, AGENTS.md and actual generated-client source. Record both repository commit SHAs, schema hash, client/release and locked versions from package/lockfiles and pyproject.toml/uv.lock. Build a delta map of normal UI, approved advanced UI, boundary/internal operations and explicit product exclusions. Refresh 012, 014 and 016–020 blockers separately; do not reset completed work.

**Acceptance to preserve or complete.** A clean regeneration/diff identifies the exact contract consumed by the build. Each changed operation has an owner, screen/action and test. Existing completion history remains intact. Backend metadata availability does not automatically close a parent’s browser acceptance. Do not compare a generated snapshot only against itself and call that paired verification.

**Capability dependencies (not an instruction to redo completed parents).** First intake task. Independent visual and accessibility work can proceed in parallel. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-001-ux02"></a>

### 2. APP-FE-001.UX02 — Create a reproducible visual and usability baseline

**Priority:** P1 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** UX, frontend, QA, product owner; named owners TBD

**Current delta.** Reproduce the owner-reported failures on this exact commit. Capture workflow and form-builder screenshots plus actual gesture recordings, at desktop/laptop/narrow widths. No new browser reproduction or visual inspection was performed in this review, so do not carry old screenshots or old absence claims forward.

**Current evidence:** [R01](#source-r01), [R05](#source-r05), [R08](#source-r08), [R11](#source-r11).

**Retained target / preservation criteria.** Inspect actual requester, reviewer, designer, administrator, operator and auditor journeys; validate these personas. Capture request lists, runtime forms, review screens, form/workflow builders, inbox and administration using synthetic data. Record route, viewport, locale, theme, expected/actual behavior and impact. Select workflow canvas, form builder and client runtime form as the first design-review set. Treat the owner-reported canvas/form-builder interaction failures as authoring release blockers and record direct pointer/menu/preview reproduction, not only screenshots. Use the v2 work-unit acceptance walks.

**Acceptance to preserve or complete.** Every visual defect has reproducible browser evidence. Present coherent alternatives for the three authoring/client pilot screens and record the owner’s choice. Separate visual approval from functional acceptance. Do not claim pixel-perfect, mobile-ready or screen-reader-ready from source inspection or one desktop screenshot.

**Capability dependencies (not an instruction to redo completed parents).** 001.UX01 for reproducible environment identity; not a dependency on new backend functionality. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-004-ux01"></a>

### 3. APP-FE-004.UX01 — Unify design tokens and action hierarchy

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** UX, frontend; named owners TBD

**Current delta.** Reuse the existing semantic tokens, full-width console, shared temporal controls and documented library exceptions. NG-ZORRO is now intentionally installed alongside PrimeNG and Material; it is not evidence of an unauthorized replacement. Concentrate visual changes on editor panel proportions, action hierarchy, density and overlays, without broad CSS changes to working screens.

**Current evidence:** [R03](#source-r03), [R04](#source-r04), [R05](#source-r05).

**Retained target / preservation criteria.** Use the existing PrimeNG-first policy and documented Material/CDK/native/Foblex exceptions. Standardize typography, spacing, surfaces, readable form width, control sizes, focus, borders, validation and disabled states. Give each task a clear primary action; keep dangerous actions distinct. Propose comfortable/compact list density only where it helps. Do not install a new UI framework, paid kit or state system.

**Acceptance to preserve or complete.** The three authoring/client pilot screens share a coherent hierarchy in English/Farsi, RTL/LTR and supported themes. Long labels and zoom remain readable. Styling does not change canonical values, authorization or workflow semantics. Product review accepts the direction before application-wide restyling.

**Capability dependencies (not an instruction to redo completed parents).** 001.UX02. Can proceed without new APIs. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-007-ux01"></a>

### 4. APP-FE-007.UX01 — Make navigation and record screens task-oriented

**Priority:** P1 | **Review disposition:** REGRESSION | **New application verification:** NOT_RUN  
**Owner roles:** UX, frontend; named owners TBD

**Current delta.** The shared list/detail/dialog pattern is recorded DONE / VERIFIED_INTEGRATED under APP-FE-007. Preserve it. Test editor return paths, authorized repair navigation and current list context; implement only a concrete adoption or usability defect found on the affected screen. Do not rebuild the app shell or shared CRUD patterns.

**Current evidence:** [R14](#source-r14), [R18](#source-r18).

**Retained target / preservation criteria.** Preserve Operations/Studio/Administration. Standardize list-first pages with purpose, primary action, search/filters, results and bounded pagination. Details lead with meaningful title, status and allowed actions. Put technical IDs in optional copyable details. Preserve list context on return using only non-sensitive route state. Keep request, process, work-item and notification states distinct.

**Acceptance to preserve or complete.** A requester starts or resumes work without entering a reference ID; a reviewer returns to the same queue context. Empty data differs from no search matches. Direct restricted navigation fails safely even when the menu is hidden. No client-side role check is treated as server authorization.

**Capability dependencies (not an instruction to redo completed parents).** 004.UX01 and 006.UX01; reuse the existing route structure. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-007-ux02"></a>

### 5. APP-FE-007.UX02 — Standardize field controls and recovery states

**Priority:** P1 | **Review disposition:** REGRESSION | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, accessibility QA; named owners TBD

**Current delta.** Shared field, validation, feedback, select and temporal controls exist; APP-FE-007 shared-pattern acceptance is recorded complete. Reuse them in new editor surfaces and test pending, invalid, forbidden and uncertain states there. The remaining editor buffer problems do not justify another generic field system.

**Current evidence:** [R04](#source-r04), [R14](#source-r14).

**Retained target / preservation criteria.** Extend cohesive shared wrappers around existing controls. Support persistent labels, help, required indicators, inline errors, read-only explanations and accessible descriptions. Define loading, empty, invalid, forbidden/revoked, stale/conflicting, uncertain, failed and successful states. Use persistent recovery messages for unresolved failures rather than toast-only feedback. Retain legitimate multiline text fields.

**Acceptance to preserve or complete.** Wrappers have keyboard, focus, read-only/disabled, error association and long-translation tests. Failed saves retain authorized input. Loading is not displayed as empty data. Validation is not color-only. A missing server result never produces an invented success message.

**Capability dependencies (not an instruction to redo completed parents).** 004.UX01; coordinate with 034.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-006-ux01"></a>

### 6. APP-FE-006.UX01 — Reuse authorized resource pickers and verify editor adoption

**Priority:** P0 | **Review disposition:** REGRESSION | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** APP-FE-006 is recorded DONE for all sixteen paged picker kinds and available selected-value hydration. Reuse its current domain/adapter seams. Later adoption by node/field inspectors stays with those feature owners. A membership-aware calendar picker is a distinct unresolved eligibility contract, not a reason to replace generic pickers.

**Current evidence:** [R14](#source-r14).

**Retained target / preservation criteria.** Reuse existing authorized selectors and POST /api/v1/resource-links/selected for supported kinds. Implement bounded search, pagination, cancellation, selected values outside page one and clear unavailable states. Preserve opaque keys and exact version pins. The selected endpoint accepts at most 50 items and fails atomically for ineligible input; do not invent partial success or issue unbounded per-item probes.

**Acceptance to preserve or complete.** Saved selections remain readable when not on the current page. Slow old queries cannot replace new results. Revocation invalidates protected label caches. Selected-value visibility, detail access and execution authority are tested separately. A retired version is not silently replaced by latest.

**Capability dependencies (not an instruction to redo completed parents).** 001.UX01; extend the existing picker implementation. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-005-ux01"></a>

### 7. APP-FE-005.UX01 — Recover safely from stale and uncertain mutations

**Priority:** P0 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** Shared competing-edit and uncertain-result recovery has recorded acceptance. Focus new work on workflow/form pending buffers and save/reload behavior. Current editor code still has broad busy/pending gates. Verify exact stale-ref and lost-response recovery at those screens rather than reimplementing shared transport or idempotency.

**Current evidence:** [R07](#source-r07), [R09](#source-r09), [R10](#source-r10), [R14](#source-r14).

**Retained target / preservation criteria.** Model dirty, sending, confirmed, validation-failed, conflict and unknown-outcome states. Adopt current owning refs after every successful mutation, including collections and attachment changes. On 409 preserve authorized local input and fetch current state before proposing a merge. Replay only the same supported operation with unchanged command key and exact payload. Changed intent requires reconciliation and a new command. Do not blindly retry refresh rotation or non-idempotent actions.

**Acceptance to preserve or complete.** Test double click, a response lost after commit, stale refs, changed replay payload, route teardown and actor change. A supported replay commits at most one business effect. Timeout is labeled uncertain until reconciled. Local input never leaks to a subsequent actor or survives revocation contrary to policy.

**Capability dependencies (not an instruction to redo completed parents).** 001.UX01 and the exact owning mutation contracts. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-036-ux01"></a>

### 8. APP-FE-036.UX01 — Preserve the session boundary and private transfers

**Priority:** P0 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend boundary, backend, security QA; named owners TBD

**Current delta.** Keep the established same-origin boundary and private transfers. Newer receipts records retain the real HTTPS/expiry/size/fault matrix as unfinished; a shared session store remains conditional on multi-replica deployment. Preserve the recently repaired anonymous-asset boundary fixture while migrating browser coverage.

**Current evidence:** [R15](#source-r15), [R16](#source-r16), [R18](#source-r18).

**Retained target / preservation criteria.** Retain the documented same-origin Node boundary with server-held tokens. Verify refresh coordination, return navigation, session expiry, logout and actor changes. Do not introduce browser token storage or Angular confidential-client secrets. Use authorized case/work-item/report content routes and release temporary object URLs. Preserve private no-store behavior through proxies and service workers. Treat multi-replica deployment as a separate validated design.

**Acceptance to preserve or complete.** Concurrent requests do not create refresh storms. Logout clears protected caches and subscriptions. Another actor cannot download a prior actor’s content through a copied UI destination. Transfer failures disclose no tokens or provider internals. Local demo checks are not represented as deployed proxy or HA acceptance.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01; existing boundary and transfer tests. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-016-ux01"></a>

### 9. APP-FE-016.UX01 — Deliver a visual form workspace with a live client-preview dock

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** UX, frontend; named owners TBD

**Current delta.** A FormCanvas, quick field buttons and palette/canvas/properties layout now exist. The true runtime preview is still a separate section outside the designer grid. Adapt the current workspace into tools/edit/live-preview composition; keep properties available without hiding the client preview. Do not create a second form engine.

**Current evidence:** [R05](#source-r05), [R06](#source-r06), [R07](#source-r07), [R11](#source-r11).

**Retained target / preservation criteria.** Deliver tools dock → editable form surface → resizable interactive client preview. Components, Outline and Properties can share the tools dock rather than crowding four columns. Add contextual field selection, clear insertion targets, typed fast creation, sensible properties and responsive panel fallback. Keep preview visible while designing; no raw JSON or copied references in normal authoring. Implement the v2 work units with exact runtime semantics.

**Acceptance to preserve or complete.** A designer builds the agreed reference form with preview beside it, changes labels/required rules, enters synthetic values, reorders fields, changes language/width, saves and reopens without losing edits or copying IDs. Actual requester/reviewer rendering remains a separate paired gate. See APP-FE-016.UX01.a and APP-FE-019.UX02.a/b.

**Capability dependencies (not an instruction to redo completed parents).** 004.UX01, 007.UX02; coordinate existing 016/017 ownership. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-016-ux02"></a>

### 10. APP-FE-016.UX02 — Finish safe cross-parent field and layout movement

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, QA; named owners TBD

**Current delta.** reparentPlacement and destination controls already exist with collection-context, cycle/root and bound checks; the continuation records scoped real-service evidence. Extend direct insertion/reordering on the visual form surface, including before/after/inside targets and cancellation. Reuse the domain transform; do not permit cross-collection rebinding as an ordinary move.

**Current evidence:** [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13).

**Retained target / preservation criteria.** Add valid destinations, insertion indicators and a Move to container command. Reject cycles and unsupported nesting. Preserve node identity and canonical scope for placement-only moves. Crossing repeated-data scopes requires explicit compatible rebinding; do not silently change data meaning. Provide single-pointer non-drag and keyboard alternatives, announcements and predictable selection/focus. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** Move between supported groups, reorder locally and attempt invalid nesting. Undo/redo and save/reopen preserve identity and meaning. Invalid movement leaves the document unchanged with useful feedback. Keyboard and non-drag pointer flows each complete the task.

**Capability dependencies (not an instruction to redo completed parents).** 016.UX01; existing form-authoring/form-editing invariants. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-016-ux03"></a>

### 11. APP-FE-016.UX03 — Complete placement duplication without changing canonical bindings

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend contract reviewer, QA; named owners TBD

**Current delta.** Nested vertical/horizontal/grid placement duplication is implemented. It deliberately shares canonical bindings and gives copied nodes fresh identities. Preserve this behavior and explain it in the UI. Complete the requested duplication ergonomics; creating independent canonical fields is a separate explicitly supported operation, not a silent change to duplicateLayout.

**Current evidence:** [R06](#source-r06), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15).

**Retained target / preservation criteria.** Distinguish duplicate placement from create a new canonical field. Assign new stable node keys. Share a canonical binding only when supported and intentionally selected. New fields require unique paths and dependency validation. Duplicate collections must not reuse runtime row identities. Disable unsupported duplication modes instead of guessing their semantics. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** Duplicates have unique node identities, clear shared/new-data behavior and valid nesting. Undo/redo/save/reopen preserve the intended result. Existing schema remains unchanged for placement-only duplication. Incompatible copies are rejected before mutation.

**Capability dependencies (not an instruction to redo completed parents).** 016.UX01 and 017.UX02. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-016-ux04"></a>

### 12. APP-FE-016.UX04 — Finish responsive editor and runtime layout parity

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** UX, frontend, backend contract reviewer; named owners TBD

**Current delta.** Bounded grid columns plus column/span/row and accessibility controls/runtime consumption have recorded delivery. Do not list these as absent. Complete panel resizing/width modes and preview/runtime parity using the actual geometry dialect. The current builder stacks the full workspace below 80rem; test laptop usability rather than assuming desktop columns remain available.

**Current evidence:** [R05](#source-r05), [R13](#source-r13).

**Retained target / preservation criteria.** Expose only supported grid, width, wrapping and container properties from the current render contract. Add narrow/desktop previews and purposeful stacking. Store versioned presentation metadata separately from canonical values. Do not invent breakpoint fields, arbitrary CSS or renderer capabilities. A demonstrated missing supported property becomes a paired backend proposal. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** Long English/Farsi labels, help and errors do not overlap. Narrow forms avoid page-wide horizontal scrolling; intentional tables have their own navigation. Save/reopen reproduces the authored presentation. Unsupported dialect/capability combinations show explicit compatibility errors.

**Capability dependencies (not an instruction to redo completed parents).** 016.UX01, 001.UX01; conditional APP-BE-019.UX01 only if needed. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-016-ux05"></a>

### 13. APP-FE-016.UX05 — Clarify pending edits, Apply, Save, Undo and Publish

**Priority:** P0 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, QA; named owners TBD

**Current delta.** Bounded history, current-ref save, route-change cleanup and pending-edit protection already exist. The builder still rejects selection with pending node/inspector/settings edits and clears preview when edits change. Replace the interaction trap with scoped recoverable buffers and truthful applied/saved states; preserve invalid input and canonical semantics.

**Current evidence:** [R06](#source-r06), [R07](#source-r07), [R13](#source-r13).

**Retained target / preservation criteria.** Show inspector-pending, local-unsaved, saving, saved and conflicting states distinctly. Preserve current bounded history and edit fences. Explain blocked actions. Confirm destructive reload/navigation and prevent silent discard on selection changes. Publication remains separate and versioned. Do not add autosave without deliberate concurrency and privacy semantics. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** Apply never claims server persistence. Selection changes and undo cannot silently discard pending edits. Failed/stale saves preserve authorized input. Successful save adopts current refs and survives reopen. Published versions remain immutable and visibly read-only.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01; current builder state/history behavior. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-017-ux01"></a>

### 14. APP-FE-017.UX01 — Verify every declared form primitive end to end

**Priority:** P0 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** The twenty primitives and backend conformance support are not missing. The recorded scoped editor acceptance does not cover all twenty kinds, nested collections, attachments, actions, numeric/null/omission and correction combinations. Build the remaining actual-browser conformance matrix and fix only failing cases.

**Current evidence:** [R13](#source-r13), [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Create a matrix for action, attachment_collection, boolean, calculated, choice, date, datetime, display, grid, group, horizontal, integer, media, number, repeater, table, text, textarea, user and vertical. Track applicable palette, inspector, valid/invalid configuration, persistence, rendering, submission, read-only and localization behavior. Use the real field/render contracts. Distinguish layout/display/action from data controls.

**Acceptance to preserve or complete.** Every advertised kind passes its applicable real-service round trip. Cover false, zero, empty, null, missing and numeric precision where relevant. Unsupported renderers fail clearly rather than being advertised ready. Fixture-only and backend-only evidence remain separately labeled.

**Capability dependencies (not an instruction to redo completed parents).** 001.UX01, 016.UX01; paired APP-BE-019/020 review. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-017-ux02"></a>

### 15. APP-FE-017.UX02 — Provide typed canonical-field creation and binding

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend contract reviewer; named owners TBD

**Current delta.** Six quick-add field types with automatic unused keys/stable identities and existing-field placement controls now exist. Configured collection/choice/media placement restoration has recorded delivery. Extend purposeful controls to the remaining complex canonical/binding cases and exact scalar semantics; keep label changes separate from canonical renames.

**Current evidence:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R13](#source-r13), [R15](#source-r15), [R16](#source-r16).

**Retained target / preservation criteria.** Add a field browser with canonical path, type and localized label. Separate binding existing data from creating fields. Label changes must not rename canonical keys. Show dependency impact before key/type changes. Removing a layout placement must not delete canonical schema or submitted data. Preserve untouched unknown metadata rather than losing it during typed editing. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** A designer creates/binds supported fields without JSON. Display-label changes retain canonical values. Placement removal preserves schema. Duplicate paths and incompatible types are rejected meaningfully. Existing documents round-trip without silent data/metadata removal.

**Capability dependencies (not an instruction to redo completed parents).** 017.UX01; 016.UX03; current dependency metadata. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-017-ux03"></a>

### 16. APP-FE-017.UX03 — Build typed validation controls and actionable errors

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, accessibility QA; named owners TBD

**Current delta.** Typed constraints/options and grid/accessibility editing are already present. Finish the complex/deepest-pointer configuration and correction matrix, including preserved invalid buffers and meaningful repair focus. Do not rebuild simple required/min/max controls that already satisfy acceptance.

**Current evidence:** [R13](#source-r13), [R20](#source-r20).

**Retained target / preservation criteria.** Expose supported required/type/length/range/choice constraints. Separate draft warnings from publication blockers. Map safe pointer diagnostics to field/node labels and repair links. Runtime forms need inline messages and a linked error summary, retaining machine codes for safe support. Do not reveal hidden fields or compile arbitrary authored executable code.

**Acceptance to preserve or complete.** Invalid configuration identifies the relevant inspector control. Failed runtime submission preserves input and focuses an appropriate summary/field. Unknown pointers produce safe useful messages. Unrelated edits do not incorrectly clear unresolved server errors. Backend validation remains authoritative.

**Capability dependencies (not an instruction to redo completed parents).** 007.UX02, 017.UX01, 005.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-017-ux04"></a>

### 17. APP-FE-017.UX04 — Complete collection and table configuration

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** Stable collections and configured placement restoration exist. Remaining work is complex collection row structures/actions, safe scope edits and full requester/reviewer row-identity conformance. Reordering/duplicating visual placements must not create canonical rows or cross collection ancestry.

**Current evidence:** [R12](#source-r12), [R13](#source-r13), [R15](#source-r15).

**Retained target / preservation criteria.** Provide supported column/child settings, limits, labels and add/remove/reorder/duplicate permissions. Distinguish table presentation from repeatable data. Show an editable example through the shared renderer. Structural runtime changes use stable item_key commands; attachment and feedback addresses must not use array position as identity.

**Acceptance to preserve or complete.** Configuration works without JSON. Real-service tests add/edit/reorder/duplicate/remove rows; duplicates receive new identities. Existing feedback and attachments remain with the correct row after movement. Invalid structural commands fail atomically.

**Capability dependencies (not an instruction to redo completed parents).** 017.UX01/02 and 028.UX03. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-017-ux05"></a>

### 18. APP-FE-017.UX05 — Finish attachment configuration and transfer feedback

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, security QA; named owners TBD

**Current delta.** Attachment option controls and existing media/collection placement restoration must be reused. Verify the remaining complex rules, private upload/link/replace/correction and failure paths through real services. Simulated author preview cannot be used as evidence that private transfers work.

**Current evidence:** [R13](#source-r13), [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Expose only supported file count/type/size/required policies. Represent uploading, failed upload, uploaded-but-unlinked, linked, replacing/removing and unavailable states when applicable. Retry each step under its own contract and refresh owning refs. Show scanning/quarantine only if the server supplies it. Use authorized attachment content routes, never public substitutes.

**Acceptance to preserve or complete.** Invalid files give useful feedback. Lost upload/link responses do not create duplicates or falsely satisfy required attachments. Reorder/replace/remove maintain ownership and current refs. A different actor cannot access the content. Submission waits for required links to be confirmed.

**Capability dependencies (not an instruction to redo completed parents).** 036.UX01, 005.UX01; paired attachment contract. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-018-ux01"></a>

### 19. APP-FE-018.UX01 — Replace ordinary behavior JSON with constrained rules

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend contract reviewer; named owners TBD

**Current delta.** Basic typed behavior and registered calculation controls exist. Finish supported rule/operator/source configuration and navigation diagnostics without requiring normal JSON. Complex shape coverage remains a frontend consumption problem unless an exact producer gap is demonstrated.

**Current evidence:** [R13](#source-r13).

**Retained target / preservation criteria.** Build typed source/operator/value/effect controls only for supported behavior. Show readable rule summaries and dependencies. Preserve unsupported expressions in safe read-only/approved expert form instead of silently rewriting them. Use server behavior/runtime preview and reject stale preview results. Never use eval/new Function or treat client rules as authorization. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** A designer configures and previews supported conditional behavior without JSON. False/zero/empty/null/absent cases follow the contract. Cycles and invalid references have useful errors. Hiding/disabling a field does not automatically erase its canonical value contrary to server policy.

**Capability dependencies (not an instruction to redo completed parents).** 017.UX01/02/03; existing APP-FE-018 implementation. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-018-ux02"></a>

### 20. APP-FE-018.UX02 — Make dynamic choices type-safe and race-safe

**Priority:** P0 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** The builder already provides the author RUNTIME_OPTIONS port, and the shared renderer/options infrastructure exists. Complete approved source/context editing, selected-key resolution, dependent-query cancellation and stale-response tests. Preserve typed values, authorization and exact input context.

**Current evidence:** [R06](#source-r06), [R13](#source-r13).

**Retained target / preservation criteria.** Provide typed supported option-source/dependency configuration. Preserve json-scalar/1 distinctions between number 1, string "1", false and null where allowed. Use designer endpoints for authoring and pinned case/work-item options at runtime. Fence results by source revision, dependency fingerprint, generation, current form and actor. Cancel/coalesce searches. Remote metadata is not permission for arbitrary URL fetching.

**Acceptance to preserve or complete.** A slower old response cannot replace the latest results. Dependency changes revalidate or invalidate selections with a clear explanation. Off-page saved values remain readable through authorized hydration. Revoked options cannot be submitted from cache. Submission revalidates actual saved values.

**Capability dependencies (not an instruction to redo completed parents).** 006.UX01, 017.UX01, 005.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-018-ux03"></a>

### 21. APP-FE-018.UX03 — Clarify calculations and manual overrides

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** sum/concat/count configuration and server evaluation have recorded scoped acceptance. Remaining work is full override authorization, dependency invalidation, function/expression compatibility and usable repair feedback. Keep the registered calculator instead of inventing a browser-side execution engine.

**Current evidence:** [R13](#source-r13).

**Retained target / preservation criteria.** Provide supported typed calculation settings and read-only runtime values. Show authorized automatic/manual provenance only when supplied. Manual override requires the declared permission, reason and current override command. Reset uses server recomputation. Explain invalidation when source inputs change. Do not invent currencies, thresholds or formula capabilities.

**Acceptance to preserve or complete.** Unauthorized users cannot edit calculated fields through controls or crafted patches. Override/reset use current refs and record required reasons. Changed inputs invalidate stale overrides as specified. Preview is labeled simulation, not execution or approval evidence.

**Capability dependencies (not an instruction to redo completed parents).** 017.UX01/02 and 005.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-019-ux01"></a>

### 22. APP-FE-019.UX01 — Build typed pages, views, variants and localization

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, UX, backend contract reviewer; named owners TBD

**Current delta.** Plain catalog repair, en/fa/ar display and several view controls exist. Full PageSettings/default_view/actions/variants and parameterized/plural/format authoring remain incompletely consumed in the recorded criteria. Preserve working Arabic and session display-calendar behavior even though English/Farsi remain the reference acceptance locales.

**Current evidence:** [R04](#source-r04), [R13](#source-r13), [R16](#source-r16), [R19](#source-r19).

**Retained target / preservation criteria.** Provide supported page/view management, ordering and localized titles/help/errors/options. Distinguish edit, summary and print views. Surface missing translations and publication requirements. Client variants use trusted registered client/release policy, not browser identity claims. Locale changes affect text/direction, never canonical values or exact pins. Farsi does not imply Jalali wire dates. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** A designer configures supported pages/translations without JSON. Required translation problems block publication with repair guidance. Runtime locale switches preserve input and form/design identity. Print/summary remain nonmutating and do not reveal hidden values.

**Capability dependencies (not an instruction to redo completed parents).** 017.UX01/02, 018.UX01, 001.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-019-ux02"></a>

### 23. APP-FE-019.UX02 — Deliver live side-by-side preview conforming to the shared runtime

**Priority:** P0 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** The actual renderer and manual preview already exist; saved-version Display also exists. Neither is the requested automatic adjacent preview for the current unsaved design. Reuse api.preview and RuntimeForm, split preview loading from editor busy, preserve compatible sample values and fence outdated document/locale/purpose/actor responses.

**Current evidence:** [R05](#source-r05), [R06](#source-r06), [R07](#source-r07), [R16](#source-r16).

**Retained target / preservation criteria.** Use the existing app-runtime-form in an interactive preview dock. POST /api/v1/forms/runtime-preview accepts current unsaved FormDocuments and bounded synthetic data; debounce changes and reject obsolete responses using actor/document/purpose/locale generations. Separate design state from sample input, preserve compatible preview values, and label local/server-verified/stale/error states. Keep no-side-effect simulation explicit. Compare to actual authorized requester/reviewer projections. See APP-FE-019.UX02.a/b.

**Acceptance to preserve or complete.** Changing the applied design updates the adjacent interactive client preview without manual persistence or a full reload. Slow older responses cannot replace newer revisions. Compatible input/focus survives edits; invalid configuration and network failure show a truthful stale/error state. Equivalent authorized real-case scenarios agree on applicable runtime behavior, without any request, upload, approval or external effect from preview.

**Capability dependencies (not an instruction to redo completed parents).** 017.UX01, 018.UX01/02; paired test environment. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-019-ux03"></a>

### 24. APP-FE-019.UX03 — Make sample input and diagnostics navigable

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, UX; named owners TBD

**Current delta.** Typed sample edits update sampleJson, and diagnostics already contain links. Finish normal synthetic scenario controls and readable repair summaries. Keep a clearly stale last-good preview or an explicit unavailable state; raw diagnostics/context editors must be optional expert tools rather than the normal path.

**Current evidence:** [R05](#source-r05), [R07](#source-r07).

**Retained target / preservation criteria.** Use a normal shared-runtime sample-data form, accessible diagnostic list, severity filtering and jump-to-field/node links. Keep sanitized raw diagnostics optional for approved experts. Separate authoring validity, behavior simulation, renderer compatibility, publication readiness and requester eligibility; do not collapse them into one green badge. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** A supported pointer opens the right inspector without losing unrelated edits. Unknown diagnostics stay safely visible. Pure preview success cannot enable a blocked business action. Synthetic values and private data do not enter telemetry or support payloads.

**Capability dependencies (not an instruction to redo completed parents).** 017.UX03 and 019.UX02. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-028-ux01"></a>

### 25. APP-FE-028.UX01 — Complete eligible creation and resumable private drafts

**Priority:** P1 | **Review disposition:** REVIEW | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** Existing requester creation/private drafts are documented; this review did not re-audit their full current source. Receipts and requester-to-process navigation have newer scoped acceptance. Reproduce only the remaining creation/resume/eligibility/attachment cases before estimating new implementation.

**Current evidence:** [R15](#source-r15), [R18](#source-r18), [R20](#source-r20).

**Retained target / preservation criteria.** Use POST /api/v1/request-types/eligible/search, not designer discovery, to show localized eligible types. Create the draft with the actual DTO, then load its authorized pinned view. Provide clear save state, private attachments, review-before-submit and a meaningful next destination. Never silently repin to a newer published form or switch client presentation outside the explicit resume policy.

**Acceptance to preserve or complete.** A non-superuser starts, saves, leaves and resumes a draft with attachments. Revoked eligibility/client access fails safely. Publishing a newer version does not change the draft pin. Submission returns an honest persistent state/receipt rather than only a toast.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01, 006.UX01, 019.UX02, 036.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-028-ux02"></a>

### 26. APP-FE-028.UX02 — Redesign the runtime form for understandable completion

**Priority:** P1 | **Review disposition:** REVIEW | **New application verification:** NOT_RUN  
**Owner roles:** UX, frontend, accessibility QA; named owners TBD

**Current delta.** Reuse the actual shared runtime, responsive geometry and temporal controls. Review real requester completion screens with the new designed forms; no current browser evidence here establishes that the entire runtime UI needs replacement. Retain the user-facing clarity requirement.

**Current evidence:** [R04](#source-r04), [R13](#source-r13), [R15](#source-r15).

**Retained target / preservation criteria.** Use readable width, meaningful sections, persistent labels/help and a clear primary completion action. Group related short fields when useful; avoid forcing every form into a wizard. Put errors inline and in a linked summary that identifies affected pages. Explain locked/calculated values where authorized. Distinguish Save draft from Submit and preserve inputs through recovery.

**Acceptance to preserve or complete.** A requester completes the reference form without implementation-team coaching. Invalid submission retains authorized values and directs repair. Zoom, long Farsi labels and mobile keyboard positioning do not obscure focus or actions. Successful submission remains inspectable after navigation.

**Capability dependencies (not an instruction to redo completed parents).** 004.UX01, 007.UX02, 017.UX03, 028.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-028-ux03"></a>

### 27. APP-FE-028.UX03 — Protect runtime patch, row and attachment semantics

**Priority:** P0 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** Existing stable row, duplicate-placement DOM identity and private-data projection work must remain. Run the remaining numeric/string/false/zero/empty/null/omission and hidden-field/attachment correction matrix through real requester/reviewer routes. Fix only reproduced projection/patch defects.

**Current evidence:** [R13](#source-r13), [R15](#source-r15).

**Retained target / preservation criteria.** Use visible/writable/required metadata. Restricted work-item updates preserve omitted properties, treat null as a value and use delete_paths only where supported. Keep legacy replacement semantics explicit. Do not blindly serialize disabled/read-only controls or equate disabled with deletion. Use collection commands and stable row identities; adopt returned current refs for subsequent attachment/feedback edits.

**Acceptance to preserve or complete.** Tests cover false, zero, empty string, null, omission, explicit deletion, hidden/calculated/read-only values and row reorder. Changing array position cannot move another row’s file or feedback. Stale structural changes fail atomically. Actor changes remove protected canonical caches.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01, 017.UX04/05; existing runtime adapter. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-028-ux04"></a>

### 28. APP-FE-028.UX04 — Show truthful progress, history and final outcomes

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, UX; named owners TBD

**Current delta.** Authorized receipt/AI evidence projection and task-to-process navigation now exist with recorded en/fa requester evidence. Preserve the intentional denial of full process access to contracted-task reviewers. Finish remaining progress/outcome routes and uncertainty explanation without widening backend authorization.

**Current evidence:** [R15](#source-r15).

**Retained target / preservation criteria.** Build a summary/timeline only from authorized projections. Distinguish request, process, work item, external receipt, report and notification states. Label unknown/awaiting-reconciliation explicitly. The uploaded request-history contract omits values, comments and actor identities; do not fabricate a full audit trail from it. Link to authorized evidence or identify a narrow projection gap.

**Acceptance to preserve or complete.** Submitted is not labeled approved. Process completion is not labeled externally fulfilled without receipt evidence. Missing data is not rendered as zero/success. History ordering/pagination remains private and bounded. Cancellation/compensation appears only where actually supported.

**Capability dependencies (not an instruction to redo completed parents).** 028.UX01, 032.UX01; conditional APP-BE-027.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-029-ux01"></a>

### 29. APP-FE-029.UX01 — Complete work queues and claim-race recovery

**Priority:** P0 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** The newer twenty-case rehearsal records successful competing-claim cases after retained failures. Reuse the claim/work-list implementation and rerun on the current pair under Playwright; expand the user-visible race/recovery matrix rather than treating claims as absent. This review did not rerun the rehearsal.

**Current evidence:** [R15](#source-r15).

**Retained target / preservation criteria.** Provide supported available/my-work/history views, useful status/due information and persistent queue filters. Show claim/release/start only under actual rules. Re-read current state after claim. Handle claim races with safe current information rather than a generic error. Do not infer authorization from group names or cached membership.

**Acceptance to preserve or complete.** Two reviewers race for one item against real database-backed behavior: only the winner gets edit controls. The loser can recover to current state/queue. Closed, forwarded or revoked work becomes noneditable. Stale refs and membership loss are tested, not simulated by unrelated fixtures.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01, 007.UX01; exact work-item transitions. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-029-ux02"></a>

### 30. APP-FE-029.UX02 — Render exact configured human decisions

**Priority:** P0 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** Human approval and lost-approval-reply scenarios are recorded in the newer receipt rehearsal. Preserve configured server-owned actions and approval evidence. Verify the complete action/view/reason/authorization matrix; an external receipt or AI recommendation is never a substitute for required human approval.

**Current evidence:** [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Render supplied action title, kind, outcome_key, confirmation, required_scopes, require_comment and validation mode. Use the actual complete/reject/return command with current claimant, ref and command key. Collect required reasons before dispatch. Do not assume every task supports every action or that complete always means business approval. Keep submitted data immutable.

**Acceptance to preserve or complete.** A complete-only task gains no reject/return actions. Every decision enforces the exact outcome and required fields/reason. Duplicate/lost-response tests produce one supported atomic resume. No required human decision is fulfilled by an AI result or a browser-only state change.

**Capability dependencies (not an instruction to redo completed parents).** 029.UX01, 028.UX03, 022.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-029-ux03"></a>

### 31. APP-FE-029.UX03 — Complete targeted return and linked correction

**Priority:** P1 | **Review disposition:** REVIEW | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, UX, QA; named owners TBD

**Current delta.** Targeted corrections remain within the open requester/reviewer scope, but their full latest implementation was not inspected here. Reuse existing correction feedback/rows/attachments and identify the precise missing cases before making changes.

**Current evidence:** [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Allow selection of authorized field/row targets and the declared return outcome with reason. Render feedback beside the affected fields in the linked correction draft; distinguish unresolved/resolved items. Keep the original submission immutable. Show before/after values only if authorized projections supply them. Preserve private attachment links under the correction policy.

**Acceptance to preserve or complete.** New-contract returns contain required authorized feedback. Reordering rows cannot retarget feedback. Only authorized editors resolve it. Replayed return commands do not create duplicate drafts. Correction resubmission follows the configured workflow, not a new invented transition.

**Capability dependencies (not an instruction to redo completed parents).** 029.UX02, 028.UX03, 017.UX04/05. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-029-ux04"></a>

### 32. APP-FE-029.UX04 — Separate AI recommendations, tool approval and business approval

**Priority:** P0 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend AI owner, QA; named owners TBD

**Current delta.** AI evidence and historical model/agent pins have recorded requester projection. Separate recommendation, tool approval and human business decision in all applicable screens. Finish unsupported presentation cases and safe inputs without inventing confidence values or permission to show protected tool arguments.

**Current evidence:** [R15](#source-r15).

**Retained target / preservation criteria.** Show authorized typed recommendation/context/limitations without invented confidence scores or raw prompt/tool dumps by default. Give tool approvals their own purpose, requested action and safe connection/destination impact where supplied. Bind choices to current task/input/version evidence. Treat generated text and attachments as untrusted display content. Define an honest governed fallback for unavailable AI.

**Acceptance to preserve or complete.** AI never automatically ticks/submits a mandatory human approval. Changed/stale inputs invalidate or recheck approval according to backend policy. Tool approval and purchase approval remain separate actions/states. Unsafe generated content cannot invoke arbitrary routes or tools.

**Capability dependencies (not an instruction to redo completed parents).** 029.UX02, 025.UX01; actual AI approval contracts. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-020-ux01"></a>

### 33. APP-FE-020.UX01 — Make the workflow canvas a usable direct-manipulation editor

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, UX, QA; named owners TBD

**Current delta.** Whole-card dragging, node/blank context menus, visible Step actions, click-to-connect and keyboard connection/reconnection controls now exist. Complete edge/group menus, marquee/group pointer behavior and outcome-aware direct wiring. Fix source-observed stale multi-selection and navigation/history coupling. Preserve the existing Foblex adapter and domain commands.

**Current evidence:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13), [R16](#source-r16).

**Retained target / preservation criteria.** Deliver n8n-like direct manipulation on the existing Foblex adapter: canvas-first workspace, navigation independent of editing, precise node placement/Add next, selection/group drag, visible typed outcome-aware connections, direct edge selection/rewire/delete/safe insertion, contextual menus with alternatives, one-action-one-undo, scoped typed inspector buffers, and truthful current-ref save/recovery. Preserve the backend control/data model and required human approval. See APP-FE-020.UX01.a–i and APP-FE-021.UX01.a.

**Acceptance to preserve or complete.** Complete the v2 workflow and recovery walkthroughs through actual pointer/keyboard interactions and real save/reopen. Published inspection remains navigable without writes. Every saved wire carries the intended outcome/binding. Cancelled/invalid gestures do not change the graph; history is atomic; stale writes preserve authorized work. Owner acceptance of usefulness is separate from engineering checks.

**Capability dependencies (not an instruction to redo completed parents).** APP-FE-004.UX01 and exact current editor contracts. Navigation, menus, pointer feedback and local selection do not wait for unrelated calendar/dashboard/provider work. Escalate only proven semantic/metadata gaps to their backend owner. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-021-ux01"></a>

### 34. APP-FE-021.UX01 — Build exact-version typed node inspectors

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend workflow owner; named owners TBD

**Current delta.** Typed inspector infrastructure and panel-specific discardPending already exist. Do not claim every edit requires a reload. The canvas still receives one broad disabled flag for read-only or any pending edit. Keep local property buffers while allowing safe pan/zoom/inspection, and finish exact-version complex inspectors without JSON.

**Current evidence:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R20](#source-r20).

**Retained target / preservation criteria.** Dispatch typed inspectors by exact handler key/version/fingerprint. Use GET /api/v1/designer/inspector-contract and POST /api/v1/designer/config-validation for schema, ports, outcomes and safe errors. Separate deployed handler discovery from permission to use forms, agents or connections. Preserve unknown configuration until a compatible editor exists; never choose latest automatically. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** In-scope nodes are configured without JSON. Missing/changed handler contracts show an explicit unavailable state. Pointer errors navigate to relevant controls. Loading/validating metadata does not execute a handler, provider or workflow.

**Capability dependencies (not an instruction to redo completed parents).** 020.UX01, 006.UX01, 001.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-022-ux01"></a>

### 35. APP-FE-022.UX01 — Finish assignment and human-task inspectors

**Priority:** P1 | **Review disposition:** REVIEW | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend workflow owner, QA; named owners TBD

**Current delta.** Current follow-up describes partial human-task/candidate/view controls; this review did not inspect every latest inspector. Verify exact forms, views, field policy, required scopes and assignment behavior first, then implement the remaining normal controls. Reuse the completed generic picker service.

**Current evidence:** [R14](#source-r14), [R20](#source-r20).

**Retained target / preservation criteria.** Use authorized user/group pickers and deliberate exact form/view pins. Edit supported actions, outcomes, required scopes, reasons and validation modes. Surface empty/revoked groups and incompatible forms through readiness. Distinguish design access from requester and execution authority. Do not invent quorum, self-approval restrictions, escalation or new lifecycle policies.

**Acceptance to preserve or complete.** Save/reopen preserves the exact task contract. Runtime reviewers receive only configured actions. Missing candidates and incompatible views produce repairable diagnostics. Publication remains the authoritative final gate; choosing a group never grants its members additional rights.

**Capability dependencies (not an instruction to redo completed parents).** 021.UX01, 019.UX01, 006.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-023-ux01"></a>

### 36. APP-FE-023.UX01 — Provide typed visual data mapping

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend workflow owner; named owners TBD

**Current delta.** Typed port selectors and reconnection preserve conditions/priority/defaults in recorded scoped acceptance. Keep them as the non-drag alternative. Finish structured/list/ordinal data mapping and direct diagram feedback; do not equate control-edge acceptance with full data-port mapping verification.

**Current evidence:** [R13](#source-r13), [R20](#source-r20).

**Retained target / preservation criteria.** Show authorized sources/destinations, types, requiredness and exact snapshot provenance. Offer supported constants and mappings with readable summaries. Use existing completion/field inventory metadata. Keep canonical data distinct from rendering/localization. Prevent mappings to unauthorized/read-only/calculated destinations and invalidate stale analysis when a source pin changes.

**Acceptance to preserve or complete.** Compatible mappings save and reopen correctly. Incompatible connections identify their cause. Inaccessible fields reveal no private labels or values. Publication revalidates mappings against exact pins. No client-only shortcut bypasses backend write policy.

**Capability dependencies (not an instruction to redo completed parents).** 021.UX01, 017.UX02, 006.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-024-ux01"></a>

### 37. APP-FE-024.UX01 — Complete supported branch, timer, event and subprocess editors

**Priority:** P1 | **Review disposition:** REVIEW | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend workflow owner, QA; named owners TBD

**Current delta.** Supported branch/timer/event/subprocess editors already have available slices. Full current handler coverage was not re-audited. Compare each exact handler contract and existing inspector, preserve working pins/semantics and implement only uncovered configurations.

**Current evidence:** [R20](#source-r20).

**Retained target / preservation criteria.** Build structured controls only for deployed supported contracts. Make branch outcomes/defaults, durations/timezones and subprocess pins explicit. Explain incompatible dependencies. Distinguish configuration/preview from execution and discovery from call authorization. Do not imply general BPMN, recurrence or arbitrary event-correlation support.

**Acceptance to preserve or complete.** Each advertised advanced node has valid/invalid save and publication tests plus applicable real-execution evidence. Version upgrades are deliberate. Unavailable nodes cannot produce a falsely green publish state. Timer/event cancellation and retries are demonstrated only under supported rules.

**Capability dependencies (not an instruction to redo completed parents).** 021.UX01, 023.UX01, 006.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-025-ux01"></a>

### 38. APP-FE-025.UX01 — Finish governed integration and AI configuration

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend integration/AI owners, security QA; named owners TBD

**Current delta.** Protected operation contracts, receipts and AI evidence are no longer blanket missing backend prerequisites. Finish governed node configuration and authorized selection on top of existing contracts. Keep live vendor/paid AI execution separate from deterministic sandbox evidence.

**Current evidence:** [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Use governed operation and authorized connection/agent catalogs. Present typed inputs/outputs, approval rules, verification state, retry policy and exact revision/secret-version boundaries when safely exposed. Never place secrets in Angular. Separate pure configuration preview from explicitly authorized live tests. A selected connection is not proof of executable authority.

**Acceptance to preserve or complete.** An authorized designer configures supported operations without JSON. Revoked/unverified connections fail closed. Sandbox execution has required approval and durable receipt evidence. Dispatch timeouts lead to reconciliation, not blind replay. Live vendors/models and spend require separate approved access.

**Capability dependencies (not an instruction to redo completed parents).** 021.UX01, 023.UX01; backend operation/AI contracts. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-027-ux01"></a>

### 39. APP-FE-027.UX01 — Make publication, repair and version comparison understandable

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend workflow owner, QA; named owners TBD

**Current delta.** Validation/promotion/publication, comparisons and backend default restoration are documented as existing. Complete the normal repair/compare/restore journey and exact version/view checks; distinguish local discard, layout reset, draft replacement and successor creation. Do not wait for a nonexistent default-restoration service.

**Current evidence:** [R13](#source-r13), [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Present exact saved-version readiness with severity, owning repair destination and current refs. Respect bounded diagnostics and incomplete/not-checked states. Show meaningful diffs and deliberate upgrade preview/apply. Retired pins remain visible for repair; never silently substitute latest. Workflow default restoration creates the supported new draft and is separate from environment reset.

**Acceptance to preserve or complete.** A designer navigates a safe repair link and returns without losing context. Repair does not automatically grant, publish or execute. Active-case pins and published snapshots remain unchanged. Stale or inaccessible dependencies produce non-disclosing errors. Publication rechecks the actual final saved state.

**Capability dependencies (not an instruction to redo completed parents).** 021.UX01, 024.UX01; existing APP-FE-011 dependency repair. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-012-ux01"></a>

### 40. APP-FE-012.UX01 — Finish unified inbox and authenticated SSE behavior

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend boundary, backend, QA; named owners TBD

**Current delta.** Actual worker/Redis/SSE inbox delivery is recorded; the latest commit adds mark-all-read through bounded sequential current-ref operations. Reuse both. Remaining work is full MAP recipient/destination coverage, reserved operation destinations and regression of the new batch partial-failure/new-arrival behavior. Mark-all-read is not an atomic backend bulk command or deletion.

**Current evidence:** [R14](#source-r14), [R15](#source-r15), [R16](#source-r16).

**Retained target / preservation criteria.** Use existing inbox search/unread/detail/read/events through the same-origin boundary. Subscribe then refresh; refresh on resync/reconnect and at least every 60 seconds as specified. Deduplicate/coalesce invalidations while preserving focus/scroll. Last-Event-ID is only a bounded reconnect hint. Resolve code-owned destinations with current authorization and redact unavailable targets. Do not build a parallel WebSocket system.

**Acceptance to preserve or complete.** A ready report notice opens an authorized download; a work notice opens current work. Test missed/duplicate events, reconnect, logout, stale mark-read refs and unavailable sources. Verify actual proxy no-buffer/no-compression behavior and disconnect propagation. Reserved destinations remain unavailable until reconciled, not simulated as working links.

**Capability dependencies (not an instruction to redo completed parents).** 036.UX01, 005.UX01, 006.UX01; conditional APP-BE-014.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-014-ux01"></a>

### 41. APP-FE-014.UX01 — Complete calendar team selection, dates and reminders

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** Personal calendar CRUD, DST/all-day handling, conflicts/replay and real reminders are recorded delivered. Keep the session-only Jalali/Hijri presentation and Gregorian wire distinction. Finish ordinary membership-aware team selection, full derived-deadline matrix, and transparent reminder editing; current DTO reminder configuration cannot be reconstructed from historical states.

**Current evidence:** [R04](#source-r04), [R14](#source-r14).

**Retained target / preservation criteria.** Separate personal/team events from derived work deadlines. Offer only teams eligible for the actor’s action, not an admin/designer list. Preserve Gregorian canonical dates, explicit IANA timezone, DST validation and exclusive all-day end dates. Support only the stated reminder limits. Only creators edit manual events; membership controls visibility. Do not infer delivery receipts from reminder configuration.

**Acceptance to preserve or complete.** Current members see only permitted team events; membership loss is enforced again on writes. Derived deadlines cannot be dragged into editable events. Stale commands recover safely. Test DST gaps/folds, all-day boundaries, delete/reminder cancellation and bounded 1–93-day searches.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01, 006.UX01; APP-BE-008.UX01 if no suitable selector exists. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-015-ux01"></a>

### 42. APP-FE-015.UX01 — Preserve and regress the implemented analytics experience

**Priority:** P2 | **Review disposition:** REGRESSION | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, accessibility QA; named owners TBD

**Current delta.** APP-FE-015 is recorded DONE / VERIFIED_INTEGRATED for all nine registered metric/list populations and recovery/responsive/RTL cases. Preserve those definitions and accessible tables. Re-run regression on the current pair; add implementation only for a reproduced defect or separately approved metric.

**Current evidence:** [R14](#source-r14).

**Retained target / preservation criteria.** Use the server metric dictionary and authorized aggregate query. Show unit, population, time window, timezone, generation/as-of and availability. Keep zero distinct from null/unknown durations or unmapped outcomes. Provide accessible data tables and server-defined drill-down. Do not invent approval, cost, receipt or performance baselines.

**Acceptance to preserve or complete.** Charts, tables and drill-down agree on population. Empty/unknown/unavailable states are distinguishable. DST/timezone windows are correct. Private metric data is not shared between actors. Old/cancelled responses cannot paint a new user’s dashboard.

**Capability dependencies (not an instruction to redo completed parents).** 007.UX01, 008.UX01; existing APP-BE-018 contract. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-030-ux01"></a>

### 43. APP-FE-030.UX01 — Replace generic integration/AI administration JSON

**Priority:** P1 | **Review disposition:** REVIEW | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend domain owners, UX; named owners TBD

**Current delta.** Specialist integration/AI administration remains within open parent scope; a full current source audit was not performed. Use existing administration patterns and exact governed contracts, then replace only demonstrated normal JSON dependencies. Do not rebuild generic administration.

**Current evidence:** [R14](#source-r14), [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Recheck live routes and provide domain forms, authorized pickers, validation, verification state and structured result/history summaries for supported agents/connections/policies. Preserve approved expert tools only when optional and redacted. One-time secret display belongs solely to specifically authorized creation/rotation flows with no logging or persistence. Never weaken the existing execution/session boundary.

**Acceptance to preserve or complete.** An administrator completes in-scope configuration without JSON or opaque-ID copying. Results offer meaningful next actions. Provider failures are sanitized. Normal workflow coverage is demonstrated, not inferred from a generated API client or a hidden advanced console.

**Capability dependencies (not an instruction to redo completed parents).** 006.UX01, 007.UX02, 025.UX01. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-031-ux01"></a>

### 44. APP-FE-031.UX01 — Finish identity, group, client and request-type administration

**Priority:** P1 | **Review disposition:** REVIEW | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend identity/workflow owners, QA; named owners TBD

**Current delta.** Shared user/root CRUD and history are recorded complete, but that does not close all identity/group/client/request-type specialist scope. Keep working screens and inspect the remaining permission/grant/one-time-secret/version/eligibility cases before implementation.

**Current evidence:** [R14](#source-r14), [R20](#source-r20).

**Retained target / preservation criteria.** Provide separate list/detail/history flows, clear membership/permission changes and supported confirmations/reasons. Explain client kinds/releases without equating clients with tenants or trusting User-Agent identity. Configure request types with deliberate published pins and eligibility. Keep deleted/inactive records out of ordinary selection except explicit authorized lifecycle views.

**Acceptance to preserve or complete.** An administrator performs supported setup without copied refs/JSON. Membership removal changes subsequent server access. Selecting a version never silently picks latest. A restricted request start is not enabled by embedding a confidential client secret in the browser.

**Capability dependencies (not an instruction to redo completed parents).** 006.UX01, 007.UX01/02; actual identity/client/request-type contracts. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-032-ux01"></a>

### 45. APP-FE-032.UX01 — Make reports, execution receipts and recovery usable

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, operators, QA; named owners TBD

**Current delta.** Requester receipts and purposeful operator reconciliation controls are implemented. The newer record still leaves actual superuser recovery/stale/lost-reply/cancellation browser acceptance and broad schedule/report/audit coverage open. Preserve the distinction between synchronous Studio report pages and queued Administration files.

**Current evidence:** [R14](#source-r14), [R15](#source-r15).

**Retained target / preservation criteria.** Provide typed report jobs and structured execution/receipt details. Distinguish paginated report-search aliases from queued exports. Use authorized private downloads. Offer retry/reconcile/cancel/compensation only where actual authority and contracts permit it. Show safe timestamps/correlation and bounded history. Database rollback must never be presented as reversing an external action.

**Acceptance to preserve or complete.** Reports remain discoverable after navigation or notification loss. Expired/forbidden download recovery is clear. Uncertain dispatched actions are reconciled before retry. Generic JSON commands cannot create unsupported recovery paths. Real worker/provider evidence is separate from UI simulation.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01, 036.UX01, 025.UX01; existing APP-FE-026 run overlays. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-013-ux01"></a>

### 46. APP-FE-013.UX01 — Preserve and regress safe support/error handling

**Priority:** P1 | **Review disposition:** REGRESSION | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, operators, QA; named owners TBD

**Current delta.** APP-FE-013 durable support and safe client intake are recorded DONE / VERIFIED_INTEGRATED, including injected sink failures. Preserve their exact privacy and error contracts; test new editor failures through the existing seam. Do not create a second error recorder or label expected fault injection as a new production defect.

**Current evidence:** [R14](#source-r14).

**Retained target / preservation criteria.** Show safe public error and correlation/support references when supplied. Use the allowlisted client-failure DTO only: supported screen/build/code/request identifiers, never form values, HTML, stack dumps or arbitrary messages. Respect rate limits/coalescing. Present authorized incident acknowledge/resolve actions with current refs. Avoid recursive reporting when the support/notification sink fails.

**Acceptance to preserve or complete.** Users can copy a safe correlation reference. persisted=false or a null support ref is not reported as a filed incident. Logs reject private data and tokens. Intake throttling/sink outages do not create retry storms. Support destinations do not confer access.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01, 007.UX02; support authorization. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-008-ux01"></a>

### 47. APP-FE-008.UX01 — Preserve preferences, saved views, favorites and help

**Priority:** P2 | **Review disposition:** REGRESSION | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, UX; named owners TBD

**Current delta.** APP-FE-008/009/010 preferences/profile/avatar, saved views/favorites and help acknowledgments are recorded DONE at their scopes. Newer temporal/localization and Ant Design integration must also be preserved. Regress persistence/actor cleanup and editor adoption; do not reimplement those features based on older reset/default prose.

**Current evidence:** [R04](#source-r04), [R14](#source-r14), [R19](#source-r19).

**Retained target / preservation criteria.** Use GET/PATCH /api/v1/me/preferences with current refs. Omitted nested values remain unchanged; whole-group null resets defaults, while unsupported scalar nulls are invalid. Apply locale, direction, theme and timezone coherently. Keep existing APP-FE-009 saved views/favorites and APP-FE-010 help ownership; do not create duplicate persistence. Store only approved minimal help state.

**Acceptance to preserve or complete.** Editing one setting preserves unrelated groups. Conflicts and actor changes recover safely. Locale does not translate machine codes or change canonical calendar semantics. Saved filters do not leak between users. Dismissing help never disables required validation or recovery guidance.

**Capability dependencies (not an instruction to redo completed parents).** 005.UX01; existing APP-FE-009/010 and their backend contracts. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-033-ux01"></a>

### 48. APP-FE-033.UX01 — Close real API/UI coverage and correct the JSON register

**Priority:** P1 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, QA, domain reviewers; named owners TBD

**Current delta.** Current generated inventory and updated JSON-register entries exist. Reclassify each remaining ordinary editor gap against current source, including consistency/follow-up owners. A textarea match is not itself a bug; optional expert inspection does not satisfy missing normal UI.

**Current evidence:** [R16](#source-r16), [R20](#source-r20).

**Retained target / preservation criteria.** Re-run and manually classify current matches by route/persona/journey. Identify required JSON inputs, raw-only results, legitimate text controls and approved optional expert exceptions. Update API/UI coverage and cross-link one owning task per gap. Keep normal, internal, boundary and approved exclusion dispositions explicit.

**Acceptance to preserve or complete.** Every in-scope normal interaction has purposeful input/output and actual tests. No feature disappears merely to make a no-JSON check pass. A typed API client is not counted as UI completion. Remaining advanced exceptions have explicit purpose, approval and privacy handling.

**Capability dependencies (not an instruction to redo completed parents).** Relevant domain fixes; existing APP-FE-033 dependency map. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-034-ux01"></a>

### 49. APP-FE-034.UX01 — Verify remaining accessible names and multilingual authoring

**Priority:** P1 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, accessibility QA, product owner; named owners TBD

**Current delta.** The formerly hardcoded Component inspector accessible name is corrected in the current builder. Remove that specific repair. Simulated runtime preview and Validation diagnostics aria-labels still contain literal English in this template. Verify all remaining names, overlays/focus/zoom/non-drag access and en/fa; preserve newer Arabic and temporal behavior.

**Current evidence:** [R04](#source-r04), [R05](#source-r05), [R08](#source-r08), [R13](#source-r13).

**Retained target / preservation criteria.** Localize the region name or connect aria-labelledby to the translated heading. Audit static accessible strings, route/document/dialog labels, announcements and focus restoration. Verify keyboard completion, non-drag pointer alternatives, RTL/LTR, long labels, zoom, themes and screen-reader tasks. Preserve LTR where canonical identifiers need it. Apply the chosen accessibility target’s actual target-size/spacing rules, not a blanket unsupported minimum. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** The region has the correct accessible name in both languages. Automated checks and manual keyboard/screen-reader evidence remain distinct. Drag functionality has a single-pointer non-drag alternative as well as keyboard access. No accessibility completion claim comes from automated scanning alone.

**Capability dependencies (not an instruction to redo completed parents).** 007.UX02; touched domain screens; 001.UX02. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-035-ux01"></a>

### 50. APP-FE-035.UX01 — Measure bounded performance and lifecycle cleanup

**Priority:** P1 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA; named owners TBD

**Current delta.** Reuse existing canvas/runtime measures and the newer browser-sandbox duration reports. Measure actual edit/preview latency, group gestures and teardown on agreed hardware before setting pass/fail budgets or claiming Playwright is faster. D05/manual device acceptance is not supplied by this review.

**Current evidence:** [R13](#source-r13), [R15](#source-r15), [R17](#source-r17).

**Retained target / preservation criteria.** Measure representative and bounded-stress forms, collections, canvas, tables, charts and inbox on declared browsers/devices. Record interaction timings, requests, payloads, memory and teardown. Reuse actual signals/OnPush/zoneless patterns; do not upgrade APIs or introduce a state framework because newer documentation exists. Profile before rewriting/virtualizing. Bound retries and fence async responses by actor/resource context. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** Route teardown and actor changes stop relevant work and late rendering. Repeated opens do not accumulate streams/object URLs. Large supported collections remain keyboard-usable. Publish measured values and proposed budgets; no invented baselines, arbitrary passes or universal-device claims.

**Capability dependencies (not an instruction to redo completed parents).** 001.UX01/02 and relevant features. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-037-ux01"></a>

### 51. APP-FE-037.UX01 — Prove the connected reference journey and a second configuration

**Priority:** P0 | **Review disposition:** VERIFY | **New application verification:** NOT_RUN  
**Owner roles:** QA, frontend, backend, operators, product owner; named owners TBD

**Current delta.** Nine-scenario editor service acceptance and a later twenty-case receipt rehearsal with two guarded resets are documented. Preserve their exact tested-source boundaries. Prove the redesigned editor-to-runtime journey and second configuration on the current pair; do not repeat all delivery as if no integration evidence exists.

**Current evidence:** [R13](#source-r13), [R15](#source-r15).

**Retained target / preservation criteria.** Use the guarded disposable harness for eligible type → localized private draft/attachments → submit/normalize → labeled AI recommendation → required human decision/correction → configured branches → authorized HTTP sandbox action → durable receipt → notification/report → inspectable outcome. Demonstrate a small non-purchase service-request configuration. Label fixtures, real workers/HTTP and live provider stages separately; unsupported stages remain explicit. Apply the linked v2 canvas/form recovery work units as detailed acceptance refinements; reuse equivalent existing work rather than duplicate it.

**Acceptance to preserve or complete.** Use non-superuser actors. Exercise duplicate submission, claim race, stale refs, session expiry, lost responses, provider timeout and supported recovery. Record source/schema/build identities, logs, browser evidence and skips. Reset touches no shared/production data. APP-FE-038 retains separate product/user acceptance ownership.

**Capability dependencies (not an instruction to redo completed parents).** Required journey features; existing APP-FE-037/038 and backend harness/release tasks. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-fe-002-ux01"></a>

### 52. APP-FE-002.UX01 — Adopt Playwright and complete current-tree evidence gates

**Priority:** P0 | **Review disposition:** EXTEND | **New application verification:** NOT_RUN  
**Owner roles:** Frontend, backend, QA, operators; named owners TBD

**Current delta.** Adopt Playwright through the current pnpm toolchain. The package manifest has no declared @playwright/test dependency or Playwright command; the custom runner remains. Reuse its newer diagnostics/sandbox evidence and repair the recorded flaky timing/teardown tests without suppressing diagnostics. Require actual final-tree and paired browser evidence.

**Current evidence:** [R03](#source-r03), [R16](#source-r16), [R17](#source-r17), [R18](#source-r18).

**Retained target / preservation criteria.** Apply [Playwright work units PW01–PW08](#playwright-browser-verification) under this item: pinned runner, safe fixtures, actual canvas/form gestures, paired outcomes, visual/accessibility checks, strict evidence gates and measured migration. Retain old coverage until parity; keep all other test layers. Verify the actual README/mise commands. Run the documented mise run check with zero emitted warnings, plus required paired API/browser checks. Preserve thresholds and failures: no blanket suppressions, masked exits, fixture substitution or skip-based completion. Read relevant skills and use graphify when the local graph/tool is available; update the graph after code changes. Save the existing-style change record and paired contract handoff.

**Acceptance to preserve or complete.** Evidence identifies environment, source/schema hashes, exact commands, passes, failures and skips. Local, paired, demo, deployed and user-accepted states remain separate. Release includes monitoring, recovery, support and rollback/forward-repair guidance. An unavailable tool is reported as not run, never claimed executed.

**Capability dependencies (not an instruction to redo completed parents).** Baseline first; final gate for each significant completed slice. APP-FE-038 owns final acceptance. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-be-008-ux01"></a>

### 53. APP-BE-008.UX01 — Verify or provide actor-eligible team selection

**Priority:** P1 | **Review disposition:** CONDITIONAL | **New application verification:** NOT_RUN  
**Owner roles:** Backend identity owner, frontend; named owners TBD

**Current delta.** A membership-aware ordinary-user calendar team selector remains explicitly unresolved in the current peer handoff. Recheck live backend ownership/authorization before proposing a new endpoint. Do not reuse an administration or workflow-design selector as proof of calendar membership.

**Current evidence:** [R14](#source-r14), [R15](#source-r15).

**Retained target / preservation criteria.** Inspect existing selectors and their authorization tests first. Only if no suitable projection exists, extend the owning selector with bounded actor-eligible results and safe selected-value hydration. Do not grant administrator/designer permission to ordinary requesters, download every group, or invent client-side membership authority. Freeze the exact compatible contract before frontend changes.

**Acceptance to preserve or complete.** A non-admin sees only currently eligible active groups. Membership loss invalidates selection and event creation. Deleted/inactive/private group labels remain non-disclosing. Existing consumers stay compatible and a paired frontend test consumes the approved shape.

**Capability dependencies (not an instruction to redo completed parents).** APP-FE-001.UX01 and APP-FE-014.UX01. No new endpoint name is authorized here. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-be-014-ux01"></a>

### 54. APP-BE-014.UX01 — Reconcile inbox destination producers and documentation

**Priority:** P1 | **Review disposition:** CONDITIONAL | **New application verification:** NOT_RUN  
**Owner roles:** Backend notification/source owners, frontend; named owners TBD

**Current delta.** Reserved operation MAP-07/08 destinations remain reported unavailable. Define only the missing authorized operation target/resolver behavior after backend recheck; retain the functioning inbox stream and existing destinations. A notification link must never execute a business command.

**Current evidence:** [R14](#source-r14), [R15](#source-r15).

**Retained target / preservation criteria.** Inspect producer staging, target resolution, current source authorization and tests. Establish supported/reserved status per kind. Correct stale descriptions or implement only the missing authorized producer/resolver. Preserve redaction for unavailable/deleted/revoked/expired sources and code-owned route allowlists. An enum value alone must not be treated as working capability.

**Acceptance to preserve or complete.** Each target has documented producer, availability, authorized destination and paired browser evidence. Operation links require actual receipt/source authority. Cross-user, expired and revoked cases reveal no private subject/content/ref. Frontend and backend consume one reconciled contract.

**Capability dependencies (not an instruction to redo completed parents).** APP-FE-001.UX01, APP-FE-012.UX01; existing APP-BE-013/014 ownership. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-be-019-ux01"></a>

### 55. APP-BE-019.UX01 — Fill only demonstrated designer metadata or diagnostic gaps

**Priority:** P1 | **Review disposition:** CONDITIONAL | **New application verification:** NOT_RUN  
**Owner roles:** Backend form/workflow owner, frontend; named owners TBD

**Current delta.** Designer inspector, config validation and readiness metadata are described as implemented and used. Retire the blanket producer-missing assumption. File backend work only for a specific unsupported property/diagnostic found while finishing the current complex UI.

**Current evidence:** [R13](#source-r13), [R20](#source-r20).

**Retained target / preservation criteria.** Compare typed frontend needs against deployed metadata. Add only a demonstrated supported-but-unexpressed property or safe diagnostic linkage, with a failing paired case first. Keep code-owned schemas/fingerprints, bounded pure validation and authorized repair pointers. Do not solve normal UX by introducing a new unrestricted generic JSON editor or arbitrary schema-execution service.

**Acceptance to preserve or complete.** The failing case proves the gap before API expansion. Existing documents/versions round-trip compatibly. Metadata does not claim installed renderer support, credentials or execution authority. Limits, envelopes, BaseDTO and snake_case conventions remain intact.

**Capability dependencies (not an instruction to redo completed parents).** APP-FE-017.UX01, 021.UX01, 016.UX04; existing APP-BE-019 scope. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-be-020-ux01"></a>

### 56. APP-BE-020.UX01 — Verify existing runtime conformance; repair proven backend mismatches only

**Priority:** P0 | **Review disposition:** CONDITIONAL | **New application verification:** NOT_RUN  
**Owner roles:** Backend form owner, frontend, QA; named owners TBD

**Current delta.** Backend twenty-kind conformance is reported implemented; the missing evidence is largely frontend matrix coverage. Reuse the fixtures and projections and request a backend fix only for a failing canonical/policy case proved against the current pair. Do not build another runtime.

**Current evidence:** [R13](#source-r13), [R15](#source-r15), [R20](#source-r20).

**Retained target / preservation criteria.** Build versioned conformance cases for all twenty kinds, typed scalar options, missing/null/delete, collections, attachments, calculations, views, write policy and localization. Reuse bpms.runtime/1. Fix inconsistencies in the owning application/domain code and enrich only safe visible metadata where required. Preserve BaseDTO/snake_case and published/version-pinned behavior.

**Acceptance to preserve or complete.** The same applicable cases pass server validation and the actual frontend against real HTTP. Hidden defaults/fields/provenance do not leak. Unknown dialects, stale refs and revoked access fail as documented. Active cases are not repinned and published snapshots are not rewritten.

**Capability dependencies (not an instruction to redo completed parents).** APP-FE-001.UX01, 017.UX01, 019.UX02; existing APP-BE-020. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-be-027-ux01"></a>

### 57. APP-BE-027.UX01 — Close proven outcome and reconciliation projection gaps

**Priority:** P1 | **Review disposition:** CONDITIONAL | **New application verification:** NOT_RUN  
**Owner roles:** Backend request/integration owner, frontend, operators; named owners TBD

**Current delta.** Receipt/AI read projections and reconciliation operations exist and are consumed. Keep reviewer full-process denial as intentional authorization. The recorded narrow remaining projection limitation is dispatch age/compensation-state eligibility, not absence of outcomes altogether; confirm usefulness and privacy before extending.

**Current evidence:** [R15](#source-r15).

**Retained target / preservation criteria.** Inventory current request/work-item/operation/report reads and idempotency receipts first. Add an operation-specific authorized lookup or enrich its owning projection only where reconciliation is impossible. Expose minimal safe business state/current refs/recovery information. Keep minimal request history separate from any newly approved audit view. Do not create generic retry-anything controls or reveal provider payloads.

**Acceptance to preserve or complete.** A lost response after commit can be distinguished from pending/unknown without repeating an external effect. Every lookup checks current authority. A receipt key is not an authorization capability. Bounded reads/retention and paired frontend recovery behavior are specified and tested.

**Capability dependencies (not an instruction to redo completed parents).** APP-FE-005.UX01, 028.UX04, 032.UX01; verify actual backend parent scope during intake. The current delta and repository handoff override old absence/blocked assumptions.

<a id="app-be-028-ux01"></a>

### 58. APP-BE-028.UX01 — Adapt the existing disposable paired harness for browser acceptance

**Priority:** P0 | **Review disposition:** CONDITIONAL | **New application verification:** NOT_RUN  
**Owner roles:** Backend, QA, operators; named owners TBD

**Current delta.** An owned disposable paired harness and reset rehearsal exist, including a correction for missing compiled locale assets. Reuse them for Playwright actor/data isolation. Only genuine environment/orchestration gaps need new work; never replace real services with silent fixture fallback.

**Current evidence:** [R13](#source-r13), [R15](#source-r15), [R17](#source-r17).

**Retained target / preservation criteria.** Reuse existing guarded APP-BE-028/029 harness work. Supply non-superuser roles, published pins, synthetic media, broker/cache/storage/workers and an HTTP sandbox with durable receipts. Add bounded fault injection for duplicates, claim races and ambiguous outcomes. Do not build a second reset system or use shared databases/live vendors/paid AI without separate authority.

**Acceptance to preserve or complete.** A clean disposable environment demonstrates the journey and resets repeatably. Identify actual worker/HTTP stages versus deterministic fixtures/live providers. Broker connectivity is not worker completion. No shared records, active pins or applied migrations are rewritten to manufacture a pass.

**Capability dependencies (not an instruction to redo completed parents).** Existing backend harness tasks; APP-FE-037.UX01; current DB-002/D07 and environment/provider decisions, without reviving the historical D01 blocker. The current delta and repository handoff override old absence/blocked assumptions.

## Detailed authoring execution units — retained targets, current source overrides

The 24 original execution-unit IDs below remain nested inside the main cards. Their interaction/negative-case requirements are preserved. Their old absence claims and initial statuses do not describe the new commit. Reuse the current delivered behavior explicitly identified in their review notes.

<a id="app-fe-020-ux01-a"></a>

#### APP-FE-020.UX01.a — Canvas-first workspace and explicit interaction modes

**Revision 3.3 current-source note:** Existing Foblex workspace, palette and typed inspectors stay. Reorganize their composition; no engine replacement.

**Parent:** APP-FE-020.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** Workflow authoring must be the primary workspace, not a diagram embedded among configuration forms.

**Required implementation.**

1. Use a viewport-filling canvas below a compact header with workflow name, exact version, workspace state and distinct Save, Validate, Promote and Publish actions. Preserve the actual lifecycle; do not collapse these into an ambiguous Run action.
2. Provide a searchable add-node dock and contextual inspector. Keep technical diagnostics and JSON outside the ordinary path. Clearly separate Select, Pan, Connect, Configure and read-only inspection states.
3. Design node cards with readable display title, type, configuration status, ports and an action menu. Do not use raw stable keys as the primary business label. Use icon/text as well as color; preserve exact IDs internally.

**Acceptance scenarios.**

1. A designer adds three supported nodes, configures them, connects them, saves, reopens and locates validation issues without copying IDs or editing JSON.
2. At a declared laptop viewport, opening a dock does not hide all useful canvas space; zooming the browser and long Farsi labels do not hide primary actions.
3. Loading, permission denial and empty catalog are distinct. An unavailable step type is explained, not shown as executable or silently replaced.

**Dependencies.** APP-FE-001.UX01; APP-FE-004.UX01.

<a id="app-fe-020-ux01-b"></a>

#### APP-FE-020.UX01.b — Separate navigation from edit permissions, pending edits and undo

**Revision 3.3 current-source note:** Still needed: broad disabled and viewport-to-semantic-history coupling remain in current source. Keep read-only mutation guards while separating navigation.

**Parent:** APP-FE-020.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** The board passes readonly or pending into one disabled flag. The canvas checks this flag for zoom, fit and transform; the board routes viewport changes through workspace history.

**Required implementation.**

1. Replace the catch-all interaction policy with explicit navigation, selection, graph-edit and configuration capabilities in the existing adapter. Read-only must mean no definition mutation, not no inspection.
2. Keep pan/zoom/fit/find available while a node inspector has invalid or pending text. Maintain a local inspection viewport for published versions without writing the definition. Draft viewport persistence may reuse existing workspace metadata but must not pollute semantic undo.
3. Use a documented select/pan control scheme with visible controls. Keep wheel/trackpad gestures scoped to the canvas and preserve page/browser zoom accessibility. Esc or pointer cancellation must end an active gesture.

**Acceptance scenarios.**

1. Open a published workflow and pan, zoom, fit and inspect it; assert zero definition-write requests.
2. Type an invalid inspector value, navigate the diagram, then return: the pending value survives and no Save or publish is falsely enabled.
3. Move node A once, pan/zoom repeatedly, then Undo: node A returns in one semantic undo step. Navigation does not make an unchanged executable graph appear modified.

**Dependencies.** APP-FE-020.UX01.a.

<a id="app-fe-020-ux01-c"></a>

#### APP-FE-020.UX01.c — Reliable node creation, palette dropping and add-next

**Revision 3.3 current-source note:** Palette drop/click placement and whole-card drag are present; complete add-next and regress precise transformed placement rather than reimplementing.

**Parent:** APP-FE-020.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** Handlers exist, but their presence does not demonstrate accurate placement or a fast authoring flow.

**Required implementation.**

1. Allow search-and-click Add, drag from palette, and add-next from a selected output. Place at the actual world coordinate using the canvas transform, not a guessed page offset. Provide a visible drop ghost and insertion/placement feedback.
2. On add-next, carry the source node, exact port/outcome and document generation through the chooser. Create the node and compatible connection together only after selection; cancelling leaves the graph untouched. Where output choice is ambiguous, ask for that choice in the chooser.
3. Handle scrolled pages, resized panels, non-default zoom, browser zoom, pointer cancellation and optional supported edge auto-pan. Restrict palette items to actual authorized catalog choices; bound/search the catalog without dropping pagination.

**Acceptance scenarios.**

1. Drop the same node at 50%, 100% and 200% canvas zoom with non-zero pan; it appears under the intended cursor/drop anchor and remains there after save/reopen.
2. Add by button and by click-to-place without dragging; both produce the same valid semantic node. A cancelled or forbidden drop creates nothing.
3. Add a successor from a named outcome, undo once, and verify both additions are undone. Slow catalog responses cannot attach a node to a newer unrelated selection.

**Dependencies.** APP-FE-020.UX01.a; APP-FE-020.UX01.b.

<a id="app-fe-020-ux01-d"></a>

#### APP-FE-020.UX01.d — Predictable selection, drag movement and alignment

**Revision 3.3 current-source note:** Prioritize the source-derived stale selectionKeys / ordinary click / toolbar duplicate finding described above. Group pointer/marquee acceptance remains distinct from existing keyboard movement.

**Parent:** APP-FE-020.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** A usable editor needs consistent selection and grouped movement, not a checkbox list as its primary selection mechanism.

**Required implementation.**

1. Specify single-click replacement selection, modifier toggling, empty-canvas deselection, marquee selection and select-all/clear. Synchronize node focus, inspector and selectionKeys instead of maintaining contradictory highlighted selections.
2. Drag a selected node/group with live connected-edge redraw, preserved relative offsets and optional snap/align guides. Keep ordinary input/button interaction from initiating node drag. Use one history transaction per completed gesture.
3. Expose align/distribute and move commands where supported; these alter layout only. Cancelled drags restore the starting positions. Do not conflate visual grouping with a subprocess or execute a graph transformation.

**Acceptance scenarios.**

1. Select A and B, click C without a modifier, move C: only C moves. Shift toggles and selection clearing have consistent results.
2. Move a three-node selection: every node moves once, internal/external connections remain correct, and one Undo restores the whole gesture.
3. Marquee, move and align have keyboard and click-based alternatives. Editing a label or inspector value does not move a node or trigger global Delete.

**Dependencies.** APP-FE-020.UX01.a; APP-FE-020.UX01.b.

<a id="app-fe-020-ux01-e"></a>

#### APP-FE-020.UX01.e — Outcome-aware and type-aware connection creation

**Revision 3.3 current-source note:** Direct canvas callbacks still use the board outcome default; keep the existing typed keyboard port/outcome controls and make direct wiring equally explicit.

**Parent:** APP-FE-020.UX01  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** The inspected canvas exposes a generic control output, while connect() supplies the board-wide outcome. A line must communicate the branch or data binding it actually creates.

**Required implementation.**

1. Render distinct exact supported outcome handles, or require an explicit outcome chooser when drawing a control edge. Derive options from the pinned handler/type contract. Never silently use a hidden global next value for every branch.
2. Keep control transitions and data bindings visually and semantically distinct. During dragging, highlight compatible targets and explain incompatible direction/type/cardinality. Final validation follows existing domain/backend rules; do not invent blanket cycle bans or implicit type conversions.
3. Provide a click-source then click-target workflow and an accessible connect dialog with human-readable nodes/ports. Draw a provisional edge, commit only a valid connection and leave the old graph unchanged on cancellation/rejection. Use practical hit areas beyond the visible thin line/socket.

**Acceptance scenarios.**

1. Connect each actually configured human-decision/branch outcome to different nodes. Inspect the saved payload and reopen: every line retains the exact intended outcome and destination.
2. Attempt output-to-output, control-to-data, forbidden duplicate and incompatible bindings: each is rejected according to the actual contract with an actionable message and no stray line.
3. Drag and non-drag connection creation produce equivalent graph payloads. Existing draft and published graph fixtures render without inventing missing connections.

**Dependencies.** APP-FE-020.UX01.b; Exact supported node port/outcome metadata and existing connection domain validation; no dependency on completing all APP-FE-021 inspectors; Unknown metadata cases escalate to APP-BE-019.UX01.

<a id="app-fe-020-ux01-f"></a>

#### APP-FE-020.UX01.f — Direct edge selection, rewiring, deletion and insertion

**Revision 3.3 current-source note:** Reconnection callbacks and selector controls exist. Finish direct edge interaction, compatible insertion and original-edge preservation on invalid rewires.

**Parent:** APP-FE-020.UX01  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** Users should edit the connection they see, without finding its technical ID in another control.

**Required implementation.**

1. Make each edge selectable with an expanded hit region, hover/focus toolbar and edge inspector. Support changing an endpoint, editing a supported outcome/mapping and removing the selected edge.
2. Rewire atomically: retain the original until the replacement is valid. Preserve metadata and user routing where still applicable; clean orphaned routing on deletion. One action is one undo unit.
3. Provide insert-node-on-connection only for a compatible, unambiguous transformation that preserves branch meaning and data mappings. Preview the change; cancellation is a no-op. Never automatically bypass a deleted approval or silently reconnect all neighbors.

**Acceptance scenarios.**

1. Rewire A to B into A to C and undo: endpoints, outcome/mapping and applicable waypoints return exactly.
2. Delete one selected edge by its on-canvas action; no unrelated edge or node is removed. Save/reopen shows the same result.
3. An incompatible insertion leaves the original connection intact. A valid insertion survives save/reopen and one Undo restores the pre-insertion graph.

**Dependencies.** APP-FE-020.UX01.e; APP-FE-020.UX01.h.

<a id="app-fe-020-ux01-g"></a>

#### APP-FE-020.UX01.g — Canvas, node, edge and multi-selection context menus

**Revision 3.3 current-source note:** Node Inspect/Connect/Duplicate and blank Fit/Reset already exist. Extend missing target-specific actions and regress keyboard/focus behavior; do not start a second menu component.

**Parent:** APP-FE-020.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** Right-click must provide relevant actions where the user is working, with the same functions available without right-click.

**Required implementation.**

1. Implement target-aware context menus for background, node, connection and selected group. Background: Add, Paste when safe content exists, Select all, Fit, reset view. Node: Configure, supported display-name edit, Duplicate, Copy, Add next, Delete. Edge: Inspect, supported outcome/mapping edit, Reconnect, Insert compatible node, Delete. Group: Duplicate, Align/distribute, Delete.
2. Use the same command handlers for menus, toolbar and shortcuts. Right-clicking an unselected node targets that node; right-click inside a selection preserves the group. Clamp menu placement to viewport including RTL.
3. Expose a visible more-actions button, keyboard menu access, correct focus/expanded semantics, Esc closure and focus restoration. Do not replace the native context menu in text inputs. Do not offer Execute, Disable, Convert to subprocess or business actions unless exact supported semantics and permissions are verified.

**Acceptance scenarios.**

1. Every required action is available through its contextual menu and through keyboard/click alternatives; no item is a decorative placeholder.
2. Right-click an unselected node while another is selected and choose Delete: the confirmed target, not the old selection, is affected.
3. Open at every viewport edge in English/Farsi; menu remains operable. Read-only menus allow inspection/navigation but cannot mutate any definition.

**Dependencies.** APP-FE-020.UX01.a; APP-FE-020.UX01.e.

<a id="app-fe-020-ux01-h"></a>

#### APP-FE-020.UX01.h — Safe command history, duplication, clipboard and deletion

**Revision 3.3 current-source note:** Domain duplication and history exist. Complete safe user-facing clipboard/group delete/undo semantics; do not auto-bridge removed human approvals.

**Parent:** APP-FE-020.UX01  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** Fast editing is only useful when edits are reversible and duplication does not corrupt identities, dependencies or approval paths.

**Required implementation.**

1. Extend the existing history/command layer rather than adding a competing state engine. Record bounded semantic edits for add/move/connect/reconnect/delete/configure/duplicate. Navigation, hover and preview typing are not definition history.
2. Duplicate a node or selected subgraph with fresh stable identities, remapped internal edges and preserved exact dependency pins. External references are preserved only under explicit existing semantics and revalidated. Show unresolved dependencies rather than choosing latest.
3. Keep clipboard authoring-only, bounded and validated. Never include secrets, tokens, real case data or execution receipts. Handle denied system clipboard permission with an explicit in-session alternative. Deletion shows affected dependent items; remove only selected graph objects and their defined dependents, never invent a bypass.

**Acceptance scenarios.**

1. Duplicate a branch subgraph: originals remain unchanged, new IDs are unique, internal edges point to new nodes, and pins have not changed.
2. Perform mixed edits, undo to the start, redo to the end and save/reopen: the semantic document matches expected snapshots. Each drag occupies one undo step.
3. Paste malformed or unsupported content and delete a required approval path: no unsafe replacement is committed, and publication remains blocked when actual validation requires it.

**Dependencies.** APP-FE-020.UX01.a; APP-FE-020.UX01.d.

<a id="app-fe-021-ux01-a"></a>

#### APP-FE-021.UX01.a — Contextual node editing without freezing the whole canvas

**Revision 3.3 current-source note:** Typed inspector and panel discardPending are present. Finish retained local buffers and safe navigation instead of claiming reload is the only recovery.

**Parent:** APP-FE-021.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** Typing a property should not turn the entire editor into an inert surface or force a page reload to keep working.

**Required implementation.**

1. Provide an explicit Configure affordance and double-click/Enter equivalent that opens a typed inspector for the selected exact node version. Group meaningful settings, inputs, outputs and related form/connection links; show understandable empty/error states.
2. Retain per-node transient buffers for incomplete values. Apply valid edits to the working draft at sensible boundaries, or keep a clearly scoped Apply/Discard action for complex atomic edits. Preserve unsaved values when switching selection; show which node needs attention.
3. Keep navigation and unrelated safe editing available. Only operations that depend on invalid pending state are blocked, with a reason. Changing handler/type/version requires compatibility review, not silent config loss. Maintain server-authorized exact-version selectors.

**Acceptance scenarios.**

1. Edit a valid label/property, navigate to another node and return: the change is retained and the draft save state is truthful.
2. Leave an incomplete value, inspect another node and return: the incomplete value survives; Save/Promote/Publish do not claim it is persisted or validated.
3. Configure the reference human task and its exact form view without JSON or copied refs. A revoked dependency is safely unavailable and never silently upgraded.

**Dependencies.** APP-FE-020.UX01.a; Current exact handler metadata and relevant existing typed-inspector implementation; unrelated primitive/provider acceptance is not a prerequisite.

<a id="app-fe-020-ux01-i"></a>

#### APP-FE-020.UX01.i — Truthful workflow persistence, stale writes and recovery

**Revision 3.3 current-source note:** Current-ref workspace save/promotion is implemented. Preserve it and finish exact conflict/uncertainty/unsaved-buffer acceptance.

**Parent:** APP-FE-020.UX01  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R08](#source-r08), [R09](#source-r09), [R10](#source-r10), [R13](#source-r13); owner-reported usefulness requirements and the current-source note above.

**Problem and intended outcome.** The editor must distinguish local edits, saved workspace, valid graph, promoted version and published version, especially after failures.

**Required implementation.**

1. Maintain explicit local revision and last-acknowledged saved revision. Adopt refreshed opaque refs on every mutation. Edits made while a save is in flight remain dirty after the older revision is acknowledged.
2. Keep explicit Save as a reliable baseline. Autosave is not authorized merely by this redesign: enable only with serialized writes, the actual replay contract, failure recovery and product approval. Never retry uncertain non-idempotent commands with new intent.
3. On stale refs, preserve authorized local work and offer a deliberate compare/reload/repair path using current contracts. Do not silently overwrite the server. On actor loss, stop async work and prevent private buffers from crossing sessions. Published versions remain immutable; editing starts an authorized draft.

**Acceptance scenarios.**

1. Delay a save, make another edit, then release the response: the newer edit remains visible and unsaved; the current ref is adopted for the next write.
2. Use two sessions to create a stale save: no silent overwrite, unchanged exact-version pins, actionable conflict state and no loss of authorized current-session input.
3. Simulate timeout after commit: the UI reports an uncertain state and follows actual reconciliation/replay rules, not a false success/failure or duplicate publish.

**Dependencies.** APP-FE-020.UX01.h; APP-FE-001.UX01; Existing mutation/session infrastructure.

<a id="app-fe-016-ux01-a"></a>

#### APP-FE-016.UX01.a — Dedicated form workspace with an always-available client-preview dock

**Revision 3.3 current-source note:** FormCanvas and the palette/canvas/properties grid already exist. The actual runtime preview remains outside it; this is a layout/state extension, not a new builder.

**Parent:** APP-FE-016.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15); current implementation and the residual target above.

**Problem and intended outcome.** The current template has a field-card canvas, palette and properties, but still puts manually triggered runtime preview outside that workspace. The requested product is a visual builder with immediate client feedback.

**Required implementation.**

1. Use a compact persistent header and three functional zones: a tools dock for Components/Outline/Properties, a central editable form surface, and a resizable Client preview dock. Avoid forcing four permanently narrow columns onto laptop screens; palette/properties can share tabs in the tools dock.
2. Keep preview open by default at supported desktop widths, independent of selecting a field. Provide collapse, expand/full-screen and clear responsive fallback. Store only allowed non-sensitive panel preferences through existing mechanisms; no new backend table just to resize a panel.
3. Let designers click a real-looking field/section in the edit surface to configure it, with selection outline, drag handle and contextual add/duplicate/remove. Client preview is separate interactive runtime, without editor handles. Global settings and expert inspection remain secondary.

**Acceptance scenarios.**

1. Create a form without scrolling between configuration and preview. Change a label/required setting and observe the client-side result beside the edit surface.
2. Click any field or outline entry and open its properties; the correct object is highlighted everywhere while client preview remains usable.
3. At the declared laptop viewport and 200% browser zoom, panel fallback preserves input and actions rather than shrinking the form into unusable strips.

**Dependencies.** Existing shared runtime/form authoring implementation; APP-FE-004.UX01 design direction for the touched screen; complete twenty-kind conformance is a release gate, not a workspace-start prerequisite.

<a id="app-fe-016-ux02-a"></a>

#### APP-FE-016.UX02.a — Visual field insertion and safe nested drag-and-drop

**Revision 3.3 current-source note:** Reparenting/explicit move controls already exist. The card surface still lacks direct insertion gestures; reuse the same-context domain operation.

**Parent:** APP-FE-016.UX02  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15); current implementation and the residual target above.

**Problem and intended outcome.** Adding or moving fields should happen where they will appear, with explicit valid drop positions.

**Required implementation.**

1. Offer palette cards with recognizable labels, click Add here, and drag into before/after/inside zones on the editable surface. Show a ghost, insertion line, parent highlight and readable destination breadcrumb. Empty pages/groups need real drop targets.
2. Support compatible cross-parent movement, layout reordering and edge scrolling. Distinguish root scope, object scope and repeated-row scope; moving across a collection boundary may change binding meaning and needs a reviewed explicit mapping or rejection.
3. Preserve node_key and canonical data for a pure placement move. Prevent layout ancestry cycles and invalid primitive nesting. Provide Move before/after/into commands and Cancel/Esc; do not treat arbitrary form nesting as always safe.

**Acceptance scenarios.**

1. Move a field within and between supported groups, then undo, save and reopen: order, identity, rules and data binding remain correct.
2. Drop into an empty supported group and a narrow preview-oriented layout; feedback names the actual destination, not a nearby sibling.
3. Attempt a cyclic/invalid nesting or unsafe collection-scope move: no partial mutation or lost canonical field. Click-based commands complete equivalent valid moves.

**Dependencies.** APP-FE-016.UX01.a; Existing form-editing domain functions.

<a id="app-fe-017-ux02-a"></a>

#### APP-FE-017.UX02.a — Fast field creation and contextual properties

**Revision 3.3 current-source note:** Six quick-add types auto-create unused canonical keys. Preserve configured-field restoration and typed inspectors; finish residual complex controls.

**Parent:** APP-FE-017.UX02  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15); current implementation and the residual target above.

**Problem and intended outcome.** Designers should start with a user-facing field, not manually invent a technical key before every addition.

**Required implementation.**

1. Offer a small purposeful field catalog using the actual twenty primitives. Give new fields safe proposed keys and defaults using existing naming constraints, then show editable advanced binding details. Display-label changes never silently rename saved canonical keys.
2. Use type-specific properties: label/help/default/required, supported validation, typed choices, accepted attachment policy, collection columns, numeric precision and date/time semantics. Do not display one generic schema form for every kind.
3. Connect newly created schema, placement and translation entries atomically in the working document. Keep missing/null/empty/false/zero and exact decimal semantics. Expose unsupported or unknown options without erasing them.

**Acceptance scenarios.**

1. Add text, number, choice, attachment and repeated line-item fields with normal controls; no JSON or copied IDs is needed.
2. Rename a display label in English and Farsi; canonical key, dependent bindings and prior definitions remain unchanged.
3. Save/reopen every declared primitive using the parent twenty-kind matrix. Primitive appearance alone does not count as end-to-end support.

**Dependencies.** APP-FE-016.UX01.a; Current primitive/renderer contracts; run relevant conformance as each control is implemented rather than waiting for the whole APP-FE-017.UX01 parent.

<a id="app-fe-016-ux03-a"></a>

#### APP-FE-016.UX03.a — Duplicate fields and layouts without accidental shared data

**Revision 3.3 current-source note:** Placement-only nested layout duplication is the existing deliberate contract. A duplicate placement shares bindings; an independent canonical field must use a separate supported creation action.

**Parent:** APP-FE-016.UX03  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15); current implementation and the residual target above.

**Problem and intended outcome.** Copying something visually can mean reusing a field or creating a new field. These meanings must not be silently mixed.

**Required implementation.**

1. Reuse the supported placement-only duplication for nested vertical/horizontal/grid layouts. Explain that the copy has fresh visual identities but shares canonical fields, options, localization references and collection bindings; do not silently change that contract.
2. Make the existing separate New field action the deliberate path to independent data with an unused canonical key. A generalized “duplicate as new canonical subtree” operation is a proposed extension, not a missing current capability; it needs an explicit remapping and compatibility design before it becomes required implementation.
3. Preserve placement restoration and dependency-aware removal. Remove placement must not delete canonical fields or collection identities. Show unsupported copies or non-local dependencies honestly; never auto-upgrade exact library pins.

**Acceptance scenarios.**

1. Duplicate a supported nested layout, including a configured collection descendant: every copied node has a fresh node_key, original nodes are unchanged, and canonical scopes/values remain intentionally shared after save/reopen.
2. Create an independent field through the separate New field action: it receives a new canonical key, existing rules/bindings are not silently redirected, and display-label changes never rename old data.
3. Unsupported/root duplication and unsafe canonical deletion do not mutate the draft. Undo/redo restores the exact placement document and selection without changing published versions or active cases.

**Dependencies.** APP-FE-016.UX02.a; APP-FE-017.UX02.a.

<a id="app-fe-016-ux04-a"></a>

#### APP-FE-016.UX04.a — Responsive form layout controls that match runtime

**Revision 3.3 current-source note:** Grid columns, coordinates and runtime stacking are delivered in recorded scope. Complete panel/preview width interaction and real conformance rather than adding invented breakpoint DTOs.

**Parent:** APP-FE-016.UX04  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15); current implementation and the residual target above.

**Problem and intended outcome.** A form must be usable at the client width, not only inside an editor screenshot.

**Required implementation.**

1. Provide supported one/two-column or grid-span layout controls, section grouping, spacing presets and bounded width settings only where represented by current contracts. Do not invent persisted CSS/layout fields.
2. Preview at an explicit actual content width. If runtime uses viewport media queries, use a verified isolated rendering context or compatible responsive adapter; scaling a desktop screenshot is not a phone preview.
3. Keep logical field order, labels/help/errors, actions and keyboard order coherent in RTL/LTR. Collapse columns at supported breakpoints without changing canonical data or workflow semantics.

**Acceptance scenarios.**

1. At proposed 390px, 768px and 1280px content widths, applicable supported forms show usable labels, errors, fields and actions without accidental horizontal page scrolling.
2. Long Farsi labels and repeated tables have a deliberate responsive treatment. Edit surface/preview selection does not change tab order in the real client form.
3. Reopen the saved form and compare with the actual requester runtime at matching width; unsupported layout options are explicit, not falsely saved.

**Dependencies.** APP-FE-016.UX01.a; APP-FE-019.UX02.a; Exact supported layout contract.

<a id="app-fe-016-ux05-a"></a>

#### APP-FE-016.UX05.a — Fluid property editing without Apply/Save traps

**Revision 3.3 current-source note:** Pending selection blocks and preview clearing remain. Reuse history/ref lifecycle while enabling recoverable incomplete input.

**Parent:** APP-FE-016.UX05  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15); current implementation and the residual target above.

**Problem and intended outcome.** The form editor must remain usable while a designer enters incomplete values, without claiming those values are saved.

**Required implementation.**

1. Keep a valid working document, transient per-selection editor buffers, and last server-acknowledged revision distinct. Valid simple edits update the working document at sensible boundaries; incomplete typed values remain in the buffer with inline feedback.
2. Preserve pending buffers when changing selection and preview mode. Complex atomic changes may use a scoped Apply/Discard, but ordinary navigation and unrelated inspection must remain possible. Do not solve friction by dropping pending input.
3. Use bounded undo transactions and an honest save-status indicator. Fence preview/network responses by document revision and actor. Explicit Save is baseline; optional autosave follows actual concurrency/replay contracts and separate approval.

**Acceptance scenarios.**

1. Enter a partially invalid number/rule, navigate elsewhere, then return: the partial input is intact and correctly flagged.
2. Change a label, undo once and redo; both edit surface and preview reflect the same applied document revision.
3. Save during subsequent typing and simulate stale/failed responses: newer local work remains unsaved, current refs update correctly, and no private buffers carry into another session.

**Dependencies.** APP-FE-016.UX01.a; APP-FE-017.UX02.a; Existing mutation infrastructure.

<a id="app-fe-018-ux01-a"></a>

#### APP-FE-018.UX01.a — Understandable rules, choices and calculation setup

**Revision 3.3 current-source note:** Keep typed rules and registered sum/concat/count controls. Concentrate on approved dynamic source/context/override/navigation and complex shape coverage.

**Parent:** APP-FE-018.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R06](#source-r06), [R11](#source-r11), [R12](#source-r12), [R13](#source-r13), [R15](#source-r15); current implementation and the residual target above.

**Problem and intended outcome.** Typed controls must express real behavior, not replace a JSON textarea with equally opaque identifiers.

**Required implementation.**

1. Use constrained readable rules such as Show field when [source] [operator] [value], with exact supported actions and types. Provide a readable rule summary and links to affected fields.
2. Use structured static-choice editing with distinct label/value/type, and typed authorized dynamic-source setup. Show loading, dependency-not-ready, no-results, revoked and failed states. Reuse parent race-safe option lookup work.
3. Expose supported calculations and override policy without arbitrary JavaScript or a second evaluator. Hidden/read-only is not authorization; previews are simulations and the server remains authoritative.

**Acceptance scenarios.**

1. Build a supported conditional justification field using normal controls and test both branches in preview and actual runtime.
2. Change a dependency while a previous option request is delayed: stale choices cannot overwrite the new state; typed canonical option values survive save/reopen.
3. Invalid references/types identify the source field and remain repairable. Unsupported expressions cannot execute browser code or call providers.

**Dependencies.** APP-FE-017.UX02.a; APP-FE-018.UX02; APP-FE-018.UX03.

<a id="app-fe-019-ux01-a"></a>

#### APP-FE-019.UX01.a — Pages, localized labels and purpose-specific views in normal controls

**Revision 3.3 current-source note:** Retain simple catalog repair and saved-version four-purpose display. Finish full PageSettings/variants/parameterized messages; preserve newer ar support.

**Parent:** APP-FE-019.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R07](#source-r07), [R13](#source-r13), [R21](#source-r21); existing preview/localization contracts and the current-source note above.

**Problem and intended outcome.** Designers need to configure what each client-facing view displays and understand which language they are editing.

**Required implementation.**

1. Provide page/section navigation, supported view/purpose configuration and side-by-side or toggled English/Farsi label/help editing. Distinguish editor language from preview language and persisted translation.
2. Show missing/stale translation warnings and fallback behavior. Translate display labels, accessible names and help, not canonical codes or option values.
3. Expose only supported edit/summary/print/correction views and simulated policies. Do not present a requester/reviewer selector as real impersonation or a grant of visibility. Farsi does not automatically imply Jalali dates.

**Acceptance scenarios.**

1. Build a multi-page form with English/Farsi labels using normal controls, reorder a page and reopen without changing canonical bindings.
2. Switch preview language and purpose without losing form edits or synthetic input; the selected view and simulation limits remain visible.
3. Missing translations and unsupported view settings are actionable and do not silently overwrite another locale.

**Dependencies.** APP-FE-016.UX01.a; APP-FE-019.UX02.a.

<a id="app-fe-019-ux02-a"></a>

#### APP-FE-019.UX02.a — Interactive side-by-side client preview using the existing runtime

**Revision 3.3 current-source note:** Reuse actual RuntimeForm and current preview API. Saved-version Display is not the adjacent unsaved-design preview.

**Parent:** APP-FE-019.UX02  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R07](#source-r07), [R13](#source-r13), [R21](#source-r21); existing preview/localization contracts and the current-source note above.

**Problem and intended outcome.** A useful builder shows the actual runtime controls and behavior while the designer works, not a static mock or detached manual preview.

**Required implementation.**

1. Mount the existing runtime form in the preview dock. Keep it interactive for synthetic typing, choices and supported navigation; no selection/drag overlays intercept client interactions there. Provide a separate explicit Select field in editor action where useful.
2. Keep schema/design state, editor selection and synthetic preview input separate. Reconcile compatible synthetic values by stable identity when the design changes. Structural changes that invalidate values must warn and reset only affected sample state deliberately.
3. Offer visible current purpose, locale, viewport width and local/server verification state. Provide reset sample, normal empty data and safe synthetic scenario controls. Preview must never submit a request, create an approval, upload a private file or invoke an integration.

**Acceptance scenarios.**

1. Type into preview, change the field label/required rule in the editor and continue typing: input/focus are preserved where compatible and preview reflects the latest applied design.
2. Test required, empty, invalid, disabled, hidden and correction/summary behavior where supported. Meaningful differences from real case policy are labeled simulated.
3. Complete the same applicable form scenario in author preview and real authorized requester/reviewer runtime and compare values, validation and rendering. No second form renderer is introduced.

**Dependencies.** APP-FE-016.UX01.a; APP-FE-016.UX05.a; Existing shared runtime implementation and current runtime-preview contract; full twenty-kind conformance is required for final parent acceptance, not to start this slice.

<a id="app-fe-019-ux02-b"></a>

#### APP-FE-019.UX02.b — Automatic, bounded and race-safe server preview

**Revision 3.3 current-source note:** Manual preview shares busy with edits today. Add independent bounded automatic preview with generation/context fencing and preserved sample values.

**Parent:** APP-FE-019.UX02  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R07](#source-r07), [R13](#source-r13), [R21](#source-r21); existing preview/localization contracts and the current-source note above.

**Problem and intended outcome.** Live preview must neither require a server save after every edit nor allow older responses to replace the latest design.

**Required implementation.**

1. Use POST /api/v1/forms/runtime-preview with current valid documents and bounded synthetic data. The uploaded contract accepts unsaved FormDocuments; do not invent an endpoint or persist a definition solely to preview it.
2. Debounce applied design changes, cancel or ignore superseded requests and tag results with actor/document/purpose/locale revision. Use a proposed initial 300ms debounce, tune from measurement and prevent a request per pointer move. Handle 422/429/network failure explicitly.
3. Keep immediate local rendering limited to shared established capabilities; server-evaluated behavior is not falsely certified locally. On invalid documents or preview failure, mark the last valid preview as stale with repair guidance. Never show stale results as the current client output.

**Acceptance scenarios.**

1. Delay response for revision A, edit to B, return B then A: only B is displayed as current. Repeat with locale and actor changes.
2. On invalid configuration or network loss, the editor retains work, preview shows a truthful stale/error state and recovery succeeds without reloading the page.
3. Network assertions confirm bounded requests, no hidden save/publish/provider commands, correct unsaved documents payload and cleanup on teardown.

**Dependencies.** APP-FE-019.UX02.a; Verified runtime-preview service contract.

<a id="app-fe-019-ux03-a"></a>

#### APP-FE-019.UX03.a — Useful synthetic scenarios and click-to-repair diagnostics

**Revision 3.3 current-source note:** Typed sample changes and issue links exist. Finish readable diagnostics and scenario controls without normal JSON.

**Parent:** APP-FE-019.UX03  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, UX, QA; named owners TBD  
**Evidence basis:** [R05](#source-r05), [R07](#source-r07), [R13](#source-r13), [R21](#source-r21); existing preview/localization contracts and the current-source note above.

**Problem and intended outcome.** A designer should understand and repair a form without knowing JSON pointers or manually preparing complex sample documents.

**Required implementation.**

1. Provide normal synthetic sample controls for text/numeric/choice data and supported row identities. Offer empty, valid, validation-error, conditional and correction comparison scenarios where supported; labels must identify simulated data.
2. Group issues by page/field/rule with plain-language summaries, severity and a Go to field action. Retain safe machine code/pointer in optional technical detail for support.
3. For preview-only limits such as unavailable real uploads or structural case commands, show a truthful placeholder and a separate paired acceptance test rather than fake success. Keep diagnostics free of secrets/private values.

**Acceptance scenarios.**

1. Activate a failing sample, choose an issue and reach the relevant property/field without losing other edits or scroll context.
2. Correct the problem and observe current-preview recovery; stale diagnostics from an older revision disappear or are explicitly marked stale.
3. Normal authoring and verification of the declared demo subset require no raw JSON. Unsupported preview behavior is not counted as tested.

**Dependencies.** APP-FE-019.UX02.a; APP-FE-019.UX02.b; APP-FE-017.UX03.

<a id="app-fe-034-ux01-a"></a>

#### APP-FE-034.UX01.a — Keyboard, non-drag pointer, RTL and responsive authoring acceptance

**Revision 3.3 current-source note:** The original inspector aria-label issue is fixed. Review remaining literal names, current menu focus and temporal/localization/zoom behavior.

**Parent:** APP-FE-034.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, accessibility QA, UX; named owners TBD  
**Evidence basis:** [R13](#source-r13), [R14](#source-r14), [R15](#source-r15), [R17](#source-r17); acceptance requirements, not new test results.

**Problem and intended outcome.** Good pointer interactions do not justify excluding keyboard, assistive-technology or non-drag users.

**Required implementation.**

1. Provide keyboard and single-pointer non-drag alternatives for add, move, connect, reorder, resize and context actions. Test them separately: keyboard support alone does not establish non-drag pointer support.
2. Localize region/control names, announcements and status, including Component inspector, Simulated runtime preview and Validation diagnostics found in the template. Use roving focus or an equivalent deliberate navigation design for large graphs.
3. Keep RTL chrome and field layout correct without silently mirroring workflow semantics. Protect native text editing/IME, browser shortcuts, popup focus, Esc handling and zoom. Test synthetic data in both themes/locales on the declared browser matrix.

**Acceptance scenarios.**

1. Complete a three-node workflow and a six-field form using keyboard only, then independently using clicks/taps without dragging.
2. Open/operate/dismiss menus and drawers and recover focus predictably. Input typing never triggers node deletion, movement or clipboard graph commands.
3. Capture automated accessibility results and separate manual keyboard/screen-reader findings. No universal mobile or WCAG conformance claim comes from a scanner pass.

**Dependencies.** Canvas/form work units touched by the slice.

<a id="app-fe-035-ux01-a"></a>

#### APP-FE-035.UX01.a — Measure canvas smoothness and preview latency without changing semantics

**Revision 3.3 current-source note:** Existing measurements and newer browser-sandbox timings are inputs, not current performance certification or a Playwright speed result.

**Parent:** APP-FE-035.UX01  
**Priority:** P1 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, QA, backend as needed; named owners TBD  
**Evidence basis:** [R13](#source-r13), [R14](#source-r14), [R15](#source-r15), [R17](#source-r17); acceptance requirements, not new test results.

**Problem and intended outcome.** Users need responsive dragging and fast authoring; the current review has no measured performance baseline.

**Required implementation.**

1. Measure small and agreed bounded-stress graphs/forms on named browsers/devices. Suggested starting fixtures are 25/100 nodes and 20/100 fields, constrained by actual supported server limits, with representative edges/rules/rows. These are proposed fixtures, not established scale promises.
2. Profile gesture frames, full-document clones, history size, renderer re-creation, server-preview requests and teardown. Batch layout gestures; avoid rebuilding all form controls or validation on every pointer event. Do not introduce virtualization that breaks ports, measurement, focus or form semantics.
3. Record p50/p95 interaction and preview timings, long tasks, peak memory, requests per edit sequence and successive-open cleanup. Propose local feedback within 100ms and smooth typical dragging as candidate usability goals; agree device-specific budgets before pass/fail certification.

**Acceptance scenarios.**

1. Before/after traces show the measured change on the same fixture/device. Any approved budget miss remains visible and release-blocking for its agreed scope.
2. Twenty repeated editor opens/closes do not accumulate subscriptions, streams, object URLs or stale previews. Keep bounded history and request counts.
3. One completed drag creates one semantic history entry; preview input remains stable during unrelated designer changes. Report actual results, not inferred frame rates.

**Dependencies.** APP-FE-020.UX01.h; APP-FE-019.UX02.b.

<a id="app-fe-037-ux01-a"></a>

#### APP-FE-037.UX01.a — Demonstrate authoring-to-runtime usefulness, not just component tests

**Revision 3.3 current-source note:** Reuse documented nine-scenario editor acceptance and later twenty-case receipt/reset evidence. Prove the redesigned end-to-end reference at the current pair.

**Parent:** APP-FE-037.UX01  
**Priority:** P0 | **Authoring release blocker:** yes | **Current execution status:** consult the canonical owner; this review ran no application checks.
**Owner roles:** Frontend, backend, QA, product owner; named owners TBD  
**Evidence basis:** [R13](#source-r13), [R14](#source-r14), [R15](#source-r15), [R17](#source-r17); acceptance requirements, not new test results.

**Problem and intended outcome.** The editors are not complete until a designer can produce a usable workflow and client form and another person can use the result.

**Required implementation.**

1. Demonstrate form creation, live preview, workflow wiring, exact form/task configuration, workspace save/validate/promote/publish and reopen against real paired services. Use the actual supported lifecycle and non-superuser permissions.
2. Run an eligible requester through the published form and a reviewer through the configured human decision. Include a configured correction/branch path and real notification/outcome only where backend support and service evidence exist. Report missing downstream capabilities separately; do not pretend the authoring milestone proves full integration.
3. Record current source/schema versions, actual commands, console/network results, video or screenshots with synthetic data and any usability assistance. Keep the full final zero-warning mise run check, paired tests and product/user acceptance as separate required evidence.

**Acceptance scenarios.**

1. The owner or nominated designer completes the agreed reference authoring task without code, JSON, copied refs or developer rescue; observed failures become explicit reopen criteria.
2. The exact saved/published form renders through actual requester/reviewer projections and correct configured branch outcome payloads. Immutable published definitions and active case pins remain unchanged during later editing.
3. Run stale writes, cancelled drags, failed saves, invalid rules, permission revocation and preview-response races. Required skips or fixture-only substitutes do not qualify for release.

**Dependencies.** Applicable canvas/form units; APP-FE-001.UX01; Existing paired environment; backend blockers recorded per scenario.

<a id="playwright-browser-verification"></a>

## Playwright verification and migration — current pnpm implementation input

The eight PW IDs are retained under APP-FE-002.UX01. Installing Playwright is still a requested change; the inspected package manifest does not declare its runner or commands. Reuse the existing production/fixture/real-service harnesses and preserve their evidence labels. Current tooling requirements: pinned compatible @playwright/test, pnpm@12.11.2, repository Node 24, pnpm-lock.yaml (including its multiple documents), strict engine/peer/build policy, and no package-lock.json. Select and verify the exact Playwright version at implementation time; this review did not establish a new compatible version or install binaries.

<a id="app-fe-002-ux01-pw01"></a>

#### APP-FE-002.UX01.PW01 — Pinned runner, configuration and developer workflow

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P0 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** frontend/test engineering and CI, named owners TBD. **Depends on:** current checkout/toolchain intake; not on every unfinished feature.

**Required implementation.** Inspect the current `package.json`, `pnpm-lock.yaml`, toolchain files, README, browser scripts and CI before modifying them. Add an exact compatible `@playwright/test` development dependency and commit the reproducible lockfile change. Verify Node/pnpm compatibility, browser/OS support and install-script policy. Do not use an unpinned runtime download of `latest` in CI or bypass package install safeguards. Existing runtime UI dependencies do not need replacement.

Use TypeScript Playwright tests and a scoped `playwright.config.ts` (or extend an existing one found during intake). Include test/config sources in an explicit no-emit typecheck, lint and format gate; the inspected application-only `tsconfig.app.json` command must not be assumed to cover them. Keep browser-only utilities out of domain/application source boundaries.

Use Playwright-managed matching browser binaries [PW-S10]. Do not assume the existing generic `BROWSER_BINARY` or a system Firefox executable is compatible with Playwright's patched browser builds. Record selected package/browser revisions in evidence. Reconcile and document legacy engine environment variables rather than silently ignoring them.

Default required browser coverage is **Chromium and Firefox**, retaining the existing engine scope. Provide a separate WebKit compatibility project; its release-blocking status and any Safari/device support claim need an explicit supported-browser decision and actual evidence. Browser emulation is not a physical mobile-device test.

Separate development smoke, fixture-backed regression and real-service paired execution. Build the application once per source/configuration and serve the actual production build for acceptance through its existing same-origin session boundary. Do not swap in a preview-only component route and label it production-page acceptance. A lightweight fixture route can remain a clearly labelled isolated test.

**Acceptance.** A clean checkout can install the locked tools/browsers and discover/run a real pilot test through documented commands. The runner fails on missing required prerequisites. The first pilot produces HTML/machine-readable output and a failure trace. Unit tests and production bundle boundaries remain intact. No existing tests have been deleted to get this first slice green.

<a id="app-fe-002-ux01-pw02"></a>

#### APP-FE-002.UX01.PW02 — Actor isolation, lifecycle and disposable service fixtures

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P0 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** test engineering, frontend session owner, backend/operations, named owners TBD. **Depends on:** PW01; existing approved test harness for paired evidence.

**Required implementation.** Reuse current fixture builders, the real session boundary and the guarded disposable backend harness. Split fixture data/HTTP helpers from page-injected scripts where needed; do not simply execute the old in-page script through `page.evaluate()` and declare pointer coverage migrated. Give each test a fresh browser context and mutable records of its own. Give parallel workers independent writable accounts, sessions and data; browser contexts alone do not isolate backend state [PW-S1, PW-S2].

Authenticate through the real same-origin boundary for paired tests. Keep service tokens and confidential client credentials server-side. Do not introduce production bypass endpoints or browser token storage for testing. State reuse is allowed only for scenarios where it does not hide login/refresh behavior or create shared-session races. Logout, refresh rotation, revocation, account mutation and reviewer claim races need deliberate isolated identities. Simulate two tabs with one context and two independent actors with separate contexts; do not confuse these tests.

Run identifiers must namespace temporary files, storage prefixes, browser artifacts and fixture-owned records. Do not imply a new tenant model. For resources that cannot be namespaced safely, use separate disposable environments or serialize the owning tests. Start with one worker for shared-backend/legacy harness groups; enable parallelism only after database, broker, worker, media, session and reset isolation is proven. Parallel CI jobs/shards also need isolation; `workers: 1` does not serialize separate jobs.

Before any reset, validate an allowlisted disposable target and the existing explicit destructive-operation safeguards. Never reset an environment while another test owns it. Start/stop only processes owned by the test run; propagate cancellation/timeouts; collect bounded safe diagnostics and clean up in teardown even on failure. A cleanup failure is recorded, not silently swallowed.

**Acceptance.** Isolated tests pass in varied order without reading another test's records; protected traces and auth-state files are ignored by Git and not published as general artifacts. Missing backend services cannot trigger a hidden switch to fake responses. A deliberate authorization/claim race exercises actual server rejection with exact contract assertions. No shared/production data or live paid provider is touched.

<a id="app-fe-002-ux01-pw03"></a>

#### APP-FE-002.UX01.PW03 — Real workflow-canvas gesture regressions

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P0 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** canvas frontend owner and test engineering, named owners TBD. **Depends on:** PW01/PW02 plus the specific interaction being tested; missing editor features remain failing/blocked feature work, not fabricated passes.

**Required implementation.** Build a small typed canvas driver around user-visible controls, purposeful node/port/edge test contracts and bounding boxes. Locate by role/name/label wherever meaningful; use stable test IDs for geometrical ports/edges without weakening accessible names. Do not locate by opaque API refs copied by the user, Angular internals, array index or brittle Foblex private markup.

Use Playwright pointer and keyboard actions for acceptance. For native HTML drag-and-drop, exercise real dragstart/data-transfer/drop behavior. For Foblex pointer gestures, use the actual down/move/up sequence on the appropriate handle or connector. Synthetic `dispatchEvent` and domain-function calls may supplement unit tests, but do not replace a real gesture scenario [PW-S6].

| Required scenario                                          | Assertions beyond “the handler ran”                                                                                                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palette drag/drop under pan, zoom and page scroll          | Node appears at the intended canvas position with one stable identity; edge/port alignment remains correct; save/reopen preserves the placement.                                                                              |
| Click-to-place, add-next and keyboard/non-drag alternative | Correct kind and insertion position, sensible focus, no duplicate node and no unintended canvas placement when clicking a menu or existing node.                                                                              |
| Output-to-input drag                                       | The actual selected outcome and source/target port are visible and persist; control/data meanings stay distinct. Incompatible targets and cancelled wiring leave the graph unchanged.                                         |
| Existing-edge selection, rewire and insertion              | Actual line is actionable; invalid rewire preserves the original connection; compatible insertion preserves outcome/mapping; no approval bypass is introduced.                                                                |
| Blank/node/edge/group right-click                          | Menu targets the item under the pointer, not a stale selection; actions, disabled reasons, viewport placement, Escape/outside dismissal and focus restoration work. Include keyboard menu invocation and visible equivalents. |
| Marquee/modifier selection and group drag                  | Only intended nodes move by a consistent delta; connected lines follow; no accidental edge creation; group action yields one undo step.                                                                                       |
| Duplicate/delete/undo/redo                                 | New identities are unique; safe dependencies and intentional bindings are retained; one completed gesture is one history step; text editing shortcuts do not delete nodes.                                                    |
| Pending inspector and published read-only state            | Pan/zoom/fit/find/inspection still work where allowed; invalid buffered properties are not lost; forbidden mutations do not reach the server.                                                                                 |
| Stale save and uncertain response                          | Local authorized input survives; conflict and uncertain states are explicit; refreshed refs and operation-specific replay rules are used; no false “Saved” label.                                                             |

The core browser evidence must combine visible assertions, the relevant observed request/response and an authorized fresh read or reopen. Do not seed the target graph already connected and count a page-load test as connection coverage. Use only server-supported outcomes and lifecycle transitions.

**Acceptance.** Reproduce the reported broken gesture as a failing regression where possible, then demonstrate its repair through actual browser input. Pass the required Chromium/Firefox and English/Farsi interaction combinations. Record trace, screenshot and safe semantic evidence; any fixture-backed portion remains labelled as such.

<a id="app-fe-002-ux01-pw04"></a>

#### APP-FE-002.UX01.PW04 — Visual form builder and race-safe client preview

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P0 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** form frontend owner and test engineering; backend form owner for conformance, named owners TBD. **Depends on:** PW01/PW02 and applicable field/editor functionality.

**Required implementation.** Start from the normal form-designer route and exercise the tools dock, editable surface, contextual properties and adjacent interactive preview. Use separate scoped locators for designer and client preview so a test cannot pass by interacting with the wrong copy of a field. Use the existing runtime renderer; do not build a second renderer just for testing.

| Required scenario                                          | Assertions                                                                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create a field by palette/drop and by a non-drag control   | Correct placement/default properties; stable node identity; generated canonical key where supported; no normal JSON/copy-ref step.                                                          |
| Change label, help, required state, choices and validation | Correct preview output, canonical values preserved and saved document/reopen agree. Partial invalid inspector input stays recoverable.                                                      |
| Reorder/reparent/duplicate nested layouts                  | Valid insertion feedback; incompatible nesting rejected; no cycles; intentional new-field versus shared-placement semantics; safe undo.                                                     |
| Live preview next to authoring                             | Preview remains visible while editing; updates without requiring a server save first where supported; compatible sample input and focus survive.                                            |
| Delayed, failed and out-of-order previews                  | Deliberately delay response A, trigger design B, deliver B then A; only B is shown. Test route teardown, actor changes, stale diagnostics and retry of safe preview reads.                  |
| Twenty-primitive conformance                               | Map each primitive and applicable editable/read-only/default/null/validation/collection/media behavior to the existing matrix. Unsupported combinations are explicit, not silently skipped. |
| Collections, private attachments and dynamic options       | Stable row identities, typed options and late-query protection; simulated preview restrictions clear; actual private upload/link authorization is tested separately in the paired journey.  |
| Narrow/wide preview and English/Farsi                      | Correct actual content width and direction; long labels, errors, dates/numbers and dropdown overlays remain usable; no translated machine codes.                                            |
| Save/reopen and publication                                | Current refs adopted, invalid/conflicting writes recover, published definitions stay immutable and active requests retain exact version pins.                                               |

A controlled mocked/delayed response is appropriate for deterministic frontend race/failure tests, but must be marked fixture or fault-injection evidence. A separate real-service conformance test verifies the supported backend preview and persistence. Assert that client-preview interactions do not create requests, approve work, link/upload real files or call providers.

**Acceptance.** The representative form can be built visually, exercised in the side preview, saved and reopened through production UI. Required primitive behaviors and negative paths have traceable tests; screenshot-only success does not establish form semantics or backend conformance.

<a id="app-fe-002-ux01-pw05"></a>

#### APP-FE-002.UX01.PW05 — Actual paired workflow and security/recovery journeys

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P0 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** test engineering, frontend, backend and operators, named owners TBD. **Depends on:** PW02 and actual prerequisites of each supported scenario.

**Required implementation.** Use the existing disposable environment and non-superuser author/requester/reviewer accounts. For each selected release journey, run the actual UI against the actual boundary/backend, database and required worker/media/notification services. A synthetic external HTTP sandbox is permitted when explicitly labelled; no live AI/provider spend is assumed or authorized.

Cover exact definition publication and pins, eligible request creation, localized draft input, private attachment linking, submit, human claim/decision/correction, configured branches, inspectable outcome and notifications/reports where they belong to the selected journey. Assert actual outcomes using approved read APIs and service-owned evidence; do not assert success solely from a toast. Use existing exact endpoints/envelopes/errors after checking the current contract, not invented test endpoints.

Required negative paths include two-reviewer claim races, two-tab stale saves, permission revocation, session expiry/refresh coordination, ambiguous post-submit responses, duplicate command replay, private download denial and preview-versus-business-side-effect separation. Refresh tokens and non-idempotent external actions are not blindly retried. For ambiguous outcomes, deliberately distinguish “request never sent” from “server committed but response lost.” Browser route interception alone must not be used to claim an external provider committed an effect.

Separate projects/evidence labels: `fixture`, `paired_real_services`, and `fault_injection` (names proposed). Replacing owned business API responses with fixtures cannot satisfy `paired_real_services`. Bounded delay/drop fault injection around real requests is allowed only when identified and its server effect is evidenced. Keep long-lived notification streams out of generic “wait for network idle” readiness conditions.

**Acceptance.** The tested reference journey has real browser + service evidence with both source identities and schema hash; required missing services or unfinished actions are reported as blocked, not skipped-green. Existing backend concurrency/authorization tests remain required. The broader product's acceptance is not claimed from a narrower pilot pass.

<a id="app-fe-002-ux01-pw06"></a>

#### APP-FE-002.UX01.PW06 — Visual regression, language, responsiveness and accessibility

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P1 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** frontend, QA/accessibility and product/design reviewer, named owners TBD. **Depends on:** PW01 and pilot surfaces with reviewed expected behavior.

**Required implementation.** Add reviewed screenshots for the canvas, open context menus, typed inspector, form workspace, client preview and important error/conflict states. Use a deterministic build, OS/browser revision, prepared fonts, fixed locale/theme/viewport and synthetic data. Wait for purposeful readiness and font loading. Avoid making a broken screenshot the approved baseline. Snapshot changes require human diff review; never auto-update screenshots in the passing CI gate [PW-S7].

Use role/label and keyboard assertions in addition to images. Cover focus order/restoration, Escape, menu keyboard navigation, non-drag alternatives, zoom, required labels/errors, long Farsi text and RTL overlays/edge interactions. Verify the application's locale setting and `lang`/`dir`, not just the browser locale. Translate accessible display text, not canonical keys/outcomes. Theme and responsive checks must retain real usability, not merely fit inside a screenshot.

Reuse current `axe-core` policies. Adopt a compatible `@axe-core/playwright` adapter only when useful and reconcile its version with the existing engine; do not silently run inconsistent rule sets. Automated axe checks cover specified screens and active states such as open dialogs/menus/errors; they do not establish manual screen-reader acceptance [PW-S8]. Track incomplete/manual items explicitly. Do not use broad rule disabling or screenshot masking to hide real controls, focus problems or errors.

Use a risk-based matrix: core canvas/form gestures in both Chromium/Firefox and en/fa; focused light/dark and supported desktop/laptop states; narrow requester/runtime screens; and narrow-editor behavior only to the level actually supported. Add WebKit compatibility results separately. Preserve the existing approved profile and device expectations if intake finds stricter ones.

**Acceptance.** Visual diffs are reviewed and regressions fail. Automated accessibility violations are zero under the declared unchanged rule set; required manual checks remain separately evidenced. Neither device emulation nor Playwright WebKit alone becomes a claim of acceptance on every phone or Safari release.

<a id="app-fe-002-ux01-pw07"></a>

#### APP-FE-002.UX01.PW07 — CI integration, evidence and no-coverage-loss migration

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P0 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** CI/test engineering and release owner, named owners TBD. **Depends on:** PW01/PW02; scenario parity before retiring each legacy path.

**Required implementation.** Inventory the existing mandatory checks, assertions and evidence consumers. Build an old-to-new coverage map keyed by scenario/owning backlog ID, not just script name or test count. Mark each legacy group KEEP, MIGRATE, or RETIRE_AFTER_PARITY. Keep API, boundary, deployment, no-JSON, translation and contract checks. Migrate the canvas/form pilots first; leave all other required old checks running until equivalent Playwright assertions and real-service coverage exist.

Wire the required Playwright suites into `mise run check` and the actual existing CI/evidence aggregation path. A focused smoke command is faster feedback, **not** a replacement for the full gate. Preserve all current mandatory scopes. New paired acceptance remains explicit and fail-closed; an absent backend/binary cannot produce a successful full-product verdict. If local and paired commands are separate, the final aggregate still requires both for the deliverable concerned.

Use real process exit codes, explicit timeouts, exact package/browser/build provenance, and always-attempt artifact collection after failures. Do not use `continue-on-error`, masked shell exits, warning suppression or dynamic skips to turn failing required evidence green. Pin CI dependencies consistently with repository policy. Use least-privilege workflow permissions; never expose trusted credentials to untrusted fork code or upload auth state.

**Strict result policy.** Set `forbidOnly: true`, default required-run `retries: 0`, and retain first-failure evidence. Diagnostic retries can run separately, but the first failure remains visible and a retry pass does not satisfy strict readiness. When diagnostic retries are enabled, use `failOnFlakyTests: true` or an equivalent tested report gate with the selected supported version [PW-S9]. Zero tests, a missing expected scenario/project, a required skip/fixme/expected failure, cancelled run, or absent report cannot be accepted as a full pass. Compare the declared required manifest with collected results; tooling flags alone do not detect every missing scenario.

Capture browser console warnings/errors, page crashes/exceptions, unexpected request failures and unexpected HTTP failures with bounded safe context. Negative tests declare specific expected method/route/status/error outcomes; they do not blanket-ignore all 401/403/409 or all aborted requests. Legitimate preview cancellation may be expected only in its scoped test. No emitted warning is silently reclassified away to meet the repository zero-warning rule. A reproducible unavoidable platform exception must remain explicit and cannot be called strict readiness.

**Evidence outputs (proposed).** Human HTML report plus JSON/JUnit or the repository's compatible machine format; failure screenshots; failure traces with DOM/network timelines; optional short video for hard-to-debug gestures. Use `trace: 'retain-on-failure'` for the critical suite with zero retries, and `screenshot: 'only-on-failure'`; video can be `retain-on-failure` for the selected gesture/debug project. Trace capture has overhead and must be measured rather than denied [PW-S4, PW-S5].

Traces, videos, screenshots and network logs can contain private data and session material. Use synthetic accounts/data, protected short-lived access and explicitly bounded retention; never publish raw traces to a public issue/site or upload the auth-state directory. Screenshot masks do not sanitize trace DOM/network content. Disable or avoid sensitive capture where it cannot be safely retained and document the evidence alternative. Token values, credentials, prompts and private payloads must not be copied into summary logs.

Record each suite's source SHA/worktree identity, backend revision where applicable, API hash, browser revision, OS/runtime, profile, data mode, worker/shard settings, case IDs, passes/failures/skips/flaky status and artifact locations. Extend the existing release-evidence parser instead of assuming it understands a new report. Keep historical evidence rather than overwriting it with the new runner's name.

**Acceptance.** Demonstrate the gate correctly fails for a deliberately failing assertion, a console warning, an omitted required test, an inaccessible required service and a retry-only pass. The normal final-tree mandatory suite then passes without required skips/warnings. Retire a legacy browser command only after reviewed one-to-one/one-to-many scenario parity and updated documentation/evidence consumers; retain a documented fallback during migration without double-counting it as new coverage.

<a id="app-fe-002-ux01-pw08"></a>

#### APP-FE-002.UX01.PW08 — Measured execution speed and reliability

**Revision 3.3 current-source note:** Use the current pnpm manifest/lock/workspace policy and preserve the newer sandbox/temporal/diagnostic coverage. Existing historical acceptance is reused; no Playwright run or speedup is claimed here.

**Priority:** P1 | **Status:** PROPOSED | **Verification:** NOT_RUN  
**Owner roles:** test engineering, CI and performance owner, named owners TBD. **Depends on:** at least one comparable migrated slice; PW02 before any concurrency increase.

**Required implementation.** Compare equivalent existing and Playwright scenarios on the same source/build, runner class, engine/profile, data, service topology and required assertions. Record build/install/service startup separately from test execution, artifact capture and total feedback time. Use repeated measurements (proposed minimum five per comparable mode); report median and range with the sample size. Do not present a small sample as a reliable p95 or compare a reduced Chromium smoke to the previous full Firefox suite.

First remove redundant application builds and unnecessary fixed waits. Prefer locator actionability and bounded web-first assertions; wait on the relevant UI/network/semantic event, not arbitrary sleep or network-idle in an app with streams [PW-S1]. Reuse a worker's browser process with fresh contexts where safe. Begin with bounded concurrency, measure 1/2/4 workers only where fixture isolation allows, and select capacity from observed stability/memory/backend load. Shard only when the whole environment, including accounts/session refresh and resets, is independently safe [PW-S2, PW-S3].

Track first-attempt pass rate, repeated-run failures, suite startup/execution duration, CPU/memory, retries, cleanup failures, developer diagnostic time and coverage parity. Application performance remains separate: browser-runner duration is not canvas responsiveness, preview latency, production scalability or a load test. Run actual interaction performance measurement without contention from parallel regression jobs; report instrumentation effects.

**Acceptance.** Publish an honest before/after comparison and a concurrency decision with no lost required scenarios. Preserve the faster settings only if correctness, isolation and reliability hold. If the migration is not faster, report that and keep the defensible tooling/coverage benefits; no fabricated speedup, blanket timeout reduction or skipped tests. Performance budgets for the app and CI stay provisional until measured and agreed.

### Playwright reference index retained from revision 3.2

The following reference identifiers are retained from the supplied master file for the implementation guidance above. Their pages were **not re-fetched in this source recheck**; verify relevant options and compatibility against the exact selected Playwright version during implementation. They are not measurements of this project's speed or evidence that the runner is installed.

| ID     | Primary documentation reference                                                         | Guidance covered                                                                                          |
| ------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| PW-S1  | Playwright, Best Practices — `https://playwright.dev/docs/best-practices`               | User-visible assertions, locator waiting, test isolation and typecheck/lint guidance.                     |
| PW-S2  | Playwright, Authentication — `https://playwright.dev/docs/auth`                         | Auth-state reuse boundaries, state-file sensitivity and independent accounts for writable parallel tests. |
| PW-S3  | Playwright, Parallelism — `https://playwright.dev/docs/test-parallel`                   | Workers and configurable execution; does not establish project-level speedup.                             |
| PW-S4  | Playwright, Trace viewer — `https://playwright.dev/docs/trace-viewer`                   | Action timeline, DOM snapshots and network inspection for failures.                                       |
| PW-S5  | Playwright, Configuration (use) — `https://playwright.dev/docs/test-use-options`        | Trace/screenshot/video configuration.                                                                     |
| PW-S6  | Playwright, Actions — `https://playwright.dev/docs/input`                               | Browser pointer, keyboard and drag interactions.                                                          |
| PW-S7  | Playwright, Visual comparisons — `https://playwright.dev/docs/test-snapshots`           | Screenshot assertions and environment-sensitive baselines.                                                |
| PW-S8  | Playwright, Accessibility testing — `https://playwright.dev/docs/accessibility-testing` | axe integration and limits of automated accessibility testing.                                            |
| PW-S10 | Playwright, Browsers — `https://playwright.dev/docs/browsers`                           | Browser installation/revision matching and Firefox/WebKit compatibility boundaries.                       |
| PW-S9  | Playwright, TestConfig — `https://playwright.dev/docs/api/class-testconfig`             | Explicit `forbidOnly`, `failOnFlakyTests`, retries and worker controls.                                   |

## Completion, rollout and handoff

Preserve source identity and current contracts at every slice. Test actual positive/invalid/forbidden/stale/conflicting/uncertain/cancelled/success states, unsaved navigation, actor change, route teardown and long localized content. Published definitions remain immutable, active cases pinned, refs refreshed after writes, and replay payloads unchanged for their exact operation. Keep canonical values and authorization separate from rendering. AI cannot satisfy a human-approval requirement.

For editor mutations, verify domain transforms and actual pointer/keyboard/browser interactions; for claims/concurrency/private media/external receipts, use real owned services and actors. Fixture browser tests are useful but labelled fixture-only. Playwright must not claim success by calling internal component methods or replacing a required UI gesture with a prepared graph. Preserve diagnostics and failures; missing services/browsers, required skips, cancelled checks and retry-only passes do not establish completion.

A final unchanged-source `mise run check`, task-specific real backend/browser evidence, supported accessibility/performance checks and updated change records remain required. Backend D07 results retain their precise exception label; they never waive frontend diagnostics or human acceptance. Manual screen-reader/device and usefulness review remain human tasks. Save/publish success is not rollout, deployment or user acceptance.

Roll out reviewable slices with before/after evidence and a reversible application deployment. No automatic published definition rewrite, case-pin mutation, schema/data reset or live provider call is part of a visual upgrade. Resolve migration changes with the current backend owner and DB-002 policy; a database rollback does not undo external effects. Operator support should retain safe correlation references, not private form/trace payloads.

### Implementation-agent instruction

Read current AGENTS.md, the canonical APP/CONS/follow-up owners and this revision. Reconfirm that the current checkout includes the reviewed commit; preserve all local changes. Query the local graph with graphify when present and available. First demonstrate the existing whole-card/context-menu/quick-field behavior before editing it. Choose one bounded remaining criterion, preferably the selection regression or adjacent preview slice; add a failing regression, extend the existing domain/adapter/UI seams, and gather actual unchanged-tree evidence. Add Playwright through pnpm using isolated real-user journeys and a coverage crosswalk. Do not convert recorded DONE shared features into NEW work. Do not mark a parent complete from a scoped test. Record exact source/contract/test identity, failures, remaining gaps and peer handoff. Refresh the graph after code changes. This document review itself has not committed, tested or deployed application code.

## Evidence register — selected sources at the frozen frontend commit

Source-derived behavior, repository-reported verification and this review's proposed work remain distinct. URLs below identify the exact inspected revision, not an assumed future main branch. Old test artifacts and source digests named by a document were not independently fetched or executed here.

<a id="source-r01"></a>

### R01 — GitHub main branch / frozen review identity

Commit: https://github.com/Metal-Bat/angular-base/commit/f12efc443bfb9d073594c12567d9088d55687c66

Identity: `f12efc443bfb9d073594c12567d9088d55687c66`.

Commit message: feat(studio): improve form authoring and workflow interactions; commit timestamp 2026-10-12T19:03:02Z.

<a id="source-r02"></a>

### R02 — Repository instructions

File: `AGENTS.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/AGENTS.md

Identity: `ffd5a25f06904396a297501675d6a3604f500671`.

Current DB-002/D07 and cross-layer amendments; original task ownership and evidence rules.

<a id="source-r03"></a>

### R03 — Toolchain and package declarations

File: `package.json`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/package.json

Identity: `c580d95655c32856ba5b45e366b4043583031c70`.

pnpm@12.11.2; Node >=24.21.0 <25; declared Angular 21.2.25 / Foblex 19.3.0 / PrimeNG 21.1.10 / NG-ZORRO 21.3.3. pnpm-lock.yaml (blob 6bc3c878af15e15f34da48207590d930b1702add, inspected lines 1–110 and 140–260) contains package-manager and application documents; pnpm-workspace.yaml blob 7adf62d82af7fa0bcef46c02115ef302add6d9f8 retains strict engine/peer/build rules. Not a dependency audit or successful install.

<a id="source-r04"></a>

### R04 — UI policy and documented integrations

File: `docs/UI-LIBRARIES.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/docs/UI-LIBRARIES.md

PrimeNG-first; retain scoped NG-ZORRO/Material/native/canvas exceptions. Temporal display calendars and canonical Gregorian distinction; newer sections supersede older descriptive prose.

<a id="source-r05"></a>

### R05 — Form workspace template and styling

File: `src/app/features/studio/presentation/form-builder/form-builder.html`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/presentation/form-builder/form-builder.html

Identity: `bc6b0c40595de87cba77907c8a000364823f78de`.

Full template inspected. Companion form-builder.scss blob 300dec2e3fa82567da1bd6f2554ac3ecc6fb0243 shows palette/canvas/properties and stacking at max-width:80rem, with preview outside this grid.

<a id="source-r06"></a>

### R06 — Form editing state

File: `src/app/features/studio/presentation/form-builder/form-builder.ts`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/presentation/form-builder/form-builder.ts

Identity: `71f72e9cc74c1f576cd553a52fc49f29c7a6096e`.

Quick-add, reparent, placement duplication, history, pending-selection fence, preview invalidation.

<a id="source-r07"></a>

### R07 — Form command/preview lifecycle

File: `src/app/features/studio/presentation/form-builder/form-builder-commands.ts`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/presentation/form-builder/form-builder-commands.ts

Identity: `0612702442838ae0b9a60cad866754bee93dd512`.

Inspected lines 1–340. Shared busy flag, manual preview, data/sample update, generation fencing and route loading.

<a id="source-r08"></a>

### R08 — Canvas interaction adapter

File: `src/app/features/studio/infrastructure/workflow-canvas/workflow-canvas.ts`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/infrastructure/workflow-canvas/workflow-canvas.ts

Identity: `9318c44d47a0ffddcaf876ed0c3f2c08e6bb9621`.

Node/blank context menus, click-to-connect, duplicate callback, navigation guard and single/multi-selection dispatch.

<a id="source-r09"></a>

### R09 — Workflow board state adapter

File: `src/app/features/studio/presentation/workflow-board/workflow-board.ts`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/presentation/workflow-board/workflow-board.ts

Identity: `9db48db7e44911c83402b7f403a07f2b44b5e9e4`.

Broad disabled input, board outcome default, viewport history path and single selection.

<a id="source-r10"></a>

### R10 — Workflow command interactions

File: `src/app/features/studio/presentation/workflow-board/workflow-interactions.ts`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/presentation/workflow-board/workflow-interactions.ts

Identity: `9e8de796ce8a215438d41691bc63b50a1d39c1ef`.

Panel discard exists. selectionKeys is preferred for toolbar duplication; ordinary select does not clear it.

<a id="source-r11"></a>

### R11 — New visual form cards

File: `src/app/features/studio/presentation/form-canvas/form-canvas.html`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/presentation/form-canvas/form-canvas.html

Identity: `eff1d4dbb4d19ce30586c3b8bc2ef428ffacae09`.

Buttons with icons/answer-line placeholders, indentation and six quick-add controls. Companion form-canvas.ts blob cdb22a456305aa307f81c71ba6405f1a5919f4d0 contains flattened outline cards; no direct card DnD inputs/outputs in these inspected files.

<a id="source-r12"></a>

### R12 — Placement domain operations

File: `src/app/features/studio/domain/form-placement.ts`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/src/app/features/studio/domain/form-placement.ts

Identity: `9eff4ae41328bdf9b750a2d64c1d729855df7a2a`.

Same-collection reparenting; nested layout-only duplication with fresh placement identity and shared canonical data.

<a id="source-r13"></a>

### R13 — Recorded scoped editor acceptance

File: `docs/delivery/APP-FE-016-020-ACCEPTANCE.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/docs/delivery/APP-FE-016-020-ACCEPTANCE.md

Identity: `a4252a8c93d21d325ee78731f085aa457c87e4a7`.

Reports 379 operations/565 schemas, nine actual Firefox scenarios, and historical complete local gate; parent scope remains open. Logs were not fetched or rerun in this review.

<a id="source-r14"></a>

### R14 — Recorded shared-feature closure and peer gaps

File: `docs/delivery/APP-FE-006-015-PEER-HANDOFF.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/docs/delivery/APP-FE-006-015-PEER-HANDOFF.md

Identity: `04af435b17cd0961a967f4061ecaf4267009d9b7`.

Records DONE reusable scopes for 006–011, 013 and 015; 012/014 incomplete; team selector, reminder offsets and operation-destination gaps.

<a id="source-r15"></a>

### R15 — Recorded receipts, recovery and placement continuation

File: `docs/delivery/APP-FE-026-028-RECEIPTS.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/docs/delivery/APP-FE-026-028-RECEIPTS.md

Inspected first 120 lines, including later successful run-seven section start. Twenty-case success/reset report, intentional reviewer denial, implemented configured placement; operator recovery matrix still limited. Historical test reports are not new results.

<a id="source-r16"></a>

### R16 — Latest commit diff and form change record

File: `docs/changes/APP-FE-016.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/docs/changes/APP-FE-016.md

Latest commit diff retrieved; form record includes 2026-10-12 card/create-draft/display follow-up and older continuations. Whole-card/context-menu repair and notification/boundary follow-ups appear in the same commit. These describe scoped tests, not blanket parent completion.

<a id="source-r17"></a>

### R17 — Current browser orchestration

File: `scripts/browser-quality-check.mjs`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/scripts/browser-quality-check.mjs

Identity: `af9802a27ab4a1b06ac435aac7d7e4f17674343d`.

Sequential engine/scopes, temporal scope, sandbox diagnostics, timings, screenshot requirement in sandbox and fixture-only summary. No measured Playwright comparison.

<a id="source-r18"></a>

### R18 — Setup and documentation

File: `README.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/README.md

Identity: `d4ad2aac47eddfa4fdf8f31ac311befa804832c5`.

Current mise/pnpm install/check guidance; older next-step/clone-target prose needs reconciliation. Generated graph is ignored and local; no CLI execution in this review.

<a id="source-r19"></a>

### R19 — Current contract intake lineage

File: `docs/reference/app-be-001/contract-manifest.json`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/docs/reference/app-be-001/contract-manifest.json

Identity: `1eb9e4355527884ee9e3a9fd2f5ed0b253110755`.

Historical current_operations:314 coexists with later current_intake/history. Current en manifest hash 49f59cb7804f07e820f7cb1f4d26adb4794b5496a7520d59df38d238fae907ed. app-fe-008.1/contract-intake.json blob d3721a301f26e91dc945f9c97f700fa362842d7c records additive Arabic intake. Never select baseline from an old field alone.

<a id="source-r20"></a>

### R20 — Owning follow-up and instruction maps

File: `docs/delivery/follow-up-2026-10-09/FRONTEND-FOLLOW-UP.md`  
Pinned source: https://github.com/Metal-Bat/angular-base/blob/f12efc443bfb9d073594c12567d9088d55687c66/docs/delivery/follow-up-2026-10-09/FRONTEND-FOLLOW-UP.md

Identity: `18fed6ce0918c1e91b14b46be72ab303c3f166fc`.

First 170 lines inspected. Current source and later acceptance take precedence over earlier missing-feature prose. Also read original/delivery backlogs, consistency backlog/register/software contract and contract-consistency skill. CONS-FE-001–005 and proposed APP-FE-039–043 remain separate existing scope, not five or ten new repair tasks created here.

<a id="source-r21"></a>

### R21 — Uploaded API snapshot

Source: user-provided `openapi.json`; not fetched from GitHub in this review.

Container bytes SHA-256 043b96cdf9efe0278472256ea13fbb601ac96f01c869608ff910766f68fc3e9a; 324 path entries, 379 operations, 565 schemas, counted locally. No confirmed deployed/backend revision attached. Does not prove byte or semantic equality with current repository producer.

## Uploaded API operation reference — snapshot inventory, not current deployed authority

**Revision 3.3:** This retained 174-operation subset comes from the uploaded snapshot. It is not the complete 379-operation API and not proof of current producer equality, browser support or missing UI. Reconcile the current producer before using payloads. See R19/R21.

This compact index retains all **174 operations** from the previously packaged relevant API subset. It is not the full API, proof that every operation has UI, or proof of implementation/deployment. It was checked against the mounted uploaded `openapi.json` when assembling this file.

**Uploaded schema SHA-256:** `043b96cdf9efe0278472256ea13fbb601ac96f01c869608ff910766f68fc3e9a`. The source snapshot contains 324 paths, 379 HTTP operations and 565 component schemas.

Request schemas below are locators, not complete DTOs. This index deliberately does not repeat the entire OpenAPI. Use the exact current producer/client schema for fields, limits, success/error envelopes, authorization, concurrency and replay rules. A dash means no request-body schema is declared in this snapshot; path/query/header parameters may still be required. Do not infer a safe retry from an HTTP method.

| Method | Exact API path                                                               | Declared request-body schema               | Source summary                                            |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| POST   | `/api/v1/designer/dependency-readiness`                                      | DependencyReadinessQuery                   | Inspect exact definition dependencies and repair guidance |
| GET    | `/api/v1/designer/inspector-contract`                                        | —                                          | Read versioned authoring inspector contracts              |
| POST   | `/api/v1/designer/config-validation`                                         | InspectorValidationQuery                   | Validate an exact handler configuration without execution |
| POST   | `/api/v1/designer/catalog`                                                   | DesignerQuery                              | Search authoring capabilities                             |
| POST   | `/api/v1/designer/selectors/{kind}`                                          | DesignerQuery                              | Select visible workflow authoring resources               |
| POST   | `/api/v1/designer/completion`                                                | CompletionQuery                            | Completion                                                |
| POST   | `/api/v1/designer/field-inventory`                                           | FieldInventoryQuery                        | Explain fields in an exact workflow snapshot              |
| POST   | `/api/v1/support/incidents/search`                                           | IncidentQuery                              | Search support incidents                                  |
| POST   | `/api/v1/support/incidents/report`                                           | IncidentQuery                              | Search                                                    |
| GET    | `/api/v1/support/incidents/{ref_id}`                                         | —                                          | Read a support incident                                   |
| GET    | `/api/v1/support/incidents/by-support/{support_ref}`                         | —                                          | Resolve an authorized support correlation                 |
| POST   | `/api/v1/support/incidents/{ref_id}/history`                                 | PageRequest                                | History                                                   |
| POST   | `/api/v1/support/incidents/{ref_id}/acknowledge`                             | IncidentCommand                            | Acknowledge a support incident                            |
| POST   | `/api/v1/support/incidents/{ref_id}/resolve`                                 | IncidentCommand                            | Resolve a support incident                                |
| POST   | `/api/v1/support/client-failures`                                            | ClientFailure                              | Record a safe client failure                              |
| POST   | `/api/v1/calendar/events`                                                    | CalendarInput                              | Create a calendar event                                   |
| POST   | `/api/v1/calendar/events/search`                                             | CalendarQuery                              | Search calendar events and deadlines                      |
| POST   | `/api/v1/calendar/events/report`                                             | CalendarQuery                              | Search                                                    |
| GET    | `/api/v1/calendar/events/{ref_id}`                                           | —                                          | Detail                                                    |
| PUT    | `/api/v1/calendar/events/{ref_id}`                                           | CalendarInput                              | Update a calendar event                                   |
| DELETE | `/api/v1/calendar/events/{ref_id}`                                           | —                                          | Delete                                                    |
| POST   | `/api/v1/calendar/events/{ref_id}/history`                                   | PageRequest                                | History                                                   |
| GET    | `/api/v1/calendar/events/{ref_id}/reminders`                                 | —                                          | Event Reminders                                           |
| GET    | `/api/v1/calendar/work-reminders/{ref_id}`                                   | —                                          | Work Reminders                                            |
| PUT    | `/api/v1/calendar/work-reminders/{ref_id}`                                   | ReminderInput                              | Configure Reminders                                       |
| DELETE | `/api/v1/calendar/work-reminders/{ref_id}`                                   | —                                          | Cancel Reminders                                          |
| POST   | `/api/v1/resource-links`                                                     | ResourceReference                          | Create an authorized stable resource link                 |
| POST   | `/api/v1/resource-links/resolve`                                             | LocatorQuery                               | Resolve a stable link to a current reference              |
| POST   | `/api/v1/resource-links/selected`                                            | SelectedQuery                              | Read eligible selected values outside search pages        |
| GET    | `/api/v1/analytics/catalog`                                                  | —                                          | Read the registered business metric dictionary            |
| POST   | `/api/v1/analytics/query`                                                    | MetricQuery                                | Aggregate authorized business metrics                     |
| POST   | `/api/v1/designer/library/search`                                            | LibrarySearch                              | Search reusable definitions                               |
| POST   | `/api/v1/designer/library/select`                                            | LibrarySelectQuery                         | Select one visible published library version              |
| POST   | `/api/v1/designer/library/{kind}/{ref_id}/dependencies`                      | —                                          | Dependencies                                              |
| POST   | `/api/v1/designer/library/{kind}/{ref_id}/where-used`                        | LibrarySearch                              | Where Used                                                |
| POST   | `/api/v1/designer/library/{kind}/{ref_id}/compare`                           | CompareRequest                             | Compare                                                   |
| POST   | `/api/v1/designer/library/{kind}/{ref_id}/guidance`                          | —                                          | Guidance                                                  |
| POST   | `/api/v1/designer/library/templates`                                         | TemplateCreate                             | Create Template                                           |
| POST   | `/api/v1/designer/library/upgrade-preview`                                   | BulkUpgradeRequest                         | Upgrade Preview                                           |
| POST   | `/api/v1/designer/library/upgrade-apply`                                     | BulkUpgradeRequest                         | Upgrade Apply                                             |
| POST   | `/api/v1/designer/library/form-versions/{ref_id}/explanation`                | —                                          | Explanation                                               |
| GET    | `/api/v1/step-types/operations`                                              | —                                          | Inspect governed business operations                      |
| POST   | `/api/v1/forms/search`                                                       | FormQuery                                  | Search Forms                                              |
| GET    | `/api/v1/forms/{ref_id}`                                                     | —                                          | Get Forms                                                 |
| PUT    | `/api/v1/forms/{ref_id}`                                                     | FormCreateDTO                              | Update Forms                                              |
| DELETE | `/api/v1/forms/{ref_id}`                                                     | —                                          | Delete Forms                                              |
| POST   | `/api/v1/forms/{ref_id}/history`                                             | HistoryQuery                               | History Forms                                             |
| POST   | `/api/v1/forms/report`                                                       | FormQuery                                  | Report Forms                                              |
| POST   | `/api/v1/forms`                                                              | FormCreateDTO                              | Create Forms                                              |
| POST   | `/api/v1/forms/validate`                                                     | PreviewRequest                             | Validate Form                                             |
| POST   | `/api/v1/forms/preview`                                                      | PreviewRequest                             | Preview the form for the authenticated client             |
| POST   | `/api/v1/forms/copy-component`                                               | ComponentCopyRequest                       | Copy Component                                            |
| POST   | `/api/v1/forms/behavior-preview`                                             | BehaviorPreviewRequest                     | Preview Behavior                                          |
| POST   | `/api/v1/forms/render-schema`                                                | —                                          | Render Meta Schema                                        |
| POST   | `/api/v1/forms/field-catalog`                                                | —                                          | Discover versioned primitive field contracts              |
| POST   | `/api/v1/forms/options`                                                      | OptionPreviewRequest                       | Preview a field option source                             |
| POST   | `/api/v1/forms/navigation-preview`                                           | NavigationPreviewRequest                   | Preview host navigation and atomic result mapping         |
| POST   | `/api/v1/forms/runtime-preview`                                              | SimulatedRuntimePreviewRequest             | Preview a simulated runtime form / پیش‌نمایش فرم اجرا     |
| POST   | `/api/v1/form-versions/search`                                               | FormVersionQuery                           | Search Versions                                           |
| GET    | `/api/v1/form-versions/{ref_id}`                                             | —                                          | Get Versions                                              |
| PUT    | `/api/v1/form-versions/{ref_id}`                                             | FormDocuments                              | Update Versions                                           |
| DELETE | `/api/v1/form-versions/{ref_id}`                                             | —                                          | Delete Versions                                           |
| POST   | `/api/v1/form-versions/{ref_id}/history`                                     | HistoryQuery                               | History Versions                                          |
| POST   | `/api/v1/form-versions/report`                                               | FormVersionQuery                           | Report Versions                                           |
| POST   | `/api/v1/form-versions`                                                      | FormVersionCreateDTO                       | Create Versions                                           |
| POST   | `/api/v1/form-versions/{ref_id}/publish`                                     | —                                          | Publish Form                                              |
| POST   | `/api/v1/form-versions/{ref_id}/reuse-upgrade-preview`                       | ComponentUpgradePreviewRequest             | Preview Reuse Upgrade                                     |
| POST   | `/api/v1/form-versions/{ref_id}/retire`                                      | —                                          | Retire Form                                               |
| POST   | `/api/v1/request-types/eligible/search`                                      | EligibleRequestTypeQuery                   | Search request types this requester can start             |
| POST   | `/api/v1/request-types/search`                                               | RequestTypeQuery                           | Search Types                                              |
| GET    | `/api/v1/request-types/{ref_id}`                                             | —                                          | Get Type                                                  |
| PUT    | `/api/v1/request-types/{ref_id}`                                             | RequestTypeCreateDTO                       | Update Type                                               |
| DELETE | `/api/v1/request-types/{ref_id}`                                             | —                                          | Delete Type                                               |
| POST   | `/api/v1/request-types/{ref_id}/history`                                     | HistoryQuery                               | History Type                                              |
| POST   | `/api/v1/request-types/report`                                               | RequestTypeQuery                           | Report Types                                              |
| POST   | `/api/v1/request-types`                                                      | RequestTypeCreateDTO                       | Create Type                                               |
| GET    | `/api/v1/business-requests/{ref_id}/view`                                    | —                                          | Read an ordinary requester's pinned runtime form          |
| POST   | `/api/v1/business-requests/search`                                           | BusinessRequestQuery                       | Search Requests                                           |
| GET    | `/api/v1/business-requests/{ref_id}`                                         | —                                          | Get Request                                               |
| PUT    | `/api/v1/business-requests/{ref_id}`                                         | BusinessRequestUpdateDTO                   | Update Request                                            |
| POST   | `/api/v1/business-requests/report`                                           | BusinessRequestQuery                       | Report Requests                                           |
| POST   | `/api/v1/business-requests`                                                  | BusinessRequestCreateDTO                   | Create Request                                            |
| POST   | `/api/v1/business-requests/{ref_id}/collections/edit`                        | CollectionEditRequest                      | Edit Request Collection                                   |
| POST   | `/api/v1/business-requests/{ref_id}/overrides`                               | ManualOverrideRequest                      | Override Calculation                                      |
| POST   | `/api/v1/business-requests/{ref_id}/resume-presentation`                     | —                                          | Open an authorized draft presentation on this client      |
| POST   | `/api/v1/business-requests/{ref_id}/submit`                                  | BusinessRequestSubmitDTO                   | Submit Request                                            |
| GET    | `/api/v1/business-requests/{ref_id}/attachments`                             | —                                          | List Attachments                                          |
| POST   | `/api/v1/business-requests/{ref_id}/attachments`                             | AttachmentAddDTO                           | Add Attachment                                            |
| PUT    | `/api/v1/business-requests/{ref_id}/attachments`                             | AttachmentReorderDTO                       | Reorder Attachments                                       |
| PUT    | `/api/v1/business-requests/{ref_id}/attachments/{attachment_ref_id}`         | AttachmentReplaceDTO                       | Replace Attachment                                        |
| DELETE | `/api/v1/business-requests/{ref_id}/attachments/{attachment_ref_id}`         | —                                          | Remove Attachment                                         |
| GET    | `/api/v1/business-requests/{ref_id}/attachments/{attachment_ref_id}/content` | —                                          | Download Attachment                                       |
| POST   | `/api/v1/business-requests/{ref_id}/cancel`                                  | —                                          | Cancel Request                                            |
| POST   | `/api/v1/business-requests/{ref_id}/options`                                 | OptionQuery                                | Resolve options for a pinned request form                 |
| POST   | `/api/v1/business-requests/{ref_id}/history`                                 | ResourceHistoryQuery                       | Read owned request submission history                     |
| POST   | `/api/v1/work-items/search`                                                  | CartableQueryDTO                           | Search Work Items                                         |
| GET    | `/api/v1/work-items/{ref_id}`                                                | —                                          | Get Work Item                                             |
| GET    | `/api/v1/work-items/{ref_id}/view`                                           | —                                          | Read a policy-filtered pinned human-task view             |
| GET    | `/api/v1/work-items/{ref_id}/runtime`                                        | —                                          | Read the authorized versioned runtime form state          |
| POST   | `/api/v1/work-items/{ref_id}/feedback/{feedback_key}/resolve`                | —                                          | Resolve linked correction feedback                        |
| GET    | `/api/v1/work-items/{ref_id}/attachments`                                    | —                                          | List Work Item Attachments                                |
| POST   | `/api/v1/work-items/{ref_id}/attachments`                                    | AttachmentAddDTO                           | Add Work Item Attachment                                  |
| PUT    | `/api/v1/work-items/{ref_id}/attachments`                                    | AttachmentReorderDTO                       | Reorder Work Item Attachments                             |
| PUT    | `/api/v1/work-items/{ref_id}/attachments/{attachment_ref_id}`                | AttachmentReplaceDTO                       | Replace Work Item Attachment                              |
| DELETE | `/api/v1/work-items/{ref_id}/attachments/{attachment_ref_id}`                | —                                          | Remove Work Item Attachment                               |
| GET    | `/api/v1/work-items/{ref_id}/attachments/{attachment_ref_id}/content`        | —                                          | Download Work Item Attachment                             |
| POST   | `/api/v1/work-items/{ref_id}/claim`                                          | WorkItemCommandDTO                         | Claim Work Item                                           |
| POST   | `/api/v1/work-items/{ref_id}/release`                                        | WorkItemCommandDTO                         | Release Work Item                                         |
| POST   | `/api/v1/work-items/{ref_id}/start`                                          | WorkItemCommandDTO                         | Start Work Item                                           |
| POST   | `/api/v1/work-items/{ref_id}/collections/edit`                               | CollectionEditRequest                      | Edit Work Item Collection                                 |
| POST   | `/api/v1/work-items/{ref_id}/overrides`                                      | ManualOverrideRequest                      | Override Calculation                                      |
| POST   | `/api/v1/work-items/{ref_id}/save`                                           | WorkItemSaveDTO                            | Autosave a claimed human-task draft                       |
| POST   | `/api/v1/work-items/{ref_id}/complete`                                       | WorkItemCompleteDTO                        | Complete a declared human-task action                     |
| POST   | `/api/v1/work-items/{ref_id}/reject`                                         | WorkItemCompleteDTO                        | Reject through a declared human-task action               |
| POST   | `/api/v1/work-items/{ref_id}/return`                                         | WorkItemCompleteDTO                        | Return work with field or row feedback for correction     |
| POST   | `/api/v1/work-items/{ref_id}/forward`                                        | WorkItemForwardDTO                         | Forward Work Item                                         |
| POST   | `/api/v1/work-items/{ref_id}/cancel`                                         | WorkItemCommandDTO                         | Cancel Work Item                                          |
| POST   | `/api/v1/work-items/{ref_id}/expire`                                         | WorkItemCommandDTO                         | Expire Work Item                                          |
| POST   | `/api/v1/work-items/{ref_id}/comment`                                        | WorkItemCommentDTO                         | Comment On Work Item                                      |
| POST   | `/api/v1/work-items/{ref_id}/read`                                           | WorkItemStateDTO                           | Read Work Item                                            |
| POST   | `/api/v1/work-items/{ref_id}/pin`                                            | WorkItemStateDTO                           | Pin Work Item                                             |
| POST   | `/api/v1/work-items/{ref_id}/archive`                                        | WorkItemStateDTO                           | Archive Work Item                                         |
| POST   | `/api/v1/work-items/{ref_id}/watch`                                          | WorkItemStateDTO                           | Watch Work Item                                           |
| POST   | `/api/v1/work-items/{ref_id}/options`                                        | OptionQuery                                | Resolve options for a pinned human-task form              |
| POST   | `/api/v1/work-items/{ref_id}/history`                                        | ResourceHistoryQuery                       | Read authorized task lifecycle history                    |
| GET    | `/api/v1/ai-agents/work-items/{work_item_ref}/tool-approval`                 | —                                          | Inspect a claimed AI tool approval                        |
| POST   | `/api/v1/ai-agents/work-items/{work_item_ref}/tool-approval`                 | AIToolApprovalCommandDTO                   | Approve or deny a claimed AI tool call                    |
| POST   | `/api/v1/notifications/search`                                               | NotificationQuery                          | Search Notifications                                      |
| POST   | `/api/v1/notifications/report`                                               | NotificationQuery                          | Report Notifications                                      |
| GET    | `/api/v1/notifications/{ref_id}`                                             | —                                          | Notification Detail                                       |
| POST   | `/api/v1/notifications/{ref_id}/read`                                        | —                                          | Mark Notification Read                                    |
| GET    | `/api/v1/inbox/events`                                                       | —                                          | Stream private inbox updates                              |
| POST   | `/api/v1/inbox/report`                                                       | InboxQuery                                 | Report unified notifications                              |
| POST   | `/api/v1/inbox/search`                                                       | InboxQuery                                 | Search unified notifications                              |
| GET    | `/api/v1/inbox/unread`                                                       | —                                          | Read unified unread total                                 |
| GET    | `/api/v1/inbox/{ref_id}`                                                     | —                                          | Read unified notification                                 |
| POST   | `/api/v1/inbox/{ref_id}/read`                                                | ReadCommand                                | Mark unified notification read                            |
| POST   | `/api/v1/auth/login`                                                         | LoginDTO                                   | Login                                                     |
| POST   | `/api/v1/auth/token`                                                         | Body_token_api_v1_auth_token_post          | Token                                                     |
| POST   | `/api/v1/auth/refresh`                                                       | RefreshDTO                                 | Refresh                                                   |
| POST   | `/api/v1/auth/logout`                                                        | RefreshDTO                                 | Logout                                                    |
| POST   | `/api/v1/auth/logout-all`                                                    | —                                          | Logout All                                                |
| POST   | `/api/v1/auth/forgot-password`                                               | ForgotPasswordDTO                          | Forgot Password                                           |
| POST   | `/api/v1/auth/reset-password`                                                | ResetPasswordDTO                           | Reset Password                                            |
| POST   | `/api/v1/auth/change-password`                                               | ChangePasswordDTO                          | Change Password                                           |
| GET    | `/api/v1/auth/me`                                                            | —                                          | Me                                                        |
| POST   | `/api/v1/auth/sessions/search`                                               | SessionQuery                               | List Sessions                                             |
| POST   | `/api/v1/auth/sessions/report`                                               | SessionQuery                               | Report Sessions                                           |
| GET    | `/api/v1/auth/sessions/{ref_id}`                                             | —                                          | Get Session                                               |
| DELETE | `/api/v1/auth/sessions/{ref_id}`                                             | —                                          | Revoke Session                                            |
| POST   | `/api/v1/auth/permissions/search`                                            | PageRequest                                | Current Permissions                                       |
| POST   | `/api/v1/auth/permissions/report`                                            | PageRequest                                | Report Current Permissions                                |
| GET    | `/api/v1/me/preferences`                                                     | —                                          | Read personal workspace preferences                       |
| PATCH  | `/api/v1/me/preferences`                                                     | PreferencesPatch                           | Apply personal workspace preferences                      |
| POST   | `/api/v1/admin/work-groups/search`                                           | WorkGroupQuery                             | Search Groups                                             |
| GET    | `/api/v1/admin/work-groups/{ref_id}`                                         | —                                          | Get Group                                                 |
| PUT    | `/api/v1/admin/work-groups/{ref_id}`                                         | WorkGroupUpdateDTO                         | Update Group                                              |
| DELETE | `/api/v1/admin/work-groups/{ref_id}`                                         | —                                          | Delete Group                                              |
| POST   | `/api/v1/admin/work-groups/{ref_id}/history`                                 | HistoryQuery                               | Group History                                             |
| POST   | `/api/v1/admin/work-groups/report`                                           | WorkGroupQuery                             | Report Groups                                             |
| POST   | `/api/v1/admin/work-groups`                                                  | WorkGroupCreateDTO                         | Create Group                                              |
| POST   | `/api/v1/admin/work-groups/select`                                           | WorkGroupSelectQuery                       | Select Groups                                             |
| POST   | `/api/v1/admin/work-groups/{ref_id}/members`                                 | MemberChangeDTO                            | Add Member                                                |
| POST   | `/api/v1/admin/work-groups/{ref_id}/members/deactivate`                      | MemberChangeDTO                            | Deactivate Member                                         |
| DELETE | `/api/v1/admin/work-groups/{ref_id}/members/{user_ref_id}`                   | —                                          | Remove Member                                             |
| POST   | `/api/v1/media/files`                                                        | Body_upload_file_api_v1_media_files_post   | Upload File                                               |
| POST   | `/api/v1/media/images`                                                       | Body_upload_image_api_v1_media_images_post | Upload Image                                              |
| GET    | `/api/v1/media/files/{ref_id}`                                               | —                                          | Download a private user file                              |
| GET    | `/api/v1/media/images/{ref_id}`                                              | —                                          | Download a private WebP image                             |
| POST   | `/api/v1/reports/search`                                                     | ReportQuery                                | Search Reports                                            |
| GET    | `/api/v1/reports/{ref_id}`                                                   | —                                          | Get Report                                                |
| DELETE | `/api/v1/reports/{ref_id}`                                                   | —                                          | Delete Report                                             |
| GET    | `/api/v1/reports/{ref_id}/download`                                          | —                                          | Download Report                                           |
| POST   | `/api/v1/reports/{ref_id}/history`                                           | HistoryQuery                               | Report History                                            |

<a id="consolidation-provenance"></a>

## Revision 3.3 integrity and provenance

Input: the mounted revision 3.2 master, SHA-256 `01e46b01d5d8be4dcb0bb66cf0e3400bbc1a80c63c34fb1a4ce2f34d2ef56e9a`. Updated against selected pinned frontend files and records listed above. The historical 58 main IDs, 24 authoring IDs and eight Playwright IDs are preserved without new top-level allocations. Current deltas replace stale absence claims and withdraw old remaining-work estimates; original detailed target/acceptance requirements remain where compatible. Current pnpm terminology replaces the old active npm instructions. The uploaded API subset is labelled separately from current producer authority.

This file was generated and structurally checked in the conversation environment. Structural file validation is not application verification. No repository source, ticket state, commit, pull request, deployment or shared data was changed.
