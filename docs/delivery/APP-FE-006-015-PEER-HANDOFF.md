# APP-FE-006–015 current contract handoff (2026-10-09)

Frontend base revision: `95f88dce6f1a48da87294929041378c174e6b39c` (working changes are identified by the acceptance manifests). Backend inspected revision: `9999641f8e37077829ebbe7159a6cd794fb94b91`.

The current generated client consumes the actual localized producer contract: 374 operations, 550 schemas. Historical delivery evidence remains intact. This handoff records observed frontend-scope closure and remaining contract gaps; it does not approve new contracts or assert full product readiness.

## APP-FE-014: eligible team selector

`CalendarEventInput.work_group_ref_id` is implemented. `apps/calendar/application/service.py:CalendarService._group` requires the current actor's active membership, even for a superuser. The current administration group selector is protected by group administration authorization. C03 workflow selection context is also permission constrained and does not establish calendar membership eligibility.

Ordinary team members need a readable, paginated, current-reference membership-aware selector before the frontend can offer team event creation without copied opaque references or unrelated administration privileges. A peer should freeze an existing appropriate selector or supply the missing contract; frontend must recheck it before save. Personal events and preserving an existing event's group reference do not establish this acceptance.

## APP-FE-014: reminder editing projection

`CalendarItemDTO` exposes schedule and group but omits the event's configured `reminder_offsets`. The reminder list includes historical reminder states; those records cannot reliably reconstruct the current configuration. The frontend therefore asks for explicit replacement of existing reminders, with confirmation, and never presents historical rows as an authoritative “keep current” choice.

A peer can expose a bounded current configuration if independent reminder editing must preserve offsets transparently. No DTO field or endpoint is invented here.

## APP-FE-012: reserved operation destinations

The real inbox `FutureTarget` has `route_key: null`; MAP-07/MAP-08 target kind `operation` remains reserved. The frontend displays safe unavailable guidance and does not fabricate an operation URL or execute a business command. Full MAP-01–14 destination acceptance cannot be claimed until the owning operation contract and destination exist.

## APP-FE-011: actual repair categories

The current C06 service groups `human.user.unknown` under `work_groups` and leaves `human.work_group.inactive` in the generic workflow category. The frontend retains the current wire schema and maps these exact stable codes to the existing authorized user/group screens. `human.form.not_published` offers the form root owning active-state repair; `step_types` offers the immutable step-version destination. Backend category cleanup remains a peer-owned compatibility review, not authorization for a DTO or lifecycle change.

Read-only setup connectivity/configuration does not prove provider or worker execution. Unknown required worker/scheduler checks remain unready. No endpoint for a generic active probe is invented; operation-specific connection verification and worker execution evidence retain their existing owners and approval rules.

## Evidence boundaries

The owned paired harness exercises production frontend code and real HTTP against a copied backend source and fresh disposable PostgreSQL/cache/object storage. It never resets shared data or changes peer source. Failed and partial browser runs remain in `artifacts/paired-foundations/`. Worker startup alone does not establish scheduled reminder execution. Full `mise run check`, task-specific real-service scenarios, deployment, and user acceptance remain separate levels.

## Remaining acceptance by frontend owner

These are current gaps, replacing assumptions that all C01–C10 producers are absent. Historical records remain intact. Tasks with incomplete required evidence remain open.

| Task       | Remaining acceptance or contract gap                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| APP-FE-006 | All sixteen actual paged selector kinds, available current summaries, page-two/off-page/clear/deleted-candidate acceptance are proved; keyboard/locale and complete zero-warning gate also passed. APP-FE-006 is DONE at its reusable-picker scope. Later editor adoption retains its owning feature IDs; favorite step-version destinations belong to APP-FE-009. |
| APP-FE-007 | DONE / VERIFIED_INTEGRATED at shared-pattern scope: actual user/root CRUD, validation and competing-edit recovery, readable history, exact synchronous Studio report preview and immutable versions passed with the complete zero-warning gate. Specialist editor/full product work retains its later owners.                                                      |
| APP-FE-008 | DONE / VERIFIED_INTEGRATED: actual invalid-input non-persistence, competing-client profile/preference recovery with independent drafts, account persistence and private avatar operations passed; complete zero-warning final gate passed. Manual assistive-technology and deployment acceptance remain separate.                                                  |
| APP-FE-009 | DONE / VERIFIED_INTEGRATED: actual competing windows, explicit schema repair, typed query restoration, paged/current/deleted favorites, immutable step destination and account isolation; complete zero-warning gate passed.                                                                                                                                       |
| APP-FE-010 | DONE / VERIFIED_INTEGRATED: actual historical revision, bilingual seen/dismiss/revisit/reset, focus, persistence and account isolation; complete zero-warning gate passed. Manual assistive-technology acceptance remains separate.                                                                                                                                |
| APP-FE-011 | DONE / VERIFIED_INTEGRATED: actual missing-form repair/return/revalidate, immutable published pins, enabled/disabled clients, expiry and stale/denied cases; complete zero-warning gate passed. Unknown required execution remains unready; no provider probe is invented.                                                                                         |
| APP-FE-012 | BLOCKED: full MAP recipient/destination coverage, including reserved MAP-07/MAP-08 operation contracts. Current real worker/Redis/SSE delivery, read-only navigation, reconnect and actor cleanup passed.                                                                                                                                                          |
| APP-FE-013 | DONE / VERIFIED_INTEGRATED: actual recorder outage/recovery, business rollback, safe correlation, headerless intake/non-recursion and operator audit; complete ordinary zero-warning gate passed. Four deliberately induced backend fault records are retained separately.                                                                                         |
| APP-FE-014 | BLOCKED: membership-aware team selection and full workflow-derived deadline/source matrix. Actual personal-event competing edits, source cancellation, unchanged lost-response replay, UTC+04/all-day/DST and clocked scheduler/worker delivery passed.                                                                                                            |
| APP-FE-015 | DONE / VERIFIED_INTEGRATED: all nine real registered metric/list populations, deletion/date/denied-dimension, unavailable/stale/backend recovery, phone-width resize, RTL and actor cleanup; complete zero-warning gate passed. Unsupported monetary metrics are not offered.                                                                                      |

Manual acceptance, backend final gate, deployment and vendor execution are separate evidence levels. No missing matrix or backend exception is promoted to strict full demo readiness.

The final unchanged-tree gate and exact actual pair manifests are recorded in [the consolidated closure](APP-FE-006-015-ACCEPTANCE.md). Failed and partial scoped results remain under `artifacts/paired-foundations*/` and `artifacts/paired-notifications/`; these do not establish deployment or full demo readiness.
