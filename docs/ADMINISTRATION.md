# Administration: Steps 34–35

`/administration` links only groups with permitted operations. The ten groups expose 101 operations declared in the platform OpenAPI. Generated controls cover target parameters, filters and writable values, with JSON inputs for nested configuration. Operation selection is permission-aware; the backend independently checks resource access and lifecycle. Clients/releases retain their existing studio-backed administration screens.

| Group                 | Principal authority                                                       | Scope                                                                                                           |
| --------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Users                 | `admin.users.manage`; role assignment requires `admin.permissions.manage` | Search/select, CRUD, history/report, restore, roles and administrator password reset                            |
| Roles and permissions | `admin.permissions.manage`                                                | Catalogs, creation/update/deletion and history/report                                                           |
| Work groups           | `admin.work_groups.manage`                                                | Catalog/select, membership add/deactivate/remove and history/report                                             |
| Integrations          | `integrations.manage`; selector uses `workflows.manage`                   | Configuration, verification, rotation/revocation and authoritative current grants                               |
| AI agents             | `workflows.manage`; execution budget reads use `requests.start`           | Draft/publish lifecycle, providers/connections/models/metadata/suggestions/choices and actual execution budgets |
| Background tasks      | `admin.tasks.manage`                                                      | Definitions/queues, schedules, executions, manual run, retry and revoke                                         |
| Processes             | `requests.start`; recover uses `processes.recover`                        | Current reads/timeline, pause/cancel/retry/compensate/resume/timeout/recover and scheduled actions              |
| Audit events          | `admin.permissions.manage`                                                | Read-only search/detail/report                                                                                  |
| Entity history        | `admin.history.read`                                                      | Backend-authorized history queries                                                                              |

## Commands and references

Choose an operation, supply its actual required fields, then Load for reads or Review command for mutations. Search/report pages retain server paging. Use current row stores its returned fields; choosing a detail/update/action operation carries matching current references and values forward. After a mutation, reread current state before another action. Deleted users remain readable to authorized administrators; restore uses the fresh soft-deleted reference.

Confirmation freezes the exact target/payload before sending. A task retry/revoke uses `task_id`, while execution detail uses `ref_id`. Queued/manual-run responses remain queued rather than being labelled completed. Schedule inputs expose the server's interval, crontab and clocked UTC timestamp contract; no separate timezone/overlap field is invented. Process controls require backend requester/superuser/recovery authority and valid state; unavailable lifecycle actions are recoverably rejected by the server. Event delivery and reviewer tool approval remain outside this console.

Stale or uncertain writes retain inputs without automatic retries. Invalid nested JSON blocks commands even if another field changes. Unsaved operation/navigation changes require confirmation. Accepted credential inputs clear; returned credential/token/password fields are recursively redacted. Actor change, logout, permission changes and component destruction clear all private state and fence pending responses. Password reset revokes the target's existing credentials. Accepted mutations refresh the current administrator's permissions. Request IDs support incident handoff without response/body logging.

This is a functional contract-driven administration interface. It uses generic labeled fields and structured results rather than bespoke visual editors for every nested provider, permission or scheduling setting. Server schemas and diagnostics remain authoritative.

## Verification

Nine added unit tests cover exact task IDs, frozen review payloads, actor changes during confirmation/in-flight requests, uncertain results, paging, credential redaction and operation-specific permissions. The complete frontend suite has 257 tests.

The Firefox synthetic administration journey verifies confirmation, transient passwords, redacted results, paging, carrying current references, queued task status, labels, permission revocation and empty browser storage. Separate actual HTTP checks cover 35 administrator/outsider assertions: eight permission-protected catalogs, user create/update/stale conflict/history, role assignment, password reset and session revocation, membership lifecycle, deletion and restore.

`npm run test:backend-admin` runs actual HTTP checks plus 17 existing PostgreSQL integration tests for membership, connection grants/rotation, restriction preservation, scheduler leadership/one-off occurrence, durable outbox/retry and process recovery. It requires a **fresh migrated disposable database** and cache, `DISPOSABLE_BACKEND=1`, `BACKEND_ROOT`, and the backend test environment. `BACKEND_PYTHON`/`BACKEND_PYTEST` override virtualenv executables. Scheduler tests run first; each module runs in a separate process because the existing shared async pool can retain connections from a previous event loop. Scheduler publication tests mock broker delivery; they do not prove a running Celery broker/worker.

See [quality evidence and remaining release gates](RELEASE-READINESS.md).
