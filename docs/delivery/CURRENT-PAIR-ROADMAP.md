# Selected frontend/backend execution roadmap

2026-10-27 continuation: selected local schema rollout is applied after a private
backup/restore rehearsal, preserving 103 tables and 189,438 business rows. Agent
producer contracts are implemented with focused database/process acceptance; saved
connection names are consumed by the existing frontend. Remaining new Agent UI
consumers stay with APP-FE-025/030. The user selected backend business seeds next:
APP-BE-005.3 adds thirteen executable review processes without rewriting legacy v2
cases or auto-approving human work. Current evidence is under
`artifacts/seed-processes-2026-10-27/`; complete final gates remain required.
The October 26 findings and selected order below are retained as intake history.

Intake: 2026-10-26. This is an execution selection, not another task-status ledger.
Frontend status stays in FRONTEND-BACKLOG.md and its follow-up; backend unfinished
work stays in BACKLOG.md. Existing changes in both checkouts are retained.

## Current findings

- The existing application already implements authentication, requester/reviewer
  workflows, form/canvas authoring, administration, notifications and execution.
  Reuse these owners; do not rebuild them from old planning prose.
- The October 25 durable REQUEST/CONTEXT declarations, legacy Transform and
  notification/claim lock repairs have a successful 44-scenario paired receipt and
  a sixteen-stage backend receipt. Their closing frontend receipt is incomplete:
  its second attempt timed out during the Angular unit-test build, before assertions.
- The scheduler registration and workflow-library seed have focused historical
  acceptance but remain unfinished in the backend backlog. Their earlier failures
  concern PostgreSQL availability and a missing configured Swagger browser.
- At this intake the API on port 8000 is unavailable. Existing infrastructure
  containers are being restored without resetting volumes or running shared migrations.
- Backend D07 has exactly two accepted SDK exceptions. A backend pass retains
  VERIFIED_WITH_EXCEPTION; it cannot establish strict exception-free demo readiness.

Current execution: all 51 focused backend scheduler/library tests pass. The API
health endpoint returns 200 after restoring dependencies. The frontend rerun builds
successfully in 15.863 seconds and passes all 1,064 tests in 234 files, then
Nx reports that the configured cloud workspace is unclaimed (401). The native
command exit is 0; the remote Cloud error is retained separately.
Continue local checks with Nx's existing `NX_NO_CLOUD=true` option; this changes
remote-cache transport, not test selection, exit-code enforcement or diagnostics.
Hosted Cloud verification remains a separate unresolved gate.

The running development database is at `0003_arabic`; the reviewed binding repair
requires `0004_binding_source_schema`. APP-BE-031/032 own the next deployment
action: validate a private backup on an owned restored copy, rehearse the forward
upgrade, then apply it through the normal migration owner and verify authoring.
The prepared plan is in the current evidence directory; no shared migration has
been applied. Infrastructure readiness alone does not establish schema readiness.

APP-BE-024.1 and APP-BE-005.2 now have bounded completion records backed by the
first complete current-source backend gate and task-specific acceptance. Their
final documentation-qualified gate is running. Exact final results remain in the
current completion receipt; broader frontend parents and release gates stay open.

## Selected actions and dependency order

| Order | Existing task owners                                                     | Action and observable exit condition                                                                                                                                                                                                                   | Selection                |
| ----- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| 1     | APP-BE-024.1; APP-BE-005.2; APP-FE-002/038                               | Restore existing local prerequisites; run fresh-process scheduler and workflow-library regressions; identify an installed browser explicitly. Retain native exits and failures.                                                                        | STARTED                  |
| 2     | APP-BE-024.1; APP-BE-005.2; APP-FE-024/036/037/038                       | Complete unchanged-source `mise run check` in each checkout, actual library publication/execution and paired HTTP/browser acceptance. Diagnose the frontend build timeout without raising deadlines, skipping tests or weakening diagnostics.          | SELECTED                 |
| 3     | APP-BE-019.UX01; APP-FE-025/030                                          | Freeze the remaining Agent producer contracts: saved connection names, workflow-bound input choices, authorized retrieval catalog/preview and governed provider testing. Implement through existing AI/designer owners; consume only tested contracts. | NEXT producer slice      |
| 4     | APP-BE-016; APP-FE-014                                                   | Implement/reconcile ordinary-actor current active group memberships for the Calendar picker. Prove paging, revocation, deletion and cross-user privacy before UI consumption. Reuse current Calendar write authorization.                              | NEXT                     |
| 5     | APP-BE-014; APP-FE-012                                                   | Freeze MAP-07/08 authorized recipients and resolvable operation destinations. Keep unsupported targets without fabricated URLs. Verify live delivery, reconnect and actor cleanup through the boundary.                                                | NEXT                     |
| 6     | APP-BE-019; APP-FE-023/024                                               | Define versioned cross-source object composition, conflict/null/order rules, authorized redacted samples and unbound request expression semantics. Preserve published pins and operation-specific replay.                                              | Contract prerequisite    |
| 7     | CONS-FE-001–005; existing backend consistency owners                     | Reconcile existing producer inventory and actual repair evidence before changing old NOT_RUN/BLOCKED labels. Check fixed nested/computed DTOs, one producer manifest, canonical defaults, shared-control ownership and localized/accessibility states. | Revalidate prerequisites |
| 8     | APP-BE-031/032; APP-FE-034–038                                           | Exact immutable candidate pair, built runtime image, actual hosted jobs, recovery/restore, complete browser/accessibility/performance evidence and operator handoff. Human acceptance and deployment require their own evidence.                       | External exit gates      |
| 9     | APP-BE-033 → 034 → 035 → 036/037 → 038; APP-FE-039 → 040 → 041/042 → 043 | Private assistant: freeze ownership/schema/turn contracts; bounded governed turns; explicit proposal confirmation; owned durable schedules/results; paired showcase. Reuse current AI/workflow/task infrastructure.                                    | Subsequent feature chain |

Rows 3–6 are separate producer deltas, not evidence that their entire parent
features are absent. Their relative implementation order can change after current
pair verification exposes a concrete correctness risk. Model/data configuration,
action/principal policy and required human approval remain explicit prerequisites;
no live paid calls are implied by selecting this roadmap.

## Evidence and closure

Current run evidence is under `artifacts/roadmap-2026-10-26/`; prior October 25
receipts remain untouched. Record current source identities, complete command logs,
exit codes, actual test counts and required skips. Local, integrated, demo, hosted,
deployed and user acceptance are separate outcomes. Missing final evidence keeps
the owning task open. No task is completed by this roadmap.

References: ORDERED-REMAINING-WORK.md; ../changes/APP-FE-024-BINDING-CONTRACTS.md;
../changes/APP-FE-023-PEER-HANDOFF.md; AGENT-EDITOR-CAPABILITIES.md;
consistency-2026-10-09/REPAIR-REGISTER.md; follow-up-2026-10-09/FRONTEND-FOLLOW-UP.md.
