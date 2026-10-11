# Design and verification record templates

Use these structures inside the repository's existing documentation/generation system. Do not create an empty parallel inventory for each task. Replace placeholders only with observed facts; a template row is not approval or verification.

## 1. Field trace record

| Field                | Required information                                                                 |
| -------------------- | ------------------------------------------------------------------------------------ |
| Domain key           | Stable concept, not a UI label.                                                      |
| Owner / source       | Entity and column, or application computation; file and revision.                    |
| Exposure             | Database-only, public input, public output, actor-filtered or dialect boundary.      |
| Value contract       | Type, units, range/length, precision, timezone/date-only meaning.                    |
| Mutation semantics   | Omitted, explicit null, empty, zero, false, immutable, calculated.                   |
| Identity/concurrency | Current ref requirement, row identity, write/replay behavior.                        |
| DTOs                 | Exact create/update/action/list/detail/select/history/report model paths used.       |
| OpenAPI              | Actual operation IDs, request/response schemas/mode, discriminator and examples.     |
| UI                   | Feature/route, control, read presenter, errors, defaults and localized message keys. |
| Authorization        | Effective read/write/hidden/required and current client/resource restrictions.       |
| Tests / evidence     | Actual positive/negative test identifiers, environment and artifacts.                |
| Status               | Designed / implemented / local / integrated / deployed / user-accepted separately.   |

### Worked source-grounded example — appearance mode

Domain: personal appearance mode. Persistence: `UserPreferencesEntity.document` under the typed preference group. Public type: `AppearancePreferences.theme_mode`; values light/dark/system. Backend default: system. Read: GET `/api/v1/me/preferences`; update: PATCH of the same singleton with current ref_id. Omitted appearance is preserved; null appearance resets that whole group. The UI has a system-mode control and a Reset appearance action. The inspected Reset appearance behavior instead queues blue/light. R07 therefore requires a deliberate correction/clarification, not a database rename or new preference API. Actual default/current ref/reload/other-user tests must be added/run before it is verified. This example describes code, not a completed repair.

## 2. Compatibility/exception record

Record: key, domain, current behavior, governing rule, reason for exception, consumers, security implications, tests, owner, approval/evidence reference, introduction version, planned review/removal and compatibility mechanism.

Observed exceptions to reconcile now:

- Existing self profile/preferences PATCH; preserve current partial update meaning instead of renaming it to PUT.
- Existing data/result envelope difference and bounded selector page/items modes; preserve consumer expectations.
- Binary routes; document the content type/headers rather than force a JSON envelope.
- Dynamic document/map keys; validate dialect rather than apply fixed-field snake_case mechanically.
- Repository-recorded D07 exceptions; label verification accurately, without adding broad suppressions.
- Repository-recorded DB-002 two-file migration baseline; legacy transition/new schema policy remain explicit.

A new exception does not become approved because it appears in this list. An observed API does not authorize unrelated new exceptions. No exception may waive private-data protection or required human approval.

## 3. Domain workflow / screen acceptance record

Record persona, source request type and pins, navigation entry, preconditions, input fields/actions, authoritative API calls, expected canonical data, observable execution and business outcome, notification/report/calendar effects, and support/recovery behavior.

For each relevant state record expected user text/actions and corresponding test: loading, empty, invalid, forbidden, revoked, stale, conflicting, failed, uncertain and successful. Also record actor switch, route teardown, unsaved input, delayed response, locale/theme changes, keyboard/focus, boundary/network interruption and duplicate command cases.

Do not invent a transition to fill a template. Mark nonapplicable states with reason. Unknown or unsupported must never masquerade as success.

## 4. Actual verification record

Required fields:

- Task and implemented scope; prior and new source identities.
- Backend SHA, frontend SHA, working-tree fingerprints, locks, schema/dialect/registry hashes and migration revision.
- Exact commands, exit statuses, start/end source comparison, environment and owned service/database identities.
- Passed/failed/skipped/xfail counts with test names for mandatory scenarios; skipped is not verified.
- Diagnostic/warning counts and exact approved exception references; no generic “clean” when exceptions apply.
- HTTP/browser/worker/provider evidence and safe receipt identifiers; synthetic/mocked/live classification.
- Manual accessibility/product signoff actually performed, or explicitly pending.
- Failure/interruption/rollback or forward-repair outcome, remaining risks, support instructions and peer handoff.

Do not include tokens, secrets, raw private payloads, prompts, attachments or user personal data. Evidence should be useful without being sensitive. An unavailable sink or missing report must be visible.

## 5. Change record

Use the repository's existing `docs/changes/TASK-ID.md` and change-journal structure. Include goal, before/after behavior, interface/data compatibility, actual verification and affected task relationships. Existing historical records remain historical. A follow-up to a DONE task has its own traceable scope; do not rewrite the past verification to cover new code.
