import { readFile, realpath, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
const types = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
};
export async function createStaticAssets(directory) {
  const root = await realpath(directory);
  await stat(resolve(root, "index.html"));
  return async function assets(request) {
    const url = new URL(request.url);
    if (
      url.pathname === "/session" ||
      url.pathname.startsWith("/session/") ||
      url.pathname === "/api" ||
      url.pathname.startsWith("/api/")
    )
      return null;
    if (!["GET", "HEAD"].includes(request.method))
      return new Response(null, {
        status: 405,
        headers: { allow: "GET, HEAD", "cache-control": "no-store" },
      });
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return new Response(null, { status: 400 });
    }
    if (
      pathname === "/api" ||
      pathname.startsWith("/api/") ||
      pathname === "/session" ||
      pathname.startsWith("/session/")
    )
      return null;
    if (pathname === "/health" || pathname === "/ready")
      return new Response(null, { status: 404 });
    if (
      pathname.includes("\\") ||
      pathname.includes("\0") ||
      pathname.split("/").some((part) => part === ".." || part.startsWith("."))
    )
      return new Response(null, { status: 404 });
    if (pathname.endsWith(".map")) return new Response(null, { status: 404 });
    let filename = resolve(root, "." + pathname);
    if (!extname(pathname)) filename = resolve(root, "index.html");
    try {
      const physical = await realpath(filename);
      if (!physical.startsWith(root + sep))
        return new Response(null, { status: 404 });
      if (!(await stat(physical)).isFile())
        return new Response(null, { status: 404 });
      const content = await readFile(physical);
      const immutable = /[.-][A-Z0-9]{8,}\.(js|css)$/.test(pathname);
      const refresh =
        physical === resolve(root, "index.html") ||
        pathname === "/runtime-config.json";
      return new Response(request.method === "HEAD" ? null : content, {
        headers: {
          "content-type":
            types[extname(physical)] ?? "application/octet-stream",
          "cache-control": refresh
            ? "no-store"
            : immutable
              ? "public, max-age=31536000, immutable"
              : "no-cache",
          "x-content-type-options": "nosniff",
          "referrer-policy": "same-origin",
          "x-frame-options": "DENY",
        },
      });
    } catch {
      return new Response(null, {
        status: 404,
        headers: { "cache-control": "no-store" },
      });
    }
  };
}
