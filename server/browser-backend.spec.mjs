import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createSessionBoundary } from "./session-boundary.mjs";
// Seed only disposable accounts. This runner never logs credentials or response payloads.
const credentials = JSON.parse(
  await readFile(
    process.env.BACKEND_BROWSER_ACCOUNTS ?? "/tmp/frontend-steps-accounts.json",
    "utf8",
  ),
);
const directory = process.env.BROWSER_APP_DIR ?? "dist/ng-architect/browser";
const index = await readFile(join(directory, "index.html"), "utf8");
const profile = await mkdtemp(join(tmpdir(), "real-backend-browser-"));
let resolveResult;
const result = new Promise((resolve) => {
  resolveResult = resolve;
});
let boundary;
const calls = [];
const script = `
(async () => {
 const accounts = ${JSON.stringify(credentials).replaceAll("<", "\\u003c")};
 const wait = async (predicate, name) => { for (let n=0;n<400;n++) { if(predicate()) return; await new Promise(r=>setTimeout(r,25)); } throw Error('Timed out: '+name); };
 const check = (value,message) => { if(!value) throw Error(message); };
 const button = (label,root=document) => [...root.querySelectorAll('button')].find(el=>el.textContent.trim()===label && !el.disabled);
 const click = async(label,root=document) => { await wait(()=>button(label,root),label); button(label,root).click(); await new Promise(resolve => setTimeout(resolve,75)); };
 const fill = (id,value) => { const input=document.getElementById(id); check(input, 'Missing control '+id); input.value=value; input.dispatchEvent(new Event('input',{bubbles:true})); };
 const login = async(index) => { await wait(()=>document.querySelector('#username'), 'Login'); fill('username',accounts.users[index]); fill('password', accounts.password); document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); };
 const field = (scope) => 'field-'+encodeURIComponent(scope);
 const ready = async() => wait(()=>document.querySelector('app-runtime-form') && !document.querySelector('app-case-detail [role="status"]'), 'Runtime readiness');
 const confirm = async() => { await wait(()=>document.querySelector('dialog[open]'), 'Confirmation'); await click('Continue',document.querySelector('dialog[open]')); };
 try {
  await login(0); await wait(()=>document.querySelector('app-request-catalog'), 'Catalog');
  await click('Create draft'); await ready();
  fill(field('/amount'),'125.750'); await click('Save'); await wait(()=>document.querySelector('app-case-detail')?.textContent.includes('Saved') && !document.querySelector('app-case-detail')?.textContent.includes('Loading…'),'Saved');
  check(document.getElementById(field('/amount')).value==='125.750', 'Exact decimal string changed');
  await click('Next page'); await wait(()=>button('Add row'),'Rows page');
  await click('Add row'); await wait(()=>document.querySelector('[data-row-key]'), 'Stable row');
  const firstKey=document.querySelector('[data-row-key]').dataset.rowKey;
  fill(field('/lines/0/note'),'First row'); await click('Save');
  await wait(()=>document.getElementById(field('/lines/0/note'))?.value==='First row' && document.querySelector('app-case-detail')?.textContent.includes('Saved'), 'Row saved');
  await click('Duplicate row'); await wait(()=>document.querySelectorAll('[data-row-key]').length===2,'Duplicated row');
  check(new Set([...document.querySelectorAll('[data-row-key]')].map(el=>el.dataset.rowKey)).size===2,'Duplicate key');
  check(document.querySelector('[data-row-key]').dataset.rowKey===firstKey,'Original row identity changed');
  await click('Submit'); await confirm(); await wait(()=>document.querySelector('a[href*="/operations/processes/"]') && !document.querySelector('app-case-detail')?.textContent.includes('Loading…'),'Process reference');
  document.querySelector('a[href*="/operations/processes/"]').click(); await wait(()=>document.querySelector('app-process-entry')?.textContent.includes('Timeline') && document.querySelector('app-process-entry')?.textContent.includes('WAITING'),'Real timeline');
  await click('Sign out'); await login(1); await wait(()=>document.querySelector('a[href="/operations/tasks"]'),'Task navigation'); document.querySelector('a[href="/operations/tasks"]').click();
  await wait(()=>document.querySelector('app-task-inbox a[href*="/operations/tasks/"]'),'Available task'); document.querySelector('app-task-inbox a[href*="/operations/tasks/"]').click();
  await click('Claim'); await wait(()=>document.getElementById(field('/amount'))?.tagName==='INPUT' && !document.getElementById(field('/amount')).disabled,'Claimed form');
  check(!document.getElementById(field('/private_note')) && !document.querySelector('main').textContent.includes('hidden-default'),'Hidden field disclosed');
  fill(field('/amount'),'200.000'); await click('Save'); await wait(()=>document.querySelector('app-case-detail')?.textContent.includes('Saved') && !document.querySelector('app-case-detail')?.textContent.includes('Loading…'),'Reviewer save');
  await click('Approve'); await confirm(); await wait(()=>document.querySelector('app-case-detail')?.textContent.includes('COMPLETED'),'Completed task');
  check(!document.getElementById(field('/private_note')),'Hidden field disclosed after completion');
  check(localStorage.length===0 && sessionStorage.length===0,'Private state persisted in browser storage');
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true})});
 } catch(error) { await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,error:error.message+"; "+[...document.querySelectorAll("app-case-detail [role=alert]")].map(el=>el.textContent).join("; ")})}); }
})();`;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const parts = [];
    for await (const part of req) parts.push(part);
    if (url.pathname === "/__result") {
      resolveResult(JSON.parse(Buffer.concat(parts)));
      res.end("ok");
      return;
    }
    if (
      url.pathname.startsWith("/session/") ||
      url.pathname.startsWith("/api/")
    ) {
      const response = await boundary(
        new Request(origin + req.url, {
          method: req.method,
          headers: req.headers,
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : Buffer.concat(parts),
        }),
      );
      calls.push({
        method: req.method,
        path: url.pathname,
        status: response.status,
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (url.pathname === "/runtime-config.json") {
      res.setHeader("content-type", "application/json");
      res.end(await readFile("public/runtime-config.json"));
      return;
    }
    const extension = extname(url.pathname);
    if (extension) {
      res.setHeader(
        "content-type",
        {
          ".js": "application/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".woff2": "font/woff2",
        }[extension] ?? "application/octet-stream",
      );
      res.end(await readFile(join(directory, url.pathname)));
      return;
    }
    res.setHeader("content-type", "text/html");
    res.end(index.replace("</body>", "<script>" + script + "</script></body>"));
  } catch {
    res.writeHead(500);
    res.end("Browser test service failed");
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const origin = "http://127.0.0.1:" + server.address().port;
boundary = createSessionBoundary({
  browserOrigin: origin,
  upstreamOrigin:
    process.env.BACKEND_BROWSER_ORIGIN ?? "http://127.0.0.1:58800",
  development: true,
  mode: "public",
});
let browser;
let timeout;
try {
  browser = spawn(
    process.env.FIREFOX_BINARY ?? "firefox",
    [
      "--headless",
      "--no-remote",
      "--profile",
      profile,
      origin + "/operations/catalog",
    ],
    { stdio: "ignore" },
  );
  browser.on("error", () =>
    resolveResult({ ok: false, error: "Firefox could not start" }),
  );
  const outcome = await Promise.race([
    result,
    new Promise((resolve) => {
      timeout = setTimeout(
        () => resolve({ ok: false, error: "Browser journey timeout" }),
        90000,
      );
    }),
  ]);
  assert.equal(
    outcome.ok,
    true,
    outcome.error + "\n" + JSON.stringify(calls.slice(-10)),
  );
  console.log(
    "Firefox real backend passed: ordinary requester/reviewer, exact decimal, stable row duplication, private policy, save, submit, timeline, claim and completion.",
  );
} finally {
  clearTimeout(timeout);
  if (browser && browser.exitCode === null) {
    browser.kill("SIGTERM");
    await once(browser, "exit");
  }
  await new Promise((resolve) => server.close(resolve));
  await rm(profile, { recursive: true, force: true });
}
