# Optional expansion: Step 38

Step 38 contains three alternatives. On October 4, 2026, the project owner deferred offline drafts. Search/bulk commands and push/collaboration remain unselected and require new contracts; no optional runtime controls are exposed.

| Alternative                                    | Existing foundation                                                          | Contract decisions needed before implementation                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Rich search, archived queues and bulk commands | Server-paged search/filter/sort contracts and individual revisioned commands | Which resources/fields, full-text semantics, archive eligibility, per-item authorization, idempotency, partial outcomes and audit           |
| Push updates and collaboration                 | Bounded polling, independent workspace revisions and explicit promotion      | Authenticated SSE/WebSocket transport, sequence/replay/reconnect, conflict policy, presence privacy and missed-event recovery               |
| Offline drafts                                 | Actor-owned memory, unsaved-change guards and canonical revision checks      | Eligible data/scopes, opt-in storage/encryption, lifetime/shared devices, actor switch/logout, stale revision recovery and product approval |

The current API has no agreed bulk or collaboration transport contract. A privileged process-event delivery endpoint is not a collaboration stream. Filtering one loaded page is not global search. Offline recovery, execution and submission remain outside the current delivery scope.

After selecting an alternative, add its agreed API/data-policy acceptance cases to the backlog and implement backend guarantees before exposing controls. The current request to continue the numbered plan establishes intent to revisit this step, but does not resolve which alternative or its policies.
