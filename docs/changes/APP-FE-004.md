# APP-FE-004 — PrimeNG-first policy and pattern showcase

Date: 2026-10-08. Status: DONE. Verification: VERIFIED_LOCAL.

## Summary and scope

Reuse existing public semantic tokens and thin wrappers; repair the measured outlined danger-button contrast through public light/dark tokens. Showcase adds shared selector validation/keyboard behavior with forwarded required semantics, disabled input and empty table; native/Material/Foblex exceptions have concrete purposes. No framework or paid library replacement.

## Reuse and changes

docs/UI-LIBRARIES.md; screen-patterns.md; ui-showcase; fa/ar catalog additions; browser-ui fixture. Existing legacy IDs remain intact. Current base frontend commit is `afe4bbe5f566c80e7eb45f6ef9f12c041d60139d`; producer base is `995829eebd9483ac6b589c1648fc799c650ad464`. Existing user-supplied untracked delivery documents were preserved and formatted; both frontend backlog copies are synchronized.

Contracts/scenarios: A23/A24. No dependency or schema migration changes. Owned smoke data is temporary; no shared/production data, active pins or published payloads are reset. No push, deploy or paid calls.

## Verification evidence

The final working-tree gate is `DELIVERY_BACKEND_ROOT=/home/erfan/Project/python/fast-api-sample mise run check`. Inspect `artifacts/check/manifest.json` for exact source tree identity, lock/OpenAPI hashes, installed Node/npm/browser versions, start/end, per-command native exit codes, diagnostic counts and unit totals. Per-command logs are retained under artifacts/check. This record is valid only with a final manifest exit 0 and zero diagnostic counts; a failing run prevents completion and must be repaired.

Focused parent/envelope regressions passed. `mise exec -- npm run ci:gates` rejected warning, translation, template, lint, assertion and production-build defects; final negative log is `/tmp/app-fe-wave3/final-negative-gates.log`. Browser quality reports under artifacts label fixture-only checks. `artifacts/paired-smoke/manifest.json` and browser.json record the actual requester/reviewer HTTP smoke (request count is recorded in browser.json), service severity evidence and owned-service cleanup.

Initial failures and limitations are retained in [gate notes](../delivery/GATES.md): formatting, intermediate lint, original cold-build timeout, shared-UI theme timeout, administration danger contrast failure/repair, cached-cache startup mismatch and the repaired service SQL text false positive. No automatic retry or suppressed diagnostic qualifies as readiness.

## Limits and handoff

Local verification and the specific real HTTP journey are distinct evidence levels. Chromium, manual assistive technology/device acceptance, workers/live providers, deployment and user acceptance are not claimed. Future producer APIs remain with APP-FE-006–032 and their backend owners. Peer source was read only; the exact consumed APP-BE-001 contract copies are frontend-owned.

Graph refresh: `graphify update .` follows final source changes; no API rebuild cost. The old backlog links the authoritative delivery supplement instead of duplicating APP task bodies.
