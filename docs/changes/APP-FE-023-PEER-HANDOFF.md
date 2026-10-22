# First remaining capability group — current producer handoff

Date: 2026-10-19. Existing APP owners; no duplicate implementation tickets or parent
completion. Reconciled against the actual sibling backend source and its generated
producer contracts, not historical availability prose. Current pair/evidence hashes
belong to `artifacts/user-timezone/completion.json`.

## Repaired existing contract

APP-FE-023 / APP-BE-019.UX01: nested STEP_OUTPUT source_path execution and visual
selection are implemented. Exact final acceptance is in
[the owning record](APP-FE-023-NESTED-OUTPUT.md). Earlier handoffs describing the
resolver as returning the entire port remain historical for their recorded source.

## Backend contracts still requiring an owning producer design and freeze

| Existing owner              | Remaining delta                                               | Required producer outcome                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APP-FE-024 / APP-BE-019     | REQUEST source schema disappears on executable reconstruction | A trusted durable source survives save, validation, promotion, publication and reload. Preserve deployed immutable pins; current workspace-only metadata is insufficient.                                                 |
| APP-FE-024 / APP-BE-019     | Legacy Transform v1 input-schema conflict                     | Registry and configured input validation must accept the same schema. Do not rewrite published v1 handlers or active versions.                                                                                            |
| APP-FE-023 / APP-BE-019     | Cross-source object assembly                                  | Decide a versioned composition contract with typed destination fields, conflict/order/null rules and server execution. GraphBinding has no target-field path today; single-source Transform projection remains available. |
| APP-FE-023 / APP-BE-019     | Authorized examples/samples                                   | Provide an explicitly authorized, redacted and bounded projection with schema/version context; private execution snapshots are not an authoring sample API.                                                               |
| APP-FE-025/030 / APP-BE-019 | Saved connection name                                         | Return a safe display name through existing use-authorized model metadata, with stale/revoked/denied tests; do not elevate workflow authors to integration administrators or scan arbitrary selector pages.               |
| APP-FE-025/030              | Workflow-bound choice validation                              | Supply an authorized exact workflow/version/input-shape projection, distinguishing empty/invalid/valid samples. Standalone permitted input names do not prove runtime shape.                                              |
| APP-FE-025/030              | Retrieval catalog and non-executing preview                   | Freeze the supported source kinds/parameters, persisted plan, authorization, version pins and bounds. A public report DTO does not grant permission to use it as an AI source.                                            |
| APP-FE-025/030              | Standalone provider test                                      | Approve exact inputs, lifecycle, human approval, budget/unknown-use rules and safe result projection through the existing execution owner. No live/paid call or arbitrary execution endpoint is implied.                  |
| APP-FE-014 / APP-BE-016     | Membership-aware Calendar team picker                         | Provide paged current active memberships and current group refs to ordinary actors. Administrator group enumeration cannot substitute. Existing group checks on writes remain authoritative.                              |
| APP-FE-012 / APP-BE-014     | MAP-07/08 operation targets                                   | Freeze the authorized destination/recipient and current-resource resolver. FutureTarget still has route_key null; do not fabricate an operation URL or business command.                                                  |

These are contract/design dependencies, not absent frontend scaffolds. The existing
four precise Agent handoffs remain in AGENT-EDITOR-CAPABILITIES.md and the detailed
REQUEST/Transform findings remain in APP-FE-024-PEER-HANDOFF.md. Proposed contracts
must be implemented/tested and frozen before adding their frontend consumers.

## User timezone request

The persisted user profile/workspace timezone now governs Calendar, new timed
appointments and Dashboard. The selector remains only in profile settings.
[Scope and schedule compatibility](APP-FE-008-TIMEZONE.md) are separate from the
missing Calendar membership contract; no new user preference field is required.
