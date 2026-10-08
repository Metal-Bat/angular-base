# Deployment and rollback: Step 37

The repository now supports serving production Angular assets and the same-origin session boundary from `server/main.mjs`. Set `FRONTEND_DIR` to the built browser directory. The listener remains loopback-only; the deployment provides HTTPS through a reverse proxy. The [proxy example](../deploy/nginx.conf.example) is a location-block template, not a provisioned staging environment.

## Prepare a release

1. Run `mise run check`, dependency reports, browser/real-backend checks and the release gates in [release readiness](RELEASE-READINESS.md). Resolve permission/browser/device signoff and applicable findings.
2. Retain an immutable versioned directory containing the browser build, public runtime configuration, the matching `server/` sources and toolchain metadata. `npm run release:evidence` writes `artifacts/release-manifest.json` with asset hashes/sizes, contract and lockfile hashes, initial bytes, source-map absence and lazy-canvas verification. Retain this manifest with test evidence.
3. Apply the five incremental backend patches in documented order, including the workspace migration. Register the confidential client/release and actual renderer/API capabilities. Keep older releases active while pinned cases still require compatible rendering. Never rewrite execution/form pins during a frontend rollout.
4. Supply `NODE_ENV=production`, exact HTTPS `BOUNDARY_BROWSER_ORIGIN`, backend origin, `FRONTEND_DIR`, registered `BOUNDARY_CLIENT_KEY`/`BOUNDARY_CLIENT_RELEASE` and server-only `BOUNDARY_CLIENT_SECRET` from the deployment secret store. Start `node server/main.mjs` under the service supervisor. Never place the secret in public runtime config, a build argument, a committed file or a command recorded in shell history.
5. Route the HTTPS browser origin to the loopback listener. Preserve Origin, cookie and CSRF headers; disable proxy caching for all session/API responses. Check private authenticated responses, binary downloads and no payload/credential logging. TLS certificates, supervisor configuration, process resource limits and network access are environment-owned.

## Static behavior

HTML and runtime configuration use `no-store`. Hashed JS/CSS use one-year immutable caching; unhashed assets revalidate. Extensionless deep links serve the SPA shell. Missing asset paths return 404; API/session paths are never mistaken for SPA routes. Only GET/HEAD serve static assets. Public source maps, hidden files, encoded traversal and symlink escapes are denied.

## Rehearse and switch

Use a new backend-compatible release directory, validate its manifest and runtime configuration, then change `FRONTEND_DIR` through the supervisor and restart the process. Run login, a deep-link reload, ordinary request/review, administration denial, workspace reopen and binary/report checks at the **actual staging HTTPS origin**. Verify an incompatible registered release fails safely. Record release IDs, manifests, checks, timestamps and incident owner without secrets.

Session state currently lives in one Node process. A restart or release switch requires login again; multiple processes need sticky routing or an explicitly designed shared session store. Keep deployment behavior consistent with that contract.

Rollback switches back to the retained compatible directory and restarts. It changes frontend/server code and public runtime configuration, while existing backend execution/form version pins remain untouched. Reread authoritative state after uncertain commands. Do not downgrade the backend workspace schema merely to roll back static assets; backend rollback needs its own compatible migration/data rehearsal.

## Evidence and pending gate

On October 4, 2026, the project owner supplied `localhost:8000` as the intended local staging address. Initial HTTP and HTTPS checks returned connection refused. A subsequent startup investigation verified the running FastAPI backend at `http://127.0.0.1:8000`: health/readiness passed, PostgreSQL/cache/broker/storage were ready, and all 314 operation IDs matched the pinned frontend contract. The missing listener was the session boundary on port 3000; the development command now starts it automatically. Angular proxy reads of session status, health and readiness passed at `http://localhost:4200`. These HTTP development checks leave HTTPS deployment/rollback acceptance pending. A browser origin includes the scheme, hostname and port; production mode requires HTTPS, a working TLS proxy and the registered confidential client/release. Supply credentials through server environment configuration rather than chat or public runtime configuration.

`npm run test:deployment` performs a local HTTP release A → B → A rehearsal and checks deep links, cache headers, API/session separation, HEAD/method handling and path isolation. `mise run check` includes it. This is a local static-serving test, not staging deployment, TLS/proxy validation or a backend-version rollback exercise.

Step 37 remains prepared pending the staging origin/access, registered client/release configuration, release-gate signoff and an actual staging deployment/rollback rehearsal. Nothing has been published or deployed externally.

## Substep 37a: local HTTPS rehearsal

`BROWSER_ENGINE=chromium npm run test:deployment-https` adds a real TLS listener and a fresh disposable browser profile to the boundary fixture. Set `BROWSER_BINARY` if Chromium is not on PATH. The harness requires OpenSSL and generates a one-day self-signed localhost certificate inside its temporary directory. Its certificate exception applies only to that test browser; production serving configuration is unchanged. It removes the certificate, profile and release fixtures on completion.

The test runs the boundary with `development: false`, verifies that Chromium stores/sends the production `__Host-workspace_session` Secure/HttpOnly cookie, and repeats CSRF, forged bearer replacement, token-route isolation, no-store, logout and empty-storage checks. Synthetic static releases switch A → B → A through the real static adapter with an opaque pinned deep link; runtime configuration and HTML refresh, hashed assets stay immutable and public source maps stay unavailable. This tests local production cookie behavior and static adapter compatibility. It does not provision a reverse proxy, deploy Angular/backend versions, or establish compatibility of deployed execution pins. Step 37 still requires the actual staging rehearsal described above.

### Health and readiness services

The frontend does not use backend healthcheck or readiness services. Angular proxies only `/session/**` and `/api/**`; the session boundary no longer forwards `/health` or `/ready`, and production static routing returns 404 for those unused paths. Development startup uses the existing `/session/status` session endpoint. Historical diagnostic evidence above does not configure an ongoing health/readiness check.
