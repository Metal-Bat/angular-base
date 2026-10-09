import { createStaticAssets } from "./static-assets.mjs";
import { createServer } from "node:http";
import { createHttpBoundary } from "./http-boundary.mjs";
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
  maxBodyBytes,
  maxInFlightRequests: Number(process.env.BOUNDARY_MAX_IN_FLIGHT_REQUESTS ?? 8),
  maxResponseBytes: Number(
    process.env.BOUNDARY_MAX_RESPONSE_BYTES ?? 11 * 1024 * 1024,
  ),
  transferTimeoutMs: Number(process.env.BOUNDARY_TRANSFER_TIMEOUT_MS ?? 60000),
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
const server = createServer(
  createHttpBoundary({ browserOrigin, handle, assets }),
);
server.listen(Number(process.env.BOUNDARY_PORT ?? 3000), "127.0.0.1", () => {
  console.log("Session boundary listening on loopback.");
});
