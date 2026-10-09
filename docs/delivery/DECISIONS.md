# Delivery decisions

## Decisions, defaults and scope boundaries

User-confirmed scope: application bootstrap/permissions; calendar/chart services; persisted profile/theme/preferences; no deleted objects in ordinary lists; complete relevant API UI coverage; Angular/code/PrimeNG review; rich linked workflow authoring; setup checklist; shared pickers; dependency repair; saved views/favorites; notification map; demo harness/default restoration; small multilingual help with seen state; recorded supportable failures; strict warning-free checks. These are user requirements, not invented prior approvals of technical choices below.

| ID                                | Choice and proposed default                                                                                                                                                                                                    | Why it matters / blocked work                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 — **owner decision required** | Keep applied consolidated migration b13a0c7d2e44 immutable; allow new additive revisions on one linear chain. Alternative: retain one-file mandate only with a separately designed/versioned upgrade mechanism.                | Existing DB-001 explicitly mandates one revision. New tables cannot silently edit it. APP-BE-003 is CONFLICT until approved; persistence implementation and its dependent integration gates wait.         |
| D02 — integration and AI          | First connected-system demo uses a clearly labeled separate HTTP sandbox with an actual durable receipt and deterministic AI fixtures. Select a named vendor sandbox and approved live AI agent/data/cost cap for live claims. | Allows useful genuine network/worker demonstration without inventing vendor access. Named-vendor/live-AI acceptance remains blocked until access and evidence exist; no hidden automatic purchases/calls. |
| D03 — calendar                    | Preserve implemented Gregorian canonical wire dates and deliver English/Farsi UI. Jalali input/conversion is a separate explicitly approved extension, not automatically implied by Farsi.                                     | Current backend rejects persian calendar. Do not offer a nonfunctional UI toggle or silently change date interpretation.                                                                                  |
| D04 — execution authority         | Least-change demo retains existing publisher-bound execution identity with a dedicated non-superuser demo publisher and tested fail-closed offboarding. A service-principal redesign requires explicit approval.               | Do not silently elevate or change active-case pins. APP-BE-022 documents the exact pilot policy; only a new authority model is blocked on further decision.                                               |
| D05 — browser/performance         | Use the provisional C14 desktop/mobile, Chromium/Firefox, en/fa/light/dark profile; identify actual test device and agree performance budgets before pass/fail certification.                                                  | Implementation/measurement can proceed; supported-device/performance/user acceptance cannot be invented. No untested “works on all browsers” claim.                                                       |
| D06 — session/deployment          | Retain same-origin server-held tokens. A single-process, restart-signout demo is the minimal existing topology; multiple replicas require a protected shared session design and separate validation.                           | No automatic browser-token-store switch, new auth architecture or unverified HA claim. Production topology is not established by this plan.                                                               |

No assumption is made about tenants, staffing, deadlines, compliance, production scale or recovery commitments. Do not treat clients/work groups as a tenant model. New business approvals, quorum, self-approval restrictions, monetary units or holiday policies need explicit domain requirements.

Later-release candidates, **not silently added to this initial scope**: external calendar sync/invitations/recurrence/holiday engine; Jalali conversion; team-shared views; multi-user collaborative canvas/offline drafts; general bulk commands; arbitrary connector marketplace; BPMN interoperability; enterprise SSO/tenancy; new HA session store. A current existing API cannot be excluded under this list just to avoid finishing its legitimate UI.

## User-requirement traceability

| Requirement                                      | Backend producer                  | Frontend consumer                 | Acceptance          |
| ------------------------------------------------ | --------------------------------- | --------------------------------- | ------------------- |
| Seed data and permissions                        | APP-BE-004/005                    | APP-FE-001/011/031/037            | A01/A02             |
| No deleted records in ordinary lists             | APP-BE-006                        | APP-FE-006/007/009/031            | A02/A05/A09         |
| Profile/themes/preferences                       | APP-BE-007                        | APP-FE-008                        | A03                 |
| Reusable resource pickers                        | APP-BE-008                        | APP-FE-006                        | A02/A11             |
| Saved views and favorites                        | APP-BE-009                        | APP-FE-009                        | A03/A05             |
| Small multilingual help + seen table/list        | APP-BE-010                        | APP-FE-010                        | A03/A04             |
| Setup/readiness checklist                        | APP-BE-011                        | APP-FE-011                        | A06                 |
| Dependency readiness/repair                      | APP-BE-012/019                    | APP-FE-011/021/027                | A06/A11/A12         |
| Notification map, inbox and deep links           | APP-BE-013/014                    | APP-FE-012                        | A07                 |
| Recorded supportable failures                    | APP-BE-015                        | APP-FE-013/032                    | A20                 |
| Calendar + reminders                             | APP-BE-016/017                    | APP-FE-014                        | A08                 |
| Charts/analytics                                 | APP-BE-018                        | APP-FE-015                        | A09                 |
| All relevant API/UI support; no normal JSON      | APP-BE-019/020 + owning contracts | APP-FE-001/005/007/016–033        | A10/A11/A14/A15/A24 |
| Code review and Angular best practice            | APP-BE-030                        | APP-FE-003                        | A22/A23/A24         |
| PrimeNG-first design audit/adoption              | APP-BE-019 metadata only          | APP-FE-004/007 and domain editors | A23                 |
| Rich linked workflow canvas                      | APP-BE-019/021/022/024/026        | APP-FE-020–027                    | A11/A12/A16/A17/A18 |
| Required approval and useful integrations        | APP-BE-021–025/028                | APP-FE-022/025/026/028–030        | A16/A17/A18/A26     |
| Safe return-to-default workflows                 | APP-BE-026                        | APP-FE-027                        | A13                 |
| Demonstration harness + environment reset        | APP-BE-005/028/029                | APP-FE-037                        | A25/A26             |
| Zero-warning mise run check and actual readiness | APP-BE-002/031/032                | APP-FE-002/034–038                | A24/A26             |
| Private attachments, reports, sessions, recovery | APP-BE-024/027/028/032            | APP-FE-028/029/032/036/037        | A19/A21/A22         |
