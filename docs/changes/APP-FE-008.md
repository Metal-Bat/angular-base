# APP-FE-008 — Actor-scoped session appearance preparation

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice only).

## Implemented and reused

Added grouped, labeled PrimeNG theme/language controls on the existing profile screen, with supported named palettes, light/dark/system mode and appearance reset. The UI explicitly says changes apply to this session. ColorScheme observes system changes only in system mode and releases its media listener. Theme and locale return to application defaults on actor reset; late static locale reads cannot apply the previous actor's selection. Existing account/security navigation remains available.

Reused core/auth/profile, ColorScheme, Locale, ActorState, ControlField and SelectControl. Added profile-appearance.ts and tests. No personal settings are put in persistent browser storage.

## Verification

Focused specs cover cancellation/revocation, actor cleanup, immutable edits, redacted collection presentation, missing/null/false/zero, system-mode lifecycle and applied-query repair as relevant to this task. Browser records, Studio catalogs and administration scenarios exercise existing CRUD and picker interaction; profile appearance is checked in the auth reload journey. Browser fixtures never contact the user's backend.

Final local verification is `mise run check`; evidence is `artifacts/check/manifest.json` and per-command logs. A valid run requires exit 0, zero diagnostic counts and identical starting/ending source hashes. This validates implemented local slices only. Required new-contract real API/browser acceptance is not claimed. Focused run logs are under `/tmp/app-fe-wave4/`.

No dependency, database migration, seed, production/shared-data, deployment or paid-call changes. Peer code was read only. `graphify update .` refreshes the graph after final source changes.

## Remaining work and exact blocker

APP-BE-007 is IN_PROGRESS / NOT_RUN in the read-only peer checkout. Actual /me/preferences and /me/profile implementation files exist, but neither route appears in the current frozen delivery OpenAPI or contract index, and no APP-BE-007 handoff/change record exists. Therefore no speculative endpoint is exposed or called. Server settings/bootstrap application, density/timezone/workspace defaults, profile/avatar editing, optimistic conflict recovery and actual-backend two-user cross-session persistence remain blocked on the frozen verified C02 handoff. Session appearance is not persisted preference delivery.

The task remains BLOCKED until its entire acceptance criteria and required integration evidence pass. This record is not permission to mark the parent DONE based on fixture/local quality.

## Current-contract implementation continuation — 2026-10-09

The earlier missing-producer statements above are historical. The current implemented backend was compared before intake: 374 operations / 550 schemas, backend revision `9999641f8e37077829ebbe7159a6cd794fb94b91`, frontend base revision `95f88dce6f1a48da87294929041378c174e6b39c`. See [the contract intake](../reference/app-fe-015/contract-intake.json). The generated client, main source and localized producer files now share this intake while preserving previous evidence.

C02: Existing self-service PATCH profile/preferences contracts are preserved. Typed profile and private avatar controls, server-owned density/timezone/numbering/workspace/page-size/email settings and serialized partial preference groups extend working authentication. Default landing destinations require current permission.

Focused unit evidence: `/tmp/frontend-015-unit8.log` records 470 passing tests across 90 files. Production build `/tmp/frontend-015-build7.log` passed without warnings under the unchanged initial budget. These focused results do not replace the final gate.

Actual second-account, persisted appearance/settings, private avatar and unsaved-conflict acceptance remain required. Parent completion is not claimed. Actual paired run manifests, including failed attempts, are retained in `artifacts/paired-foundations/`; current-source manifests and final local gate are recorded separately below.

The peer checkout is read-only. Only the existing guarded disposable harness migrates/seeds owned test databases and removes its own services. No shared reset, migration/source/dependency/mise/environment file change, external provider call or deployment is performed by this continuation.

### Additional current-contract repairs

Real-service testing exposed two repaired defects: the existing binary upload returns a Blob response, which must be decoded before reading its reference; avatar attachment/removal also advances the backend preference revision. Avatar mutations now coordinate with preference saves and reload the current preference reference, retaining unsaved profile names. Focused actor cleanup and login-default tests cover stale callbacks and logout during preference lookup.

Focused suite `/tmp/frontend-015-unit20.log`: 477 tests in 92 files passed. Production build `/tmp/frontend-015-build27.log` passed the unchanged budget with zero warnings. These remain focused evidence; full final verification and expanded paired acceptance are recorded separately. Failed/partial runs are retained.

## Current acceptance evidence and remaining scope

