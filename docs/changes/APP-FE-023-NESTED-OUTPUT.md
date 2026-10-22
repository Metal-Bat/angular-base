# APP-FE-023 — Visual nested prior-output mapping and repaired execution

Date: 2026-10-19. Continuation of APP-FE-023 / APP-BE-019; no whole-parent closure.

## Outcome and reuse

The existing visual data mapper can choose authorized nested prior-output fields
and indexed collection members. It retains the exact pinned root output-port
schema in source_schema, stores the escaped JSON Pointer in source_path and checks
the projected type against the destination. Save/reopen restores the selection;
unavailable/non-dominating outputs remain excluded. Existing constants, LIST
ordering, control edges and graph history are reused.

The sibling backend's existing ProcessService._step_output now applies its already
validated source_path through the existing pointer resolver. Whole-port bindings
keep their behavior. Missing fields fail instead of supplying the whole object;
false, null and decimal strings stay exact. No route, DTO, entity, migration,
published payload, approval rule or process pin changes. The backend record is
APP-BE-019.UX01. The backend change was applied with explicit filesystem approval.
Deploy the matching runtime before offering nested mapping from this frontend.

Child workflow input mappings retain their separate whole-output contract; only
the ordinary graph mapper opts into nested output suggestions. No target_path,
private sample API, implicit composition engine or general retrieval API is added.

## Evidence and limits

Four of five backend regressions reproduced the original bug; after repair all
five passed. Initial formatting/type findings were test-only except for a strict
truthiness diagnostic; explicit bool preserves the intended empty-pointer root
semantics. No diagnostics were suppressed. Focused mapper/interface/subprocess
checks passed 21 tests. Initial new-test setup omitted required completion
cardinality and was corrected; max-line lint findings were resolved by extracting
the focused test and one domain collection predicate.

The actual owned Firefox workflow journey passed 37 scenarios, including selecting
this field through the mapper, saving the WIP, validating, promoting/publishing,
executing a nested object→string→integer chain and retaining a previous process
pin. Whole-object substitution would fail that integer conversion. That first run
is source-qualified intermediate evidence; subsequent domain helper extraction
requires final-source qualification rather than relabeling it.

Final source-qualified service reruns and complete frontend/backend gates belong
to `artifacts/user-timezone/completion.json`. Missing/partial evidence is incomplete;
D07's exact backend policy remains distinct from frontend zero diagnostics. Manual,
live-provider, deployed and user acceptance are not inferred from these tests.

## Remaining first-group contracts

See [APP-FE-023-PEER-HANDOFF](APP-FE-023-PEER-HANDOFF.md). REQUEST schema reconstruction,
legacy Transform v1, cross-source assembly, authorized samples, Agent metadata/
choice/retrieval/test contracts, Calendar team selection and reserved notification
operation targets are not closed by this resolver repair.

The final serial supported service batch passed workflow 37, Calendar 7, analytics
6 and settings/foundations 40 (90 total), with unchanged functional hashes inside
each profile and exact producer agreement. A later Calendar-only fold-offset repair
requires final-source service qualification; these results are retained rather
than silently assigned to a newer source. Complete backend gates retain a missing
configured Swagger executable and an unrelated strict subprocess startup timeout;
only actual later complete results may supersede those failures.
