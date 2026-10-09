import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionBoundary } from "./session-boundary.mjs";

const config = {
  browserOrigin: "https://workspace.example",
  upstreamOrigin: "http://api.internal",
  mode: "confidential",
  clientKey: "workspace",
  clientSecret: "synthetic-server-secret",
  clientRelease: "1.0.0",
};
test("unused health and readiness routes never contact the upstream service", async () => {
  let calls = 0;
  const boundary = createSessionBoundary(config, {
    fetcher: async () => {
      calls++;
      throw Error("Unexpected upstream request");
    },
  });
  for (const path of ["/health", "/ready"]) {
    assert.equal(
      (await boundary(new Request(config.browserOrigin + path))).status,
      401,
    );
  }
  assert.equal(calls, 0);
});
const request = (path, body, headers = {}, method = body ? "POST" : "GET") =>
  new Request(config.browserOrigin + path, {
    method,
    headers: {
      origin: config.browserOrigin,
      "content-type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
const tokens = () =>
  new Response(
    JSON.stringify({
      success: true,
      data: {
        access_token: "synthetic-access",
        refresh_token: "synthetic-refresh",
        expires_in: 120,
      },
    }),
  );
async function login(handle) {
  const response = await handle(
    request("/session/login", {
      username: "fixture",
      password: "fixture-password",
      client_secret: "browser-forgery",
      client_release: "forged",
    }),
  );
  assert.equal(response.status, 200);
  return {
    response,
    cookie: response.headers.get("set-cookie").split(";")[0],
    data: await response.json(),
  };
}

test("keeps credentials and both tokens on the server; binds only configured client identity", async () => {
  const calls = [];
  const handle = createSessionBoundary(config, {
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return tokens();
    },
  });
  const { response, data } = await login(handle);
  assert.match(
    response.headers.get("set-cookie"),
    /__Host-workspace_session=.*HttpOnly.*SameSite=Lax.*Secure/,
  );
  assert.equal(data.boundaryMode, "confidential");
  assert.equal(JSON.stringify(data).includes("synthetic-access"), false);
  assert.equal(JSON.stringify(data).includes("synthetic-refresh"), false);
  const credentials = JSON.parse(calls[0].init.body);
  assert.equal(credentials.client_secret, config.clientSecret);
  assert.equal(credentials.client_release, "1.0.0");
});

test("rejects foreign origins, cross-site metadata and login forms before upstream calls", async () => {
  let calls = 0;
  const handle = createSessionBoundary(config, {
    fetcher: async () => {
      calls++;
      return tokens();
    },
  });
  assert.equal(
    (
      await handle(
        request(
          "/session/login",
          { username: "a", password: "b" },
          { origin: "https://evil.example" },
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handle(
        request(
          "/session/login",
          { username: "a", password: "b" },
          { "sec-fetch-site": "cross-site" },
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handle(
        request(
          "/session/login",
          { username: "a", password: "b" },
          { "content-type": "text/plain" },
        ),
      )
    ).status,
    415,
  );
  assert.equal(calls, 0);
});

test("requires CSRF, strips browser authorization, and never replays uncertain mutations", async () => {
  const calls = [];
  const handle = createSessionBoundary(config, {
    fetcher: async (url, init) => {
      calls.push({ url, init });
      if (url.pathname.endsWith("/login")) {
        return tokens();
      }
      throw new Error("synthetic timeout");
    },
  });
  const { cookie, data } = await login(handle);
  assert.equal(
    (await handle(request("/api/v1/business-requests", {}, { cookie }))).status,
    403,
  );
  const result = await handle(
    request(
      "/api/v1/business-requests",
      {},
      {
        cookie,
        "x-csrf-token": data.csrfToken,
        authorization: "Bearer browser-forgery",
      },
    ),
  );
  assert.deepEqual(await result.json(), {
    error: "upstream_unavailable",
    uncertain: true,
  });
  assert.equal(calls.length, 2);
  assert.equal(
    calls[1].init.headers.get("authorization"),
    "Bearer synthetic-access",
  );
});

test("blocks token routes including encoded paths", async () => {
  const handle = createSessionBoundary(config, {
    fetcher: async () => tokens(),
  });
  const { cookie, data } = await login(handle);
  for (const path of [
    "/api/v1/auth/login",
    "/api/v1/auth/%6Cogin",
    "/api/v1/auth%2Frefresh",
    "/api/v1/auth/token",
  ]) {
    assert.equal(
      (
        await handle(
          request(path, {}, { cookie, "x-csrf-token": data.csrfToken }),
        )
      ).status,
      404,
    );
  }
});

test("expires sessions and clears cookies; logout invalidates locally even if upstream fails", async () => {
  let now = 0;
  const handle = createSessionBoundary(
    { ...config, sessionMaxAgeSeconds: 120 },
    {
      now: () => now,
      fetcher: async (url) => {
        if (url.pathname.endsWith("/login")) {
          return tokens();
        }
        throw new Error("synthetic failure");
      },
    },
  );
  const first = await login(handle);
  now = 121000;
  assert.equal(
    (await handle(request("/api/v1/auth/me", null, { cookie: first.cookie })))
      .status,
    401,
  );
  const second = await login(handle);
  const logout = await handle(
    request(
      "/session/logout",
      {},
      { cookie: second.cookie, "x-csrf-token": second.data.csrfToken },
    ),
  );
  assert.deepEqual(await logout.json(), {
    authenticated: false,
    upstreamRevoked: false,
  });
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(
    (await handle(request("/api/v1/auth/me", null, { cookie: second.cookie })))
      .status,
    401,
  );
});

test("marks public development mode explicitly and refuses confidential mode without server credentials", async () => {
  assert.throws(
    () => createSessionBoundary({ ...config, clientSecret: undefined }),
    /Invalid/,
  );
  const handle = createSessionBoundary(
    { ...config, mode: "public", clientSecret: undefined },
    { fetcher: async () => tokens() },
  );
  const { data } = await login(handle);
  assert.equal(data.boundaryMode, "public");
});

test("keeps session capacity bounded when login responses arrive concurrently", async () => {
  const handle = createSessionBoundary(
    { ...config, maxSessions: 1 },
    { fetcher: async () => tokens() },
  );
  const responses = await Promise.all(
    [1, 2].map(() =>
      handle(
        request("/session/login", {
          username: "fixture",
          password: "fixture-password",
        }),
      ),
    ),
  );
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 503],
  );
  const accepted = responses.find((response) => response.status === 200);
  const cookie = accepted.headers.get("set-cookie").split(";")[0];
  const status = await handle(request("/session/status", null, { cookie }));
  assert.equal((await status.json()).authenticated, true);
});

test("single-flights concurrent expiry and atomically rotates both tokens", async () => {
  let now = 0;
  let refreshCalls = 0;
  const seen = [];
  const handle = createSessionBoundary(config, {
    now: () => now,
    fetcher: async (url, init) => {
      if (url.pathname.endsWith("/login")) {
        return tokens();
      }
      if (url.pathname.endsWith("/refresh")) {
        refreshCalls++;
        assert.equal(JSON.parse(init.body).refresh_token, "synthetic-refresh");
        await new Promise((resolve) => setImmediate(resolve));
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              access_token: "rotated-access",
              refresh_token: "rotated-refresh",
              expires_in: 120,
            },
          }),
        );
      }
      if (url.pathname.endsWith("/logout")) {
        assert.equal(JSON.parse(init.body).refresh_token, "rotated-refresh");
        return new Response("{}");
      }
      seen.push(init.headers.get("authorization"));
      return new Response("{}");
    },
  });
  const { cookie, data } = await login(handle);
  now = 121000;
  const responses = await Promise.all(
    Array.from({ length: 8 }, () =>
      handle(request("/api/v1/auth/me", null, { cookie })),
    ),
  );
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal(refreshCalls, 1);
  assert.deepEqual(seen, Array(8).fill("Bearer rotated-access"));
  await handle(
    request("/session/logout", {}, { cookie, "x-csrf-token": data.csrfToken }),
  );
});

