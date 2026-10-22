# Ordered frontend follow-up — 2026-10-18

Scoped verification is governed by
`artifacts/ordered-follow-up/completion.json` and its archived full-check manifest.
Until that receipt exists with a successful full gate, final verification is
pending. All parent tasks and complete master acceptance remain open at their
previous evidence levels. This is a repair and acceptance continuation, not
completion of all 25 parent tasks.

The user requested this sequence: 1 typography, 5 Calendar/operations,
4 agent/integration administration, 3 requester/reviewer, 2 advanced form/workflow,
6 final acceptance. Reused Angular/PrimeNG, shared typed controls, record routes,
command coordination, existing real-service harnesses and immutable version pins.
No new business endpoint, migration, dependency or framework was introduced.

## 1 — Typography (APP-FE-004)

The user's Vazirmatn choice supersedes the Yekan Bakh asset dependency. Official
v33.003 variable WOFF2 and its OFL are bundled unchanged. Persian and Arabic share
the font across page text, controls and overlays; English retains its existing
stack. Preparation rejects missing/invalid assets. The asset source, SHA-256 and
license are recorded in `public/fonts/README.md`; native `fc-scan` confirms the
Vazirmatn family. Actual regular/bold FontFace loads, same-origin WOFF2 response
and overlay typography are tested, rather than only a CSS family name.

Production build `/tmp/ordered-font-build.log`, font preparation
`/tmp/ordered-font-prepare-final.log` and four Chromium/Firefox cases
`/tmp/ordered-font-browser-native.log` pass. Current WebKit and complete primary
browser results are separately retained by the final receipt. Initial restricted
browser-launch failures remain in `/tmp/ordered-font-browser.log`.

## 5 — Calendar and operations (APP-FE-014/032)

Schedule updates now compare changed date bounds with retained current bounds,
preserve explicit null clearing, and leave unrelated/legacy interval updates
alone. No omitted field is added to the outgoing update. Five focused unit cases
pass in `/tmp/ordered-schedule-unit.log`. Calendar, schedule and locale-overlay
Chromium/Firefox acceptance initially passes 28 cases and fails two copies of an
incorrect new test assertion about a permanently mounted Angular host. Corrected
acceptance checks the actual form closes and detail is visible; both pass in
`/tmp/ordered-schedule-browser-corrected.log`. Initial complete browser artifacts
are retained under `artifacts/ordered-follow-up/operations-attempt-1/`.

The running backend acceptance in `calendar-live/findings.json` creates an owned
event through UI, repeats Edit/Cancel five times, checks no leaving-popover/editor
overlap and restored focus, deletes through UI and confirms GET 404. Its locale
is restored. The separate `schedule-live/findings.json` passes actual inactive schedule
edit acceptance: invalid expiry sends no PUT, corrected expiry persists against
the retained start, the row remains disabled and is deleted afterward. The initial
unsupported-method selector probe created no schedule and remains retained.
Calendar screenshots were visually inspected, including Persian desktop layout.

Membership-aware team selection remains a producer dependency: the existing
administration selector does not establish ordinary-user event membership.
Complete workflow-derived deadline/source, scheduler/worker and operator recovery
fault matrices retain APP-FE-014/032 ownership. They are not replaced by the
personal-event acceptance.

## 4 — Agent/integration administration (APP-FE-030.UX01/025)

The localized decimal regression is reproduced in
`/tmp/ordered-agent-before.log`: valid localized digits/separators were emitted
unchanged. ASCII digits/decimal separator are now serialized without binary
rounding, while the entered draft and scientific notation remain intact. Four
unit cases pass in `/tmp/ordered-agent-after.log`; ten Chromium/Firefox editor,
query and workspace cases pass in `/tmp/ordered-agent-browser.log`.

The existing disposable service profile 030 exercises five actual editor/HTTP
scenarios: draft creation and authorized metadata, exact limits/local checks,
static/input choice unions, typed filtering/sorts, and other-author denial. Its
configured connection verification flag is setup, not vendor verification or
execution. Final-source results are archived under `services-final/030/`.

Live demo inspection is retained under `agent-live/`. Provider and connection
selectors returned HTTP 200, but the administrator received no eligible
connection rows. No connection, credentials, grant or execution was fabricated.
The initial exploratory navigation interrupted module preloading; its diagnostics
remain in `create-attempt-1.json`. Waiting for actual module completion leaves
zero diagnostics in the subsequent empty-selector result. No agent draft was
created by that blocked live attempt.

The four precise dependencies in `docs/delivery/AGENT-EDITOR-CAPABILITIES.md`
remain: saved off-page connection display name, workflow-bound choice shape/sample,
safe retrieval catalog/preview and an approved standalone provider test. Existing
supported configuration and the absence of these capabilities remain distinct.

