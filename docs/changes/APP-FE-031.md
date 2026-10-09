# APP-FE-031 — Searchable role permissions

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (bounded frontend slice or reused local tooling; parent acceptance incomplete).

## Reuse and behavior

Paged authorized permission-name choices retain absent selections, group rows and fence actor changes; draft changes still require existing save confirmation.

Exact changed/reused files, endpoint/schema provenance, compatibility, configurable limits and task-specific remaining scope are recorded in [the end-of-backlog matrix](../delivery/END-OF-BACKLOG.md). Existing auth, runtime forms, list-first CRUD, authoring lifecycle, timeline, private reports and browser harnesses remain the base. No new API, dependency, migration, shared data, paid provider call, commit or deployment was introduced. Backend source was read only; paired database/storage/cache resources were uniquely owned and removed.

## Verification and evidence

Focused command logs are retained under `/tmp/end-*.log`; expanded isolated Firefox workspace/records journeys and boundary regressions passed. Generated transport remains APP-BE-001 (314 operations / 425 schemas). The fresh real HTTP pair migrated/seeded disposable services and failed schema comparison before browser execution: `artifacts/paired-smoke/manifest.json` records failure, exact canonical contract hashes and changed path/schema names. Old browser artifacts do not prove this failed run integrated.

The authoritative local final evidence is the subsequent complete `mise run check`, all command logs and `artifacts/check/manifest.json`, requiring zero diagnostics and identical starting/ending source hashes. `artifacts/delivery/status.json` separately reconciles current source identity, remaining task statuses and failed paired smoke. A local full gate does not close this parent's actual acceptance. Axe incomplete items and missing manual/Chromium/hardware/service evidence are not suppressed or claimed passed.

Intermediate formatter/lint/template/test fixture failures and contract drift remain in `/tmp/end-*.log`; corrections preserve thresholds and assertions. The publication unit harness explicitly waits for initialized DRAFT state before testing confirmation guards.

## Remaining work and peer handoff

All remaining reference arrays, memberships/client restriction/lifecycle/outsider and least-privilege real-backend acceptance remain incomplete.

The exact common handoff and boundary operation instructions are in [END-OF-BACKLOG.md](../delivery/END-OF-BACKLOG.md). Status remains BLOCKED; IMPLEMENTED does not mean complete, integrated, demo-ready, deployed or user-accepted. Graph refresh uses AST-only `graphify update .`.
