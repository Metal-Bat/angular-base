import { createWorkspaceFixture } from "./workspace-fixture.mjs";
import { createProfileFixture } from "./profile-fixture.mjs";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { createServer } from "node:http";
import { once } from "node:events";
import { createStaticAssets } from "./static-assets.mjs";
import { createHttpBoundary } from "./http-boundary.mjs";
import { createSessionBoundary } from "./session-boundary.mjs";
import { createCanvasFixture } from "./workflow-canvas-fixture.mjs";
import { createStudioCatalogFixture } from "./studio-catalog-fixture.mjs";
import { createOtherCrudFixture } from "./other-crud-fixture.mjs";
import { createRecordsFixture } from "./records-fixture.mjs";
import { createPreferencesFixture } from "./preferences-fixture.mjs";
import { readBoundedBody } from "./private-transfer.mjs";

// Each test owns both servers and fresh mutable fixtures. No real backend is contacted.
export async function startStudioBrowserFixture({
  assetRoot = "dist/ng-architect/browser",
  density = "compact",
  conditionalWorkflow = false,
  dataMapping = false,
  subprocessMapping = false,
  collapsedWorkflow = false,
  typedChoice = false,
  attachmentReceipt = null,
  inlineAttachments = false,
  sharedRecords = false,
  administrationDetails = false,
} = {}) {
  const metrics = JSON.parse(
    await readFile(
      new URL(
        "../src/app/features/analytics/domain/metric-catalog.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const records = createRecordsFixture();
  const other = createOtherCrudFixture();
  const canvas = createCanvasFixture({
    conditional: conditionalWorkflow,
    dataMapping,
    subprocessMapping,
    collapsed: collapsedWorkflow,
  });
  const studio = createStudioCatalogFixture({ typedChoice });
  const preferences = createPreferencesFixture({ density });
  const profile = createProfileFixture();
  const workspace = createWorkspaceFixture({
    actorReference: "fixture-user",
    attachmentReceipt,
    inlineAttachments,
  });
  const failures = [];
  const upstream = createServer(async (req, res) => {
    try {
      const rawBytes = await readBoundedBody(
        {
          headers: new Headers(req.headers),
          body: ["GET", "HEAD"].includes(req.method)
            ? null
            : Readable.toWeb(req),
        },
        2 * 1024 * 1024,
      );
      const raw = rawBytes.toString();
      const path = new URL(req.url, "http://fixture.invalid").pathname;
      if (path === "/api/v1/inbox/events") {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write(
          'event: inbox.resync\ndata: {"schema_version":1,"reason":"connected"}\n\n',
        );
        const heartbeat = setInterval(() => {
          if (!res.destroyed) res.write(": keep-alive\n\n");
        }, 5000);
        heartbeat.unref();
        res.on("close", () => clearInterval(heartbeat));
        return;
      }
      if (
        attachmentReceipt &&
        path === "/api/v1/media/files" &&
        req.method === "POST"
      ) {
        const upload = workspace.handle(req.method, path, raw);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(upload));
        return;
      }
      if (inlineAttachments) {
        const upload = await workspace.upload(
          req.method,
          path,
          rawBytes,
          new Headers(req.headers),
        );
        if (upload) {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(upload));
          return;
        }
      }
      const attachmentContent = workspace.content(req.method, path);
      if (attachmentContent) {
        res.writeHead(200, {
          "content-type": attachmentContent.contentType ?? "text/plain",
          "content-disposition":
            'attachment; filename="' +
            (attachmentContent.filename ?? "purchase-receipt.txt") +
            '"',
        });
        res.end(attachmentContent.bytes ?? attachmentContent);
        return;
      }
      const personal = profile.handle(req.method, path, raw);
      if (personal) {
        res.writeHead(personal.status, {
          "content-type": personal.contentType,
        });
        res.end(personal.bytes ?? JSON.stringify(personal.body));
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
            items: [
              "requests.start",
              "forms.manage",
              "workflows.manage",
              "admin.users.manage",
              "admin.permissions.manage",
              "admin.tasks.manage",
              ...(administrationDetails ? ["requests.manage"] : []),
              ...(sharedRecords
                ? ["admin.work_groups.manage", "integrations.manage"]
                : []),
            ],
            page: 1,
            size: 100,
            total:
              6 + (sharedRecords ? 2 : 0) + (administrationDetails ? 1 : 0),
            total_pages: 1,
          },
        };
      } else if (!result && path === "/api/v1/inbox/unread")
        result = { success: true, data: { total: 0 } };
      else if (
        !result &&
        [
          "/api/v1/inbox/search",
          "/api/v1/me/favorites/search",
          "/api/v1/me/saved-views/search",
        ].includes(path)
      )
        result = {
          success: true,
          result: { items: [], page: 1, size: 20, total: 0, total_pages: 0 },
        };
      if (!result && path === "/api/v1/calendar/events/search")
        result = {
          success: true,
          result: { items: [], page: 1, size: 100, total: 0, total_pages: 0 },
        };
      if (!result && path === "/api/v1/analytics/catalog")
        result = { success: true, data: metrics };
      if (!result && path === "/api/v1/analytics/query") {
        const query = JSON.parse(raw);
        const definition = metrics.find(
          (item) => item.metric_key === query.metric_key,
        );
        if (!definition) throw Error("Unknown fixture metric");
        const values =
          definition.unit === "seconds"
            ? [0, 90, null, 180, 30, 60]
            : [0, 1, 3, 0, 1, 0];
        const available = definition.availability === "available";
        const buckets = values.map((value, index) => ({
          date: new Date(
            Date.parse(query.start_date + "T00:00:00Z") + index * 86400000,
          )
            .toISOString()
            .slice(0, 10),
          value,
          population_count: definition.unit === "seconds" ? 1 : value,
          sample_count:
            definition.unit === "seconds" ? (value === null ? 0 : 1) : value,
          unknown_count: value === null ? 1 : 0,
        }));
        result = {
          success: true,
          data: {
            metric_key: definition.metric_key,
            unit: definition.unit,
            version: 1,
            availability: definition.availability,
            generated_at: "2026-10-14T08:00:00Z",
            as_of: "2026-10-14T08:00:00Z",
            timezone: query.timezone,
            total_value: available
              ? definition.unit === "seconds"
                ? 72
                : 5
              : null,
            population_count: available
              ? definition.unit === "seconds"
                ? 6
                : 5
              : null,
            sample_count: available ? 5 : null,
            unknown_count: available
              ? definition.unit === "seconds"
                ? 1
                : 0
              : null,
            series: available ? [{ key: "total", buckets }] : [],
            drilldown: null,
          },
        };
      }
      result ??=
        canvas.handle(req.method, path, raw) ??
        studio.handle(req.method, path, raw) ??
        other(path, raw, req.method) ??
        (/^\/api\/v1\/(business-requests|work-items|processes)(\/|$)/.test(
          path,
        ) ||
        (attachmentReceipt && path === "/api/v1/media/files")
          ? workspace.handle(req.method, path, raw)
          : null) ??
        records.handle(req.method, path, raw);
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
    const assets = await createStaticAssets(assetRoot);
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
