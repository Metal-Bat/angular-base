# Shared selects, calendar display and public theme continuation

Date: 2026-10-17. Owners: APP-FE-004, APP-FE-007.UX02 and APP-FE-014.UX01; read-only form presentation remains with APP-FE-016. This is a scoped repair record, not closure of the master or its parent features.

## Reproduced defects

The native Firefox audit continued across English, Persian and Arabic before repairs. Nested selects appended to a positioned popover received document coordinates from PrimeNG's installed overlay implementation. The Persian filter menu started beyond the right edge of a 1440px viewport; the calendar-system menu had the same offset. Their prior tests checked visibility and selection, without proving proximity to the trigger. Language and theme controls also touched because their wrapper used `display: contents` instead of owning a gap. Theme had no browser cache and reset on actor cleanup. Several timestamp displays and typed read-only form values bypassed calendar-aware formatting.

Before/after measurements and screenshots are under `artifacts/locale-overlay-repair/`. The initial audit's `document.fonts.check()` result is not evidence that Yekan Bakh loaded: no face was registered and no Yekan Bakh asset exists. The font check can succeed when an undeclared family falls back.

## Repairs

Shared single/multiple selects now mount consistently to the document body, with PrimeNG owning positioning, collision handling, nested overlay click handling and scroll dismissal. Removed the unused custom-parent input seam and references. Calendar and filter popovers retain their own behavior; selection must keep the parent open. New pointer tests measure dropdown proximity, then choose a condition/calendar and verify actual canonical results on phone and desktop in all three languages.

The preferences row owns a 0.75rem gap and wraps its controls. The public theme survives logout and login-page reload using one bounded localStorage key, `workspace.public-theme`, containing only `<palette>-<mode>` for the seven existing palettes and light/dark/system. Server preferences still override it after authentication, and explicit appearance reset still uses server defaults. Language, timezone, identity, tokens, drafts and private data are not cached. Storage failures do not break theme switching. Browser journeys enforce the exact allowlist rather than requiring globally empty storage; negative policy tests reject additional keys, private fields and malformed values. Unused legacy theme reset/toggle methods were removed; existing named selection and mode controls remain.

Calendar defaults follow language: English Gregorian, Persian Jalali, Arabic civil Hijri. Switching language clears the previous language's session calendar override. Existing conversion, canonical API values, timezone and DST handling remain. A shared presentation pipe formats timestamps in account sessions, calendar reminders, work reminders, execution paths, history, approvals, notifications, readiness and support. Typed read-only form dates use UTC civil-date presentation; instants use the user's timezone. Arbitrary strings and canonical answers remain unchanged. Localized formatting remains in lazy presentation code, preserving the unchanged production initial-bundle budget.

## Acceptance and evidence

The running backend on port 8000 was used through the real frontend session boundary, with the existing demo designer account configuration. The native browser created only its own form and workflow drafts. Pointer form reordering retained the current preview answer and preserved the data schema. The exact new order persisted and reopened after an actual reload response; the runtime preview also rendered after reload. Pointer canvas movement persisted and reopened positions while preserving graph semantics and registered version pins. All three languages exercised date-picker and mini-calendar selection, correct default calendar, anchored filter choice and an actual accepted notEqual search. Theme was saved by the real backend and retained on the login screen after logout/reload. Owned draft roots were deleted afterward; the demo appearance was restored and language returned to English. No seeds, shared resets, published versions or active case pins were changed.

`artifacts/locale-overlay-repair/live-interactions-final/findings.json` records the actual service results, browser version, source start/end identity and empty application diagnostics. Earlier audit/test failures remain retained, including incorrect test assumptions about mobile Day view, an already-open desktop details element and a no-op English language choice producing no PATCH. They are not hidden or promoted to successful evidence.

The full unchanged-source `mise run check` and focused Chromium/Firefox/WebKit results belong to `artifacts/locale-overlay-repair/completion.json` when present. That receipt owns final counts and check status; historical receipts remain independent. A build warning found during development was repaired through shared locale logic reuse and lazy presentation formatting, without increasing budgets or suppressing diagnostics.

## Remaining font dependency

Yekan Bakh is named in the Persian font stack but its licensed font files are absent from the repository and the searched local font/project/download locations. IranYekan and YekanNumbers are different families and were not substituted or renamed. Existing font preparation is ready for `public/fonts/yekan-bakh/YekanBakh-Variable.woff2` or the documented regular/bold WOFF2 pair. Actual Yekan Bakh rendering remains BLOCKED on supplying those assets; fallback screenshots do not satisfy font acceptance. The user's complete request remains partial until the font can be installed and checked. Deployment, human design approval and manual assistive-technology acceptance are separate.

## Existing calendar regression selector follow-up

The preliminary full gate completed the Chromium sweep and found one existing test that searched for options inside the calendar popover DOM subtree. The entire calendar test passed in Chromium, Firefox and WebKit when its three option selectors addressed the document-body portal. The preliminary run was stopped after that sweep and retained under `artifacts/locale-overlay-repair/full-check-before-portal/`, with its partial browser report and failed assertion. Only those three selectors were corrected; canonical date, invalid-input, Escape, focus, popup ownership and short-viewport assertions remain. The corrected source requires a fresh complete full gate, plus the actual WebKit calendar regression. The final receipt never promotes the interrupted preliminary run to completion.

## User-selected open-source font — 2026-10-18

The user explicitly selected Vazirmatn instead of Yekan Bakh. Official v33.003
variable WOFF2 and its SIL OFL 1.1 license are now bundled and served locally for
Persian and Arabic. Preparation rejects missing/invalid assets; English retains
its existing stack. The earlier missing Yekan Bakh dependency is superseded.
[Ordered acceptance](APP-FE-038-ORDERED-FOLLOW-UP.md) records browser font loading,
regular/bold weights, overlay typography and the final full-check receipt.
