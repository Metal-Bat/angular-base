# Current frontend CI: observed scope and unfinished stages

Observed on 2026-10-09 through GitHub connector reads. These are remote CI observations, not application tests run by this review.

Repository: Metal-Bat/angular-base  
Commit: 95f88dce6f1a48da87294929041378c174e6b39c  
Run: 37913345517  
Job: 113763493592  
Run page: https://github.com/Metal-Bat/angular-base/actions/runs/37913345517  
Job page: https://github.com/Metal-Bat/angular-base/actions/runs/37913345517/job/113763493592

## Conclusion

The job completed with conclusion `cancelled`, not `success`. The job API records completion at 2026-10-09T10:06:01Z. Its enclosing 'Run project checks' step was cancelled. Later optional webfont, negative-gate, dependency-report and production-build-upload steps were skipped. Upload of the available evidence succeeded. No inference of production deployment, browser acceptance or successful paired integration is justified.

## Stages observed in the retrieved job log

| Stage                                                   | Observation                                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact dependency installation                           | Succeeded, with separate dependency/deprecation diagnostics described below.                                                                      |
| Formatting, API/delivery checks, type checking and lint | Completed before the next stage. The contract check still named the old APP-BE-001 producer 995829e... and 314 operations/425 schemas.            |
| Vitest                                                  | 84 test files and 455 tests passed.                                                                                                               |
| Session boundary                                        | 22 protocol tests passed, no skips.                                                                                                               |
| HTTP boundary adapter                                   | 4 tests passed, no skips.                                                                                                                         |
| Static deployment adapter                               | 2 tests passed, no skips.                                                                                                                         |
| Browser diagnostic capture                              | 3 unit tests passed, no skips.                                                                                                                    |
| Production build                                        | Completed at 09:47:37 UTC; initial bundle reported 493.71 kB.                                                                                     |
| Browser quality                                         | Began at 09:47:37 UTC; no scope-success summary appeared before cancellation at 10:05:58 UTC.                                                     |
| Paired current-backend/browser acceptance               | Not established. The general runner only adds paired smoke when DELIVERY_BACKEND_ROOT is set; this observation must not be treated as such a run. |

The package does not include the full CI log: it contains irrelevant runner/environment output and is available from GitHub. Artifact upload named `dependency-reports`, ID 11609537212, succeeded, but its name does not prove the later dependency-report command ran. That command was skipped. No artifact contents were inspected here.

## Diagnostics requiring honest disposition

The install log contains deprecated inflight/glob packages and an npm summary of **15 high-severity findings**. This count is a package audit summary; production versus development reachability and actual advisory paths have not been independently triaged in this review. Do not present it as 15 proven production exploits or automatically run a force upgrade.

There are also runner/action warnings for deprecated Node API calls and actions targeting the older Node runtime, plus a pipx installation warning. These occur outside the project's internal `mise run check` diagnostic capture. A quiet project command and a completely warning-free hosted pipeline are different claims.

## Required follow-up

Extend APP-FE-002/033/038, retaining the current runner. Add per-scope start/progress/end evidence, bounded child timeouts, process-tree cleanup and partial manifests. Reproduce the first incomplete browser scope using the selected CI browser before assigning a root cause. `scripts/browser-quality-check.mjs` currently waits for each child to exit without a parent-level per-scope watchdog. It does not identify a stuck internal browser call by itself.

Preserve passing stage evidence. Do not declare the whole gate passed, suppress browser checks or merely raise global timeouts. Refresh the structured dependency audit and compatible action/toolchain upgrades as their own reviewed changes.