test("concurrent unexpected 401 reads renew once; mutations are never replayed", async () => {
  let refreshCalls = 0;
  let mutationCalls = 0;
  const handle = createSessionBoundary(config, {
    fetcher: async (url, init) => {
      if (url.pathname.endsWith("/login")) {
        return tokens();
      }
      if (url.pathname.endsWith("/refresh")) {
        refreshCalls++;
        await new Promise((resolve) => setImmediate(resolve));
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              access_token: "new",
              refresh_token: "new-refresh",
              expires_in: 120,
            },
          }),
        );
      }
      if (init.method === "POST") {
        mutationCalls++;
        return new Response("{}", { status: 401 });
      }
      return new Response("{}", {
        status: init.headers.get("authorization") === "Bearer new" ? 200 : 401,
      });
    },
  });
  const { cookie, data } = await login(handle);
  const reads = await Promise.all(
    Array.from({ length: 4 }, () =>
      handle(request("/api/v1/auth/me", null, { cookie })),
    ),
  );
  assert.ok(reads.every((response) => response.status === 200));
  assert.equal(refreshCalls, 1);
  const mutation = await handle(
    request(
      "/api/v1/business-requests/search",
      {},
      { cookie, "x-csrf-token": data.csrfToken },
    ),
  );
  assert.equal(mutation.status, 409);
  assert.equal((await mutation.json()).uncertain, true);
  assert.equal(mutationCalls, 1);
});

