# Sequence and provisional incremental effort

Date: 2026-10-09. These are planning estimates, not promised completion dates or measured agent throughput. They cover ONLY the new consistency tasks. Existing feature/assistant repairs stay in their original estimates and must not be double-counted.

| New workstream             | Focused person-days | Confidence    |
| -------------------------- | ------------------: | ------------- |
| Backend consistency tasks  |                9–19 | Low to medium |
| Frontend consistency tasks |                8–17 | Low to medium |
| Combined new work          |               17–36 | Low to medium |

Each range includes focused implementation, review, relevant tests and documentation. It excludes vendor/decision waiting, feature bodies already planned, production access and unknown baseline repairs. One person-day means one focused contributor-day, not a statement about an AI agent's elapsed runtime. Staff assignments and dates remain TBD. Do not mechanically divide by an arbitrary number of agents; shared contracts, migrations and review serialize some work.

## Recommended order

| Stage                          | Deliverable                                                                                                       | Work to start                                                          | Exit                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0 — adopt the map              | Correct file placement, one task/status authority and scoped rule exceptions                                      | CONS-BE-001; peer prepares CONS-FE-001 against an agreed source subset | No conflicting current instructions or invented API names                       |
| 1 — repair the boundary        | Current producer/client handshake, BaseDTO regressions, actual preference reset semantics and source-stable gates | R01/R03/R05/R07; CONS-BE-002; CONS-FE-002                              | Exact pair and canonical values known; concrete regression cases fail then pass |
| 2 — complete existing services | Saved views/help/readiness/inbox/support/calendar/metrics production integration                                  | R08–R13 through original APP IDs                                       | Ordinary user outcomes with actual backend and truthful state                   |
| 3 — author and run             | Nested editors, canonical form/canvas behavior, defaults and rich seeds; protected operation policy               | R15–R18; CONS-BE-004/005/006; CONS-FE-003/004/005                      | Reference workflow authorable and executable without JSON                       |
| 4 — assistant extension        | Private conversation, confirmed actions and owned time-based work                                                 | Existing proposed APP-BE-033–038 / APP-FE-039–043                      | Real self-task and scheduled summary after restart, with receipts               |
| 5 — scope acceptance           | Pair, browsers, runtime services, failure/reset/manual evidence                                                   | R19/R20 and original release tasks                                     | Scope-specific demo readiness; separate deployment/user signoff                 |

CONS-BE-003 metadata/backfill can run by touched domain in parallel; it must not become a weeks-long blocker before usable features. Choose each next task by risk and dependencies, not just numerical ID. Record actual cycle time for the first three completed tasks and re-estimate the remaining work.

## Per-task ranges

| Task        | Person-days | Predecessors                          |
| ----------- | ----------: | ------------------------------------- |
| CONS-BE-001 |         1–2 | None                                  |
| CONS-BE-002 |         1–2 | CONS-BE-001                           |
| CONS-BE-003 |         2–4 | CONS-BE-001                           |
| CONS-BE-004 |         2–4 | CONS-BE-001, CONS-BE-002              |
| CONS-BE-005 |         2–4 | CONS-BE-001, CONS-BE-002              |
| CONS-BE-006 |         1–3 | CONS-BE-001, CONS-BE-002              |
| CONS-FE-001 |         1–2 | CONS-BE-001                           |
| CONS-FE-002 |         2–4 | CONS-BE-001, CONS-BE-002, CONS-FE-001 |
| CONS-FE-003 |         2–4 | CONS-FE-001                           |
| CONS-FE-004 |         2–4 | CONS-FE-001, CONS-FE-002              |
| CONS-FE-005 |         1–3 | CONS-FE-001, CONS-FE-002, CONS-FE-003 |

No calendar dates are assigned. A new migration/authority policy is a decision dependency, not permission for an agent to implement an unsafe shortcut.
