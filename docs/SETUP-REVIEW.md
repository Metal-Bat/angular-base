# Frontend setup and design review

Reviewed October 2, 2026. The installed frontend foundation builds and runs, but the product is still the Angular starter screen. It is not ready for product acceptance: the domain screens and API integration are not implemented, and release tooling has unresolved dependency advisories.

## PrimeNG, Material, and Tailwind integration

The official `tailwindcss-primeui` plugin is connected to Tailwind 4. Firefox verified a temporary fixture with real PrimeNG and Material buttons in both light and dark mode: semantic primary/contrast and surface utilities match Aura tokens, `rounded-border` resolves to the preset radius, utility padding overrides the layered PrimeNG button rule, and Material accepts utility margins. Toggling `.app-dark` changes both libraries' colors and Tailwind's dark variant together. There were no browser errors or license notices.

The fixture's source was restored after the check. The application build retains its starter screen and stays within the configured bundle budget. The integration contract and code examples are documented in [UI library choices](UI-LIBRARIES.md).

## Current key-free verification

The final stack uses Angular 21.2.25 and MIT-licensed PrimeNG 21.1.10. Clean `npm ci`, `npm ls --all`, formatting, API inventory, type checking, lint, both unit tests, and production build passed. The production bundle is 385.19 kB initial. Firefox checked the production build at 1440 × 900, 390 × 844, and 320 × 740: no license notice, console warnings/errors, failed requests, or horizontal overflow. Aura variables, PrimeIcons fonts, and Tailwind utilities loaded.

The scoped Piscina 5.3.2 override removes the critical build-worker findings. The production audit has zero findings; the October 3 full audit reports 24 high-severity development-tooling entries; see [current release triage](RELEASE-READINESS.md). Earlier browser results below remain historical records of the initial v22 setup.

## Verified tools and dependencies

All project-configured mise tools are installed and resolve correctly: Node 24.21.0, npm 12.2.0, rtk 0.47.0, graphifyy 0.9.53 and Husky 9.1.7. `npm ls --all` passes with no missing or invalid dependencies. Husky's local package remains available for npm's prepare lifecycle; Git uses `.husky/_` as its hooks path.

The commit-message hook was exercised without creating a commit: it accepted a valid conventional message and rejected an invalid message. The pre-push verification command was run directly. The staged-file hook was inspected but not exercised against the user's working changes.

## Issues fixed during this review

- Tailwind was installed but had no PostCSS configuration or CSS entry point. Added `.postcssrc.json`, `src/tailwind.css` and its global Angular build entry. Source discovery is scoped to `src`. The existing main container now uses the generated `w-full` utility; its appearance is preserved.
- PrimeIcons was installed but its stylesheet and fonts were not loaded. Added its stylesheet to Angular's global styles and verified the font loads in a real browser.
- Formatting checks included installed agent skill documents. Excluded `.agents/` and `.aider-desk/`, consistent with the existing `.codex/` exclusion. Local `.vscode/settings.json` is also excluded: its spelling dictionary changed during verification, and these personal editor updates should not fail application checks. Existing dictionary entries were preserved.
- `mise run check` previously omitted formatting, API inventory and TypeScript checks. It now runs those checks before lint, tests and production build.
- The starter component test now uses the application's actual providers and waits for zoneless rendering, so it exercises the configured router and PrimeNG provider instead of a separate minimal provider list.

