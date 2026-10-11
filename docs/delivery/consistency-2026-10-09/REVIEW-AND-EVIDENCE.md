# Consistency review and evidence boundaries

Date: 2026-10-09. Backend `9999641f8e37077829ebbe7159a6cd794fb94b91`; frontend `95f88dce6f1a48da87294929041378c174e6b39c`. Both heads were re-read through GitHub and are unchanged since the preceding review. No newer application implementation is inferred.

## Verdict

Preserve the current architecture and implementations. The requested product scope is represented in the combined APP/assistant/consistency registers, but a full current-pair usable demonstration is not verified. Further consistency gaps exist. This package makes them concrete and testable rather than claiming universal correctness.

## Further findings

| Finding                                                                                          | Class and consequence                                                                                          | Owner                           |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| BaseDTO misses computed field names and nested model inheritance                                 | Confirmed guard weakness; isolated synthetic reproduction. No live violating route claimed.                    | CONS-BE-002 / R03               |
| Generic CRUD skill forbids existing self-profile/preferences PATCH                               | Confirmed instruction conflict; a literal agent could break current clients by changing methods.               | CONS-BE-001 / R02               |
| Backend default system appearance differs from UI Reset appearance light                         | Confirmed meaning mismatch, separate from neutral actor-cleanup reset.                                         | APP-FE-008 / R07                |
| Persisted density and other settings are not all applied in inspected preference path            | Source/coverage gap; complete actual UI effects rather than another settings service.                          | APP-FE-008 / R07                |
| Entity/comment and DTO field documentation vary materially                                       | Source metadata inconsistency; no data-corruption claim. Effective schemas must be checked after enrichment.   | CONS-BE-003/004 / R04           |
| Schedule response inherits create validation; condition/time coverage is incomplete at DTO level | Design/validation review target, not a reproduced scheduling exploit. Trace downstream behavior before fixing. | CONS-BE-005 / R06               |
| Backend gate has no matching final source fingerprint check                                      | Source-level evidence-integrity gap; not a claim that a past recorded run changed unnoticed.                   | APP-BE-002 / R05                |
| Studio directly imports a presentation control from Administration                               | Confirmed coupling; may be deliberate reuse, but needs a clear shared boundary rather than duplication.        | APP-FE-003 / CONS-FE-004 / R14  |
| Seeder uses form provenance and incomplete existing graph comparison                             | Source-level convergence gap; does not imply published immutability is broken.                                 | APP-BE-005/028 / R17            |
| Active instructions/handoffs still mix migration/exception decisions                             | Confirmed documentation drift across recorded files. Current DB-002/D07 must remain explicit.                  | CONS-BE-001 / CONS-FE-001 / R02 |

## Retained significant product gaps

Current-pair contract handoff; saved-view/favorite consumer; persisted help acknowledgement; live readiness and measured worker/scheduler probes; unified inbox/support frontend; production calendar/analytics adapters; remaining normal JSON-free form/workflow/integration editors; approval-protected external operations; restore UI; full private-transfer, hosted/browser/manual and rich demo evidence. See R01 and R08–R20. Existing components and backend services are reuse targets, not absent by default.

The previous frontend CI observation was a cancelled run after earlier passing stages, not a full success. This review has not attested a new passing CI run. The historical 53-path/121-schema mismatch likewise must be replaced by a fresh exact-pair comparison before closure, not treated as a freshly recomputed number.

## What was checked now

- Current main refs through the GitHub connector.
- BaseEntity, BaseDTO, preference entity and typed DTOs, self profile/preferences routes, support DTOs, scheduler DTO family, presenter/envelopes and localized Swagger enrichment.
- Existing CRUD and Swagger skills, backend backlog/migration records, frontend theme/reset/profile and cross-feature inspector code.
- Previous pinned review and implementation handoff files, preserving all original and previously proposed IDs.
- An isolated transcription probe on Python 3.13.5 / Pydantic 2.13.5: normal camelCase rejected; computed camelCase and nested non-BaseDTO output accepted by the copied guard. Package-root verification files show exact output and limitations.

## What was not checked here

The source review is risk-directed, not a manual examination of every line. This runtime cannot resolve github.com for a local clone; mise and graphify are unavailable, SQLModel is not installed, and Python/Node do not match the repository toolchains. No repository test suite, pinned uv/npm install, full lock resolution, live OpenAPI generation, application browser/Swagger rendering, migrations, worker/provider calls, deployment, restore or user acceptance ran here. No remote source/backlog changes, issues, approvals or pushes were made. Repository-recorded approvals and test results are identified as such, not newly executed or independently authenticated decisions.

## How confidence increases

1. Adopt one authoritative rule/field/exception map without altering working protocols.
2. Freeze the current producer and consume it in the peer.
3. Reproduce concrete defects on the pinned environment and add regressions before repairs.
4. Finish existing feature deltas and exact paired journeys.
5. Run unchanged-tree mise gates and actual service/browser/manual acceptance with sanitized evidence.

Only then can the relevant scope be described as verified or demo-ready. No finite source review proves the absence of all future defects; the intended safeguard is complete scope traceability plus executable regression evidence.