## 3 — Requester/reviewer (APP-FE-028/029)

Delayed comment/forward responses are now fenced by actor, task context and view
lifetime. A previous task cannot clear the new task's pending command or redirect
navigation after the old view closes. Both cross-task races fail before the fix
in `/tmp/ordered-tasks-before.log`. Six cases pass after the fix in
`/tmp/ordered-tasks-context.log`, including destruction during forwarding.

Existing disposable service profile 028 verifies nine private transfer and
requester/reviewer scenarios, including committed unusable-receipt recovery,
replacement/removal, private previews, exact pins, actor cleanup and outsider
content denial. Profile 021 additionally covers actual claimed reviewer state,
comments/personal metadata and ordinary-reviewer forwarding-selector denial.
These are real HTTP against owned services; they do not claim the complete
protected approval, correction/resubmission or competing-claim acceptance matrix.

## 2 — Forms/workflow (APP-FE-020/023)

Pointer data wiring and duplicated mappings previously assigned ordinals from the
whole graph. The backend explicitly requires scalar ordinal zero and dense LIST
ordinals per step/input. New scalar bindings use zero and reject duplicate input
mappings. LIST append order is scoped to the input. Partial clones, source-step
removal and reconnection retain dense order; changed connection identities retain
their authored routes. Existing published graphs are not rewritten.

Two failing domain regressions are retained in
`/tmp/ordered-workflow-before-2.log`; earlier readonly test-setup compilation failure
is retained separately. Twenty-one focused authoring/canvas cases pass in
`/tmp/ordered-workflow-after-3.log`. Focused lint initially finds missing braces,
a long test title and connector complexity; these are corrected by normal braces,
wording and extracting the input-ordinal calculation, without suppressions or
threshold changes. `/tmp/ordered-changes-lint-2.log` passes.

`workflow-live/findings.json` records trusted native pointer wiring on an owned
API-prepared draft against the running backend: exact ordinal zero, save/reopen,
unchanged control graph, actual positive graph validation and actual rejection of
the former graph-wide ordinal. Owned root/draft are deleted and locale restored.
Earlier denied designer access, incomplete copied outcome routes and missing
cross-port setup bindings remain retained under `workflow-live-attempt-*`; they
are not passed acceptance. The final run is repeated after the lint refactor.

Profile 021 verifies 23 real workflow/task/administration scenarios, including
registered typed configuration, invalid buffer recovery, insertion, group edits,
whole-object mappings with actual positive/negative graph validation, branch
policy, immutable pins, receipt reads, current refs and private transport. This
does not close the broader nested/collection mapping, conversion composition,
execution-preview, publication/default comparison or full form-reference matrix.
Those criteria retain their existing APP owners and contract requirements.

## 6 — Final acceptance and evidence boundaries

The first full gate passes formatting, API/delivery contracts and browser types/lint,
then fails the interaction file at 402 lines against the existing 400-line ceiling.
Its complete evidence is retained in `full-check-attempt-1/`. Capturing the current
document once and removing one inconsistent empty separator brings the file back
within the unchanged limit; focused lint passes. Final service/browser evidence
is refreshed after that source edit.

The final unchanged-source `mise run check` is required with all fifteen stages,
zero emitted diagnostics and no required skips. The final receipt records its
actual exit, counts, source identity and archived logs; no result is preclaimed.
Selected WebKit, actual service datasets and native running-backend acceptance
are independently recorded, never promoted from fixtures. Historical failed and
partial results remain retained.

Final-source profiles 021/030/028 pass 23/5/9 real-service scenarios with
empty diagnostics. The fourteen selected final-source WebKit cases also pass.
These counts do not include the separate running-backend Calendar, schedule and
pointer-wiring journeys. The AST refresh initially cannot start its worker inside
the restricted sandbox; its separate native retry records the actual outcome.

Final service datasets use the guarded harness's immutable backend snapshot and
owned PostgreSQL/cache/storage services. Each requires exact full paths/components
producer equality, unchanged frontend/backend functional source and empty service
and browser diagnostics. Earlier pre-lint passing datasets remain under
`services-before-lint/`; final runs and their native exits are separately archived.
No backend source, shared seed, active case, published pin or permission is changed.

Full parent/master readiness remains separate from these scoped repairs. Remaining
manual screen-reader/device and human visual/persona approval, D05 performance
budget agreement, complete task-specific service/fault coverage and deployment
rehearsal are not supplied by automated checks. No production deployment, paid
provider execution, publication or user acceptance is claimed. This continuation
does not silently close unimplemented parent feature criteria.
