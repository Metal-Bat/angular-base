# APP-FE-037 — Failed paired contract rehearsal

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (bounded frontend slice or reused local tooling; parent acceptance incomplete).

## Reuse and behavior

Run owned real PostgreSQL/cache/storage/API migration/seed; capture exact paths/components hashes and safe drift metadata before browser execution.

Exact changed/reused files, endpoint/schema provenance, compatibility, configurable limits and task-specific remaining scope are recorded in [the end-of-backlog matrix](../delivery/END-OF-BACKLOG.md). Existing auth, runtime forms, list-first CRUD, authoring lifecycle, timeline, private reports and browser harnesses remain the base. No new API, dependency, migration, shared data, paid provider call, commit or deployment was introduced. Backend source was read only; paired database/storage/cache resources were uniquely owned and removed.

## Verification and evidence

Focused command logs are retained under `/tmp/end-*.log`; expanded isolated Firefox workspace/records journeys and boundary regressions passed. Generated transport remains APP-BE-001 (314 operations / 425 schemas). The fresh real HTTP pair migrated/seeded disposable services and failed schema comparison before browser execution: `artifacts/paired-smoke/manifest.json` records failure, exact canonical contract hashes and changed path/schema names. Old browser artifacts do not prove this failed run integrated.

The authoritative local final evidence is the subsequent complete `mise run check`, all command logs and `artifacts/check/manifest.json`, requiring zero diagnostics and identical starting/ending source hashes. `artifacts/delivery/status.json` separately reconciles current source identity, remaining task statuses and failed paired smoke. A local full gate does not close this parent's actual acceptance. Axe incomplete items and missing manual/Chromium/hardware/service evidence are not suppressed or claimed passed.

Intermediate formatter/lint/template/test fixture failures and contract drift remain in `/tmp/end-*.log`; corrections preserve thresholds and assertions. The publication unit harness explicitly waits for initialized DRAFT state before testing confirmation guards.

## Remaining work and peer handoff

Fresh run failed on 53 paths/121 schemas. Full service/persona/fault and guarded reset-twice demo cannot proceed until C13/C14 and peer prerequisites are reconciled.

The exact common handoff and boundary operation instructions are in [END-OF-BACKLOG.md](../delivery/END-OF-BACKLOG.md). Status remains BLOCKED; IMPLEMENTED does not mean complete, integrated, demo-ready, deployed or user-accepted. Graph refresh uses AST-only `graphify update .`.

## 2026-10-09 extension — Actual worker/SSE/Firefox paired profile

Extended the existing implementation for the backend's implemented unified inbox and live stream. Exact contracts, reused/changed ownership, stream limits, actual paired command, source identity, focused/final evidence, retained failures and remaining acceptance are recorded in [NOTIFICATION-PUSH-ACCEPTANCE.md](../delivery/NOTIFICATION-PUSH-ACCEPTANCE.md). Historical results above remain unchanged. Parent status remains BLOCKED / IMPLEMENTED until its broader required acceptance passes.

## 2026-10-11 continuation — APP-FE-037.1

Extended the existing implementation through the independently scoped behavior in [the five-slice continuation record](../delivery/APP-FE-036-038-CONTINUATION.md). That record names changed/reused files, actual contract provenance, focused tests, retained failures and remaining criteria with owners. Parent acceptance remains BLOCKED / IMPLEMENTED; no historical result is replaced. Full final gate and repeated paired results are appended there from observed execution.

Observed closure: the finalized-source actual pair passed 16 browser scenarios with exact HTTP contract and unchanged peer/runtime identities; the full gate passed all twelve stages with zero diagnostics, 559 Angular tests and ten Firefox scopes. Final exact-current-tree evidence after documentation closure lives in `artifacts/check/manifest.json` and `artifacts/app-fe-036-038/final-check/`. The linked continuation record preserves initial failures, scoped claims and precise remaining owners. Parent status remains unchanged.

## Owned locale snapshot continuation — 2026-10-11

Existing paired infrastructure now captures required ignored compiled en/fa gettext artifacts with explicit start/end hashes. This repairs a discovered temporary-runtime omission without changing backend source or weakening producer comparison. Actual receipt/recovery rehearsal failures, reruns and remaining parent acceptance are retained in [receipt continuation](../delivery/APP-FE-026-028-RECEIPTS.md). Parent remains open.

Current source-qualified evidence is in the [receipt/layout continuation](../delivery/APP-FE-026-028-RECEIPTS.md): successful strict 20-case backend rehearsal and two guarded resets, plus ten actual layout browser scenarios. Scope limits, failed earlier runs and current final gate remain explicit; parent acceptance is not changed.

Observed complete frontend gate: 12 stages, 579 tests / 119 files and ten Firefox scopes passed with zero emitted warnings/required skips. The [continuation record](../delivery/APP-FE-026-028-RECEIPTS.md) retains its exact source hashes, preclosure manifest and final post-documentation gate location. Parent scope limitations remain unchanged.