test("lost refresh response closes the family locally and never reuses the old token", async () => {
  let now = 0;
  let refreshCalls = 0;
  const handle = createSessionBoundary(config, {
    now: () => now,
    fetcher: async (url) => {
      if (url.pathname.endsWith("/login")) {
        return tokens();
      }
      refreshCalls++;
      throw new Error("Lost rotated response");
    },
  });
  const { cookie } = await login(handle);
  now = 121000;
  const responses = await Promise.all([
    handle(request("/api/v1/auth/me", null, { cookie })),
    handle(request("/api/v1/auth/me", null, { cookie })),
  ]);
  assert.ok(responses.every((response) => response.status === 401));
  assert.equal(refreshCalls, 1);
  assert.equal(
    (await handle(request("/api/v1/auth/me", null, { cookie }))).status,
    401,
  );
  assert.equal(refreshCalls, 1);
});

test("logout during refresh revokes the rotated token without resurrecting the session", async () => {
  let resolveRefresh;
  let entered;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const handle = createSessionBoundary(config, {
    fetcher: async (url, init) => {
      if (url.pathname.endsWith("/login")) {
        return tokens();
      }
      if (url.pathname.endsWith("/refresh")) {
        entered();
        return new Promise((resolve) => {
          resolveRefresh = resolve;
        });
      }
      assert.equal(JSON.parse(init.body).refresh_token, "last-refresh");
      return new Response("{}");
    },
  });
  const { cookie, data } = await login(handle);
  const renewal = handle(
    request("/session/refresh", {}, { cookie, "x-csrf-token": data.csrfToken }),
  );
  await started;
  const logout = handle(
    request("/session/logout", {}, { cookie, "x-csrf-token": data.csrfToken }),
  );
  resolveRefresh(
    new Response(
      JSON.stringify({
        success: true,
        data: {
          access_token: "last-access",
          refresh_token: "last-refresh",
          expires_in: 120,
        },
      }),
    ),
  );
  assert.equal((await renewal).status, 401);
  assert.equal((await logout).status, 200);
  assert.equal(
    (await handle(request("/session/status", null, { cookie }))).status,
    200,
  );
  assert.equal(
    (await (await handle(request("/session/status", null, { cookie }))).json())
      .authenticated,
    false,
  );
});

