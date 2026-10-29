# APP-FE-024 producer findings — 2026-10-19

These findings preserve existing contracts and historical evidence. No backend
source, schema, seed or applied migration was changed. The actual source pair and
producer comparison belong to `artifacts/workflow-interface/services-attempt-*`
and the final scoped receipt. This is a handoff, not an approved new exception or
permission to label the full parent ready.

2026-10-25 continuation: the owner authorized the REQUEST-persistence and legacy
Transform repairs. Their implementation and source-qualified acceptance now belong
to [the current repair record](APP-FE-024-BINDING-CONTRACTS.md) and its completion
receipt. Findings below remain historical for their recorded source; an absent or
partial current receipt is not verification.

## Legacy transform/1 binding validation conflicts

The new owned parallel-wait acceptance graph initially used registered transform/1
as its ALL-join step, with a constant on its `value` input. With target_schema `{}`,
actual graph PUT rejected the binding with `binding.target_schema.mismatch` and
reported the required binding missing (service attempt 6). With the exact registry
input-port value_schema, the same operation instead rejected
`transform.input_schema.mismatch` (attempt 7).

Read-only source reconciliation:

- `src/apps/workflows/application/service.py` around `_validate_bindings` compares
  target_schema against the registry port for v1. Its configured transform contract
  override is limited to v2.
- `src/apps/workflows/application/validation.py` constructs transform schemas for
  TRANSFORM steps and checks the binding against the configured TransformSpec input.
- The registered v1 generic JsonValue port is not that configured input schema.

Together these checks require different target schemas for the same v1 binding.
The owning backend needs a consistent reviewed legacy/configured contract and
regressions through actual graph PUT/publication. Preserve immutable published
payloads and pins; do not migrate active graphs by replacing their type references.
Do not relabel historical v1 fixture/browser results as execution acceptance.

The new timer/event/ALL-join lifecycle journey uses the already reviewed registered
transform/2 with its actual configured input schema. Its required validation and
runtime assertions are unchanged; this does not establish v1 repair or widen D07.

## Expression completion versus request schema declaration

Designer completion advertises the authorized request type's form paths. Graph
expression validation constructs its `request` namespace from typed REQUEST graph
bindings, rather than that request type/form metadata. Selecting an otherwise
valid advertised but unbound request path therefore does not establish a compilable
expression. This was observed in service attempt 4 and reconciled against
`GraphValidator._context_schemas` and the designer completion owner.

The frontend retains those server-provided choices as explicitly disabled values
with a typed-request-mapping explanation. It offers declared request values,
process/client/current-user fields and dominating prior outputs. It never inserts
artificial data bindings just to make expression compilation pass. Positive actual
acceptance uses the producer-declared `process.status` schema. A broader producer
solution needs an approved source of request schema during graph validation; no
new endpoint/field or implicit schema projection is invented here.

## Existing mapper boundaries

APP-FE-023 retains its existing producer handoff for nested prior-output runtime
projection, target-field/cross-source object assembly and authorized redacted
private samples. This continuation does not fetch private execution snapshots or
replace required human approval with an inferred result.

## REQUEST schema is not retained by executable graph reconstruction

Lifecycle matrix attempt 2 saved a typed REQUEST binding for `/amount` and authored
`request.amount` in a branch condition. Graph PUT and workspace save succeeded;
workspace promotion returned 422 `expression.path.unknown`. Read-only inspection
of `WorkflowService` graph reconstruction shows REQUEST/CONTEXT source_schema
reconstructed as None (only STEP_OUTPUT port schemas are recovered), while
`GraphValidator._context_schemas` requires that schema to declare request fields.
The backend owner needs an approved durable schema source across save, promotion,
publication and reload; frontend workspace metadata cannot repair executable
reconstruction. Preserve existing immutable pins. The final loop lifecycle uses
producer-declared process.status to independently verify the visit limit and else.
This does not establish request-expression publication support.

## Parent and direct-child mutation commands during child waits

The producer explicitly rejects parent mutation commands while a SUBPROCESS
execution is waiting and rejects direct child control. Current public parent
positions support an explanatory frontend guard; read-only tracking remains
available. ProcessDTO does not expose a general parent/child discriminator for an
arbitrary process reference, so none is invented. Actual disposable acceptance
requires fresh-reference parent/direct-child cancellation conflicts and subsequent
successful timer continuation. This establishes the restriction, not cascade
cancellation support.

## Nested STEP_OUTPUT runtime continuation — 2026-10-19

The later APP-BE-019.UX01 resolver repair now applies source_path, paired with the
existing frontend mapper extension. [Current scope and source-qualified evidence](APP-FE-023-NESTED-OUTPUT.md)
supersede the whole-port-only finding for that repaired pair. REQUEST reconstruction,
legacy Transform v1, object assembly, authorized samples and child-input mapping
restrictions retain their separate contracts and acceptance requirements.
