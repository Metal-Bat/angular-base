# FRONTEND consistency and repair backlog

Version 1.0.0 — 2026-10-09. Reviewed commit: `95f88dce6f1a48da87294929041378c174e6b39c`.

**Planning status only. No task below is implemented or verified by this package.**

## Read order and anti-duplication rule

Read root AGENTS.md, the repository’s existing backlog, its current APP delivery supplement, `../follow-up-2026-10-09/FRONTEND-FOLLOW-UP.md`, current decisions, then `SOFTWARE-DESIGN-CONTRACT.md`, `REPAIR-REGISTER.md` and this file. The prior follow-up contains new assistant tasks; this file does not redefine them.

Root task status remains in the existing canonical APP supplement. The CONS IDs below own only genuinely cross-cutting design/verification outcomes. Actual feature repairs in REPAIR-REGISTER stay with their original APP IDs or a traceable child selected after checking ID availability. Do not reopen historical DONE records wholesale; record the new delta/evidence. Reuse an existing unfinished task instead of importing a duplicate CONS body when its outcome already matches.

`READY` below means ready to START inventory. Others begin BLOCKED on the named prerequisites. All start with `Verification: NOT_RUN`. A task becomes DONE only after its own actual acceptance, full final `mise run check`, required integration evidence, a change record and updated dependency/status links. D07 exception-approved backend success stays VERIFIED_WITH_EXCEPTION. Missing or skipped required evidence prevents completion.

Read the repository’s actual smart-backlog/change-journal and relevant Swagger/CRUD/select skills where present. Use graphify when its graph exists; do not claim it ran when unavailable. Preserve layered ownership, current refs, immutable published versions, exact canonical values and operation-specific replay semantics. No production changes, paid provider calls, shared resets or pushes are authorized by this planning package.

## Index

