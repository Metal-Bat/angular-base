# APP-FE-024 — Child interface authoring and real wait lifecycle continuation

This extends APP-FE-024.3 subprocess authoring and APP-FE-024.2 branch/wait
acceptance. The parent is not automatically complete. Final scoped status,
command exits, source identities and observed counts belong to
`artifacts/workflow-interface/completion.json`; an absent receipt is incomplete.

## User outcome and existing ownership

A workflow-level editor in Properties defines isolated child inputs, exact returned
outputs and business outcomes without graph JSON or reference copying. Inputs use
named text/integer/number/boolean/object/collection types or exact schemas from
registered output ports. Required and actor/group assignment settings are fields.
Objects/collections support named nested fields, collection member types and
required-field controls. New unrestricted members are described explicitly;
advanced schema constraints remain intact. Duplicate/unsafe field names are
rejected in a cancellable dialog, which fences parent Apply/save while open. Existing structured schemas and
constraints remain intact. Saved samples protect input naming/coverage while
remaining undisplayed; help, capabilities and other interface metadata are retained.

Outputs choose actual current graph steps and reviewed registered output ports,
copying their complete producer schema. Unavailable saved sources remain visible
and cannot be applied as valid. Output availability is checked against every
business Finish outcome, including bypass branches. Outcomes choose actual Finish
steps, retain invalid/duplicate buffers, reject reserved technical failure and
prevent multiple outcomes silently sharing one Finish. No private execution
sample or raw snapshot is fetched.

Pending changes, including an unadded input name, fence workspace save. Explicit
Apply/Discard, existing Undo/Redo, current workspace references, navigation guards
and published read-only behavior are reused. New controls are PrimeNG/shared UI
with semantic tokens and English/Persian/Arabic localization. The Properties dock
and existing canvas stay in place. Shared details spacing is explicitly overridden
inside this editor so full-width fields fit their own panel in RTL and phone views.

## Contract reconciliation and implementation

Read the actual producer `SubprocessInterface`, `SubprocessPort`, `SubprocessOutput`,
`SubprocessValidator`, GraphSnapshot, GraphFlow, timer/event handlers, process wait
owner and authorized event ingress. The existing GraphSnapshot.interface is the
only transport. Registered output schemas use exact root-annotation-stripped
compatibility, rather than GraphBinding type assignability. Actual START/Finish
path validation mirrors the producer for guidance; publication remains authoritative.
No endpoint, DTO, seed, migration or backend source is changed. DB-002/D07 boundaries
remain intact; source pair and exact producer comparison are recorded by the harness.

Domain ownership: `studio/domain/workflow-interface.ts` reuses inspector metadata,
graph parsing and pinned schema comparison. Presentation ownership:
`workflow-interface-editor`, `interface-outcomes`, recursive `interface-shape`,
`domain/interface-shape` mutations and existing WorkflowBoard and its
history/pending/document mutation seam. Outcomes were extracted to a focused
component to keep the normal template within its existing complexity gate.

Condition-source loading is independent of data-input-port availability, so
START/timer/subprocess-style steps can use condition values without fictitious
data ports. The actual no-input-port browser case covers that repair.

Condition editing reuses the existing authorized designer completion response.
Only server-provided request/process/client/current-user paths and prior outputs
that still dominate in the current draft are offered. Explicit insertion retains
the boolean expression buffer and existing Apply/Discard; no expression is
invented from a display label. Higher-priority exclusive/default behavior and ALL
split behavior have distinct help. Flow controls explain ALL join/cancellation,
visit bounds versus retries, elapsed seconds/UTC deadlines and event correlation.

## Verification and retained findings

Focused unit checks exercise exact schema copying, metadata preservation, bypass
branches, unavailable sources, constraint mismatch, reserved/duplicate outcomes,
assignment types, rapid edits, unadded-name fencing, discard, saved sample
protection, actor cleanup and read-only controls. Condition-value regressions cover typed
request mapping requirements and removal of prior outputs after draft bypasses. Browser acceptance covers actual
field interactions, invalid-buffer recovery, current-reference save/reopen,
Undo/Redo and phone/desktop layouts in all three languages. Each field's bounds
are checked against its inspector, in addition to page/button width. Screenshots
are agent review only, never human approval.

The first 24 three-engine cases passed page/button checks. Screenshot review found
an untranslated Child inputs heading and possible clipping; a stronger control
containment assertion reproduced the latter. Global details child margins added
to full-width inputs caused a Persian phone category field to cross its panel.
The editor now owns that spacing. The reproducing check passes; failed evidence
is retained under `artifacts/workflow-interface/containment-before`.

