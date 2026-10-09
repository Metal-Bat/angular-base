# APP-FE-020 — Canvas connection gesture fix

Date: 2026-10-09.

The workflow canvas subscribed to connection creation but omitted Foblex's required `f-connection-for-create` component. In the installed 19.3.0 implementation, connection sessions refuse to start without this component. Add the existing library's preview layer and arrow marker, and enlarge existing socket tokens from 12 px to 16 px with a connection cursor. Disabled sockets retain a default cursor and the existing draft, pending-edit and read-only guards.

Extend the disposable Firefox canvas fixture to exercise the library through DOM mouse-down/move and pointer-up gestures for both control transitions and typed step-output bindings. Fit both nodes into the mobile viewport first, assert visible socket geometry and actual hit targets, and save/reload each created connection. Existing typed binding metadata, control/data separation, immutable versions, API contracts and backend state are unchanged.

Verification: focused production build and the canvas Firefox scope are recorded in `/tmp/canvas-fix-build.log`, `/tmp/canvas-port-fix-browser.log` and `artifacts/canvas-port-fix-firefox.json`. Intermediate fixture failures exposed global token sizing, the library's pointer-up listener and offscreen ports at the mobile viewport; the fixture now uses the actual library event sequence and checks hit targets. Final local verification requires the complete subsequent `mise run check`: see `artifacts/check/manifest.json` and its command logs for exit codes, diagnostics and identical start/end source hashes. These are isolated frontend fixture checks; the parent delivery task's backend and manual acceptance blockers remain unchanged.
