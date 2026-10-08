import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { spawnSync } from "node:child_process";
import { createStaticAssets } from "./static-assets.mjs";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnBrowser, browserName } from "./browser-launch.mjs";
import { once } from "node:events";
import { createSessionBoundary } from "./session-boundary.mjs";

const profile = await mkdtemp(join(tmpdir(), "workspace-browser-"));
const tls = process.env.TLS_BROWSER_CHECKS === "1";
if (tls && process.env.BROWSER_ENGINE !== "chromium") {
  await rm(profile, { recursive: true, force: true });
  throw Error(
    "The isolated self-signed TLS fixture requires BROWSER_ENGINE=chromium.",
  );
}
let httpsOptions;
let assets;
if (tls) {
  const certificate = spawnSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-days",
      "1",
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=IP:127.0.0.1",
      "-keyout",
      join(profile, "key.pem"),
      "-out",
      join(profile, "cert.pem"),
    ],
    { stdio: "ignore" },
  );
  if (certificate.status !== 0) {
    await rm(profile, { recursive: true, force: true });
    throw Error("Could not create isolated TLS fixture certificate.");
  }
  httpsOptions = {
    key: await readFile(join(profile, "key.pem")),
    cert: await readFile(join(profile, "cert.pem")),
  };
  for (const release of ["A", "B"]) {
    const directory = join(profile, release);
    await mkdir(directory);
    await writeFile(
      join(directory, "index.html"),
      `<h1>Release ${release}</h1>`,
    );
    await writeFile(
      join(
        directory,
        release === "A" ? "main-AAAAAAAB.js" : "main-BBBBBBBC.js",
      ),
      `const release='${release}';`,
    );
    await writeFile(
      join(directory, "runtime-config.json"),
      JSON.stringify({ release }),
    );
  }
  assets = await createStaticAssets(join(profile, "A"));
}
const browserCookies = [];
const cookieHeaders = [];
const calls = [];
const upstream = createServer(async (req, res) => {
  const parts = [];
  for await (const part of req) parts.push(part);
  calls.push({
    path: req.url,
    authorization: req.headers.authorization,
    body: Buffer.concat(parts).toString(),
  });
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify(
      req.url.endsWith("/login")
        ? {
            success: true,
            data: {
              access_token: "fixture-access",
              refresh_token: "fixture-refresh",
              expires_in: 120,
            },
          }
        : { success: true, data: { ok: true } },
    ),
  );
});
upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
let handle;
let resolveResult;
const result = new Promise((resolve) => {
  resolveResult = resolve;
});
const page = `<!doctype html><script>
(async () => {
 const check = (ok, message) => { if (!ok) throw Error(message); };
 ${
   tls
     ? `
 check(location.protocol==='https:','HTTPS fixture origin');
 for(const release of ['A','B','A']){
  await fetch('/test-release?to='+release);
  const page=await fetch('/studio/workflows/opaque%2Fpin/edit');
  check(page.headers.get('cache-control')==='no-store' && (await page.text()).includes('Release '+release),'Deep-link release switch/rollback');
  const asset=await fetch(release==='A'?'/main-AAAAAAAB.js':'/main-BBBBBBBC.js');
  check(asset.headers.get('cache-control')==='public, max-age=31536000, immutable' && (await asset.text()).includes("release='"+release+"'"),'Release-specific hashed asset');
  const config=await fetch('/runtime-config.json');check(config.headers.get('cache-control')==='no-store' && (await config.json()).release===release,'Fresh release configuration');
 }
 check((await fetch('/main-AAAAAAAB.js')).headers.get('cache-control')==='public, max-age=31536000, immutable','Hashed asset cache');
 check((await fetch('/runtime-config.json')).headers.get('cache-control')==='no-store','Runtime config cache');
 check((await fetch('/missing.js')).status===404 && (await fetch('/main-AAAAAAAB.js.map')).status===404,'Private/missing assets');
