import { randomBytes, timingSafeEqual } from "node:crypto";

const unsafe = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const tokenRoutes = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/token",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
]);
const json = (status, value, headers = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
const equal = (left, right) => {
  const a = Buffer.from(left ?? "");
  const b = Buffer.from(right ?? "");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
};

export function createSessionBoundary(
  config,
  { fetcher = fetch, now = Date.now } = {},
) {
  const origin = new URL(config.browserOrigin);
  const upstream = new URL(config.upstreamOrigin);
  if (
    origin.origin !== config.browserOrigin ||
    !["http:", "https:"].includes(origin.protocol) ||
    (config.development &&
      origin.protocol === "http:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) ||
    upstream.origin !== config.upstreamOrigin ||
    !["http:", "https:"].includes(upstream.protocol) ||
    !["public", "confidential"].includes(config.mode) ||
    (origin.protocol !== "https:" && !config.development) ||
    (config.mode === "confidential" &&
      (!config.clientKey || !config.clientSecret || !config.clientRelease)) ||
    (config.mode === "public" && config.clientSecret)
  ) {
    throw new Error("Invalid server session-boundary configuration.");
  }
  const sessions = new Map();
  const maxSessions = config.maxSessions ?? 1024;
  if (
    !Number.isSafeInteger(maxSessions) ||
    maxSessions < 1 ||
    maxSessions > 10000
  ) {
    throw new Error("Invalid session capacity.");
  }
  const cookieName = config.development
    ? "workspace_session_dev"
    : "__Host-workspace_session";
  const maxAge = config.sessionMaxAgeSeconds ?? 28800;
  if (!Number.isSafeInteger(maxAge) || maxAge < 60 || maxAge > 28800) {
    throw new Error("Invalid session lifetime.");
  }
  const cookie = (id, age) =>
    `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${config.development ? "" : "; Secure"}`;
  const clearCookie = { "set-cookie": cookie("", 0) };
  const call = (path, init) =>
    fetcher(new URL(path, upstream), {
      ...init,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

  const validTokens = (result) =>
    result?.success === true &&
    typeof result.data?.access_token === "string" &&
    !!result.data.access_token &&
    typeof result.data?.refresh_token === "string" &&
    !!result.data.refresh_token &&
    Number.isSafeInteger(result.data.expires_in) &&
    result.data.expires_in > 0;
  const refresh = (id, session) => {
    if (session.refreshing) {
      return session.refreshing;
    }
    session.refreshing = (async () => {
      try {
        const response = await call("/api/v1/auth/refresh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refreshToken }),
        });
        const result = await response.json();
        if (!response.ok || !validTokens(result)) {
          throw new Error("Refresh rejected");
        }
        // Retain the rotated token for logout even if logout closed this session in flight.
        session.accessToken = result.data.access_token;
        session.refreshToken = result.data.refresh_token;
        session.accessExpiresAt = now() + result.data.expires_in * 1000;
        if (
          session.closed ||
          sessions.get(id) !== session ||
          session.expiresAt <= now()
        ) {
          throw new Error("Session closed");
        }
      } catch {
        session.closed = true;
        sessions.delete(id);
        throw new Error("Session renewal failed");
      } finally {
        session.refreshing = null;
      }
    })();
    return session.refreshing;
  };

  return async function handle(request) {
    const url = new URL(request.url);
    for (const [id, session] of sessions) {
      if (session.expiresAt <= now()) {
        session.closed = true;
        sessions.delete(id);
      }
    }
    let path;
    try {
      path = decodeURIComponent(url.pathname)
        .replace(/\/+/g, "/")
        .replace(/\/$/, "");
    } catch {
      return json(400, { error: "invalid_path" });
    }
    if (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (unsafe.has(request.method) &&
        request.headers.get("origin") !== config.browserOrigin)
    ) {
      return json(403, { error: "origin_rejected" });
    }
    const cookies = new Map(
      (request.headers.get("cookie") ?? "").split(";").map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
      }),
    );
    const id = cookies.get(cookieName);
    const session = sessions.get(id);
    if (path === "/session/status" && request.method === "GET") {
      return json(200, {
        authenticated: !!session,
        csrfToken: session?.csrfToken ?? null,
        boundaryMode: config.mode,
      });
    }
    if (path === "/session/login" && request.method === "POST") {
      if (
        !(request.headers.get("content-type") ?? "").startsWith(
          "application/json",
        )
      ) {
        return json(415, { error: "json_required" });
      }
      let credentials;
      try {
        credentials = await request.json();
      } catch {
        return json(400, { error: "invalid_credentials_body" });
      }
      if (
        typeof credentials?.username !== "string" ||
        typeof credentials?.password !== "string" ||
        !credentials.username ||
        credentials.username.length > 255 ||
        !credentials.password ||
        credentials.password.length > 4096 ||
        (credentials.device_name !== undefined &&
          (typeof credentials.device_name !== "string" ||
            credentials.device_name.length > 255))
      ) {
        return json(422, { error: "invalid_credentials_body" });
      }
      // Browser-supplied client identity/secret/release is never forwarded.
      const body = {
        username: credentials.username,
        password: credentials.password,
        ...(credentials.device_name
          ? { device_name: credentials.device_name }
          : {}),
        ...(config.clientKey
          ? {
              client_key: config.clientKey,
              client_release: config.clientRelease,
            }
          : {}),
        ...(config.mode === "confidential"
          ? { client_secret: config.clientSecret }
          : {}),
      };
      if (sessions.size >= maxSessions && !session) {
        return json(503, { error: "session_capacity_reached" });
      }
      let response;
      try {
        response = await call("/api/v1/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        return json(503, { error: "authentication_unavailable" });
      }
      if (!response.ok) {
        return json(
          [401, 403, 422, 423, 429].includes(response.status)
            ? response.status
            : 503,
          { error: "sign_in_failed" },
        );
      }
      let result;
      try {
        result = await response.json();
      } catch {
        return json(502, { error: "invalid_authentication_response" });
      }
      const tokens = result?.data;
      if (!validTokens(result)) {
        return json(502, { error: "invalid_authentication_response" });
      }
      // Never retain an old local session when signing in as another actor.
      if (id) {
        if (session) {
          session.closed = true;
        }
        sessions.delete(id);
      }
      if (sessions.size >= maxSessions) {
        return json(503, { error: "session_capacity_reached" });
      }
      const sessionId = randomBytes(32).toString("base64url");
      const csrfToken = randomBytes(32).toString("base64url");
      const lifetime = maxAge;
      sessions.set(sessionId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        csrfToken,
        expiresAt: now() + lifetime * 1000,
        accessExpiresAt: now() + tokens.expires_in * 1000,
        closed: false,
        refreshing: null,
      });
      return json(
        200,
        { authenticated: true, csrfToken, boundaryMode: config.mode },
        { "set-cookie": cookie(sessionId, lifetime) },
      );
    }
    if (["/health", "/ready"].includes(path) && request.method === "GET") {
      try {
        const response = await call(path, { method: "GET" });
        return new Response(await response.arrayBuffer(), {
          status: response.status,
          headers: {
            "content-type":
              response.headers.get("content-type") ?? "application/json",
            "cache-control": "no-store",
          },
        });
      } catch {
        return json(503, { error: "upstream_unavailable" });
      }
    }
    if (path === "/session/reset-password" && request.method === "POST") {
      if (
        !(request.headers.get("content-type") ?? "").startsWith(
          "application/json",
        )
      )
        return json(415, { error: "json_required" });
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json(400, { error: "invalid_request" });
      }
      if (
        typeof payload.token !== "string" ||
        payload.token.length > 512 ||
        !payload.token ||
        typeof payload.new_password !== "string" ||
        payload.new_password.length < 8 ||
        payload.new_password.length > 128
      )
        return json(400, { error: "invalid_request" });
      try {
        const response = await call("/api/v1/auth/reset-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: payload.token,
            new_password: payload.new_password,
          }),
        });
        if (!response.ok)
          return json(response.status >= 500 ? 503 : 400, {
            error: "reset_failed",
          });
        if (session) {
          session.closed = true;
          sessions.delete(id);
        }
        return json(200, { reset: true }, clearCookie);
      } catch {
        return json(503, { error: "upstream_unavailable" });
      }
    }
    if (!session) {
      return json(401, { error: "session_required" }, clearCookie);
    }
    if (
      unsafe.has(request.method) &&
      !equal(request.headers.get("x-csrf-token"), session.csrfToken)
    ) {
      return json(403, { error: "csrf_rejected" });
    }
    if (path === "/session/logout" && request.method === "POST") {
      session.closed = true;
      sessions.delete(id);
      if (session.refreshing) {
        try {
          await session.refreshing;
        } catch {
          /* Still revoke the latest known token. */
        }
      }
      // Local logout always completes. Upstream failure is explicit; no token/retry payload reaches the browser.
      try {
        const response = await call("/api/v1/auth/logout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refreshToken }),
        });
        return json(
          200,
          { authenticated: false, upstreamRevoked: response.ok },
          clearCookie,
        );
      } catch {
        return json(
          200,
          { authenticated: false, upstreamRevoked: false },
          clearCookie,
        );
      }
    }
    if (path === "/session/refresh" && request.method === "POST") {
      try {
        await refresh(id, session);
        return json(200, { authenticated: true });
      } catch {
        return json(401, { error: "session_expired" }, clearCookie);
      }
    }
    if (
      tokenRoutes.has(path) ||
      !path.startsWith("/api/v1/") ||
      (path.startsWith("/api/v1/auth/") &&
        ![
          "/api/v1/auth/me",
          "/api/v1/auth/permissions/search",
          "/api/v1/auth/sessions/search",
          "/api/v1/auth/change-password",
          "/api/v1/auth/reset-password",
          "/api/v1/auth/logout-all",
        ].includes(path) &&
        !/^\/api\/v1\/auth\/sessions\/[^/]+$/.test(path))
    ) {
      return json(404, { error: "route_unavailable" });
    }
    if (session.accessExpiresAt <= now() + 5000) {
      try {
        await refresh(id, session);
      } catch {
        return json(401, { error: "session_expired" }, clearCookie);
      }
    }
    const accessToken = session.accessToken;
    const headers = new Headers({
      authorization: `Bearer ${session.accessToken}`,
    });
    for (const key of ["content-type", "accept", "accept-language"]) {
      if (request.headers.has(key)) {
        headers.set(key, request.headers.get(key));
      }
    }
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer();
    if (session.closed || sessions.get(id) !== session) {
      return json(401, { error: "session_expired" }, clearCookie);
    }
    let response;
    try {
      response = await call(url.pathname + url.search, {
        method: request.method,
        headers,
        body,
      });
    } catch {
      return json(503, {
        error: "upstream_unavailable",
        uncertain: unsafe.has(request.method),
      });
    }
    if (response.status === 401) {
      try {
        if (session.accessToken === accessToken) {
          await refresh(id, session);
        }
        if (unsafe.has(request.method)) {
          return json(409, {
            error: "request_not_replayed",
            uncertain: true,
            sessionValid: true,
          });
        }
        headers.set("authorization", `Bearer ${session.accessToken}`);
        response = await call(url.pathname + url.search, {
          method: request.method,
          headers,
        });
      } catch {
        return json(401, { error: "session_expired" }, clearCookie);
      }
      if (response.status === 401) {
        session.closed = true;
        sessions.delete(id);
        return json(401, { error: "session_expired" }, clearCookie);
      }
    }
    if (session.closed || sessions.get(id) !== session) {
      return json(401, { error: "session_expired" }, clearCookie);
    }
    const outgoing = new Headers({
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    });
    for (const key of ["content-type", "content-disposition", "x-request-id"]) {
      if (response.headers.has(key)) {
        outgoing.set(key, response.headers.get(key));
      }
    }
    return new Response(
      response.status === 204 || request.method === "HEAD"
        ? null
        : await response.arrayBuffer(),
      { status: response.status, headers: outgoing },
    );
  };
}