Tailwind wiring follows [Angular's documented PostCSS integration](https://angular.dev/guide/tailwind). A separate CSS entry keeps Tailwind processing separate from the existing Material Sass theme.

## Verification results

| Check                                         | Result                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Tool versions and executable resolution       | Passed for all five project mise tools                                      |
| Full installed npm dependency tree            | Passed, no missing or invalid dependencies                                  |
| Formatting                                    | Passed after limiting the check to owned project files                      |
| API inventory                                 | Passed, 302 operations across 36 API areas                                  |
| TypeScript checking                           | Passed                                                                      |
| Angular lint                                  | Passed                                                                      |
| Angular unit tests with application providers | Both existing tests passed                                                  |
| Production build                              | Passed, 418.81 kB initial bundle versus the 500 kB warning budget           |
| Development server                            | Started on local port 4300; document and generated styles returned HTTP 200 |
| Husky commit-message behavior                 | Valid message accepted, invalid message rejected                            |
| Production-only npm audit                     | Zero vulnerabilities reported                                               |
| Full npm audit                                | Six high-severity entries in development/release tooling; unresolved        |

No new application dependency was needed for the style fixes. The temporary Playwright installation and browser downloads were kept under `/tmp/frontend-browser-review`, outside the project's dependency manifest and lockfile.

## Browser and visual review

Playwright Firefox 155 checked the rendered application at 1440 × 900, 390 × 844 and 320 × 740. All three viewport checks had no horizontal overflow, uncaught JavaScript errors, console errors or failed network requests. The heading rendered correctly, the first link was reachable with Tab, the generated Tailwind width utility applied, Aura theme variables were present and the PrimeIcons font loaded. Desktop and narrow-mobile screenshots were visually inspected.

These are smoke checks of the starter page, not a full accessibility or browser compatibility certification. Chromium could not be downloaded because its CDN returned a regional access restriction. Chromium, Safari/WebKit, VS Code's GUI debugger, assistive technology and the future domain journeys were not verified.

The earlier PrimeNG 22 browser run displayed **Invalid PrimeUI License** and logged **PrimeUI license is not configured**. The project subsequently selected MIT-licensed PrimeNG 21 and a compatible Angular 21 stack. Key configuration was removed; see [license notes](PRIMEUI-LICENSE.md). These earlier screenshots describe the historical v22 state.

## Design and architecture status

The current page is Angular's sample landing screen with links to Angular documentation. Its desktop layout and mobile wrapping work. It does not implement the requested Operations, Studio or Administration experience. The route table is empty; there is no login, API adapter, request/task workspace, form renderer, workflow canvas or administration screen to exercise.

PrimeNG's Aura provider and the existing Material theme are both present. They work for the tested starter, and both will remain supported. UI-01 aligns product design tokens, typography, per-feature component choices, theme behavior and accessibility; it does not remove either library. See [UI library choices](UI-LIBRARIES.md). Installing both libraries is not evidence that every possible component combination is styled correctly. No canvas library has been selected; STUDIO-04 intentionally evaluates it after the persistence requirements are understood.

The [implementation backlog](BACKLOG.md) remains the product plan. Its separate runtime form and editor models, pinned versions and backend authorization/mutation gates are appropriate boundaries for implementation. The backend review's F01–F03 findings are still reported backend findings; this frontend check did not reproduce or fix them. No backend service, worker, scheduler or object storage was connected during this review.

## Remaining dependency finding

The initial setup audit reported six high-severity entries rooted in `basic-ftp` through `get-uri`, `pac-proxy-agent`, `proxy-agent`, `release-it` and its conventional-changelog plugin. They are development/release-tool dependencies. The production-only audit is clear. The already configured Undici override remains patched.

The available basic-ftp fix is outside the parent's declared major-version range, so this review did not force an incompatible override or downgrade release tooling. Track an upstream compatible fix and recheck before using the release workflow. Details of the earlier upgrade decisions remain in [HISTORICAL-UPGRADE.md](HISTORICAL-UPGRADE.md).

## Repeating the local checks

Run `mise run check` to check formatting, inventory, types, lint, unit tests and build. Use `mise run dev` to start the application on the normal development port. `mise exec -- npm ls --all` checks the installed dependency tree; `mise exec -- npm audit --omit=dev` checks current production dependency advisories.

The Firefox exercise was a one-off review, not a committed E2E suite. QA-02 and QA-04 still need repeatable browser coverage as real product screens are added.

October 3 release checks supersede the initial audit counts: [release readiness](RELEASE-READINESS.md) records current reports and remaining deployment/browser gates.