test("does not dispatch a command whose body arrives after logout", async () => {
  let dispatches = 0;
  let finish;
  let entered;
  const waiting = new Promise((resolve) => {
    entered = resolve;
  });
  const handle = createSessionBoundary(config, {
    fetcher: async (url) => {
      if (url.pathname.endsWith("/login")) {
        return tokens();
      }
      if (!url.pathname.endsWith("/logout")) {
        dispatches++;
      }
      return new Response("{}");
    },
  });
  const { cookie, data } = await login(handle);
  const command = new Request(
    config.browserOrigin + "/api/v1/business-requests/search",
    {
      method: "POST",
      headers: {
        origin: config.browserOrigin,
        cookie,
        "x-csrf-token": data.csrfToken,
      },
      body: new ReadableStream({
        pull(controller) {
          entered();
          return new Promise((resolve) => {
            finish = () => {
              controller.close();
              resolve();
            };
          });
        },
      }),
      duplex: "half",
    },
  );
  const work = handle(command);
  await waiting;
  await handle(
    request("/session/logout", {}, { cookie, "x-csrf-token": data.csrfToken }),
  );
  finish();
  assert.equal((await work).status, 401);
  assert.equal(dispatches, 0);
});

test("password reset works before login, requires the same origin, and never returns upstream secrets", async () => {
  let calls = 0;
  const handle = createSessionBoundary(config, {
    fetcher: async (url, options) => {
      calls++;
      assert.equal(new URL(url).pathname, "/api/v1/auth/reset-password");
      assert.deepEqual(JSON.parse(options.body), {
        token: "single-use",
        new_password: "new-password",
      });
      return new Response(
        JSON.stringify({
          success: true,
          data: null,
          accidental_secret: "never-return",
        }),
        { headers: { "content-type": "application/json" } },
      );
    },
  });
  const body = { token: "single-use", new_password: "new-password" };
  assert.equal(
    (
      await handle(
        request("/session/reset-password", body, {
          origin: "https://attacker.example",
        }),
      )
    ).status,
    403,
  );
  assert.equal(calls, 0);
  const response = await handle(request("/session/reset-password", body));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reset: true });
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("authentication failures expose the public code without upstream secrets", async () => {
  const handle = createSessionBoundary(config, {
    fetcher: async () =>
      new Response(
        JSON.stringify({
          success: false,
          code: 1001,
          message: "private upstream diagnostic",
          data: { access_token: "private token" },
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
  });
  const response = await handle(
    request("/session/login", {
      username: "fixture",
      password: "fixture-password",
    }),
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: "sign_in_failed",
    code: 1001,
  });
});

test("password reset failures retain a string code without upstream details", async () => {
  const handle = createSessionBoundary(config, {
    fetcher: async () =>
      new Response(
        JSON.stringify({
          code: "RESET_EXPIRED",
          data: { token: "private token" },
        }),
        { status: 400 },
      ),
  });
  const response = await handle(
    request("/session/reset-password", {
      token: "fixture-reset-token",
      new_password: "fixture-new-password",
    }),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "reset_failed",
    code: "RESET_EXPIRED",
  });
});

test("rejects excessive command bodies before any business effect is sent", async () => {
  let businessCalls = 0;
  const handle = createSessionBoundary(
    { ...config, maxBodyBytes: 1024 },
    {
      fetcher: async (url) => {
        if (url.pathname.endsWith("/login")) return tokens();
        businessCalls++;
        return new Response("{}");
      },
    },
  );
  const { cookie, data } = await login(handle);
  const response = await handle(
    request(
      "/api/v1/requests/submit",
      { payload: "x".repeat(1024) },
      {
        cookie,
        "x-csrf-token": data.csrfToken,
      },
    ),
  );
  assert.equal(response.status, 413);
  assert.equal((await response.json()).uncertain, false);
  assert.equal(businessCalls, 0);
});

test("private streams surface body failure without replay or private error text", async () => {
  let businessCalls = 0;
  const handle = createSessionBoundary(config, {
    fetcher: async (url) => {
      if (url.pathname.endsWith("/login")) return tokens();
      businessCalls++;
      return new Response(
        new ReadableStream({
          pull(controller) {
            controller.error(Error("private upstream details"));
          },
        }),
      );
    },
  });
  const { cookie, data } = await login(handle);
  const response = await handle(
    request(
      "/api/v1/requests/submit",
      { command_key: "exact-intent" },
      {
        cookie,
        "x-csrf-token": data.csrfToken,
      },
    ),
  );
  await assert.rejects(response.text(), {
    message: "Private transfer interrupted",
  });
  assert.equal(businessCalls, 1);
});

test("private response stream rejects excessive declared and actual sizes", async () => {
  for (const declared of [true, false]) {
    let cancelled = false;
    const handle = createSessionBoundary(
      { ...config, maxResponseBytes: 1024 },
      {
        fetcher: async (url) => {
          if (url.pathname.endsWith("/login")) return tokens();
          return new Response(
            new ReadableStream({
              pull(controller) {
                controller.enqueue(new Uint8Array(1025));
              },
              cancel() {
                cancelled = true;
              },
            }),
            { headers: declared ? { "content-length": "1025" } : {} },
          );
        },
      },
    );
    const { cookie } = await login(handle);
    const response = await handle(
      request("/api/v1/reports/file/download", undefined, { cookie }),
    );
    if (declared) assert.equal(response.status, 502);
    else
      await assert.rejects(response.arrayBuffer(), {
        message: "Private transfer interrupted",
      });
    assert.equal(cancelled, true);
  }
});

test("logout fences bytes from an already opened private download", async () => {
  const handle = createSessionBoundary(config, {
    fetcher: async (url) => {
      if (url.pathname.endsWith("/login")) return tokens();
      if (url.pathname.endsWith("/logout")) return new Response("{}");
      return new Response(
        new ReadableStream({
          pull(controller) {
            controller.enqueue(new Uint8Array([1]));
          },
        }),
      );
    },
  });
  const { cookie, data } = await login(handle);
  const response = await handle(
    request("/api/v1/reports/file/download", undefined, { cookie }),
  );
  const reader = response.body.getReader();
  assert.deepEqual((await reader.read()).value, new Uint8Array([1]));
  await handle(
    request("/session/logout", {}, { cookie, "x-csrf-token": data.csrfToken }),
  );
  await assert.rejects(reader.read(), {
    message: "Private transfer interrupted",
  });
});

test("cancels a blocked private body read when its owner aborts", async () => {
  const { readBoundedBody } = await import("./private-transfer.mjs");
  let cancelled = false;
  const controller = new AbortController();
  const incoming = new Request(config.browserOrigin, {
    method: "POST",
    duplex: "half",
    body: new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
  });
  const work = readBoundedBody(incoming, 1024, controller.signal);
  controller.abort();
  await assert.rejects(work, { message: "Private transfer interrupted" });
  assert.equal(cancelled, true);
});

test("bounds concurrent proxy work and does not send commands rejected at capacity", async () => {
  let enter;
  const started = new Promise((resolve) => {
    enter = resolve;
  });
  let finish;
  let calls = 0;
  const handle = createSessionBoundary(
    { ...config, maxInFlightRequests: 1 },
    {
      fetcher: async (url) => {
        if (url.pathname.endsWith("/login")) return tokens();
        calls++;
        enter();
        return new Promise((resolve) => {
          finish = () => resolve(new Response("{}"));
        });
      },
    },
  );
  const { cookie, data } = await login(handle);
  const headers = { cookie, "x-csrf-token": data.csrfToken };
  const first = handle(
    request("/api/v1/requests/submit", { command_key: "first" }, headers),
  );
  await started;
  const second = await handle(
    request("/api/v1/requests/submit", { command_key: "second" }, headers),
  );
  assert.equal(second.status, 503);
  assert.deepEqual(await second.json(), {
    error: "proxy_capacity_reached",
    uncertain: false,
  });
  assert.equal(calls, 1);
  finish();
  assert.equal((await first).status, 200);
  const next = handle(
    request("/api/v1/requests/submit", { command_key: "third" }, headers),
  );
  await new Promise((resolve) => setImmediate(resolve));
  finish();
  assert.equal((await next).status, 200);
  assert.equal(calls, 2);
});
