# Workflow canvas decision: Step 29

Status: Foblex Flow selected for the local authoring implementation; broader accessibility/browser and performance release gates remain in Steps 36–37.

## Candidates and decision

| Candidate             | Integration and license                                                                    | Evidence                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Foblex Flow 19.3.0    | Angular-native components/directives; MIT; installed Angular-compatible companion packages | Implemented adapter and actual Firefox/backend prototype below          |
| Rete Angular renderer | MIT Angular plugin; official renderer documentation includes Angular 21                    | Documentation/source comparison only; not installed or benchmarked here |

Foblex fits the project's existing Angular standalone composition and renders typed ports, separate edge kinds and viewport/waypoint interactions without owning executable business rules. Rete remains an alternative if later interaction/accessibility requirements require its plugin architecture. The comparison does not claim equivalent measured performance. Sources: [Foblex installation](https://flow.foblex.com/docs/get-started), [compatibility](https://flow.foblex.com/docs/angular-version-compatibility), [MIT source](https://github.com/Foblex/f-flow), [Rete Angular renderer](https://retejs.org/docs/guides/renderers/angular/), [Rete MIT plugin](https://github.com/retejs/angular-plugin).

## Adapter and persistence

Only studio infrastructure imports Foblex. The lazy workflow route supplies the canvas port; domain/application and presentation state use owned graph/layout types. Step keys identify nodes. Input/output direction qualifies data connector keys, including identically named ports. Separate stable control/data edge identities keep routing independent of incidental row order. Trusted server catalog supplies port direction/schema; local compatibility feedback precedes authoritative server validation.

`bpms.workspace/1` stores incomplete authored graph separately from executable version rows, with independently checked revision and explicit promotion. Positions, viewport, collapsed keys and waypoints are visual metadata. Selection and undo stay in memory. History is capped at 20 snapshots; catalog loading and auxiliary pages are bounded. The backend bounds graph JSON to 256 KiB and workspace JSON to 1 MiB, with at most 256 position/collapse keys and 2,048 routes of 64 points. The frontend JSON decoder imposes a stricter 256 KiB author-document limit, finite coordinates, depth/node limits and forbidden object keys.

Server diagnostics map to stable nodes/edges or remain in a visible summary. Malformed graph entries remain editable in raw WIP. Promote/publication are separate deliberate commands. Stale revisions keep local edits, while actor changes clear them and fence late responses. Canvas destruction removes its DOM on route change.

## Measured local prototype

The headless Firefox production-build journey measured one run on this development machine. Mount measurements include the runner's 75 ms click wait and rendering frames; keyboard timings include two animation frames. They are reproducible smoke measurements, not agreed device/service budgets.

| Nodes | Mount (ms) | Keyboard move (ms) | Canvas DOM node count |
| ----- | ---------: | -----------------: | --------------------: |
| 16    |         93 |                 35 |                    68 |
| 64    |         82 |                 34 |                   260 |
| 256   |        200 |                 32 |                 1,028 |

[Machine-readable measurements](reference/studio-canvas-measurements.json) retain these values. `server/browser-studio.spec.mjs` logs only timings and request method/path/status; it does not log authored data or secrets.

The same run verified actual registered transform input/output ports and distinct data-edge rendering, arrow-key movement, persisted/reopened node positions, incomplete WIP, rejected invalid promotion, accepted valid promotion and immutable publication. Unit tests cover edge role/type checks, stable keys, bounded undo, diagnostics and layout decoding. Integration tests verify independent workspace revisions, direct graph edits invalidating promotion, history and permission denial.

The journey dispatches a wheel interaction and saves/reloads workspace, but does not establish a quantitative pan/zoom accuracy budget. It verifies DOM teardown and cleared browser storage; it does not measure heap retention. Native pointer/touch gestures, screen-reader usability, full canvas RTL behavior, multiple supported browsers and sustained memory/interaction budgets need QA-04/QA-05. Farsi read-only runtime preview is covered separately. These limits remain explicit rather than treating a library's supported APIs as acceptance evidence.
