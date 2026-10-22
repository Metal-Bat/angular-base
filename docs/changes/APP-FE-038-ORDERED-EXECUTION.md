# APP-FE-038 — Ordered remaining-work execution

Date: 2026-10-19. Existing owner continuation; parent/master acceptance remains
open. The user requested the six stages in order with no duplicate actions/work.
The [execution crosswalk](../delivery/ORDERED-REMAINING-WORK.md) separates existing
implementations, verification gaps, concrete repairs and backend dependencies.

## Intake and reuse

Read current APP owners, command coordination, producer decisions DB-002/D07 and
protected-effect policy. Existing dirty source is retained. Backend source is read
only; real-service acceptance uses owned disposable services. No migration,
shared reset, copied reference input, paid/live provider call or new command
coordinator is authorized by this continuation.

## Actual results

Work is in progress. Stage 1 reconciled existing owners into the crosswalk.
Stage 2 found a real missing Return capability: the decision adapter always sent
empty feedback even when the declared task contract required field corrections.
The existing task editor now authors named authorized fields and stable collection
row targets, validates instructions/comments, retains unfinished decisions across
safe refresh/navigation cancellation and clears them at actor/context boundaries.
It uses the existing immutable mutation coordinator and current-reference flow.
No independent approval engine or JSON authoring control was added.

Two reproduced polling defects are repaired: denied/missing tasks cannot refresh
an empty reference, and unfinished decision feedback prevents background refresh.
Feedback remains expanded while Save-before-Resolve reloads the same task.

Focused evidence so far: 36 unit assertions across four selected files plus six
advanced-task assertions passed. All 18 correction-authoring browser cases passed
across Chromium/Firefox/WebKit, en/fa/ar and 390/1440px; this is fixture evidence,
not backend acceptance. Retained initial failures include two Persian test labels
corrected to the existing translation, premature driver writes to read-only
controls, an incorrect assertion that a pinned original submission is overwritten,
and an evidence query using lowercase instead of actual uppercase stored actions.
The real-service driver now waits for editable controls, proves one Save before
Resolve and reuses the existing partial-response fault to avoid browser transport
retries before any response headers. Actual failed/partial runs remain retained.
No required assertion, retry/deadline or backend lifecycle was weakened.

The supported reviewer service run completed all six scenarios with zero browser
diagnostics and exact live paths/components agreement. Its receipt is
`artifacts/ordered-execution/reviewer-services-supported/manifest.json` (the exact
intermediate functional source, not automatic final-source qualification).
The existing peer `protected-operations` profile then passed all 36 tests in
397.73 seconds without warnings or skips. It ran in an immutable owned copy with
disposable PostgreSQL, actual outbox/Celery and the loopback HTTPS order sandbox;
the peer functional hash stayed
`b9c0812b8f5936f4fa9a01d73aedb775f187a938fca4a81f3b1dd6af78d2be42`.
An initial setup failure missing five required synthetic settings is retained,
not counted as a pass. The passing output and cleanup are in
`artifacts/ordered-execution/protected-services/`. This is backend sandbox
acceptance, not a new frontend browser/deployment or live-provider claim.

Stage 3's extended actual Firefox/service journey passed 36 scenarios with zero
diagnostics and exact producer agreement. Existing implementations were reused.
The new cases create only owned successor versions: a timer resumes a child with
an invalid integer conversion, the actual worker marks it FAILED, and exactly one
authored `failure` transition completes its parent. Earlier completed pins stay
unchanged. An unused child successor is retired; the editor retains its existing
workspace mappings/pin, explains unavailability and actual promotion rejects it
with `subprocess.version.unavailable`. No execution state is fabricated. An initial
test setup used the wrong configured Transform input schema; its real 422 is
retained in `workflow-attempt-1`, and the corrected producer schema passes.
Source-qualified intermediate evidence is in
`artifacts/ordered-execution/workflow-browser-supported/`. The existing peer form,
dependency and durable recovery regressions run separately; their results are not
preclaimed here.

Those seven unchanged peer regressions subsequently passed in 39.47 seconds with
no skips/warnings, using the existing disposable flow harness and selected
maintained tests. They cover the twenty-control request/review/print/correction
lifecycle, non-mutating setup/dependency facts and exact missing form/client pins,
exhausted timer failure, atomic event rollback/cancellation and distinct pinned
child calls/timer settlement. `artifacts/ordered-execution/workflow-services/`
retains the explicit test selection, output, cleanup and unchanged peer hash.
These backend assertions supplement rather than replace the real browser run.

Stage 4's actual Calendar browser/service run passed seven scenarios with no
diagnostics and exact live contract agreement. Existing competing-edit recovery,
fractional instants, atomic cancellation, unchanged replay, dense-event navigation
and locale/actor privacy remain intact. New assertions publish an owned successor
with a real human deadline, observe its authorized Calendar projection and task
link, disallow personal Edit/Delete, configure one reminder, complete the task and
verify deadline removal and cancellation. Completed work no longer authorizes
reminder reads (404); the guarded read-only proof confirms one CANCELLED reminder
without exposing its payload. A null-root driver wait failure is retained in
`calendar-attempt-1`; waiting for controls to mount fixes setup without relaxing
the command/authorization assertions. Supported intermediate browser evidence is
in `artifacts/ordered-execution/calendar-browser-supported/`. Actual worker and
operator recovery run separately and are not preclaimed.

