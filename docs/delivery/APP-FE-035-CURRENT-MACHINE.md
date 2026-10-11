# APP-FE-035.1 — Current-machine performance measurements

Date: 2026-10-11. Evidence: MEASURED_LOCAL_FIXTURES. Parent: BLOCKED / IMPLEMENTED.

## Owner decision and scope

The user selected the current machine: **“Use this machine for measurements.”** Hardware selection is resolved for this measurement run. This does not approve D05 budgets, certify the provisional C14 browser/device matrix, or close APP-FE-035. Reuse APP-FE-035.1; no new implementation scope or task ID is created. Historical results remain unchanged.

Hardware: Intel Core i7-1250U, 12 logical CPUs available to the process, 15.32 GiB RAM (approximately 16 GB); Debian forky/sid x86_64, kernel 7.2.9+deb14-amd64, Node v24.21.0, Firefox 153.4.0esr headless. Starting available RAM was approximately 2.32 GiB and load averages were 2.96/1.76/0.92. Background load was uncontrolled; no deliberate CPU/network throttling. Cgroup limits were not exposed at the queried root, which is not evidence of an unlimited allocation. Requested browser window: 390×844; the actual CSS viewport was not measured. Each process used a fresh temporary profile; processes ran serially. The transport was the existing local HTTP fixture, with no real backend or shared data.

[Hardware profile](../../artifacts/app-fe-035-current-machine/hardware.json), [raw command results](../../artifacts/app-fe-035-current-machine/runs.json), and [aggregate with report/log hashes](../../artifacts/app-fe-035-current-machine/summary.json) retain actual conditions and samples. Reports contain timings, counts and accessibility metadata; no business values or DOM dumps are included in the performance reports.

## Exact source and contract identity

Frontend HEAD: `95f88dce6f1a48da87294929041378c174e6b39c`, with the existing uncommitted implementation retained. Full source SHA256 before/after the measurements: `f4d37f85f3877b3d069af6addbf154a851e5f7d99438148362403d8e147e2e43`, identical. English generated OpenAPI SHA256: `78c06495ea694face5563620c11f13e1c981d046fc276046a2601640fbcdd6c6`. No contract regeneration or expected-hash edits were needed. No backend participated in these measurements; this is not new paired evidence. Existing exact paired revisions/results stay in their original records. Current DB-002/D07 instructions were reconciled; accepted backend exceptions do not excuse frontend diagnostics.

## Actual form measurements

Three production-build Firefox runs, five mount/edit/navigate-away cycles per size per run: **45 cycles passed**, fifteen per size. Each mount observed one runtime view request; each teardown observed zero retained runtime DOM nodes, pending runtime view requests and subsequent runtime view requests in the bounded observation. Actual rounded quiet windows ranged from 249 to 272 ms around the existing 250 ms timer. Canonical exact strings and empty browser storage assertions passed.

| Fields | Mount median (ms) | Mount nearest-rank p95 (ms) | Edit median (ms) | Edit nearest-rank p95 (ms) | Mounted DOM nodes |
| ------ | ----------------- | --------------------------- | ---------------- | -------------------------- | ----------------- |
| 16     | 82                | 419                         | 33               | 36                         | 117               |
| 64     | 115               | 317                         | 33               | 36                         | 453               |
| 256    | 244               | 823                         | 33               | 34                         | 1803              |

The aggregate also separates first mount per size (three samples) from subsequent mounts (twelve samples). First mounts are not guaranteed cache-cold: code and requests may already be warm. Timings include existing polling and double-animation-frame synchronization. With fifteen samples, nearest-rank p95 equals the maximum; these are descriptive measurements, not stable population estimates or approved-budget pass/fail. There is no prior comparable baseline establishing a regression or a demonstrated hot path to repair.

Nine runtime axe audits had zero violations and zero incomplete findings. Firefox did not expose `performance.memory`; heap remains null. Zero retained DOM and a short request observation do not prove absence of heap, listener, subscription or timer leaks.

## Actual canvas measurements

Three existing development-build foundations-wrapper runs passed. The fixture uses read-only, **zero-edge** graphs; it does not measure mixed edges, dragging or backend loading. The 25-node graph is already present when sampled, so its 1 ms value is a readiness/read-only-guard baseline, not a fresh render. The 100/250-node measurements resize that canvas and wait for DOM/Foblex readiness, animation frames and the read-only guard.

