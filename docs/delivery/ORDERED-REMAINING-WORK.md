# Remaining work execution crosswalk — 2026-10-19

This is the execution order requested by the user, not a second task-status
backlog. `FRONTEND-BACKLOG.md` owns APP status; existing IDs, completed scopes and
historical receipts remain intact. Verify an existing capability before repairing
it. A missing acceptance scenario is VERIFY, not permission to rebuild a feature.

Baseline: frontend commit `6aba0a5a6fad8ed7f6d51918a390ee13c12d9ae2` with existing
local modifications retained. Read-only backend functional source is
`b9c0812b8f5936f4fa9a01d73aedb775f187a938fca4a81f3b1dd6af78d2be42`.
The previous workflow slice's successful gate and 34 actual scenarios remain in
`artifacts/workflow-interface/completion.json`; they are historical evidence for
that exact source, not automatically current after this continuation.

| Order | Existing owner                                               | Classification and uncovered delta                                                                                                                                                                                          | Reuse / completion evidence                                                                                                                                                                                                                                  |
| ----- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | APP-FE-038; original APP owners below                        | REUSE/VERIFY: reconcile latest records and classify remaining work without duplicate tickets                                                                                                                                | This crosswalk; canonical backlog links here. No parent status is changed by intake.                                                                                                                                                                         |
| 2     | APP-FE-028 / APP-FE-029; protected effects remain APP-FE-026 | VERIFY then repair reproduced defects: real competing claims, duplicate/uncertain commands, correction and return-to-review; reuse existing protected receipt acceptance                                                    | MutationQueues/MutationCoordinator, CaseState/CaseEditor, runtime renderer, task controls, current refs and guarded paired browser harness. No new action queue, approval system or synthetic lifecycle.                                                     |
| 3     | APP-FE-016 / 020 / 024                                       | VERIFY: child failure/timeout, dependency/permission changes, recovery and form-reference boundaries                                                                                                                        | Existing workspace, node/interface controls, actual version pins, scheduler/outbox/Celery and dedicated subprocess lifecycle. Preserve published graphs.                                                                                                     |
| 4     | APP-FE-014 / 032                                             | VERIFY: actual deadlines and scheduler/operator failure recovery. BLOCKED capability: membership-aware team selector                                                                                                        | Existing calendar, schedule/editor/query and operator recovery owners. Existing event replay is implemented and is verified rather than rebuilt.                                                                                                             |
| 5     | APP-FE-023 / 025 / 030                                       | BLOCKED contract deltas: nested prior-output projection, cross-source object assembly, authorized samples, saved connection names, bound agent choices/retrieval/provider test; integrate only reviewed available contracts | Existing mapper/agent capability records and APP-FE-024-PEER-HANDOFF. Exact producer still has REQUEST schema reconstruction and legacy Transform v1 validation findings. No invented endpoints or paid/live effects.                                        |
| 6     | APP-FE-036 / 037 / 038 and relevant owners                   | VERIFY automated final batch; external/manual acceptance remains distinct                                                                                                                                                   | Complete unchanged-source zero-diagnostic gate, actual owned-service scenarios, en/fa/ar browser checks, AST refresh and safe receipts. Manual assistive technology/device, human visual/performance decisions and deployment require their actual evidence. |

## No duplicate work or effects

- One existing owner and one requirement-to-evidence entry for each delta. Extend
  its current implementation and change record. Record producer findings once and
  link them; do not create competing frontend/back-end substitutes.
- Reuse the stable record's MutationQueues coordinator. Save, attachments and
  decisions share current-reference ordering. Preserve each operation's actual
  replay contract: exact immutable payload/key for supported replay; no automatic
  retry after conflict or uncertainty, and no second non-replayable command.
- UI busy/confirmation guards supplement server authorization and transactional
  invariants. Verify repeated clicks, competing actors and committed lost replies
  through real services; a disabled button alone cannot prove one effect.
- Inspect all failures in each selected acceptance batch, retain them, then repair
  the smallest owning layer. Never relax retries, skips, deadlines or diagnostics.
- Focused checks precede the full gate. Once the final gate starts, source stays
  unchanged. Backend-blocked capability, local pass, integrated pass, demo,
  deployment and human acceptance retain separate labels.

## Execution evidence

Current continuation results and unresolved prerequisites belong to
`docs/changes/APP-FE-038-ORDERED-EXECUTION.md` and its final receipt. An absent or
partial receipt is incomplete. This crosswalk does not declare broader APP parents
or the full master closed.
