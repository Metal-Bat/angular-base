import {
  largeRuntimeFixture,
  runtimePerformanceScript,
} from "./runtime-performance-fixture.mjs";
import { accessibilityScript } from "./accessibility-script.mjs";
import {
  administrationFixture,
  administrationScript,
} from "./administration-fixture.mjs";
import { createWorkspaceFixture } from "./workspace-fixture.mjs";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { spawnBrowser, browserName } from "./browser-launch.mjs";
import { once } from "node:events";
import { createSessionBoundary } from "./session-boundary.mjs";

const directory = process.env.BROWSER_APP_DIR ?? "dist/ng-architect/browser";
const index = await readFile(join(directory, "index.html"), "utf8");
const profile = await mkdtemp(join(tmpdir(), "workspace-auth-browser-"));
const calls = [];
const boundaryResponses = [];
const axe =
  process.env.ACCESSIBILITY_CHECKS === "1"
    ? await readFile("node_modules/axe-core/axe.min.js", "utf8")
    : "";
const workspace = createWorkspaceFixture();
let completedLogouts = 0;
let revoked = false;
let expire = false;
let performanceFields = 16;
const upstream = createServer(async (req, res) => {
  const parts = [];
  for await (const part of req) {
    parts.push(part);
  }
  const body = Buffer.concat(parts).toString();
  calls.push({ path: req.url, body, authorization: req.headers.authorization });
  res.setHeader("content-type", "application/json");
  let result;
  if (req.url.endsWith("/login") || req.url.endsWith("/refresh")) {
    if (
      req.url.endsWith("/login") &&
      JSON.parse(body).password !== "fixture-password"
    ) {
      res.statusCode = 401;
      result = { success: false, code: 1001 };
    } else if (req.url.endsWith("/refresh") && expire) {
      res.statusCode = 401;
      result = { success: false, code: 1002 };
    } else {
      result = {
        success: true,
        data: {
          access_token: "fixture-access",
          refresh_token: "fixture-refresh",
          expires_in: 120,
        },
      };
    }
  } else if (expire) {
    res.statusCode = 401;
    result = { success: false, code: 1002 };
  } else if (req.url.endsWith("/me")) {
    result = {
      success: true,
      data: {
        ref_id: "opaque-browser-user",
        username: "fixture-user",
        is_active: true,
      },
    };
  } else if (req.url.endsWith("/permissions/search")) {
    const page = JSON.parse(body).page;
    result = {
      success: true,
      result: {
        items: revoked
          ? []
          : page === 1
            ? process.env.ADMIN_BROWSER_CHECKS === "1"
              ? [
                  "requests.start",
                  "admin.users.manage",
                  "admin.tasks.manage",
                  "admin.permissions.manage",
                ]
              : ["requests.start"]
            : ["forms.manage"],
        page,
        size: 100,
        total: revoked ? 0 : 101,
        total_pages: revoked ? 0 : 2,
      },
    };
  } else if (
    process.env.ADMIN_BROWSER_CHECKS === "1" &&
    administrationFixture(req.url, body, req.method)
  ) {
    result = administrationFixture(req.url, body, req.method);
  } else if (
    process.env.PERFORMANCE_BROWSER_CHECKS === "1" &&
    req.url.includes("/business-requests/") &&
    new URL(req.url, "http://fixture.invalid").pathname.endsWith("/view")
  ) {
    result = { success: true, data: largeRuntimeFixture(performanceFields) };
  } else if (
    process.env.WORKSPACE_BROWSER_CHECKS === "1" ||
    process.env.PERFORMANCE_BROWSER_CHECKS === "1"
  ) {
    result = workspace.handle(req.method, req.url, body) ?? {
      success: true,
      data: null,
      code: 204,
    };
  } else {
    result = { success: true, data: null, code: 204 };
  }
  res.end(JSON.stringify(result));
});
upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
let handle;
let resolveResult;
const result = new Promise((resolve) => {
  resolveResult = resolve;
});
const script = `
(async () => {
 window.fixtureStage='start';
 window.fixtureMessages=[];
 const fixtureChannel=new BroadcastChannel('workspace-session'); fixtureChannel.onmessage=event=>window.fixtureMessages.push({message:typeof event.data==='string'?event.data:'structured',at:Math.round(performance.now())});
 const check = (ok, message) => { if (!ok) throw Error(message); };
 const wait = async (predicate, name) => { for (let i=0;i<200;i++) { if(predicate()) return; await new Promise(r=>setTimeout(r,25)); } throw Error('Timed out: '+name); };
 const text = () => document.querySelector('main')?.textContent ?? '';
 ${accessibilityScript}
 const login = async (password) => {
  await wait(()=>document.querySelector('#username'), 'login form');
  for (const [id,value] of [['username','fixture-user'],['password',password]]) {
   const input=document.getElementById(id); input.value=value; input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  await auditAccessibility('login');
  document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
 };
 const settleLogout = async (count) => { for(let i=0;i<200;i++){ const state=await (await fetch('/test-control?logout-status=1')).json(); if(state.completedLogouts>=count)return; await new Promise(r=>setTimeout(r,25)); } throw Error('Logout request did not finish'); };
 const phase = new URL(location.href).searchParams.get('browserPhase');
 window.fixtureStage=phase??'login';
 if (phase === 'performance') {
 ${runtimePerformanceScript}
 } else if (phase === 'admin') {
 ${administrationScript}
 } else if (phase === 'ui') {
  await wait(()=>document.querySelector('app-ui-showcase'),'UI controls');
  await wait(()=>window.ng?.getComponent(document.querySelector('app-ui-showcase')),'component readiness');
  const sample=document.querySelector('app-ui-showcase');
  const prime=sample.querySelector('input.p-inputtext'); const material=sample.querySelector('input[matinput]');
  check(prime && material,'both libraries');
  await auditAccessibility('shared-ui-light');
  const initialBackground=getComputedStyle(prime).backgroundColor;
  check(getComputedStyle(prime).fontFamily.includes('Arial') && getComputedStyle(material).fontFamily.includes('Arial'),'shared typography');
  for (const [input,value] of [[prime,'Ali ۱۲۳'],[material,'Review']]) { input.value=value; input.dispatchEvent(new Event('input',{bubbles:true})); }
  const open=sample.querySelector('p-button button'); await wait(()=>!open.disabled,'enabled preview');
  window.fixtureStage='dark';
  document.querySelector('header button[aria-pressed]').click();
  await wait(()=>document.documentElement.classList.contains('app-dark'),'dark theme');
  await wait(()=>getComputedStyle(prime).backgroundColor!==initialBackground,'Prime dark theme');
  window.fixtureStage='persian';
  document.querySelector('header button[aria-label="Language"]').click();
  await wait(()=>document.documentElement.dir==='rtl' && sample.textContent.includes('کنترل‌های فرم'),'Persian RTL');
  check(prime.value==='Ali ۱۲۳' && material.value==='Review','canonical values changed');
  await auditAccessibility('shared-ui-persian-dark');
  window.fixtureStage='prime-dialog';
  open.focus(); open.click(); await wait(()=>document.querySelector('.p-dialog'),'Prime dialog');
  await auditAccessibility('prime-dialog');
  check(document.querySelector('.p-dialog').getAttribute('aria-modal')==='true','modal semantics');
  check(document.querySelector('.p-dialog').textContent.includes('Ali ۱۲۳'),'dialog values');
  document.querySelector('.p-dialog-close-button').click(); await wait(()=>!document.querySelector('.p-dialog'),'close dialog');
  document.querySelector('header button[aria-label="زبان"]').click(); await wait(()=>document.documentElement.dir==='ltr','English restore');
  window.fixtureStage='confirmation';
  const cancel=sample.querySelector('button:not(.p-button)'); cancel.focus(); cancel.click();
  const dialog=document.querySelector('dialog'); await wait(()=>dialog.open,'native confirmation');
  check(dialog.matches(':modal') && dialog.contains(document.activeElement),'confirmation focus containment');
  dialog.dispatchEvent(new Event('cancel',{cancelable:true})); await wait(()=>!dialog.open,'cancel confirmation');
  check(document.activeElement===cancel,'focus restoration'); check(prime.value==='Ali ۱۲۳','cancel lost edits');
  window.fixtureStage='feedback';
  const component=window.ng.getComponent(sample);
  component.feedback.show({kind:'uncertain',message:'The outcome is unknown. Check the current state before trying again.'});
  await wait(()=>text().includes('The outcome is unknown'),'uncertain feedback');
  component.feedback.show({kind:'error',message:'Review these fields',issues:[{pointer:'/sample/name',label:'Name',message:'Required'}]});
  await wait(()=>document.querySelector('main [role="status"] a'),'validation summary');
  document.querySelector('main [role="status"] a').click(); check(document.activeElement===prime,'linked issue focus');
  check(getComputedStyle(prime).outlineStyle==='solid','visible focus');
  window.fixtureStage='viewport';
  const menu=document.querySelector('header .mobile-menu');
  const nav=document.getElementById('area-navigation');
  check(getComputedStyle(nav).display==='none','collapsed small-screen navigation');
  menu.focus(); check(document.activeElement===menu,'menu keyboard focus'); menu.click();
  await wait(()=>menu.getAttribute('aria-expanded')==='true' && getComputedStyle(nav).display!=='none','expanded small-screen navigation');
  menu.click(); await wait(()=>getComputedStyle(nav).display==='none','collapsed navigation restore');

  check(!document.documentElement.scrollWidth || document.documentElement.scrollWidth<=window.innerWidth+1,'responsive overflow');
  await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true, accessibility})});
 } else if (phase === 'workspace') {
  const button = label => [...document.querySelectorAll('main button')].find(node=>node.textContent.trim()===label);
  const input = (pointer,value) => { const node=document.getElementById('field-'+encodeURIComponent(pointer)); check(node && node.tagName==='INPUT','writable field '+pointer); node.value=value;node.dispatchEvent(new Event('input',{bubbles:true})); };
  const approveDialog=async()=>{ const dialog=document.querySelector('dialog'); await wait(()=>dialog?.open,'confirmation dialog'); [...dialog.querySelectorAll('button')].find(node=>node.textContent.trim()==='Continue').click(); await wait(()=>!dialog.open,'confirmation closed'); };
  window.fixtureStage='catalog'; await wait(()=>button('Create draft'),'eligible catalog'); button('Create draft').click();
  await wait(()=>document.querySelector('h1')?.textContent.trim()==='Request detail' && button('Save'),'pinned request runtime');
  window.fixtureStage='request-edit'; input('/amount','125.75');
  check(document.getElementById('field-'+encodeURIComponent('/decimal')).value==='12345678901234567890.123456789','exact decimal display');
  button('Submit').click(); await approveDialog(); await wait(()=>text().includes('RUNNING') && !button('Submit') && !button('Check current state').disabled,'immediate running request');
  const tracking=document.querySelector('main a[href^="/operations/processes/"]'); check(tracking,'real process tracking link'); tracking.click();
  await wait(()=>document.querySelector('h1')?.textContent.trim()==='Process tracking' && text().includes('RUNNING'),'authorized tracking entry');
  window.fixtureStage='inbox'; history.pushState(null,'','/operations/tasks'); window.dispatchEvent(new PopStateEvent('popstate'));
  await wait(()=>document.querySelector('h1')?.textContent.trim()==='Task inbox' && document.querySelector('main a[href^="/operations/tasks/"]'),'task inbox');
  document.querySelector('main a[href^="/operations/tasks/"]').click();
  await wait(()=>button('Claim') && !button('Claim').disabled,'observer task'); check(!button('Approve'),'observer decision controls');
  window.fixtureStage='claim'; button('Claim').click(); await wait(()=>button('Approve') && button('Save'),'claimed authorized task');
  const readonly=document.getElementById('field-'+encodeURIComponent('/approved')); check(readonly?.tagName==='OUTPUT' && readonly.textContent.includes('false'),'readonly boolean');
  window.fixtureStage='task-save'; input('/amount','150.25'); button('Save').click(); await wait(()=>text().includes('task/saved') && button('Approve'),'filtered save');
  button('Approve').click(); await approveDialog(); await wait(()=>text().includes('COMPLETED') && !button('Approve'),'completed task');
  await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true, accessibility})});
 } else if (phase === 'reload') {
  await wait(()=>text().includes('Operations'),'reload bootstrap');
  check(document.querySelector('nav a[href="/studio"]'), 'permission beyond page one');
  check(!!document.querySelector('nav a[href="/administration"]'), 'authorized administration navigation');
  const frame=document.createElement('iframe'); frame.src='/operations?peer=1'; document.body.append(frame);
  await wait(()=>frame.contentDocument?.querySelector('h1')?.textContent==='Operations', 'second tab');
  document.querySelector('header details button').click();
  await wait(()=>text().includes('Sign in'), 'logout');
  await wait(()=>frame.contentDocument?.querySelector('h1')?.textContent==='Sign in', 'cross-tab logout');
  frame.remove(); await settleLogout(1);
  check(localStorage.length===0 && sessionStorage.length===0,'persistent credentials');
  await login('fixture-password'); await wait(()=>text().includes('Operations'),'second login');
  await fetch('/test-control?revoke=1'); window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('focus'));
  await wait(()=>text().includes('Access denied'),'revoked permission');
  check(!document.querySelector('nav a[href="/operations"]'),'revoked navigation');
  await fetch('/test-control?restore=1'); document.querySelector('header details button').click();
  await wait(()=>text().includes('Sign in'),'logout after revoke'); await settleLogout(2);
  await login('fixture-password'); await wait(()=>text().includes('Operations'),'third login');
 ${process.env.PERFORMANCE_BROWSER_CHECKS === "1" ? "location.href='/operations?browserPhase=performance'; return;" : ""}
 ${process.env.ADMIN_BROWSER_CHECKS === "1" ? "location.href='/administration/users?browserPhase=admin'; return;" : ""}
 ${process.env.UI_BROWSER_CHECKS === "1" ? "location.href='/ui-preview?browserPhase=ui'; return;" : ""}
 ${process.env.WORKSPACE_BROWSER_CHECKS === "1" ? "location.href='/operations/catalog?browserPhase=workspace'; return;" : ""}
  await fetch('/test-control?expire=1'); window.dispatchEvent(new Event('focus'));
  await wait(()=>text().includes('Sign in'),'expired family');
  await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true, accessibility})});
 } else if (!new URL(location.href).searchParams.has('peer')) {
  await wait(()=>text().includes('Sign in'),'signed-out redirect');
  check(!document.querySelector('app-operations-home'),'protected content flash');
  await login('wrong'); await wait(()=>text().includes('incorrect'),'invalid login');
  check(document.getElementById('password').value==='','password retained');
  history.replaceState(null,'','/login?returnTo=https%3A%2F%2Fevil.invalid');
  await login('fixture-password'); await wait(()=>text().includes('Operations'),'valid login');
  check(location.origin===${JSON.stringify("ORIGIN_PLACEHOLDER")},'external redirect');
  location.href='/operations?browserPhase=reload';
 }
})().catch(async error=>{ await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:false,error:window.fixtureStage+': '+error.message+' messages='+JSON.stringify(window.fixtureMessages)+' @ '+location.pathname+' '+document.querySelector('main')?.textContent?.slice(0,1400),stack:error.stack})}); });
`;
const browserServer = createServer(async (req, res) => {
  const url = new URL(req.url, origin);
  const parts = [];
  for await (const part of req) {
    parts.push(part);
  }
  if (url.pathname === "/test-result") {
    resolveResult(JSON.parse(Buffer.concat(parts)));
    res.end("ok");
    return;
  }
  if (url.pathname === "/test-control") {
    if (url.searchParams.has("logout-status")) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ completedLogouts }));
      return;
    }
    revoked = url.searchParams.has("revoke")
      ? true
      : url.searchParams.has("restore")
        ? false
        : revoked;
    expire = url.searchParams.has("expire");
    if (url.searchParams.has("fields"))
      performanceFields = Number(url.searchParams.get("fields"));
    res.end("ok");
    return;
  }
  try {
    if (
      url.pathname.startsWith("/session/") ||
      url.pathname.startsWith("/api/")
    ) {
      const response = await handle(
        new Request(origin + req.url, {
          method: req.method,
          headers: req.headers,
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : Buffer.concat(parts),
        }),
      );
      boundaryResponses.push({ path: url.pathname, status: response.status });
      if (url.pathname === "/session/logout") completedLogouts += 1;
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (url.pathname === "/runtime-config.json") {
      res.setHeader("content-type", "application/json");
      res.end(await readFile("public/runtime-config.json"));
      return;
    }
    if (extname(url.pathname)) {
      const extension = extname(url.pathname);
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
    const injected = url.searchParams.has("peer")
      ? ""
      : "<script>" +
        axe +
        "</script><script>" +
        script.replace("ORIGIN_PLACEHOLDER", origin) +
        "</script>";
    res.end(index.replace("</body>", injected + "</body>"));
  } catch (error) {
    res.writeHead(500);
    res.end("Fixture failed");
  }
});
browserServer.listen(0, "127.0.0.1");
await once(browserServer, "listening");
const origin = "http://127.0.0.1:" + browserServer.address().port;
handle = createSessionBoundary({
  browserOrigin: origin,
  upstreamOrigin: "http://127.0.0.1:" + upstream.address().port,
  development: true,
  mode: "confidential",
  clientKey: "fixture",
  clientSecret: "fixture-server-secret",
  clientRelease: "1.0.0",
});
let browser;
let timer;
try {
  browser = spawnBrowser(origin + "/operations", profile);
  browser.on("error", (error) =>
    resolveResult({ ok: false, error: error.message }),
  );
  const outcome = await Promise.race([
    result,
    new Promise((resolve) => {
      timer = setTimeout(
        () => resolve({ ok: false, error: "Browser timeout" }),
        45000,
      );
    }),
  ]);
  assert.equal(
    outcome.ok,
    true,
    outcome.error +
      (!outcome.ok
        ? "\nBoundary response metadata: " + JSON.stringify(boundaryResponses)
        : "") +
      (outcome.stack ? "\n" + outcome.stack : ""),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.path.endsWith("/permissions/search") &&
        JSON.parse(call.body).page === 2,
    ),
  );
  if (
    !process.env.ADMIN_BROWSER_CHECKS &&
    !process.env.UI_BROWSER_CHECKS &&
    !process.env.WORKSPACE_BROWSER_CHECKS &&
    !process.env.PERFORMANCE_BROWSER_CHECKS
  ) {
    assert.ok(calls.some((call) => call.path.endsWith("/refresh")));
  }
  if (process.env.WORKSPACE_BROWSER_CHECKS === "1") {
    const records = workspace.records;
    const submit = records.find((call) => call.path.endsWith("/submit"));
    assert.deepEqual(Object.keys(submit.payload), ["submit_key"]);
    assert.ok(
      records.some(
        (call) => call.method === "PUT" && call.payload.data.amount === 125.75,
      ),
    );
    const saves = records.filter(
      (call) => call.path.endsWith("/save") || call.path.endsWith("/complete"),
    );
    for (const call of saves) {
      assert.ok(!Object.hasOwn(call.payload.data, "approved"));
      assert.ok(!Object.hasOwn(call.payload.data, "decimal"));
      assert.ok(call.payload.command_key);
    }
    assert.equal(saves.at(-1).payload.outcome_key, "APPROVE");
  }
  if (process.env.BROWSER_REPORT_PATH) {
    await mkdir(dirname(process.env.BROWSER_REPORT_PATH), { recursive: true });
    await writeFile(
      process.env.BROWSER_REPORT_PATH,
      JSON.stringify(
        {
          engine: browserName(),
          date: new Date().toISOString(),
          measurements: outcome.measurements,
          accessibility: outcome.accessibility,
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (outcome.measurements)
    console.log("Runtime performance: " + JSON.stringify(outcome.measurements));
  if (outcome.accessibility?.length)
    console.log("Accessibility: " + JSON.stringify(outcome.accessibility));
  console.log(
    process.env.PERFORMANCE_BROWSER_CHECKS === "1"
      ? browserName() +
          " runtime performance fixture passed: 16/64/256 fields, five mount/edit/teardown cycles, exact strings and empty storage."
      : process.env.ADMIN_BROWSER_CHECKS === "1"
        ? browserName() +
          " administration passed: confirmation, transient passwords, redaction, paging, current references, task IDs, queue state, revocation and cleanup."
        : process.env.WORKSPACE_BROWSER_CHECKS === "1"
          ? browserName() +
            " workspace passed: eligible draft, exact canonical values, save-before-submit, tracking, claim, filtered save, completion and readonly policy."
          : process.env.UI_BROWSER_CHECKS === "1"
            ? browserName() +
              " UI checks passed: shared typography, dark theme, Persian RTL, preserved values, modal semantics, confirmation focus, linked validation, responsive layout."
            : browserName() +
              " Angular journeys passed: invalid/valid login, reload, multi-page permissions, revocation, cross-tab logout, expiry, safe return, empty storage.",
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
