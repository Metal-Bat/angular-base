# Disposable browser diagnostics

Run `mise run browser-sandbox` to build a temporary development bundle and run the existing isolated browser quality journeys. Each journey uses a disposable browser profile and synthetic loopback HTTP fixtures. No backend credentials, shared database or environment reset is needed. Firefox is the default; install it before running. Set `BROWSER_ENGINE=chromium` and `BROWSER_BINARY` to use an installed Chromium binary.

For a focused investigation, use:

```sh
mise exec -- pnpm run test:browser-sandbox --scope temporal
```

Available scopes: `boundary`, `auth`, `ui`, `foundations`, `workspace`, `canvas`, `studio-catalogs`, `records`, `temporal`, `admin`, `runtime`; Chromium also includes `https`. Omitting the scope runs the complete batch, stopping on the first failure. The complete `mise run check` always requires every normal scope and rejects sandbox scope/probe overrides.

Each run creates a fresh directory under `artifacts/browser-sandbox/`. Open its `index.html` to see scope status, the last step, diagnostic hints and links to evidence. The directory retains build/journey logs, per-scope logs, JSON reports, a run summary and native-browser PNG screenshots. Screenshots capture the actual fixture page before its profile/server is removed. A missing screenshot makes the sandbox fail and is reported honestly; it never replaces the original test assertion. Temporary application builds and browser profiles are removed after the run. Reports stay local and ignored by Git.

Reports include console warning/error categories, bounded Angular/Foblex codes, script locations when available, runtime errors, unhandled rejections, rejected HTTP paths/statuses and completed accessibility results even if a later step fails or times out. They exclude console arguments, exception payloads, response bodies, query strings, credentials and headers. Screenshots/logs show synthetic fixture UI; this command does not attach to production or a live backend. Source maps in the development build help relate generated script locations to source; report locations are not automatically a root-cause diagnosis.

For example, `NG0956` adds a hint to review `@for` tracking keys. A rejected HTTP request can be an intentional authentication/validation scenario; inspect its status alongside the failed step instead of treating every 4xx as a product defect. Axe violations fail the test; incomplete/manual-review findings remain separate evidence. Passing these scenarios does not demonstrate untested features, real-service integration, deployment or user acceptance.

To verify that warning capture fails honestly, run:

```sh
mise exec -- pnpm run test:browser-sandbox --scope auth --probe warning
```

This deliberately injects a fixture-only `NG0956` console warning. It must exit nonzero and retain its diagnostic report, hint and screenshot. It is a diagnostic self-check, not an application failure or an accepted warning exception. Normal runs never inject it. The existing browser assertion and overall deadlines are unchanged.
