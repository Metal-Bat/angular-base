# Revision-safe commands — Step 17

`MutationQueues` owns one shared coordinator per stable request/task identity. Consumers use that coordinator for save, row, attachment and decision commands rather than creating separate queues. References remain opaque; each successful response supplies the reference used by the next command.

A logical command retains a deeply immutable JSON payload. Replayable commands receive one command key, reused only for that exact intent. Changed payloads create a new command and key. Commands belong to their originating coordinator. Non-replayable commands cannot be sent twice.

The queue serializes local work and pauses on conflicts or uncertain outcomes. It retains edits and the original command key. Reconciliation requires an authorized current-state read and an explicit user decision; no network error or 409 causes automatic mutation retry. Reconciliation fences old queued work. Actor cleanup closes every coordinator, aborts pending requests and ignores late responses.

`ApiFailure.conflictKind` accepts only revision, lifecycle, idempotency or unknown. The matching backend now supplies the safe category under the existing error envelope's `data.conflict_kind`, with no DTO schema or operation-ID change. Legacy code 1004 alone is unknown because it conflates conflict causes. The incremental [backend patch](reference/backend-command-conflicts.patch) is applied locally and checksummed by the platform manifest; it is not deployed.

Pure race tests cover serialization and returned refs, all conflict categories, changed intent, immutable payloads, uncertain non-idempotent execution, replay identity, competing claimants and actor cleanup. Product requester/reviewer flows will consume these coordinators in Steps 22–23; their real-server journeys remain separate integration gates.
