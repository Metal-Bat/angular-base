# APP-FE-024.3 — Purpose-built pinned child input editor

This continuation extends the existing APP-FE-024 owner after the data mapper work.
The parent remains BLOCKED / IMPLEMENTED. Final scoped verification is governed
by `artifacts/subprocess/completion.json`; a missing or partial receipt is not
completion, and local, real-service, manual and deployed acceptance remain separate.

## User outcome and reuse

The existing subprocess inspector now edits structured object/array/nullable
constants through shared field controls. Empty strings, false, zero, null and
omission retain their separate meanings. Assignment inputs retain authorized
user/group selectors; arbitrary literal payload keys remain ordinary fields.
Existing nonconstant mappings stay intact until explicit source application or
clearing. Obsolete mappings can be deliberately removed even when their interface
metadata is unavailable, allowing the designer to repair a pin without JSON.

Authorized completion provides request fields, the supported process-status
context and whole dominating prior outputs. A new source remains pending until
explicitly applied and fences configuration/workspace save. Child REQUEST mappings
carry the selected leaf schema: their producer contract differs from graph bindings,
which carry a root schema and project a path. Child sources must match their pinned destination schemas exactly, excluding only root title/description/default/examples as the producer does. Constraint differences disable the choice rather than relying on type-only assignability. Child prior-output mappings carry
the exact registered port schema, including when completion advertises a configured
transform schema. No nested prior-output path is fabricated. Unknown/revoked
sources preserve the saved mapping and require authorized reload or explicit removal.

The inspector explains child context isolation, names required/optional inputs,
outputs, business outcomes and required capabilities, and links to the exact pinned
child version in a separate tab. A child with mappings cannot silently change
version. Published/retired child pins and original published/request pins remain
unchanged. English, Persian and Arabic controls use existing PrimeNG/shared UI,
RTL layout and semantic tokens; no framework, package or contract is replaced.

## Ownership and contract reconciliation

Domain: `subprocess-pin` extends its existing mutation functions and maps authorized
completion through `mapping-sources`, `mapping-schema`, `literalErrors` and the
reviewed node-inspector registry. Presentation: existing `subprocess-pin`, new
`subprocess-input`, `subprocess-sources`, and `subprocess-interface` components;
existing node-inspector/workflow-editor-pane pass their current graph, version
and exact type catalogs. Existing workflow-board state now observes accepted route-parameter changes, clears previous editor state, fences late loads, and opens the correct version without bypassing navigation guards. Angular CLI scaffold logs are retained under `/tmp/subprocess-*`.

Read actual producer SubprocessCall/SubprocessInputMapping/SubprocessInterface,
SubprocessValidator and Process/Subprocess services, completion and route contracts.
No public DTO, endpoint, SDK, seed, migration or backend source changes. Reconciled
DB-002 and exact D07 policy without expanding exceptions. Input isolation, server
authorization, dominance, version pins and current workspace refs remain authoritative.

## Verification and failed evidence

Initial focused regressions reproduce structured-constant rejection and inability
to clear an obsolete mapping. Additional checks cover leaf vs registry schemas,
source authorization/dominance, invalid-buffer retention, pending application and
late-response rejection after actor change/destruction. A rapid multi-input edit
regression covers merging edits before the next parent render; the inspector synchronously updates its local draft before emitting the parent change.

The Chromium/Firefox matrix exercises structured fields, explicit null/empty members,
source application, retained unrelated mappings, save/reopen and discard recovery,
plus desktop/phone editable layouts in English/Persian/Arabic with explicit localized optional-label assertions, measured page
and button containment and before/after captures. These are labelled UI fixtures.

The existing guarded APP-FE-021 real-service profile adds UI-authored child mappings,
positive server validation, exact saved pin/schema verification, actual published read-only child navigation and return, publication and
actual child execution. Its test-only subprocess action dispatches the real committed
outbox through the already-owned Celery worker; it does not write process/execution
results. Required acceptance includes completed parent settlement and actual timeline
confirmation of the original child pin after a successor publishes. Only disposable databases/containers and test-owned workflows are used.

Failures remain retained: primitive-only domain rejection, intermediate compiler/lint
findings, the visually discovered missing Persian Optional label, an incomplete retained-array assertion, a test setup missing valid graph
metadata, the initially absent prior-output type catalog, and the real fast-edit
lost-update finding. Real validation additionally rejected the initially type-only child compatibility hint; the picker now mirrors the producer’s exact-schema rule. A later live driver attempted selection before the actual call node rendered; it now waits for the node. Actual child inspection additionally reproduced stale same-editor route state; a focused route regression and guarded browser navigation cover that repair. One concurrent browser run exceeded login setup while services/graph workers competed for resources; it remains failed evidence and the final runs are serialized. No required assertion, warning limit, timeout or scenario is
suppressed. The first complete gate passed 1,010 unit tests and the first five browser-quality scopes, then exposed immediate invalid-input Apply racing asynchronous child validity. A real node-inspector regression fails before the repair; validity now propagates synchronously through both child and pin, including source application and picker readiness. This failed gate is retained and is not final verification. The next full gate passed 1,011 units, every quality scope and 361/362 browser cases; the sole failure measured phone layout while the language dropdown was still leaving at desktop coordinates. Ten isolated measurements recorded 1,097 px during the transition and exactly 390 px after popup removal. The test now waits for actual popup teardown before resizing; containment limits and deadlines are unchanged, no animation is disabled, and no product overflow is hidden. Final command exits, source identities and counts belong to the final
receipt; no future result is preclaimed here.

## Remaining owner boundaries

This does not close all APP-FE-024 branch/join/loop/timer/event lifecycle acceptance,
child interface-definition/output authoring, or the complete dependency/fault matrix.
Child input source selection covers declared nested request fields and whole
collections; the existing direct data mapper's collection-index controls are a
separate interface. Arbitrary cross-source object assembly and nested prior-output
execution retain the producer limits documented by APP-FE-023. Safe private sample
projections, provider/business-effect execution, human visual/accessibility/device
acceptance, deployment and rollout remain separate. No whole-master closure is claimed.