`
     : ""
 }
 const login = await fetch('/session/login', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'fixture',password:'fixture-password',client_secret:'forged-browser-secret'})});
 const text = await login.text(); const state = JSON.parse(text);
 check(login.status === 200, 'browser login');
 check(!/fixture-access|fixture-refresh|fixture-server-secret/.test(text), 'server tokens leaked');
 check(!document.cookie.includes('workspace_session'), 'cookie readable by JavaScript');
 check(localStorage.length === 0 && sessionStorage.length === 0, 'persistent state');
 const denied = await fetch('/api/v1/work-items/search', {method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 check(denied.status === 403, 'missing CSRF accepted');
 const accepted = await fetch('/api/v1/work-items/search', {method:'POST',headers:{'content-type':'application/json','x-csrf-token':state.csrfToken,'authorization':'Bearer browser-forgery'},body:'{}'});
 check(accepted.status === 200 && accepted.headers.get('cache-control').includes('no-store'), 'authorized request');
 const rawTokens = await fetch('/api/v1/auth/refresh', {method:'POST',headers:{'content-type':'application/json','x-csrf-token':state.csrfToken},body:'{}'});
 check(rawTokens.status === 404, 'raw token endpoint exposed');
 await fetch('/session/logout', {method:'POST',headers:{'x-csrf-token':state.csrfToken}});
 const status = await (await fetch('/session/status')).json();
 check(status.authenticated === false, 'logout retained actor');
 await fetch('/test-result', {method:'POST',body:JSON.stringify({ok:true})});
})().catch(async error => { await fetch('/test-result', {method:'POST',body:JSON.stringify({ok:false,error:error.message})}); });
</script>`;
const serveBrowser = async (req, res) => {
  browserCookies.push(req.headers.cookie ?? "");
  if (tls && req.url.startsWith("/test-release?")) {
    const release = new URL(req.url, "https://localhost").searchParams.get(
      "to",
    );
    if (!["A", "B"].includes(release)) {
      res.writeHead(400);
      res.end();
      return;
    }
    assets = await createStaticAssets(join(profile, release));
    res.end("ok");
    return;
  }
  if (req.url === "/") {
    res.setHeader("content-type", "text/html");
    res.end(page);
    return;
  }
  const parts = [];
  for await (const part of req) parts.push(part);
  if (req.url === "/test-result") {
    resolveResult(JSON.parse(Buffer.concat(parts)));
    res.end("ok");
    return;
  }
  try {
    const request = new Request(origin + req.url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : Buffer.concat(parts),
    });
    const response =
      (tls && (await assets(request))) || (await handle(request));
    if (response.headers.has("set-cookie"))
      cookieHeaders.push(response.headers.get("set-cookie"));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end();
  }
};
const browserServer = tls
  ? createHttpsServer(httpsOptions, serveBrowser)
  : createServer(serveBrowser);
browserServer.listen(0, "127.0.0.1");
await once(browserServer, "listening");
const origin =
  (tls ? "https://127.0.0.1:" : "http://127.0.0.1:") +
  browserServer.address().port;
handle = createSessionBoundary({
  browserOrigin: origin,
  upstreamOrigin: "http://127.0.0.1:" + upstream.address().port,
  development: !tls,
  mode: "confidential",
  clientKey: "fixture",
  clientSecret: "fixture-server-secret",
  clientRelease: "1.0.0",
});
let browser;
let timer;
try {
  await mkdir(join(profile, "browser"));
  browser = spawnBrowser(origin, join(profile, "browser"), {
    insecureTestTls: tls,
  });
  browser.on("error", (error) =>
    resolveResult({ ok: false, error: error.message }),
  );
  const outcome = await Promise.race([
    result,
    new Promise((resolve) => {
      timer = setTimeout(
        () => resolve({ ok: false, error: "Browser timeout after 45 seconds" }),
        45000,
      );
    }),
  ]);
  assert.equal(outcome.ok, true, outcome.error);
  assert.equal(
    JSON.parse(calls[0].body).client_secret,
    "fixture-server-secret",
  );
  assert.equal(
    calls.find((call) => call.path.endsWith("/search")).authorization,
    "Bearer fixture-access",
  );
  assert.equal(calls.filter((call) => call.path.endsWith("/search")).length, 1);
  if (tls) {
    assert.ok(
      browserCookies.some((cookie) =>
        cookie.startsWith("__Host-workspace_session="),
      ),
      "Browser did not send the production Secure cookie",
    );
    assert.ok(
      cookieHeaders.some(
        (cookie) =>
          cookie.startsWith("__Host-workspace_session=") &&
          cookie.includes("Secure") &&
          cookie.includes("HttpOnly") &&
          cookie.includes("Path=/") &&
          !cookie.includes("Domain="),
      ),
    );
    console.log(
      "Local HTTPS release rehearsal passed: production Secure/__Host cookie, A → B → A deep links, no-store/immutable caches and private asset denial. Self-signed certificate exception was confined to the temporary test browser.",
    );
  }
  console.log(
    browserName() +
      " network checks passed: HttpOnly cookie, server-only tokens/client secret, CSRF, bearer replacement, no-store, logout, empty storage.",
  );
} finally {
  clearTimeout(timer);
  if (browser && browser.exitCode === null) {
    browser.kill("SIGTERM");
    await once(browser, "exit");
  }
  await Promise.all([
    new Promise((resolve) => browserServer.close(resolve)),
    new Promise((resolve) => upstream.close(resolve)),
  ]);
  await rm(profile, { recursive: true, force: true });
}