Initial compile/lint findings (readonly test mutations, component extraction,
curly braces, complexity and formatting) were corrected without threshold changes.
Nested schema dialog acceptance additionally found a missing accessible selector
name during dialog mounting; its Value type/member controls now supply explicit
localized accessible names. The complete nested save flow passes afterward.
The first real-service run reached 11 existing scenarios, then a new driver checked
disabled DOM controls in the same stack as its synthetic input. The component's
synchronous Apply fence is independently tested; the driver now waits for actual
rendered control state. That failed run is retained as `services-attempt-1`. The second run successfully
published the actual UI-authored child interface, then found a stale two-node
expectation in the read-only navigation driver after adding the real output
producer step. It now checks the exact authored child graph size and its own
producer node; `services-attempt-2` retains the failure.

The third service attempt retained the complete current schema-choice flow but
found a static-driver assumption: collection-member selection intentionally
replaces the selector with the chosen nested object editor. The local driver now
asserts that exact replacement and its persisted nested schema rather than
waiting for a removed selector label. The general selection helper is unchanged;
`services-attempt-3` retains the failure.

The fourth service run exposed a producer distinction: completion advertises
request-form fields, but graph expression validation obtains request schemas only
from typed REQUEST data bindings. The condition picker now labels such unbound
request fields as unavailable with a specific explanation instead of offering an
unexecutable value. Process/client/current-user values and dominating registered
outputs retain their supported context. The actual positive condition acceptance
uses the producer's declared process.status schema. This producer boundary is
handed off without inserting artificial data bindings or changing the backend.

The fifth run caught source discovery being disabled during a pending mapping,
which prevented completing the mapping after choosing its target. Source loading
now keeps its original pending-mapping availability while allowing condition
completion on zero-input-port steps. The sixth run completed child interface
publication/execution and positive condition compilation, then correctly rejected
the newly seeded wait journey's approximate legacy-transform/event target schemas.
That driver now uses each exact registered input-port schema; no producer rule is
weakened. Failed manifests and safe issue codes remain in attempts 5/6.

Attempt 7 additionally found a real legacy transform/1 producer conflict: the
service and graph validator require different target schemas. The new runtime
journey uses the already supported exact transform/2 contract; its required
lifecycle assertions are unchanged. [The peer handoff](APP-FE-024-PEER-HANDOFF.md)
records both actual failure codes and the source reconciliation without changing
published pins or claiming legacy repair.

Attempt 8 reached actual process completion but counted the producer's two
completed ALL-join arrival markers as handler runs. Its replacement assertion
requires exactly two arrival records, exactly one successful handler attempt and
exactly one outgoing join transition. The following complete paired run passed
31 scenarios with zero browser/service diagnostics, exact producer comparison and
unchanged frontend/backend source identities; it is retained as
`services-supported-v2`. Final evidence must additionally include the subsequent
compatibility guard and final complete gate.

A focused saved-workspace compatibility regression then reproduced a render
exception when interface.inputs was a string. Structural guards now retain that
saved document, show an explicit unavailable typed-editor state and refuse
replacement mutations. Known advanced schemas and immutable published versions
remain intact. Nested schema structure checks also retain unsupported/invalid
layouts instead of coercing them, and preserve valid dynamic field names such as
constructor. Before/after logs are retained in `guard-regression`.

The guarded existing APP-FE-021 harness now authors an optional child input and
exact returned output in the real UI, promotes/validates/publishes that saved
workspace, and executes it through the real child/outbox/Celery settlement path.
A child successor preserves the original parent pin. A second runtime journey
uses UI-authored timers, bounded visit settings and event deadlines with real
parallel waits, ALL join, authorized event correlation, duplicate/late deliveries
and the real due-action owner. The new harness-only workflow action invokes the
producer's clocked `fire_due_actions` and committed outbox, guarded by the existing
owned database/project/task assertions. It writes no synthetic process results,
changes no clock and touches no shared services. Final outcomes belong to the
completion receipt, not this implementation description.

Composite type hints now reuse one presentation helper across the interface,
nested shape, graph mapper and pinned child summary. Each type/format token is
localized separately, so string/null unions render correctly in Persian and
Arabic without changing canonical schemas. Focused translation regressions retain
the original schema and unknown format keys.

Final paired acceptance additionally uses read-only assertions inside the already
guarded disposable subprocess action: it checks the exact owned synthetic child
input context (including false, empty collection member, request/prior-output and
WAITING context values), absence of implicit parent fields, and the actual returned
output on the settled parent execution. Only a success marker is returned; no
snapshot contents are returned or logged, no business state is synthesized, and
no UI/private sample projection is introduced. The final scoped receipt requires
this marker alongside real process/timeline/pin checks.

Auxiliary global `git diff --check` flags existing Markdown hard-break spaces;
its actual exit 2 is retained. The scoped source diff check exits 0. Native
formatting/lint/full checks remain authoritative and no threshold is changed.

