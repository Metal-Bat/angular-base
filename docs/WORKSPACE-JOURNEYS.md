# Requester and reviewer workspace — Steps 22–23

Sign in with an actor having `requests.start`, then open Operations. Server permissions, eligibility, candidate visibility and field policy remain authoritative for every read and command.

| Route                                | Behavior                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `/operations/catalog`                | Paged eligible request types; one deliberate draft creation per click       |
| `/operations/requests`               | Paged authorized request list                                               |
| `/operations/requests/:ref`          | Pinned draft edit/save, safe submit, current status and actual process link |
| `/operations/tasks`                  | Available, claimed, completed, watching, submitted and unread cartables     |
| `/operations/tasks/:ref?view=review` | Authorized named runtime view; claim/release/start and declared decisions   |
| `/operations/processes/:ref`         | Authorized process status, paged timeline, positions, steps and child links |

Each page distinguishes loading, empty and failed reads, with explicit retry. Components own their editor/page state and unregister actor cleanup when destroyed. Actor changes discard visible data and fence late replies. AI approval and unsupported task kinds show their separate classification and never receive human task controls; AI commands are Step 28.

Draft creation suppresses double clicks. A timeout/unknown outcome blocks another create until the actor reads the request list and explicitly reconciles; creation has no invented idempotency contract. Form/design pins remain unchanged across saves and reads. Draft submit validates required metadata, asks confirmation, flushes pending edits, validates the evaluated server values, then sends only a stable `submit_key` with the current reference. It does not send a second form body. Submitted requests immediately use their server status and stop offering draft commands.

Reviewer actions require current claimant ownership and a compatible editable runtime. Claim/release/start and complete/reject/return share revision-safe serialized commands with frozen payloads and stable keys. Decisions use exactly the server-declared kind, outcome, required scopes, comment requirement and validation mode. Writes include only currently writable values; explicit removal uses `delete_paths`. Prior correction data appears through the current authorized render fields. Server field validation remains authoritative.

Uncertain or conflicting commands retain edits and block further writes. Check current state rereads the authorized runtime and asks whether to retain edited writable fields; newly read-only values use the new server state. Leaving a dirty/uncertain editor asks confirmation; navigation while a command is in progress waits for completion. Data is held in memory rather than persistent browser draft storage.

## Local validation

`mise run check` runs formatting, generated API checks, types, lint, Angular tests, boundary tests and the production build. Browser checks require Firefox and loopback servers:

```sh
npm run build
npm run test:browser-workspace
npm run test:browser-auth
npm run test:browser-ui
```

The workspace check logs in through the real session boundary and runs catalog → draft → exact decimal edit → save-before-submit → tracking → inbox → claim → filtered edit/save → approve. It asserts command bodies and readonly policy through a disposable upstream fixture. Angular regressions separately cover rejected saves, actor changes, uncertain creation, return comments, option races and exact reject/return endpoints. The backend runtime patch is applied locally and regression tested; nothing is deployed. Steps 24–28 now include real backend Firefox acceptance, process timeline, private storage and report-worker integration. See [operations services](OPERATIONS-SERVICES.md) for repeatability and remaining hosted/staging gates.