| ID                          | Outcome                                                                              | Priority | Effort, person-days | Required predecessor                  |
| --------------------------- | ------------------------------------------------------------------------------------ | -------- | ------------------: | ------------------------------------- |
| [CONS-FE-001](#cons-fe-001) | Bind product vocabulary and screen patterns to the authoritative field/operation map | P1       |                 1–2 | CONS-BE-001                           |
| [CONS-FE-002](#cons-fe-002) | Enforce one producer contract across transport adapters and actual UI values         | P1       |                 2–4 | CONS-BE-001, CONS-BE-002, CONS-FE-001 |
| [CONS-FE-003](#cons-fe-003) | Turn the PrimeNG-first policy into reusable visual and interaction checks            | P1       |                 2–4 | CONS-FE-001                           |
| [CONS-FE-004](#cons-fe-004) | Guard canonical forms/canvas data and clear shared-control ownership                 | P1       |                 2–4 | CONS-FE-001, CONS-FE-002              |
| [CONS-FE-005](#cons-fe-005) | Make shared screen-state and localization completeness part of delivery evidence     | P1       |                 1–3 | CONS-FE-001, CONS-FE-002, CONS-FE-003 |

Cross-repository dependencies refer to an accepted artifact/outcome, not simultaneous editing of the other checkout. Freeze a useful subset where safe, but do not call the parent complete before all its acceptance is met. One worker owns migrations, generated contracts and lockfiles at a time.

<a id="cons-fe-001"></a>

## CONS-FE-001 — Bind product vocabulary and screen patterns to the authoritative field/operation map

Priority: P1
Status: BLOCKED
Verification: NOT_RUN
Area: frontend contracts/presentation/architecture
Owner: TBD — frontend + QA/design, backend reviewer
Depends-On: CONS-BE-001
Related: APP-FE-001, APP-FE-003, APP-FE-004, APP-FE-033
Change-Record: None
Estimate: 1–2 focused person-days; low-to-medium confidence
Design rules: SD-01–02, SD-12–13

### Goal and user outcome

Make the frontend present one coherent software product, with explicit resource meanings and no false completion labels.

### Context and reuse

Use existing shell/routes, shared record/list components, api-ui-coverage, screen-patterns and localization catalogs. No new shell or navigation framework.

### Scope and exclusions

Implement the delta below using existing owners. Do not recreate the original APP feature or declare it complete merely because this consistency check passes. No framework upgrade, physical/wire rename, new business lifecycle, arbitrary service execution or generic admin exposure is in scope.

### Implementation sequence

1. Map every product-facing operation to a persona, feature route, action, input control, output presenter and evidence. Compare against the current frozen producer, not the old 314-operation snapshot alone.
2. Adopt the domain glossary in labels/help/action wording. Separate human task, scheduled action, worker attempt, business outcome and external delivery. Record existing ambiguous strings for targeted repair.
3. Inventory common list/detail/dialog/form/status patterns and variations; choose the existing shared pattern where suitable. Keep legitimate domain differences rather than force one universal screen.
4. Cross-reference all existing APP and earlier assistant tasks. Mark genuine backend blockers separately from already-shipped producer APIs with missing adapters.
5. Record active contract/decision references and eliminate contradictory current guidance while retaining historical records. Do not mark a generated client or static component as an integrated feature.

### Acceptance criteria

- [ ] Every public product capability has a deliberate frontend disposition and named owner; internal/boundary operations are not exposed as arbitrary UI commands.
- [ ] Labels and navigation use the same business meanings as DTO/Swagger descriptions.
- [ ] No “completed/approved/delivered” presentation is derived solely from an unrelated execution or HTTP-success state.
- [ ] Existing finished screens are reused and not re-scaffolded under new feature folders.
- [ ] Final unchanged-tree gate and task-specific checks pass; warnings/exceptions/skips are disclosed exactly. No required scenario is skipped.
- [ ] Change record names implementation files, actual commands/environment, evidence, compatibility and remaining limitations; parent tasks and peer handoff are updated.

### Verification

Coverage manifest checks, route/navigation and presentation unit tests, English/Farsi label review, full mise run check. Feature integration must be separately exercised.

Proposed tests must use the existing test layout. Discover exact fixture/runner paths before implementation; no new command in this prose is claimed to exist. Unit tests first, then the required real services/browser, then the complete final gate.

### Compatibility, migration and failure risks

Do not translate machine values, disclose private state in titles or introduce terminology-only endpoint renames.

### Peer handoff and rollout

Provide missing field/action/metadata requirements as explicit backend contract deltas, never guessed requests.

Roll out behind existing feature/capability controls where relevant. On a mismatch retain prior compatible behavior and show the actual compatibility failure; do not suppress validation, strip restrictive inputs or auto-retry uncertain effects.

<a id="cons-fe-002"></a>

## CONS-FE-002 — Enforce one producer contract across transport adapters and actual UI values

Priority: P1
Status: BLOCKED
Verification: NOT_RUN
Area: frontend contracts/presentation/architecture
Owner: TBD — frontend + QA/design, backend reviewer
Depends-On: CONS-BE-001, CONS-BE-002, CONS-FE-001
Related: APP-FE-005, APP-FE-008, APP-FE-033, APP-FE-037, APP-BE-031
Change-Record: None
Estimate: 2–4 focused person-days; low-to-medium confidence
Design rules: SD-05–09, SD-12, SD-17

### Goal and user outcome

Prevent stale schema slices, incorrect default/reset mapping and silent value changes at the HTTP-to-UI boundary.

### Context and reuse

Reuse generated transport, response-adapters, ApiFailure, current-ref mutation coordinator, preferences service and existing typed decoders. Do not create a second client or generic JSON adapter.

### Scope and exclusions

Implement the delta below using existing owners. Do not recreate the original APP feature or declare it complete merely because this consistency check passes. No framework upgrade, physical/wire rename, new business lifecycle, arbitrary service execution or generic admin exposure is in scope.

### Implementation sequence

1. Bind the main client and supporting metadata generators to one exact producer manifest. Inspect every changed method/body/schema/security rule; distinguish byte hashes from semantic hashes.
2. Add reusable conformance fixtures for data/result/error/select/binary families and explicit model-to-view mappings. Preserve false/zero/null/missing, typed selection keys, decimal strings and unknown-compatible documents.
3. Exercise preference reset against backend defaults: null resets one group and the authoritative response is applied. Preserve actor-cleanup reset separately. Add loaded-density/timezone tests without silently resetting existing values.
4. Audit stale refs and durable link resolution through select, favorite, notice and detail screens. Ensure client model naming transformations do not change JSON names or machine values.
5. Run the actual paired comparison/calls for representative new services; a fixture-only pass or an absent peer remains non-integrated. Apply feature-specific fixes under their original APP owners.

### Acceptance criteria

- [ ] A stale copied schema or semantic mismatch fails before integrated readiness, without merely refreshing expected hashes.
- [ ] Persisted/reset preferences and displayed values agree with backend defaults; valid older saved settings are retained until explicitly changed.
- [ ] Unknown protocol variants produce a safe compatibility state, not dropped input or false success.
- [ ] Successful mutations refresh refs; uncertain mutations retain recovery context and are not blindly replayed.
- [ ] Final unchanged-tree gate and task-specific checks pass; warnings/exceptions/skips are disclosed exactly. No required scenario is skipped.
- [ ] Change record names implementation files, actual commands/environment, evidence, compatibility and remaining limitations; parent tasks and peer handoff are updated.

### Verification

Existing generated-client and adapter specs, exact default/value fixtures, real preferences/help/calendar/inbox calls when wired, full mise run check with the peer configured for integrated acceptance.

Proposed tests must use the existing test layout. Discover exact fixture/runner paths before implementation; no new command in this prose is claimed to exist. Unit tests first, then the required real services/browser, then the complete final gate.

### Compatibility, migration and failure risks

Do not make production feature routing depend on development previews; do not expose provider or ORM payloads to simplify decoders.

### Peer handoff and rollout

Publish the accepted producer SHA/hash and any remaining incompatibility with a concrete failing contract example.

Roll out behind existing feature/capability controls where relevant. On a mismatch retain prior compatible behavior and show the actual compatibility failure; do not suppress validation, strip restrictive inputs or auto-retry uncertain effects.

<a id="cons-fe-003"></a>

## CONS-FE-003 — Turn the PrimeNG-first policy into reusable visual and interaction checks

Priority: P1
Status: BLOCKED
Verification: NOT_RUN
Area: frontend contracts/presentation/architecture
Owner: TBD — frontend + QA/design, backend reviewer
Depends-On: CONS-FE-001
Related: APP-FE-004, APP-FE-007, APP-FE-034, APP-FE-035
Change-Record: None
Estimate: 2–4 focused person-days; low-to-medium confidence
Design rules: SD-13, SD-16

### Goal and user outcome

Make design consistency visible and testable on real business screens, not merely a PrimeNG import audit.

### Context and reuse

Use existing semantic tokens, workspace preset, shared fields/selectors/tables, feedback/dialog patterns and permitted native/Material/CDK/Foblex exceptions.

### Scope and exclusions

Implement the delta below using existing owners. Do not recreate the original APP feature or declare it complete merely because this consistency check passes. No framework upgrade, physical/wire rename, new business lifecycle, arbitrary service execution or generic admin exposure is in scope.

### Implementation sequence

1. Inventory component patterns and token use on requester, reviewer, studio, administration and new application services. Classify compliant, targeted change, or reasoned exception.
2. Choose existing canonical variants for typography, spacing/density, field labels/errors, buttons, dialogs/drawers, tables, filters, badges, loading/empty/forbidden and support notices. Avoid internal DOM selector overrides.
3. Create representative visual/interaction fixtures for en/fa, LTR/RTL, light/dark/system and comfortable/compact. Ensure the density preference actually changes the agreed patterns, not just a stored value.
4. Add keyboard focus/error association/overlay-restoration tests. Use logical CSS and correctly isolated mixed-direction IDs/numbers; retain numeric precision where a native control is safer.
5. Record visual review evidence and exceptions with owner/reason/scope. Fix touched screens incrementally under their APP tasks; no wholesale dependency removal or full design-system rewrite.

### Acceptance criteria

- [ ] A standard action/field/status has consistent shape and behavior across representative domains.
- [ ] Theme/density/RTL modes render coherently without loss of input or focus and with accessible contrast.
- [ ] Non-PrimeNG exceptions are deliberate and tested; no new arbitrary parallel pattern is introduced.
- [ ] Static framework checks and actual rendered interaction checks both exist; neither substitutes for the other.
- [ ] Final unchanged-tree gate and task-specific checks pass; warnings/exceptions/skips are disclosed exactly. No required scenario is skipped.
- [ ] Change record names implementation files, actual commands/environment, evidence, compatibility and remaining limitations; parent tasks and peer handoff are updated.

### Verification

Existing UI/browser-quality/accessibility suites and new token/pattern regressions; actual browser screenshots and manual focus/zoom checks; full mise run check. Record missing engine/device/manual evidence as incomplete.

Proposed tests must use the existing test layout. Discover exact fixture/runner paths before implementation; no new command in this prose is claimed to exist. Unit tests first, then the required real services/browser, then the complete final gate.

### Compatibility, migration and failure risks

Do not approve UI automatically from screenshot snapshots or inflate bundle/performance budgets to pass. No paid chart/calendar dependency is authorized.

### Peer handoff and rollout

Give backend only genuine metadata/semantics needs; visual tokens remain frontend-owned.

Roll out behind existing feature/capability controls where relevant. On a mismatch retain prior compatible behavior and show the actual compatibility failure; do not suppress validation, strip restrictive inputs or auto-retry uncertain effects.

<a id="cons-fe-004"></a>

## CONS-FE-004 — Guard canonical forms/canvas data and clear shared-control ownership

Priority: P1
Status: BLOCKED
Verification: NOT_RUN
Area: frontend contracts/presentation/architecture
Owner: TBD — frontend + QA/design, backend reviewer
Depends-On: CONS-FE-001, CONS-FE-002
Related: APP-FE-003, APP-FE-016, APP-FE-017, APP-FE-018, APP-FE-019, APP-FE-020, APP-FE-021, APP-FE-022, APP-FE-023, APP-FE-024, APP-FE-025, APP-FE-027
Change-Record: None
Estimate: 2–4 focused person-days; low-to-medium confidence
Design rules: SD-02, SD-04, SD-12, SD-14, SD-16

### Goal and user outcome

Keep standard editor behavior and architecture consistent while preserving existing graph/form semantics.

### Context and reuse

Reuse Foblex, typed inspectors, runtime renderer, current SchemaInput and shared field controls. Studio currently imports SchemaInput from Administration [E32]; assess ownership rather than duplicate it.

### Scope and exclusions

Implement the delta below using existing owners. Do not recreate the original APP feature or declare it complete merely because this consistency check passes. No framework upgrade, physical/wire rename, new business lifecycle, arbitrary service execution or generic admin exposure is in scope.

### Implementation sequence

1. Inventory supported editor shapes and their shared controls. Either expose existing cross-feature controls through a deliberate stable shared public seam or move only genuinely generic presentation to shared UI while preserving compatibility exports.
2. Keep domain-specific provider, human-task, binding and subprocess editors in their owners. Do not generalize everything into one giant schema component or copy Administration controls into Studio.
3. Add round-trip fixtures for labels versus canonical keys, nested row reorder, mapping removal, typed constants, hidden fields and preserved unknown-compatible properties. Guard against linked state reinitializing dirty edits when unrelated inputs update.
4. Assert ordinary seeded authoring paths need no JSON or copied refs. Contextually classify expert data panels and legitimate comment textareas; neither a grep count nor collapsing a required editor closes the task.
5. Exercise save/validate/promote/publish/default-preview/apply/layout-reset separately, including stale refs and reopening. Fix any remaining feature-specific behavior under the existing APP owner.

### Acceptance criteria

- [ ] No dependency cycle or unintended domain-to-presentation/library import is introduced; shared controls have one documented owner.
- [ ] A renamed display label, reordered row or mapping edit does not mutate unrelated canonical identity/data.
- [ ] User edits survive ordinary validation/error/late-response cases and are reconciled deliberately on stale changes.
- [ ] The full supported normal reference workflow can be authored without expert JSON; missing shapes remain explicit failures, not disabled promises.
- [ ] Final unchanged-tree gate and task-specific checks pass; warnings/exceptions/skips are disclosed exactly. No required scenario is skipped.
- [ ] Change record names implementation files, actual commands/environment, evidence, compatibility and remaining limitations; parent tasks and peer handoff are updated.

### Verification

Existing form/canvas domain tests and paired canonical fixtures; browser save/reopen/conflict/actor-switch scenarios; targeted dependency checks; full mise run check. Active pins and provider execution are server-owned.

Proposed tests must use the existing test layout. Discover exact fixture/runner paths before implementation; no new command in this prose is claimed to exist. Unit tests first, then the required real services/browser, then the complete final gate.

### Compatibility, migration and failure risks

Moving files can alter lazy bundles/import cycles and selectors. Preserve public exports and avoid an unrelated app-wide refactor.

### Peer handoff and rollout

Send any backend metadata/validation mismatch with exact document dialect, fixture and error path. No invented schema extensions.

Roll out behind existing feature/capability controls where relevant. On a mismatch retain prior compatible behavior and show the actual compatibility failure; do not suppress validation, strip restrictive inputs or auto-retry uncertain effects.

<a id="cons-fe-005"></a>

## CONS-FE-005 — Make shared screen-state and localization completeness part of delivery evidence

Priority: P1
Status: BLOCKED
Verification: NOT_RUN
Area: frontend contracts/presentation/architecture
Owner: TBD — frontend + QA/design, backend reviewer
Depends-On: CONS-FE-001, CONS-FE-002, CONS-FE-003
Related: APP-FE-002, APP-FE-010, APP-FE-011, APP-FE-012, APP-FE-013, APP-FE-034, APP-FE-037, APP-FE-038
Change-Record: None
Estimate: 1–3 focused person-days; low-to-medium confidence
Design rules: SD-13, SD-15–17

### Goal and user outcome

Prevent apparently complete screens that are only happy-path fixtures or inconsistent across language and failure states.

### Context and reuse

Extend existing actor-state cleanup, Feedback/RequestErrors, help/localization catalogs, browser diagnostics and status/evidence manifests. Do not add another notification system.

### Scope and exclusions

Implement the delta below using existing owners. Do not recreate the original APP feature or declare it complete merely because this consistency check passes. No framework upgrade, physical/wire rename, new business lifecycle, arbitrary service execution or generic admin exposure is in scope.

### Implementation sequence

1. Create a reusable screen acceptance matrix for loading, empty, invalid, forbidden/revoked, stale/conflict, failed, uncertain and success. Each feature identifies supported actions and recovery while in each state.
2. Run representative account switch, route teardown, unsaved edit, slow response and confirmation races using the existing harness. Late results cannot repopulate private data or stale notices.
3. Check added en/fa keys, plural/parameter consistency, focus destinations, accessible names, RTL direction and stable machine keys. Persisted help state, support receipts and notification targets must come from actual adapters, not presentation-only arrays.
4. Require browser-scope start/progress and bounded deadline/cancellation evidence in the existing runners under APP-FE-002; retain failing partial artifacts. A missing peer/browser/service cannot create a completed feature manifest.
5. Tie local, paired, manual and product acceptance to exact commits/contract/profile. Keep D07 exception labels separate and do not promote a clean fixture batch to integrated/demo-ready.

### Acceptance criteria

- [ ] Every finished screen declares all relevant states and has representative positive/negative tests.
- [ ] Unknown support persistence, unavailable metric data and unknown readiness remain truthful rather than green/zero defaults.
- [ ] Translation or missing-state regressions fail the corresponding check; manual review not performed remains explicitly pending.
- [ ] Feature completion needs original APP acceptance and the final gate, not simply presence of this new matrix.
- [ ] Final unchanged-tree gate and task-specific checks pass; warnings/exceptions/skips are disclosed exactly. No required scenario is skipped.
- [ ] Change record names implementation files, actual commands/environment, evidence, compatibility and remaining limitations; parent tasks and peer handoff are updated.

### Verification

Existing localization/feedback/browser tests plus the shared state matrix on live-wired representatives; final mise run check and current pair evidence for integrated scenarios.

Proposed tests must use the existing test layout. Discover exact fixture/runner paths before implementation; no new command in this prose is claimed to exist. Unit tests first, then the required real services/browser, then the complete final gate.

### Compatibility, migration and failure risks

Avoid bloating every test with the entire platform. Reuse common cases, then test domain-specific edges separately. Keep evidence sanitized.

### Peer handoff and rollout

Backend gets exact safe-error, support, readiness and notification contract mismatches; owners close their original tasks only after acceptance.

Roll out behind existing feature/capability controls where relevant. On a mismatch retain prior compatible behavior and show the actual compatibility failure; do not suppress validation, strip restrictive inputs or auto-retry uncertain effects.

## Execution order after design adoption

Do not wait for every cosmetic metadata issue before delivering working outcomes. Complete the authoritative inventory and contract boundary first, then perform risk-bearing consistency repairs in the same bounded slices as the existing APP work. Use REPAIR-REGISTER for the next concrete problem. Entity-comment backfill and broad visual cleanup are lower priority than current-pair compatibility, loss of user edits, authorization and the executable reference journey.

Before implementation, recheck current HEAD against the reviewed revision. A newly fixed criterion is credited with fresh evidence; it is not implemented a second time. A newly discovered defect is recorded under its actual owner with a failing test. “Nothing else is missing” is not an acceptance criterion; the coverage matrix and residual-risk record are.