## Observed final real-service evidence

`artifacts/workflow-interface/services-final-current` records 34 passing actual scenarios,
zero browser/service diagnostics, exit 0 for migrations/seed/browser commands and
exact HTTP paths/components equality with the frozen producer. Final frontend
functional source identity is
`70428c5179d08fce98d5f66c270419c828aea5202a8e787f13a929e7804ccd5c`;
backend start/end and untouched peer identity are
`b9c0812b8f5936f4fa9a01d73aedb775f187a938fca4a81f3b1dd6af78d2be42`.
The final receipt must also require the complete frontend gate on unchanged
source, the three-engine browser matrix and AST graph refresh. Local, integrated,
manual and deployed evidence remain separate.

## Remaining acceptance boundaries

The broader fault/dependency matrix and unsupported cascade cancellation remain
separate work. The supported cycle limit, final else and explicit active-child
command rejection are verified by the current actual-service journey. REQUEST
condition publication retains the schema reconstruction producer finding. Nested object/collection field structure and required flags
are editable; advanced JSON Schema combinations/constraints are retained rather
than rewritten by a partial schema compiler. Arbitrary cross-source object assembly, nested prior-output runtime
projection and authorized redacted sample projection retain APP-FE-023 producer
limits. The legacy-v1 producer finding is also open in the peer handoff. Provider/business-effect execution, manual visual/accessibility/device
acceptance, deployment and rollout are not established by these checks. Historical
parent statuses and accepted exact backend SDK exceptions remain unchanged.

## Declared input consumption, indexed mapping and current child outcomes

The mapper now uses an interface-bearing workflow's own declared inputs, including
nested objects and collections, without requiring an unrelated request-type
lookup. Parent form fields are excluded from the isolated child context. Shared
mapping paths preserve root schemas and rebase local schema references when an
input is wrapped under its declared name; schema resource boundaries and literal
examples/defaults remain intact. Nine focused comparisons using the actual backend
Draft202012Validator cover local definitions, resource IDs and recursion; this is
local library evidence, separate from real-service execution.

Child calls reuse the shared collection index/field controls with unique IDs.
Negative indices remain visible and invalid; exact projected leaf compatibility
fences Apply. Selection validity and pending state update synchronously. Current
known child pins offer their actual business outcomes plus technical failure;
unavailable pins preserve saved routes and disable guided continuation.

The actual service journey maps a parent collection member into the child input,
consumes that declared input through a child transform, checks the returned value
on the parent and repeats completion after a real child timer wait. Active child
waits show the producer's mutation restriction in process controls while retaining
read-only inspection. Focused shared-control tests distinguish mutation actions,
read queries, ordinary waits and recovery-only operators. No cancellation engine
or private child discriminator is introduced.

The expanded lifecycle also authors an actual bounded cycle and unconditional
else through the UI. Failures remain under lifecycle-matrix-attempt-*; the request
schema reconstruction finding belongs to the peer handoff. Observed final results
and current source hashes must come from the completion receipt.

Screenshot self-review additionally found the child-input heading touching the
category field despite passing containment bounds. The scoped heading spacing
now has an explicit block gap. The interrupted pre-spacing browser matrix is
retained separately; final browser/service receipts requalify the final bytes.

The first full final check retained 1,034 passing tests and one stale
GraphConnections assertion for the former no-input-port message. Its updated
regression requires disabled data mapping, available condition lookup and no
mapping emission. The complete failed gate remains in full-check-attempt-1; final
qualification repeats the full gate without skips or changed limits.

The next complete browser sweep ran all 392 cases: 390 passed, with the same
collection-index duplicate-alert defect reproduced once in Chromium and once in
Firefox. Both native traces, screenshots, report and full gate are retained in
full-check-attempt-2. The shared field already owns an immediate, described invalid
index message; the mapper now checks the same domain validity predicate before
attempting application, retaining the invalid value and preventing duplicate
parent feedback. Negative, fractional, non-finite and unsafe indices remain
rejected. No locator, timeout, skip, retry or threshold was weakened. Final scoped
qualification requires the subsequent three-engine regression and complete gate.

## Ordered fault/dependency acceptance — 2026-10-19

The [ordered execution record](APP-FE-038-ORDERED-EXECUTION.md) extends the existing
owner with actual child conversion failure after a real timer, single authored
parent recovery, earlier-pin preservation, unused dependency retirement and
retained-workspace/unavailable-promotion checks. The supported intermediate
Firefox/service run passes 36 scenarios with zero diagnostics. Original evidence
and producer findings remain intact; its exact source receipt and the final batch
gate govern their respective evidence levels. This does not close the complete
parent or manual/deployment acceptance.
