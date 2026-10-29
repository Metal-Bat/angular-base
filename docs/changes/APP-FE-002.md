# APP-FE-002 — Strict gate and browser diagnostics

Date: 2026-10-08. Status: DONE. Verification: VERIFIED_LOCAL.

## Summary and scope

All baseline checks retained; native lint warning ceiling, diagnostic capture, inventory/translation drift and actual opted-in paired smoke added. Six negative probes rejected their intended defects. No blanket suppression or automatic retry.

## Reuse and changes

The existing CI Chrome setup precedes the project gate and supplies its binary; browser quality runs within that gate, preserving coverage without a duplicate workflow step. Remote CI remains unexecuted locally.

scripts/check-project.mjs; check-ci-gates.mjs; check-delivery-ui.mjs; angular.json; mise.toml; browser diagnostic fixtures. Existing legacy IDs remain intact. Current base frontend commit is `afe4bbe5f566c80e7eb45f6ef9f12c041d60139d`; producer base is `995829eebd9483ac6b589c1648fc799c650ad464`. Existing user-supplied untracked delivery documents were preserved and formatted; both frontend backlog copies are synchronized.

Contracts/scenarios: C14 / A24. No dependency or schema migration changes. Owned smoke data is temporary; no shared/production data, active pins or published payloads are reset. No push, deploy or paid calls.

## Verification evidence

The final working-tree gate is `DELIVERY_BACKEND_ROOT=/home/erfan/Project/python/fast-api-sample mise run check`. Inspect `artifacts/check/manifest.json` for exact source tree identity, lock/OpenAPI hashes, installed Node/npm/browser versions, start/end, per-command native exit codes, diagnostic counts and unit totals. Per-command logs are retained under artifacts/check. This record is valid only with a final manifest exit 0 and zero diagnostic counts; a failing run prevents completion and must be repaired.

Focused parent/envelope regressions passed. `mise exec -- npm run ci:gates` rejected warning, translation, template, lint, assertion and production-build defects; final negative log is `/tmp/app-fe-wave3/final-negative-gates.log`. Browser quality reports under artifacts label fixture-only checks. `artifacts/paired-smoke/manifest.json` and browser.json record the actual requester/reviewer HTTP smoke (request count is recorded in browser.json), service severity evidence and owned-service cleanup.

Initial failures and limitations are retained in [gate notes](../delivery/GATES.md): formatting, intermediate lint, original cold-build timeout, shared-UI theme timeout, administration danger contrast failure/repair, cached-cache startup mismatch and the repaired service SQL text false positive. No automatic retry or suppressed diagnostic qualifies as readiness.

## Limits and handoff

Local verification and the specific real HTTP journey are distinct evidence levels. Chromium, manual assistive technology/device acceptance, workers/live providers, deployment and user acceptance are not claimed. Future producer APIs remain with APP-FE-006–032 and their backend owners. Peer source was read only; the exact consumed APP-BE-001 contract copies are frontend-owned.

Graph refresh: `graphify update .` follows final source changes; no API rebuild cost. The old backlog links the authoritative delivery supplement instead of duplicating APP task bodies.

## 2026-10-24 — Current dependency review and release-tool security patch

[The existing-owner continuation](APP-FE-002-DEPENDENCIES.md) refreshes the pnpm
audit for the current lockfile and patches the existing release-tool Undici
override. Its current-source receipt owns scoped verification; historical gates,
parent statuses and hosted/manual/deployment requirements remain separate.

## 2026-10-12 — Boundary fixture asset routing regression

The reported pre-push Firefox failure returned 401 at the missing-CSRF assertion. This means the boundary had no recognized session before CSRF validation. The boundary fixture forwarded anonymous asset requests, including `/favicon.ico`, into session handling, which returns 401 with a clearing session cookie. A delayed anonymous asset response can therefore erase a newly issued login cookie. Eight standalone runs of the original browser scenario passed; the timing of the reported failure was not independently reproduced.

The fixture now reserves session handling for `/session/` and `/api/`, serves HTTPS fixture assets through the existing static handler and returns 404 for missing assets. A browser regression explicitly requests the anonymous favicon before login; it fails against the original routing and passes after the repair. Login session/CSRF identity is checked before the unchanged missing-CSRF 403 assertion. Reports retain only route, status and cookie-presence booleans, never cookie/token values.

Focused Firefox checks passed, including three repeated repaired-fixture runs and the final scenario with its report at `/tmp/browser-boundary-fixed.json`. It records login 200, authenticated session status 200, missing-CSRF 403, authorized search 200, raw-token denial 404 and logout 200. The initial HTTPS verification attempt exposed the added Node fetch's inability to trust the disposable certificate; the regression now runs inside the browser instead, preserving the existing isolated TLS policy. Chromium is unavailable locally, so no repaired Chromium/HTTPS result is claimed.

The final full `mise run check` result, unchanged start/end source identities, command exits and diagnostic counts are recorded in `artifacts/check/manifest.json`, with complete stage logs under `artifacts/check/`. Only a completed exit-0 manifest with zero diagnostics establishes local verification for this repair. Existing unrelated contract-manifest working-tree changes are preserved. This is fixture verification, not real-service, deployment or user acceptance evidence.
