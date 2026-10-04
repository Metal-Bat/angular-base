# Browser authentication boundary (ADR 001)

Accepted implementation decision, October 2, 2026: use a same-origin Node session boundary for production confidential-client identity. The Angular bundle receives public configuration only. The FastAPI session binds client identity and release during authenticated login; browser headers cannot establish confidential identity.

`server/main.mjs` listens on loopback:3000. In development, Angular proxies `/session/**`, `/api/**`, `/health` and `/ready` there. Run `mise run session` in another terminal alongside `mise run dev`. FastAPI must be reachable at the configured upstream origin. The area pages still describe planned business features. Steps 11–13 now provide login, account bootstrap, permissions and server renewal; see [API-CLIENT.md](API-CLIENT.md).

## Server configuration

| Variable                   | Meaning                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `BOUNDARY_BROWSER_ORIGIN`  | Exact browser origin; defaults to `http://localhost:4200` in development. Production requires HTTPS.                                  |
| `BOUNDARY_UPSTREAM_ORIGIN` | FastAPI origin; defaults to `http://127.0.0.1:8000`. Use HTTPS across hosts or a protected same-host loopback connection.             |
| `BOUNDARY_PORT`            | Loopback listener port; default 3000.                                                                                                 |
| `NODE_ENV=production`      | Selects secure production cookies and confidential mode by default.                                                                   |
| `BOUNDARY_CLIENT_MODE`     | `confidential` or deliberately `public`. Public mode is reported to the browser and remains ineligible for confidential restrictions. |
| `BOUNDARY_CLIENT_KEY`      | Registered backend client code, supplied by the server deployment.                                                                    |
| `BOUNDARY_CLIENT_SECRET`   | Server-only confidential credential; inject through the deployment secret store.                                                      |
| `BOUNDARY_CLIENT_RELEASE`  | Registered release version, supplied by the deployment.                                                                               |

Production confidential mode rejects missing client credentials/release at startup. HTTP development browser origins are limited to loopback hosts. Keep secrets out of `.env` files committed to this repository, static assets, build arguments, URLs, browser storage, and telemetry. Public mode rejects a configured secret.

Deploy static Angular assets and route `/session/` and `/api/` to the boundary through one HTTPS reverse proxy. Bind the Node listener to loopback; preserve the browser's `Origin`, cookie, content type, CSRF and Fetch Metadata headers. Disable proxy caching and payload logging for these paths. Do not expose a second browser-facing upstream token API. Proxy host rewriting does not change the configured browser origin.

## Browser contract

- `POST /session/login`: JSON `username`, `password`, optional `device_name`. Requires the exact Origin and rejects cross-site Fetch Metadata. Browser client identity/release/secret fields are ignored. The boundary forwards only the configured server identity and keeps both upstream tokens in memory. Response: `{ authenticated, csrfToken, boundaryMode }`.
- `GET /session/status`: current authentication state, CSRF token or null, and boundary mode. No upstream credentials are returned.
- `POST /session/refresh`: requires Origin and CSRF; renews server-held credentials through the same single-flight path as API requests. Returns authentication state only.
- `POST /session/logout`: requires the session's `X-CSRF-Token` and exact Origin. Clears local state and cookie first; `upstreamRevoked` reports whether upstream revocation succeeded.
- `/api/v1/**`: requires the cookie; unsafe methods additionally require Origin and CSRF. Browser Authorization is replaced with the server-held bearer. Raw login/token/refresh/logout routes are blocked, including encoded spellings. Auth passthrough is limited to account, permissions, session listing and password-change operations.

Production cookie: `__Host-workspace_session`, opaque random identifier, `Path=/`, `HttpOnly`, `Secure`, `SameSite=Lax`. Development uses a separate cookie without Secure on loopback HTTP. The cookie has an absolute eight-hour lifetime. Access-token expiry is tracked separately and renewal never extends that absolute deadline. Account login rotates the local session. Before an API call with an expiring access token, one server renewal rotates both tokens. Concurrent unexpected 401 reads share renewal and may retry once. A rejected unsafe request returns 409 with `uncertain: true` and is never replayed. Lost, rejected or malformed refresh responses discard local state and never reuse the old refresh token. Logout waits for an in-flight rotation to revoke its latest token; a closed session cannot be restored.

All boundary responses use `private, no-store`; browser fetches must avoid persistent caches. The boundary forwards only selected content/locale headers and selected response headers. Commands are never retried automatically, including after renewal. A transport failure during a mutation returns `503` with `uncertain: true`; reconcile using an authorized read before issuing another command.

The implemented store is bounded to 1,024 active sessions per process. Restarting the process signs users out. This supports a single-process deployment; multiple replicas require a shared protected session store and revocation design before production rollout. Rate limiting and upstream session administration remain deployment responsibilities.

## Verification

`mise exec -- npm run test:boundary` checks cookies, client identity, CSRF/origin rejection, token-route blocking, expiry and logout with an injected upstream. `mise exec -- npm run test:browser-boundary` additionally runs real headless Firefox network requests against disposable loopback servers; Firefox must be installed (`FIREFOX_BINARY` can select its executable). It verifies HttpOnly behavior, server-only tokens/secret, CSRF rejection, bearer replacement, no-store, logout and empty browser storage. These fixtures verify the boundary protocol; they do not establish a deployed reverse proxy or live backend login.

`npm run test:browser-auth` exercises the built Angular application in Firefox: invalid/valid login, reload, page-two permissions, revocation, cross-tab logout and expiry. Boundary unit tests also cover concurrent renewal, unexpected 401s, lost refresh responses and logout during rotation. Root health/readiness forwarding is separate and never exposes `/internal/**`.

With `FRONTEND_DIR` set, `server/main.mjs` serves production assets and SPA deep links alongside the boundary. HTML/runtime configuration are no-store, hashed JS/CSS immutable, and API/session paths remain boundary-owned. See [deployment and rollback](DEPLOYMENT.md).
