# TOOLING-NX-001 — Nx workspace and Impeccable design refinement

Requested October 22, 2026. Scope: finish the existing in-progress Nx migration,
install project-local Impeccable guidance, and refine the shared product interface.
Existing unrelated working-tree changes and historical APP/CONS status remain owned
by their original tasks. No backend or public API contract changes are included.

## Implementation

The Angular 21 application remains at `src/` as the `ng-architect` Nx 24 project.
`project.json` owns the Angular executors, production budgets, file replacements,
proxy and existing output directory. `nx.json` defines shared inputs and cached
build/test/lint targets. Build and serve depend on existing font and scoped vendor
stylesheet preparation. Package scripts, the development launcher, disposable
browser builds and CI defect-injection harness use Nx. Nx 24's installed CLI is
`nx/dist/bin/nx.js`. Full static compiler/test logs remain visible. Conflicting
`NO_COLOR` is removed only at Nx entry points because Nx sets `FORCE_COLOR`.

The disposable CI harness copies the Nx configuration, lockfile and package-manager
policy, and disables its own cache reads. Its translation probe matches the current
Persian diagnostic. Existing lint, template, test, build and translation rejection
checks remain required. Production budget thresholds were not raised.

Impeccable 4.7.0 is installed at `.agents/skills/impeccable` from
[pbakaus/impeccable](https://github.com/pbakaus/impeccable), with its supplied
references and checksum-verifying engine launcher. The engine cache for this session
is `/tmp/frontend-impeccable`; it is not a runtime dependency. The launcher executable
bit was restored after ZIP extraction. See `DESIGN.md` for the incumbent visual system
and Operate-mode refinement rules.

Shared navigation now uses a neutral semantic surface, restrained active color,
44px targets, a measured sticky-header offset and a bounded mobile navigation region.
Directional arrows mirror in RTL. Redundant sidebar decoration was removed. Page
titles use stable sizing; text selection, carets and tabular numerals follow shared
tokens. Controls keep explicit language-aware fonts while ordinary text inherits
from the document. Duplicate invalid-field styling and default font declarations
were consolidated. Tailwind ignores test-only source candidates.

The dashboard timezone and settings link wrap with deliberate spacing. Chart date
labels are selected by their actual time-axis spacing so sparse observations do not
produce overlapping labels. All points, zero values, null gaps, data tables and
localized number/date semantics remain intact.

## Evidence and limits

- Pinned dependency installation passed with the frozen lockfile; network latency
  warnings occurred during supply-chain policy verification.
- Nx project discovery passed after allowing its local worker sockets.
- Initial production builds completed but emitted an initial-bundle warning; retain
  these failed zero-warning attempts separately from final evidence.
- Initial targeted browser run: 8/8 passed across Chromium and Firefox, including
  desktop/phone navigation and Persian/Arabic font loading. The screenshots were
  inspected; they prompted the additional dashboard label-spacing refinement.
- Initial Impeccable source detector returned no findings. A clean mechanical scan
  does not establish visual quality or service integration.
- Final command results and diagnostics are retained under `artifacts/nx-impeccable/`
  and `artifacts/check/manifest.json`. The complete final `mise run check` is the
  authoritative repository gate; required unfinished stages prevent strict readiness.
- This is local tooling and fixture browser evidence. No real-service, deployment,
  demo or user acceptance is asserted; no original APP/CONS parent is closed here.

The first complete check passed its first twelve stages with zero emitted diagnostics,
including all 1,062 unit tests and the production build. It then failed the Firefox
records browser scope because its palette assertion queried the removed decorative
sidebar logo. The fixture now compares navigation icons to the neutral navigation
caption and verifies the brand follows all seven palettes. It retains all theme
accessibility audits. The failed attempt and unchanged-source manifest are preserved
as `artifacts/nx-impeccable/check-first.log` and `check-first-manifest.json`.

The final Impeccable scan reports one stylistic finding for the incumbent Inter font.
It is retained under the skill's explicit Operate guidance permitting familiar sans
fonts and requiring refinement to respect the existing system. No detector rule or
compiler/lint/runtime diagnostic is suppressed. The finding and its review remain
in `detect-final.json` and `detector-review.json` under the evidence directory.

The second complete run passed navigation palette assertions but retained a real
Firefox runtime diagnostic. A focused probe classified it as a ResizeObserver loop
using only safe error names, fixed classifications and script locations. Header
measurement now coalesces writes into requestAnimationFrame, compares the existing
height before writing and cancels pending work when destroyed. No diagnostic was
filtered or downgraded. The second attempt is preserved in `check-second.log` and
`check-second-manifest.json`. Disposable browser-build wrappers also explicitly
request static Nx logs so compiler diagnostics cannot be hidden by its summary UI.

The focused unmodified Firefox records regression then passed with strict browser
diagnostics and accessibility enabled, including all fourteen navigation palette/theme
audits and typed CRUD, confirmation, report and reference journeys. Its complete
output is `artifacts/nx-impeccable/records-final.log`. Final desktop/phone screenshots
and the eight passing Chromium/Firefox navigation/font checks are retained in the
same directory; `browser-final.log` records that targeted run.

The third full check rejected a missing brace in observer cleanup under the existing
`curly` lint rule; it was corrected. Its failure evidence is preserved as
`check-third.log` and `check-third-manifest.json`. The legacy `pnpm ng` entry point
now aliases Nx so code generation works after removing `angular.json`; README
examples use the explicit Nx Angular generator and the actual `mise run dev` task.