See [the acceptance continuation](../delivery/APP-FE-006-015-ACCEPTANCE.md) for exact revisions, actual browser scenarios, retained failures and full gate location, and [the owner-specific remaining matrix](../delivery/APP-FE-006-015-PEER-HANDOFF.md). Actual scoped acceptance does not mark this incomplete parent DONE.

## Ordered task continuation: profile recovery

Reused ProfileSettings, Preferences, ProfileEditor, WorkspaceSettings and the existing private binary/session boundary. Local validation now matches the actual profile contract's 255 Unicode code-point limit, with linked field errors for names, timezone and page size. Unknown/stale profile writes require an authoritative read before retry; independent workspace/name drafts survive other-group writes and reads. A successful older write cannot overwrite a newer name draft. Avatar updates keep their existing preference-revision coordination.

Regression evidence is retained: `/tmp/ordered-008-regression-before.log` exposed four validation/retry failures; `/tmp/ordered-008-draft-regression-before.log` exposed a late-response overwrite. Seven new component tests pass after repair. `/tmp/ordered-008-unit.log` records 496 passing tests in 96 files; `/tmp/ordered-008-lint2.log` and `/tmp/ordered-008-build.log` pass without warnings. Intermediate lint failures remain in `/tmp/ordered-008-lint.log` and `/tmp/ordered-008-lint-fix.log`; no threshold was changed. Actual paired recovery and the complete final gate are pending.

The paired journey adds actual invalid-input/non-persistence checks and competing-client profile/preference mutations using the implemented self-service PATCH compatibility contracts. It checks retained independent drafts, blocked stale retry and authoritative recovery. These are real competing-client requests, not a claim of two independent browser windows.

## Ordered APP-FE-008 actual acceptance

`/tmp/ordered-008-paired2.log` passed 36 actual browser scenarios, including linked name/workspace validation without invalid persistence, genuine competing-client profile and preference updates, blocked stale retry, authoritative recovery preserving independent drafts, account/logout-login persistence and private avatar upload/download/removal. Frontend/backend revisions remain `95f88dce6f1a48da87294929041378c174e6b39c` / `9999641f8e37077829ebbe7159a6cd794fb94b91`. Frontend production source start/end SHA-256: `b6a98a7dae387294d059cbccf94040f9bcb679d6480e80686cd4167426177561` / `b6a98a7dae387294d059cbccf94040f9bcb679d6480e80686cd4167426177561`. Actual HTTP contract digest: `7757e54756a096fd69f708733ee3fb1c16a49ef732f427c81b7a2fdebf444b8c`. Complete manifests retain service/browser diagnostic evidence.

The failed `/tmp/ordered-008-paired1.log` is retained: a test read preceded the completed preference PATCH. The helper now yields after dispatch and awaits saved status before checking authoritative persistence; no product assertion or deadline was weakened. This is competing-client HTTP acceptance, not two separate browser windows or manual screen-reader/user acceptance. The complete final local gate is separate.

## Ordered completion gate

`/tmp/ordered-008-final-check2.log` and `/tmp/ordered-008-final-manifest.json`: all 12 commands exited 0 with zero diagnostics; 496 tests in 96 files passed, all ten Firefox scopes passed with zero detected axe violations, and the unchanged initial bundle was 497642 bytes. Source start/end SHA-256: `bb8220e72e9e5b7b80a4dac84fa5f935cb5b9e7b65525800db2f6969a9cc1d58`. The first gate stopped at formatting the handoff table; `/tmp/ordered-008-final-check.log` and `/tmp/ordered-008-final-failed-manifest.json` retain that failure. The table was formatted and the entire gate repeated. Graph refresh passed in `/tmp/ordered-008-graph.log`.

APP-FE-008 is DONE / VERIFIED_INTEGRATED at its account/settings scope. No manual screen-reader, backend final gate, vendor execution, deployment or user acceptance is claimed. The actual producer and required scoped browser behavior satisfy the dependency at this scope without relabeling the backend ticket.

## CURRENT authoring acceptance regression — 2026-10-10

The APP-FE-016–020 real-browser journey exposed a preference reload on same-account permission refresh. The existing Preferences effect now depends on computed session status rather than the whole permission snapshot; actor reset, status/profile/revision changes retain existing cleanup/reload behavior. This prevents a background read from overwriting current language writes. No working authentication or profile feature was replaced. Regression: `preferences.spec.ts`, 11 preference/inspector tests passed (`/tmp/five-locale-tests.log`). Full final and actual paired results are recorded in [APP-FE-016–020 acceptance](../delivery/APP-FE-016-020-ACCEPTANCE.md). Historical APP-FE-008 evidence/status remains intact.
