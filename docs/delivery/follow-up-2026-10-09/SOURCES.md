# Source and evidence register

Date: 2026-10-09. All project references below are repository paths at the exact inspected commits. Source descriptions distinguish source inspection from repository-reported verification. This review did not execute the application.

Backend repository: Metal-Bat/async-fast-api-base  
Commit: `9999641f8e37077829ebbe7159a6cd794fb94b91`  
Source URL pattern: `https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/<path>`

| Source                                                        | Supports                                                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| AGENTS.md; .mise.toml; pyproject.toml; uv.lock                | Repository rules, command wiring, version baseline; no new toolchain inferred.                                             |
| docs/delivery/BACKEND-BACKLOG.md                              | Current task ledger and declared completion scope.                                                                         |
| docs/changes/DB-002.md; docs/delivery/approved-decisions.json | Latest migration restructuring, explicit recorded approvals, two accepted SDK exceptions, latest reported gate scope.      |
| scripts/run_check.py                                          | Fifteen-stage gate, exact exceptions, default exclusion accounting, VERIFIED_WITH_EXCEPTION behavior.                      |
| scripts/bootstrap_application.py                              | Current system/install/demo CLI, environment guards, manifest ownership and transaction/asset boundaries.                  |
| src/apps/requests/application/demo.py; demo_templates.py      | Existing basic installation, graph shape, dependency resolution, version conflict policy and form-derived provenance hash. |
| docs/changes/APP-BE-005.md                                    | Reported existing accounts/groups/client/two templates/five cases/two private assets.                                      |
| src/utils/pagination.py; docs/delivery/live-query-matrix.md   | Shared live-only criteria before count/paging; historical lookup exception and scoped tests.                               |
| src/apps/health/setup.py                                      | Truthful read-only checks, hardcoded required unknown worker/scheduler execution.                                          |
| docs/delivery/through-020-handoff.md                          | Current support/calendar/reminder/runtime semantics; its old migration section is superseded by DB-002.                    |
| docs/delivery/wave-four/manifest.json                         | Export files, hashes, new schema head and then-uncommitted producer identity.                                              |
| docs/delivery/protected-effect-policy.md                      | Proposed sandbox operation mapping and approval policy, explicitly pending approval.                                       |
| docs/delivery/workflow-defaults.md                            | Preview/apply/layout reset semantics; old migration text is superseded by DB-002.                                          |
| docs/delivery/completion-verification.md                      | 21/32 tasks, eleven open, bounded earlier verification; precedes DB-002 final gate.                                        |
| src/apps/tasks/domain/dtos/schedules.py                       | Clocked one-off schema and limited update fields.                                                                          |
| src/apps/tasks/presentation/routes.py                         | Schedule creation and admin.tasks.manage boundary.                                                                         |
| src/apps/tasks/tasks.py                                       | Registered system.ping and existing worker/reminder/notification functions.                                                |
| src/apps tree and prior-to-current compare                    | Domain/change inventory; no durable private conversation subsystem identified in reviewed scope.                           |

Frontend repository: Metal-Bat/angular-base  
Commit: `95f88dce6f1a48da87294929041378c174e6b39c`  
Source URL pattern: `https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/<path>`

| Source                                                                          | Supports                                                                                                                                                                            |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AGENTS.md; docs/delivery/FRONTEND-BACKLOG.md                                    | Merged delivery rules, local versus integrated scope, unchanged original IDs.                                                                                                       |
| docs/delivery/END-OF-BACKLOG.md                                                 | Product blocked, incomplete 006–038, failed paired run, recorded 53/121 differences, transfer/verification limits.                                                                  |
| scripts/check-peer-contract.mjs                                                 | Checks copied baseline paths/schemas; selected wave-four metadata imports rather than current full client.                                                                          |
| scripts/check-project.mjs                                                       | Warning/diagnostic enforcement, source hash before/after; conditional paired smoke.                                                                                                 |
| docs/delivery/json-ui-register.md                                               | Fifty-six source matches needing contextual classification, not fifty-six proven bugs.                                                                                              |
| docs/delivery/NODE-INSPECTOR-COVERAGE.md                                        | Seventeen handler/version schemas, available scalar editors and remaining semantic authoring gaps.                                                                                  |
| src/app/core/auth/preferences.ts                                                | Actual preference GET/PATCH; theme/language application, revision and actor fencing.                                                                                                |
| src/app/features/help/presentation/help-page/help-page.ts                       | Current in-memory/session-only viewed and dismissed state.                                                                                                                          |
| src/app/features/calendar/presentation/foundation-preview/foundation-preview.ts | Development-only hardcoded calendar/readiness/metric fixture.                                                                                                                       |
| src/app/core/feedback/request-errors.ts; docs/changes/APP-FE-013.md             | Safe correlation UI; missing new incident intake/persistence/operator integration.                                                                                                  |
| docs/changes/APP-FE-009.md                                                      | Saved-list-view domain serialization without full persistence/favorites UI; stale producer blocker.                                                                                 |
| Current Actions run 37913345517 / job 113763493592; retrieved job logs          | Completed as cancelled in browser-quality; preceding unit/boundary/build stage successes, install diagnostics, and missing final paired/browser conclusion. See CI-OBSERVATIONS.md. |
| scripts/browser-quality-check.mjs                                               | Serial child scopes; no parent per-scope deadline/watchdog; success-only scope logging.                                                                                             |

## Official implementation guidance consulted

- mise task arguments: `https://mise.jdx.dev/tasks/task-arguments.html` — arguments are forwarded unchanged for task commands without a usage specification. The included alias follows that documented mode; runtime verification remains outstanding.
- Celery calling tasks: `https://docs.celeryq.dev/en/stable/userguide/calling.html` — long ETA/countdown tasks have worker/broker caveats; use the existing database scheduler for distant future jobs, not an in-memory sleep.
- Pydantic AI history: `https://pydantic.dev/docs/ai/core-concepts/message-history/` — continuing message history is supported conceptually; the implementation must verify APIs against the repository's locked 2.54.0 runtime.
- Pydantic AI deferred tools: `https://pydantic.dev/docs/ai/tools-toolsets/deferred-tools/` — deferred approvals/results support pause/resume patterns, but do not themselves replace application authorization, durable intent or required business approvals.

Current docs may describe a later SDK than the lockfile. No dependency upgrade or API compatibility claim follows from these references.
