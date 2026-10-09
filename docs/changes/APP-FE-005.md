# APP-FE-005 — Exact peer contract and transport verification

Date: 2026-10-08. Status: DONE. Verification: VERIFIED_LOCAL.

## Summary and scope

Exact producer en/fa hashes consumed; all English paths and 425 schemas equal the existing reproducible generated source. Real HTTP Firefox journey covers login/bootstrap/runtime/rows/submit/claim/save/complete with no browser or structured service diagnostics. New C02–C13 producer adapters remain incremental domain tasks; not invented or exposed.

## Reuse and changes

docs/reference/app-be-001/*; scripts/check-peer-contract.mjs; scripts/paired-smoke.py; server/browser-backend.spec.mjs; ADAPTER-CONTRACTS.md. Existing legacy IDs remain intact. Current base frontend commit is `afe4bbe5f566c80e7eb45f6ef9f12c041d60139d`; producer base is `995829eebd9483ac6b589c1648fc799c650ad464`. Existing user-supplied untracked delivery documents were preserved and formatted; both frontend backlog copies are synchronized.

Contracts/scenarios: C01/C11/C14 existing baseline; A12/A14/A15/A22/A24. No dependency or schema migration changes. Owned smoke data is temporary; no shared/production data, active pins or published payloads are reset. No push, deploy or paid calls.

## Verification evidence

The final working-tree gate is `DELIVERY_BACKEND_ROOT=/home/erfan/Project/python/fast-api-sample mise run check`. Inspect `artifacts/check/manifest.json` for exact source tree identity, lock/OpenAPI hashes, installed Node/npm/browser versions, start/end, per-command native exit codes, diagnostic counts and unit totals. Per-command logs are retained under artifacts/check. This record is valid only with a final manifest exit 0 and zero diagnostic counts; a failing run prevents completion and must be repaired.

Focused parent/envelope regressions passed. `mise exec -- npm run ci:gates` rejected warning, translation, template, lint, assertion and production-build defects; final negative log is `/tmp/app-fe-wave3/final-negative-gates.log`. Browser quality reports under artifacts label fixture-only checks. `artifacts/paired-smoke/manifest.json` and browser.json record the actual requester/reviewer HTTP smoke (request count is recorded in browser.json), service severity evidence and owned-service cleanup.

Initial failures and limitations are retained in [gate notes](../delivery/GATES.md): formatting, intermediate lint, original cold-build timeout, shared-UI theme timeout, administration danger contrast failure/repair, cached-cache startup mismatch and the repaired service SQL text false positive. No automatic retry or suppressed diagnostic qualifies as readiness.

## Limits and handoff

Local verification and the specific real HTTP journey are distinct evidence levels. Chromium, manual assistive technology/device acceptance, workers/live providers, deployment and user acceptance are not claimed. Future producer APIs remain with APP-FE-006–032 and their backend owners. Peer source was read only; the exact consumed APP-BE-001 contract copies are frontend-owned.

Graph refresh: `graphify update .` follows final source changes; no API rebuild cost. The old backlog links the authoritative delivery supplement instead of duplicating APP task bodies.
