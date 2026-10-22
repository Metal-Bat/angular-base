# APP-FE-029 — Declared reviewer actions

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (bounded frontend slice or reused local tooling; parent acceptance incomplete).

## Reuse and behavior

Busy/conflict and required-comment action controls; existing correction identity and AI approval separation retained.

Exact changed/reused files, endpoint/schema provenance, compatibility, configurable limits and task-specific remaining scope are recorded in [the end-of-backlog matrix](../delivery/END-OF-BACKLOG.md). Existing auth, runtime forms, list-first CRUD, authoring lifecycle, timeline, private reports and browser harnesses remain the base. No new API, dependency, migration, shared data, paid provider call, commit or deployment was introduced. Backend source was read only; paired database/storage/cache resources were uniquely owned and removed.

## Verification and evidence

Focused command logs are retained under `/tmp/end-*.log`; expanded isolated Firefox workspace/records journeys and boundary regressions passed. Generated transport remains APP-BE-001 (314 operations / 425 schemas). The fresh real HTTP pair migrated/seeded disposable services and failed schema comparison before browser execution: `artifacts/paired-smoke/manifest.json` records failure, exact canonical contract hashes and changed path/schema names. Old browser artifacts do not prove this failed run integrated.

The authoritative local final evidence is the subsequent complete `mise run check`, all command logs and `artifacts/check/manifest.json`, requiring zero diagnostics and identical starting/ending source hashes. `artifacts/delivery/status.json` separately reconciles current source identity, remaining task statuses and failed paired smoke. A local full gate does not close this parent's actual acceptance. Axe incomplete items and missing manual/Chromium/hardware/service evidence are not suppressed or claimed passed.

Intermediate formatter/lint/template/test fixture failures and contract drift remain in `/tmp/end-*.log`; corrections preserve thresholds and assertions. The publication unit harness explicitly waits for initialized DRAFT state before testing confirmation guards.

## Remaining work and peer handoff

Full scoped correction/forwarding UX, real competing claim/correction/resubmission and protected approval evidence remain incomplete.

The exact common handoff and boundary operation instructions are in [END-OF-BACKLOG.md](../delivery/END-OF-BACKLOG.md). Status remains BLOCKED; IMPLEMENTED does not mean complete, integrated, demo-ready, deployed or user-accepted. Graph refresh uses AST-only `graphify update .`.

## Independent continuation — 2026-10-10

APP-FE-029.1 extends the existing implementation. Scope, exact files, current contracts, verification and remaining acceptance are recorded in [APP-FE-026–030 acceptance](../delivery/APP-FE-026-030-ACCEPTANCE.md). Parent remains BLOCKED / IMPLEMENTED; original evidence above remains historical.

## Filter refresh continuation — 2026-10-18

The native Firefox chooser race, owner refresh repair, complete failed collection run and final scoped verification receipt are recorded in [the editor flow audit](APP-FE-016-EDITOR-FLOW-AUDIT.md). Automatic request/task refresh now waits while filter editing is open; existing explicit loading fences and unchanged payload contracts remain. This continuation does not close parent acceptance.

## In-flight task context repair — 2026-10-18

[Ordered follow-up](APP-FE-038-ORDERED-FOLLOW-UP.md) records task-context and view
lifetime fencing for delayed comment/forward replies. A previous task's result
cannot clear a new task's pending state or navigate away after its view closes.
Actor fencing, deliberate confirmation and operation replay behavior are retained.

## Reviewer correction acceptance — 2026-10-19

The [ordered execution record](APP-FE-038-ORDERED-EXECUTION.md) owns the new
evidence, not a duplicate task. Declared Return now has authorized named-field
feedback controls and required-comment validation; the adapter preserves exact
scope/item-key/message values. Unfinished feedback participates in navigation,
polling and actor/context cleanup. Save-before-Resolve retains the expanded
feedback panel. Missing/denied tasks never poll an empty reference.

The guarded owned-service reviewer run passed six scenarios, including concurrent
claims (one winner), actual correction/resubmission, a committed lost reply,
read-only reconciliation, immutable original data, hidden-field retention and one
stored decision per task. Its exact intermediate source and failed earlier runs
remain in `artifacts/ordered-execution/reviewer-services-supported/` and the
ordered execution evidence. The full final gate and broader parent acceptance
remain separate; no protected-provider or human/deployment acceptance is inferred.

### Literal scalar and row corrections

The [literal-scope continuation](APP-FE-016-LITERAL-SCOPES.md) extends the current named-feedback owner and actual-service journey to literal schema-key names, row reorder and exact prior/current values. It preserves stable identities, private data and immutable submissions; parent readiness is unchanged.

## Linked correction navigation — 2026-10-19

[APP-FE-029.UX03 linked correction navigation](APP-FE-029-LINKED-CORRECTIONS.md)
extends existing feedback with localized current row identity, purposeful field
navigation across pages, raw-input preservation and authorized read-only focus.
It reuses current refs, collection identities, page rendering and command owners;
its final scoped receipt governs verification. Parent status is unchanged.
