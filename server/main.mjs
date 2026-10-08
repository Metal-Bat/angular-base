import { createStaticAssets } from "./static-assets.mjs";
import { createServer } from "node:http";
import { createSessionBoundary } from "./session-boundary.mjs";

const browserOrigin =
  process.env.BOUNDARY_BROWSER_ORIGIN ?? "http://localhost:4200";
const maxBodyBytes = Number(
  process.env.BOUNDARY_MAX_BODY_BYTES ?? 11 * 1024 * 1024,
);
if (
  !Number.isSafeInteger(maxBodyBytes) ||
  maxBodyBytes < 1024 ||
  maxBodyBytes > 64 * 1024 * 1024
) {
  throw Error("Invalid body limit");
}
const development = process.env.NODE_ENV !== "production";
const handle = createSessionBoundary({
  browserOrigin,
  development,
  upstreamOrigin:
    process.env.BOUNDARY_UPSTREAM_ORIGIN ?? "http://127.0.0.1:8000",
  mode:
    process.env.BOUNDARY_CLIENT_MODE ??
    (development ? "public" : "confidential"),
  clientKey: process.env.BOUNDARY_CLIENT_KEY,
  clientSecret: process.env.BOUNDARY_CLIENT_SECRET,
  clientRelease: process.env.BOUNDARY_CLIENT_RELEASE,
});
const assets = process.env.FRONTEND_DIR
  ? await createStaticAssets(process.env.FRONTEND_DIR)
  : null;
const server = createServer(async (incoming, outgoing) => {
  try {
    const parts = [];
    let size = 0;
    for await (const part of incoming) {
      size += part.length;
      if (size > maxBodyBytes) {
        outgoing.writeHead(413);
        outgoing.end();
        return;
      }
      parts.push(part);
    }
    const url = new URL(incoming.url, browserOrigin);
    if (url.origin !== browserOrigin) {
      outgoing.writeHead(400);
      outgoing.end();
      return;
    }
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers,
      body: ["GET", "HEAD"].includes(incoming.method)
        ? undefined
        : Buffer.concat(parts),
    });
    const response =
      (assets && (await assets(request))) || (await handle(request));
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    outgoing.end(JSON.stringify({ error: "boundary_failure" }));
  }
});
server.listen(Number(process.env.BOUNDARY_PORT ?? 3000), "127.0.0.1", () => {
  console.log("Session boundary listening on loopback.");
});
