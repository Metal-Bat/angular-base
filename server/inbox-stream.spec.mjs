import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionBoundary } from "./session-boundary.mjs";
const config = {
  browserOrigin: "http://localhost:4200",
  upstreamOrigin: "http://api.internal",
  mode: "public",
  development: true,
  maxResponseBytes: 1024,
};
async function setup() {
  let controller, signal, headers;
  const handle = createSessionBoundary(config, {
    fetcher: async (url, init) => {
      if (url.pathname === "/api/v1/auth/login")
        return Response.json({
          success: true,
          data: {
            access_token: "private-access",
            refresh_token: "private-refresh",
            expires_in: 3600,
          },
        });
      if (url.pathname === "/api/v1/auth/logout")
        return Response.json({ success: true });
      signal = init.signal;
      headers = init.headers;
      return new Response(
        new ReadableStream({
          start(c) {
            controller = c;
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    },
  });
  const login = await handle(
    new Request(config.browserOrigin + "/session/login", {
      method: "POST",
      headers: {
        origin: config.browserOrigin,
        "content-type": "application/json",
      },
      body: JSON.stringify({ username: "fixture", password: "password" }),
    }),
  );
  const cookie = login.headers.get("set-cookie").split(";")[0],
    { csrfToken } = await login.json();
  const request = (suffix = "", extra = {}) =>
    new Request(config.browserOrigin + "/api/v1/inbox/events" + suffix, {
      headers: { cookie, ...extra },
    });
  return {
    handle,
    request,
    cookie,
    csrfToken,
    upstream: () => ({ controller, signal, headers }),
  };
}
test("SSE forwards immediately beyond the ordinary cumulative cap and cancels on logout", async () => {
  const s = await setup();
  const response = await s.handle(
    s.request("", { "Last-Event-ID": "opaque_ref", "accept-language": "fa" }),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-accel-buffering"), "no");
  const { controller, signal, headers } = s.upstream();
  assert.equal(headers.get("authorization"), "Bearer private-access");
  assert.equal(headers.get("Last-Event-ID"), "opaque_ref");
  const reader = response.body.getReader();
  const encoder = new TextEncoder();
  for (let i = 0; i < 20; i++) {
    const read = reader.read();
    controller.enqueue(
      encoder.encode(": heartbeat " + "x".repeat(100) + "\n\n"),
    );
    assert.equal((await read).done, false);
  }
  await s.handle(
    new Request(config.browserOrigin + "/session/logout", {
      method: "POST",
      headers: {
        cookie: s.cookie,
        origin: config.browserOrigin,
        "x-csrf-token": s.csrfToken,
      },
      body: "{}",
    }),
  );
  assert.equal(signal.aborted, true);
  await assert.rejects(reader.read());
});
test("SSE has separate bounded admission and rejects query credentials or invalid cursor", async () => {
  const s = await setup();
  assert.equal((await s.handle(s.request("?token=forbidden"))).status, 400);
  assert.equal(
    (await s.handle(s.request("", { "Last-Event-ID": "x".repeat(257) })))
      .status,
    400,
  );
  const first = await s.handle(s.request()),
    second = await s.handle(s.request());
  assert.equal((await s.handle(s.request())).status, 429);
  await first.body.cancel();
  await second.body.cancel();
  const third = await s.handle(s.request());
  assert.equal(third.status, 200);
  await third.body.cancel();
});
test("SSE rejects a single oversized frame instead of buffering an unlimited event", async () => {
  const s = await setup();
  const response = await s.handle(s.request());
  const read = response.body.getReader().read();
  s.upstream().controller.enqueue(
    new TextEncoder().encode("data: " + "x".repeat(4097)),
  );
  await assert.rejects(read);
  assert.equal(s.upstream().signal.aborted, true);
});

test("HTTP adapter flushes SSE headers before an event and propagates disconnect", async () => {
  const { createServer } = await import("node:http");
  const { once } = await import("node:events");
  const { createHttpBoundary } = await import("./http-boundary.mjs");
  let disconnected = false;
  const server = createServer(
    createHttpBoundary({
      browserOrigin: config.browserOrigin,
      handle: async (request) => {
        request.signal.addEventListener("abort", () => {
          disconnected = true;
        });
        return new Response(new ReadableStream({}), {
          headers: { "content-type": "text/event-stream" },
        });
      },
    }),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const abort = new AbortController();
    const response = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/v1/inbox/events",
      { signal: abort.signal },
    );
    assert.equal(response.status, 200);
    abort.abort();
    for (let i = 0; i < 50 && !disconnected; i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(disconnected, true);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
