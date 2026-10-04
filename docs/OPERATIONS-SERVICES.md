# Operations services — Steps 24–28

These steps are implemented and verified locally. They add ordinary-user process tracking, private transfers, account management, repeated rows, governed attachments, declared page navigation, operational services and advanced reviewer actions. The corresponding incremental backend changes are preserved in [backend-operations.patch](reference/backend-operations.patch). Apply it after the three earlier platform patches; the local backend checkout has the same changes. The generated platform contract has 309 operations and 417 schemas. Nothing here is a deployment or hosted-CI signoff.

## Screens and commands

| Entry                        | Behavior                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/operations/processes/:ref` | Actor-authorized status, positions, step path, child links and paged timeline; all nine process states are recognized.                                                                                                                    |
| `/account`                   | Search/detail/revoke owned sessions, logout all and change password.                                                                                                                                                                      |
| `/reset-password`            | Administrator-issued reset token and password; same-origin guest boundary, volatile inputs and generic failures. Forgotten-password recovery is administrator assisted because the backend does not provide a public email delivery flow. |
| Request/task detail          | Stable nested repeated rows, add/remove/duplicate/reorder, governed attachment transfer/link/replace/remove/reorder, declared pages and explicit presentation resume.                                                                     |
| `/operations/notifications`  | Owned paged notifications, detail, mark read and authorized request/process deep links.                                                                                                                                                   |
| `/operations/reports`        | Owned report states, private ready ZIP download, volatile archive password, history and confirmed delete. Pending details are polled until terminal.                                                                                      |
| `/operations/media`          | Authenticated generic upload and owned private download.                                                                                                                                                                                  |
| Request detail               | Authorized metadata history, draft cancellation and request report query.                                                                                                                                                                 |
| Human task detail            | Current/prior correction values, stable-row feedback resolution, comments, forwarding and personal read/pin/archive/watch.                                                                                                                |
| AI task detail               | Normal claim followed by dedicated approval metadata and explicit approve/deny. No human form or forwarding command is used.                                                                                                              |

Forwarding accepts opaque user/work-group references. The backend checks eligible principals; there is no invented public directory endpoint. Administrative cancel/expire remain separate from personal archive, require confirmation and are subject to the backend's actor/lifecycle checks. Hidden fields and policy decisions remain server owned.

## Private transfers and lifecycle

`BinaryTransfer` uses XHR progress events for uploads and downloads, cancels the underlying request on cancellation, actor loss or destruction, sanitizes filenames and revokes download object URLs. JSON-typed files remain bytes; denied JSON envelopes become API failures. The boundary accepts up to 11 MiB by default to accommodate the backend's 10 MiB file limit and multipart overhead; `BOUNDARY_MAX_BODY_BYTES` has a bounded override. No private storage URL, token, report password or canonical draft is persisted in browser storage.

Files are uploaded separately from the serialized JSON mutation queue. After upload, the client fences actor/resource identity and links the staged private upload through a governed command. Structural row and attachment commands flush pending edits first and reread authoritative state. Unknown non-idempotent outcomes require state reconciliation rather than blind replay.

Row controls track stable keys while binding the current concrete instance pointer. Nested row edits reconcile by keys, and deleted rows never fall back to the same numerical index. Feedback reads prior values only when the previous stable identity exists. Task saves project writable fields while preserving hidden canonical data on the server. The backend recalculates merged dependencies and still rejects forged derived values.

Declared page metadata is bounded and actor filtered. Next-page navigation checks that page's required fields; server completion validation remains authoritative across all pages. Read-only navigation and print show authorized data. The current page index is local component state; presentation resume explicitly renegotiates the authorized design while retaining backend canonical data and form-version pins.

Process/notification/report/queue polling runs only while visible and online, with cancellation, jitter and bounded backoff. Case polling pauses during edits, commands, transfers and blocked states; it never silently replaces dirty edits. History shows authorized metadata only. Request/process/notification “report” endpoints are paged query aliases in this backend; the interface does not claim they queue export jobs. Personal report download uses actual worker-generated owned artifacts.

## Verification and repeatability

The automated Firefox test uses real disposable ordinary accounts, a published workflow, PostgreSQL and the same-origin boundary. It verifies exact decimal strings, stable row duplication, declared page navigation, submission, WAITING timeline, reviewer claim, hidden-field exclusion, save and completion. Credentials are written to a mode-0600 temporary fixture and removed after verification. Run it only against a disposable backend:

```sh
# Backend: configure isolated database/cache/storage, migrate and start FastAPI.
# In that checkout, with its test environment and PYTHONPATH=src:.:
python scripts/seed_frontend_browser.py
# Frontend: backend defaults to loopback port 58800.
npm run build
npm run test:browser-backend
rm /tmp/frontend-steps-accounts.json
```

The opt-in backend `test_owned_report_worker.py` additionally requires a real reporting worker (`solo`, concurrency 1) and private object storage. It proves READY generation, owner download, outsider 404 and deletion. Its fixture creates a narrowly filtered report through the application service; ordinary users receive no administration permission. Existing HTTP journey tests cover stale writes, claim races, command replay, hidden-value preservation, unauthorized access and session rotation. Correction integration covers repeated return rounds, prior state and stable feedback.

Build and unit-test workers are capped at two; Vitest runs files sequentially. Disposable service resources and the reporting worker were also capped for these checks. Hosted CI, broader production browser/RTL coverage and staging deployment/rollback remain later gates.

Final local checks passed: formatting, generated API evidence, application types, lint (four template-complexity warnings), 226 frontend tests, 13 session-boundary checks and production build. Backend regressions passed with 660 tests and 117 environment-gated skips; six selected real integration cases passed together, and forwarding, password/session lifecycle and upload ownership checks passed independently. The older cross-service integration file shares an async database pool across separate event loops and fails when bundled; those targeted service checks were run in fresh processes. Backend Ruff, ty and pre-commit checks passed. Deliberately failing lint/test/build changes were rejected by the CI gate probes.
