# APP-FE-032.UX01 — contextual process and case action continuation

2026-10-15. Master V32/V33 ownership also includes APP-FE-028.UX04 and APP-FE-029.UX02/03/04. Status: **IMPLEMENTED_PARTIAL; acceptance open**. Existing business commands, server permissions, immutable pins and operation-specific replay payloads remain the owners.

Process controls now lead with authorized request/task context links. The reference form is a collapsed, explicitly technical fallback. There is no fabricated process-search UI. The existing Actions coordinator occupies the header beside Reload. Authorized process inspection shows lifecycle fields and a readable current-position table. Recovery-only operators retain their existing command scope without receiving request links, inspection tables or a new process GET. Task/request process links use descriptive text while retaining their opaque targets internally; pin/reference metadata sits in technical disclosures.

Request and task pages now place Save, Submit, History and the request Actions menu in a dedicated sticky header. Save/Submit use the existing editor methods and remain disabled by the existing edit, blocked and transfer guards. Human decision controls occupy a named task action area before the form; complete, reject and return retain their producer-owned meanings and required confirmation. Worker and AI tool approval are not substituted for these decisions. Remaining advanced task organization/forwarding and complete cross-resource context acceptance are still open.

History opens a focused PrimeNG dialog and uses the existing kind/current-reference history API. Request report opens its own result dialog, rather than expanding a list in the page header. Both dialogs have explicitly localized close names, body-mounted overlays and focus recovery. Reference changes, destruction and actor cleanup fence late private history/report responses. Opening an Actions menu sends no business command. Internal component names were removed from Operations request/task/catalog document titles and breadcrumbs.

## Contract inspection and peer handoff

The frozen producer and inspected live schema have no general process search/select endpoint. Existing `GET /api/v1/business-requests/{ref_id}` exposes `process_ref_id`; `ProcessTracking.destination` already resolves this authorized parent context. `ProcessDTO` exposes `business_request_ref_id`, `current_positions`, `ended_at`, `last_error_code`, `ref_id`, `started_at`, `status`, and `workflow_version_ref_id`. `ProcessPositionDTO` exposes execution/token status, step key and wait kind. Neither ProcessDTO nor the inspected BusinessRequestDTO provides a human process/request name or number. The UI does not manufacture one or infer process IDs from worker execution references.

APP-BE-027.UX01 retains any future approved discovery/readable identity projection. No endpoint, DTO, broad reviewer grant, producer generation, backend implementation or migration is requested or changed by this frontend continuation. Existing contracted-task reviewers must still receive safe denial when parent/process inspection is unauthorized. Complete deep-link/current-reference history migration and actual requester/reviewer service acceptance remain required.

## Scoped evidence

`artifacts/frontend-revision-5/` retains every attempt:

- `unit-process-40.log`: seven existing process-control/case-summary tests passed for current refs, readonly behavior, actor cleanup and destination ownership.
- `unit-process-surface-40.log`: two rendered tests passed: contextual parent/tracking links with collapsed manual entry and a header command area; recovery-only operation sends no inspection read. Its long module-import time is recorded separately from test execution.
- `unit-case-actions-43.log`: five history, request-menu and task-control tests passed, including actor/reference fences, live command guards and no execution on menu rendering. Later report-dialog changes require the current final rerun.
- `browser-case-dialogs-44.log`: four Chromium/Firefox tests passed. They cover aligned header controls; exact zero/decimal/boolean request preservation; History/report close names and focus return; no write on menu open; Submit confirmation; readable process links; human confirmation before one canonical decision; unchanged outcome/command fields and exclusion of readonly fields from the task patch.
- Earlier failed selector and dialog-close attempts remain in their logs/screenshots. They are not passing evidence. The scalar control is an intentionally exact canonical text control, not a native spinbutton.

The complete current unchanged-source gate, relevant paired journeys, full task/AI/worker/recovery scenarios, responsive/locale/zoom review and user acceptance remain open. No full V32/V33 or demo readiness is claimed.

## Process/task continuation — 2026-10-17

The [current acceptance record](../delivery/PROCESS-TASK-CALENDAR-ACCEPTANCE.md) extends this same owner with reactive process navigation, current-page/current-reference refresh, denied-state clearing, recovery-input guards, readable positions/timeline and contextual task commands. Inspected worker retry/revoke and simple process state rules now constrain command presentation and are rechecked after confirmation. Backend checks remain authoritative, including parallel positions and compensation/recovery semantics. Missing inspection state retains the existing recovery-only scope without an added GET. Current exact final logs/results are governed by the linked closing receipt, not the earlier incomplete gate above. Discovery/readable identity, ordinary-reviewer forwarding selection and manual/deployed acceptance remain explicit boundaries.

## Administration task and command continuation — 2026-10-17

The [Administration acceptance record](../delivery/ADMINISTRATION-DETAILS-ACCEPTANCE.md) adds registered task-definition detail, schedule variant projection with retained inactive drafts and omitted interval updates, typed schema-based command settings and shared column/Advanced filter repairs. Existing command owners, authorization, confirmation and uncertain-result replay remain unchanged. Real-service acceptance creates disabled schedules only. The linked closing receipt governs current proof; parent/master/manual readiness is not expanded.