| Nodes | Samples | Reported duration median (ms) | Maximum (ms) |
| ----- | ------- | ----------------------------- | ------------ |
| 25    | 3       | 1                             | 1            |
| 100   | 3       | 50                            | 67           |
| 250   | 3       | 83                            | 84           |

Canvas development results cannot be compared directly with production runtime timings. The wrapper also exercises existing English/Farsi, calendar and authoring behavior. Across its 27 axe audits there were zero violations; **twelve incomplete findings** remain manual-review evidence: notification detail (one), support reference (two), and Persian form builder (one), repeated in each run. They were retained, not suppressed or promoted to manual accessibility acceptance.

## Commands, failures and final gate

Each of the following commands ran three times with its own report path; exact start/end timestamps, exit codes and log hashes are in the aggregate:

- `PERFORMANCE_BROWSER_CHECKS=1 ACCESSIBILITY_CHECKS=1 BROWSER_REPORT_PATH=artifacts/app-fe-035-current-machine/runtime-N.json mise exec -- node server/browser-auth.spec.mjs`: all three exit 0. Logs `/tmp/app-fe-035-runtime-{1,2,3}.log`.
- `NG_BUILD_MAX_WORKERS=2 ACCESSIBILITY_CHECKS=1 BROWSER_REPORT_PATH=artifacts/app-fe-035-current-machine/canvas-development-N.json mise exec -- node server/browser-foundations.spec.mjs`: all three exit 0. Logs `/tmp/app-fe-035-canvas-development-{1,2,3}.log`.

The initial canvas invocation used `FOUNDATION_BROWSER_CHECKS=1` directly against the production build and exited 1 because `window.ng.getComponent` was unavailable. `/tmp/app-fe-035-canvas-1.log` and the aggregate retain this failure. It produced no accepted measurements. The correction reused the existing development wrapper; no assertions, deadlines, warning thresholds or application code changed. Successful measurement reports contain zero browser diagnostics; no required tests were skipped.

The full final command is `mise run check`, with output `/tmp/app-fe-035-final-check.log`. Its observed exit code, complete stage results, diagnostics, source identities and test counts are recorded in the owning [final-check manifest](../../artifacts/app-fe-035-current-machine/final-check/manifest.json); the owning folder preserves stage logs. [Verification outcome](../../artifacts/app-fe-035-current-machine/verification.json) records the final outcome separately from these fixture timings. A passing local gate establishes only VERIFIED_LOCAL for its exact source, not backend performance, full parent acceptance, deployment or user acceptance.

## Current remaining criteria and owners

- **Explicit product decision, D05 owner:** numerical performance budgets and supported browser/profile acceptance remain unapproved. Current-machine selection is resolved.
- **Frontend implementation/verification, APP-FE-035 and QA:** mixed-edge and drag graph scenarios; nested collections/attachments; bounded calendar ranges/chart series; sustained heap/listener/subscription/timer profiling; comparable cold/warm profiles and actual backend/network measurements.
- **Verification, APP-FE-036 and QA:** concurrent-transfer peak memory and over-limit performance scenarios at supported bounds.
- **Verification environment, APP-FE-034 and QA:** Chromium and actual manual assistive-technology/incomplete-axe review. Firefox measurements do not establish the full browser matrix.

APP-FE-012 destinations and APP-FE-014 team selection do not block these independent measurements. The next dependency-ready APP-FE-035 slice is focused mixed-edge canvas render/interaction instrumentation using the existing canonical model, followed by bounded nested-form/calendar/chart scenarios. Hardware selection alone does not close any parent task.

## Files and compatibility

This continuation changes only this measurement record, the APP-FE-035 change record, current delivery backlog, D05 decision supplement and the current supplement in APP-FE-031–035 acceptance. It reuses `server/runtime-performance-fixture.mjs`, `server/browser-auth.spec.mjs`, `server/browser-foundations.spec.mjs`, `server/foundations-fixture.mjs` and `server/browser-launch.mjs` unchanged. No application code, backend source, dependencies, migrations, mise/environment configuration or data changed. AST graph refresh is unnecessary because code is unchanged. All existing task IDs, statuses and historical evidence are preserved.
