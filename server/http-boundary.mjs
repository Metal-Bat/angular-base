import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export function createHttpBoundary({ browserOrigin, handle, assets = null }) {
  return async (incoming, outgoing) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    incoming.once("aborted", abort);
    const closed = () => {
      if (!outgoing.writableFinished) abort();
    };
    outgoing.once("close", closed);
    try {
      const url = new URL(incoming.url, browserOrigin);
      if (url.origin !== browserOrigin) {
        outgoing.writeHead(400, { "cache-control": "private, no-store" });
        outgoing.end();
        return;
      }
      const request = new Request(url, {
        method: incoming.method,
        headers: incoming.headers,
        signal: controller.signal,
        ...(["GET", "HEAD"].includes(incoming.method)
          ? {}
          : {
              body: Readable.toWeb(incoming),
              duplex: "half",
            }),
      });
      const response =
        (assets && (await assets(request))) || (await handle(request));
      if (outgoing.destroyed) {
        await response.body?.cancel();
        return;
      }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body)
        await pipeline(Readable.fromWeb(response.body), outgoing);
      else outgoing.end();
    } catch {
      if (outgoing.destroyed) return;
      if (outgoing.headersSent) {
        // Already delivered bytes cannot be replaced by an apparent JSON success.
        outgoing.destroy();
        return;
      }
      outgoing.writeHead(502, {
        "content-type": "application/json",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      });
      outgoing.end(
        JSON.stringify({
          error: "boundary_failure",
          uncertain: !["GET", "HEAD"].includes(incoming.method),
        }),
      );
    } finally {
      incoming.off("aborted", abort);
      outgoing.off("close", closed);
    }
  };
}
