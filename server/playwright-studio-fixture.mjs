import { Readable } from "node:stream";
import { createServer } from "node:http";
import { once } from "node:events";
import { createStaticAssets } from "./static-assets.mjs";
import { createHttpBoundary } from "./http-boundary.mjs";
import { createSessionBoundary } from "./session-boundary.mjs";
import { createCanvasFixture } from "./workflow-canvas-fixture.mjs";
import { createStudioCatalogFixture } from "./studio-catalog-fixture.mjs";
import { createPreferencesFixture } from "./preferences-fixture.mjs";
import { readBoundedBody } from "./private-transfer.mjs";

// Each test owns both servers and fresh mutable fixtures. No real backend is contacted.
export async function startStudioBrowserFixture() {
  const canvas = createCanvasFixture();
  const studio = createStudioCatalogFixture();
  const preferences = createPreferencesFixture();
  const failures = [];
  const upstream = createServer(async (req, res) => {
    try {
      const raw = (
        await readBoundedBody(
          {
            headers: new Headers(req.headers),
            body: ["GET", "HEAD"].includes(req.method)
              ? null
              : Readable.toWeb(req),
          },
          2 * 1024 * 1024,
        )
      ).toString();
      const path = new URL(req.url, "http://fixture.invalid").pathname;
      if (path === "/api/v1/inbox/events") {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write(
          'event: inbox.resync\ndata: {"schema_version":1,"reason":"connected"}\n\n',
        );
        return;
      }
      const preferred = preferences.handle(req.method, path, raw);
      if (preferred) preferred.body.data.workspace.landing_key = "studio";
      let result = preferred?.body;
      res.statusCode = preferred?.status ?? 200;
      if (!result && path.endsWith("/login")) {
        if (JSON.parse(raw).password !== "fixture-password") {
          res.statusCode = 401;
          result = { success: false, code: 1001 };
        } else
          result = {
            success: true,
            data: {
              access_token: "fixture-access",
              refresh_token: "fixture-refresh",
              expires_in: 120,
            },
          };
      } else if (!result && path.endsWith("/me")) {
        result = {
          success: true,
          data: {
            ref_id: "fixture-user",
            username: "fixture-user",
            first_name: "Fixture",
            last_name: "User",
            email: "fixture@example.test",
            created_at: "2026-10-04T08:00:00Z",
            updated_at: null,
            is_superuser: false,
            is_active: true,
          },
        };
      } else if (!result && path.endsWith("/auth/permissions/search")) {
        result = {
          success: true,
          result: {
            items: ["requests.start", "forms.manage", "workflows.manage"],
            page: 1,
            size: 100,
            total: 3,
            total_pages: 1,
          },
        };
      } else if (!result && path === "/api/v1/inbox/unread")
        result = { success: true, data: { total: 0 } };
      else if (!result && path === "/api/v1/inbox/search")
        result = {
          success: true,
          result: { items: [], page: 1, size: 20, total: 0, total_pages: 0 },
        };
      result ??=
        canvas.handle(req.method, path, raw) ??
        studio.handle(req.method, path, raw);
      if (!result) {
        res.statusCode = 404;
        result = { success: false, code: 1004 };
      }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(result));
    } catch (error) {
      failures.push(error.message);
      res.writeHead(500);
      res.end('{"success":false}');
    }
  });
  let browser;
  try {
    upstream.listen(0, "127.0.0.1");
    await once(upstream, "listening");
    const assets = await createStaticAssets("dist/ng-architect/browser");
    let handle;
    let origin;
    browser = createServer((req, res) =>
      createHttpBoundary({ browserOrigin: origin, handle, assets })(req, res),
    );
    browser.listen(0, "127.0.0.1");
    await once(browser, "listening");
    origin = "http://127.0.0.1:" + browser.address().port;
    handle = createSessionBoundary({
      browserOrigin: origin,
      upstreamOrigin: "http://127.0.0.1:" + upstream.address().port,
      development: true,
      mode: "confidential",
      clientKey: "fixture",
      clientSecret: "fixture-server-secret",
      clientRelease: "1.0.0",
    });
    return {
      origin,
      async close() {
        browser.closeAllConnections();
        upstream.closeAllConnections();
        await Promise.all([
          new Promise((resolve, reject) =>
            browser.close((error) => (error ? reject(error) : resolve())),
          ),
          new Promise((resolve, reject) =>
            upstream.close((error) => (error ? reject(error) : resolve())),
          ),
        ]);
        if (failures.length)
          throw Error("Fixture server failures: " + failures.join("; "));
      },
    };
  } catch (error) {
    browser?.closeAllConnections();
    browser?.close();
    upstream.closeAllConnections();
    upstream.close();
    throw error;
  }
}