The three unchanged maintained Calendar worker/operational recovery regressions
then passed in 5.86 seconds, no warnings/skips, in the same isolated peer harness:
real broker refusal/recovery, actual worker interruption and scheduler replacement,
deduplicated delivery, and cancellation after enqueue. Exact selected test paths,
source hashes, output and cleanup are retained in
`artifacts/ordered-execution/calendar-services/`. No shared worker/broker or
database was paused/reset. The membership-aware ordinary team picker remains a
separate missing producer contract; administrator enumeration is not a substitute.

Stage 5 rechecked the unchanged producer and passed all five supported Agent editor
Firefox/service scenarios with zero diagnostics and exact live paths/components
agreement (`artifacts/ordered-execution/agent-browser-supported/`). The existing
mapper/agent implementation is reused, with no paid provider call or invented API.
Read-only runtime inspection still resolves STEP_OUTPUT as the whole prior port
without applying source_path; use-authorized model metadata still has no saved
connection display name. The producer hash is unchanged from the documented
findings. The precise four agent contract dependencies remain in
`docs/delivery/AGENT-EDITOR-CAPABILITIES.md`; mapper/interface dependencies remain
with APP-FE-023 and `APP-FE-024-PEER-HANDOFF.md`. REQUEST schema reconstruction,
legacy Transform v1 validation, target-field/cross-source assembly and authorized
sample projection are not repaired by frontend substitutes. These are BLOCKED
capabilities, not missing frontend scaffolds or strict parent readiness.

Stage 6 final qualification is pending. Its final unchanged-source gate, owning
three-engine regression, actual service reruns, HTTPS boundary and AST refresh
must have actual results in the completion receipt. This record deliberately
does not preclaim a pass. Manual screen-reader/device and human visual/performance
approval, actual deployment and user acceptance remain their own evidence levels.

Final owning correction regression passed all 18 tests in 1.5 minutes across
Chromium/Firefox/WebKit, en/fa/ar and 390/1440px, with no skips/retries/flaky
results (`reviewer-browser-qualified`). The existing local HTTPS acceptance passed
with the installed Chromium binary: Secure/__Host cookies, server-only secrets,
CSRF, no-store, private assets and A→B→A deep links. Two initial launch-configuration
failures (required Chromium engine, then unavailable global binary) are retained;
no product fallback or browser-security setting was changed. Its self-signed
certificate exception was confined to the owned temporary browser.

Delivery inventory records 379 operations, 205 templates, 29 JSON inspection
matches and 11 route manifests; normal correction workflows use purposeful fields.
The final receipt must compare complete gate source identity and all real-service
functional hashes, retain raw outputs and leave unsupported/manual/deployed gates
explicit. Existing Markdown hard line breaks cause the optional `git diff --check`
whitespace report; this is not reported as a passing command and does not replace
the required format/lint/gate results. No source/threshold suppression was added.

The first final four-profile rerun collected all independent outcomes: workflow
36, Calendar 7 and Agent 5 passed, while the reviewer driver wrote to the field's
read-only OUTPUT during a claim transition. OUTPUT supports a value property but
has no input handler; this was not a saved form edit. The driver now requires an
actual enabled HTMLInputElement/HTMLTextAreaElement and observes the existing
Unsaved changes state before Resolve. The complete failed batch is retained in
`final-services-attempt-1`; all four profiles are rerun on identical final
functional source. Production application code and the three-engine test remain
unchanged by this driver repair. Final-source qualification depends on the final
receipt, not the earlier partial batch.

The final identical-source rerun subsequently passed all four profiles in order:
reviewer 6, workflow 36, Calendar 7 and Agent 5 (54 real browser/service scenarios).
Every profile has zero browser/service diagnostics and exact frozen live
paths/components agreement. Frontend functional start/end identity is
`1af2b672f64fca8fda6d931533c2744fa18dee3bf55a08b22352f30e1d88fd11`;
the backend peer and runtime remain unchanged at the hash above. The authoritative
batch receipt is `artifacts/ordered-execution/final-services/receipt.json`.
The three separately recorded maintained backend suites passed 46 tests total.
Actual local gate outcome and complete-tree identity remain pending until the
final completion receipt is generated; none is inferred from these service passes.

The first complete gate passed the first seven stages, then reported 1,034 passing
and six failing unit tests (one of 231 files). All six shared an incomplete
AdvancedTask editor double: extraction makes the feedback child's canResolve input
read the existing required canEdit method even with no feedback. The fixture now
supplies false for its null document. Its unchanged six command-draft assertions
all pass. Production code is unchanged; `tsconfig.app.json` excludes this exact
spec from the application build. The failed whole gate and initial incorrect
focused CLI invocation are retained. No test or warning is suppressed.

The final receipt must preserve the service functional hash above rather than
silently relabel it after the test-only change. It compares the full source-file
lists (only this exact spec and this journal may differ), verifies all other
runtime/config/public/test files unchanged, and compares all 162 actual-service
production JS/CSS bundle paths/hashes with the final build. Actual service
qualification therefore uses an explicit byte-equivalence proof; fixture tests
never stand in for backend acceptance. A new complete gate runs on the final
unchanged tree. Any unexpected source or bundle difference invalidates this proof
and requires the affected acceptance to run again.

Final outcomes, command exits, source identity, observed
scenario counts and retained failed runs must be recorded under
`artifacts/ordered-execution/completion.json`. Missing or partial evidence is not
completion. Existing verified slices retain their original source-qualified
receipts. Human product/manual accessibility and deployment are separate gates.
