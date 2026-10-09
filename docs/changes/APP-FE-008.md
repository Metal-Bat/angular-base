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
