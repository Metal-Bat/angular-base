import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { spawnBrowser, browserName } from "./browser-launch.mjs";
import { once } from "node:events";
import { createSessionBoundary } from "./session-boundary.mjs";
// Seed only disposable accounts. This runner never logs credentials or response payloads.
const credentials = JSON.parse(
  await readFile(
    process.env.STUDIO_BROWSER_ACCOUNTS ?? "/tmp/studio-browser-accounts.json",
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
 const account = ${JSON.stringify(credentials).replaceAll("<", "\\u003c")};
 const wait = async (predicate, name) => { for (let n=0;n<400;n++) { if(predicate()) return; await new Promise(r=>setTimeout(r,25)); } throw Error('Timed out: '+name); };
 const check = (value,message) => { if(!value) throw Error(message); };
 const button = (label,root=document) => [...root.querySelectorAll('button')].find(el=>el.textContent.trim()===label && !el.disabled);
 const click = async(label,root=document) => { await wait(()=>button(label,root),label); button(label,root).click(); await new Promise(resolve => setTimeout(resolve,75)); };
 const fill = (id,value) => { const input=document.getElementById(id); check(input, 'Missing control '+id); input.value=value; input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true})); };
 const go = async(path,tag) => { history.pushState(null,'',path); window.dispatchEvent(new PopStateEvent('popstate')); await new Promise(resolve=>setTimeout(resolve,100)); await wait(()=>document.querySelector(tag),tag); await wait(()=>!document.querySelector(tag+' [role=status]')?.textContent.includes('Loading'),'Ready '+tag); };
 const confirm = async() => { await wait(()=>document.querySelector('dialog[open]'), 'Confirmation'); await click('Continue',document.querySelector('dialog[open]')); };
 const saved = async(label) => wait(()=>document.querySelector('main').textContent.includes(label) && !document.querySelector('main').textContent.includes('Loading…'),'Saved '+label);
 const measurements = [];
 const faults = []; window.addEventListener('error', event => faults.push(event.message)); window.addEventListener('unhandledrejection', event => faults.push(String(event.reason?.message ?? event.reason)));
 try {
  await wait(()=>document.getElementById('username'),'Login'); fill('username',account.username); fill('password',account.password); document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await wait(()=>document.querySelector('app-form-builder') && document.querySelector('app-form-builder').textContent.includes('DRAFT'),'Author form');
  fill('property-name','amount'); await click('Add to selected layout');
  fill('sample-json','{"amount":"125.750"}'); await click('Preview');
  await wait(()=>document.querySelector('app-runtime-form input'), 'Shared runtime preview');
  check([...document.querySelectorAll('app-runtime-form input')].some(input=>input.value==='125.750'),'Preview changed exact string');
  await click('Save draft'); await saved('Saved');
  fill('preview-purpose','print'); fill('preview-locale','fa'); await click('Preview');
  await wait(()=>document.querySelector('app-runtime-form')?.textContent.includes('125.750'),'Print preview');
  check(!document.querySelector('app-runtime-form input:not([disabled])'),'Print preview writable');
  await go('/studio/workflow-versions/'+account.version_ref+'/edit','app-workflow-board');
  fill('graph-json',JSON.stringify({steps:[{key:'unfinished'}],transitions:[],bindings:[],targets:[]})); await click('Apply graph edits');
  await wait(()=>document.querySelectorAll('.board-node').length===1,'Incomplete node');
  await click('Save workspace'); await saved('Workspace saved.');
  const node=document.querySelector('.board-node'); node.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
  await click('Save workspace'); await saved('Workspace saved.');
  document.querySelector('f-canvas').dispatchEvent(new WheelEvent('wheel',{deltaY:-100,clientX:400,clientY:250,bubbles:true,cancelable:true})); await new Promise(resolve=>setTimeout(resolve,100));
  await click('Save workspace'); await saved('Workspace saved.');
  const transform=node.style.transform;
  await click('Reload'); await wait(()=>document.querySelector('.board-node')?.style.transform===transform,'Reopened position');
  await click('Promote graph'); await confirm(); await wait(()=>document.querySelector('app-workflow-board [role=alert]'),'Invalid promotion rejected');
  check(document.querySelectorAll('.board-node').length===1,'Invalid WIP lost');
  await wait(()=>[...document.querySelectorAll('#type-key option')].some(option=>option.value==='TRANSFORM:1'),'Registered transform palette');
  fill('type-key','TRANSFORM:1'); fill('step-key','typedSource'); await click('Add step'); fill('step-key','typedTarget'); await click('Add step');
  await wait(()=>document.querySelectorAll('.data-port').length>=4,'Typed ports');
  fill('source-port','data:typedSource:out:result'); fill('target-port','data:typedTarget:in:value'); await click('Connect');
  await wait(()=>document.querySelectorAll('f-connection.data-edge').length===1,'Separate data edge');
  check(document.querySelectorAll('f-connection').length===1,'Data edge became control transition');
  for (const count of [16,64,256]) {
    const graph={steps:Array.from({length:count},(_,index)=>({key:'node'+index,type_code:'START',type_version_ref:account.graph.steps[0].type_version_ref,config:{}})),transitions:[],bindings:[],targets:[]};
    fill('graph-json',JSON.stringify(graph)); const started=performance.now(); await click('Apply graph edits'); await wait(()=>document.querySelectorAll('.board-node').length===count,'Canvas '+count);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    const mount=performance.now()-started;
    const first=document.querySelector('.board-node'); const movement=performance.now(); first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true})); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    measurements.push({nodes:count,mountMs:Math.round(mount),keyboardMoveMs:Math.round(performance.now()-movement),domNodes:document.querySelector('f-flow').querySelectorAll('*').length});
  }
  fill('graph-json',JSON.stringify(account.graph)); await click('Apply graph edits'); await wait(()=>document.querySelectorAll('.board-node').length===2,'Valid graph');
  await click('Save workspace'); await saved('Workspace saved.');
  await click('Validate'); await saved('"valid": true');
  await click('Promote graph'); await confirm(); await saved('Promoted.');
  await click('Publish'); await confirm(); await saved('Published immutable');
  check(!button('Save workspace') && !button('Apply graph edits'),'Published graph mutable');
  await go('/studio/clients','app-resource-catalog'); await click('Search'); await wait(()=>button('Restricted studio client'),'Client catalog'); await click('Restricted studio client'); await wait(()=>document.getElementById('author-name')?.value==='Restricted studio client','Client detail');
  await click('rotate'); await confirm(); await wait(()=>document.querySelector('app-resource-catalog aside details code'),'One-time secret');
  check(document.querySelector('app-resource-catalog aside details code').textContent.length>20,'Secret missing');
  await click('Dismiss secret'); check(!document.querySelector('app-resource-catalog aside details code'),'Secret retained');
  await go('/studio/request-types','app-resource-catalog'); await click('Search'); await wait(()=>button('Restricted studio request'),'Request type catalog'); await click('Restricted studio request');
  await wait(()=>document.getElementById('author-client_targets')?.value.includes('minimum_release'),'Restrictions loaded');
  const restrictions=document.getElementById('author-client_targets').value;
  fill('author-name','Renamed studio request'); await click('Save'); await saved('Saved');
  check(document.getElementById('author-client_targets').value===restrictions,'F03 rename lost client restrictions');
  const renamed=await fetch('/api/v1/request-types/'+account.request_type_ref).then(response=>response.json());
  check(JSON.stringify(renamed.data.client_targets)===JSON.stringify(JSON.parse(restrictions)),'F03 persisted restrictions changed');
  fill('author-client_targets','[]'); await click('Save'); await confirm(); await saved('Saved');
  check(document.getElementById('author-client_targets').value==='[]','Explicit clear failed');
  await go('/studio/library','app-library-tools'); await click('Search library'); await wait(()=>!document.querySelector('app-library-tools')?.textContent.includes('Loading'),'Reusable library');
  check(!document.querySelector('f-flow') && !document.querySelector('.board-node'),'Canvas retained after route destruction');
  check(localStorage.length===0 && sessionStorage.length===0,'Private author state persisted');
  await click('Sign out'); await wait(()=>document.getElementById('username'),'Signed out');
  fill('username',account.outsider); fill('password',account.password); document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await go('/studio/form-versions/'+account.form_ref+'/edit','app-access-denied');
  check(!document.querySelector('app-form-builder'),'Unauthorized author editor rendered');
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true,measurements})});
 } catch(error) { await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,error:error.message+'; faults:'+faults.join('|')+'; dialog:'+(document.querySelector('dialog[open]')?.textContent??'')+'; '+[...document.querySelectorAll('main [role=alert]')].map(el=>el.textContent).join('; ')})}); }
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
  browser = spawnBrowser(
    origin + "/studio/form-versions/" + credentials.form_ref + "/edit",
    profile,
  );
  browser.on("error", () =>
    resolveResult({ ok: false, error: browserName() + " could not start" }),
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
  console.log(JSON.stringify(outcome.measurements));
  console.log(
    browserName() +
      " studio backend passed: non-superuser author, shared runtime, incomplete workspace reopen, keyboard, bounded canvas, validated promotion/publication, catalogs, authorization and teardown.",
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
