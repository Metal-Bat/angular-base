import { reviewerBrowserJourney } from "./reviewer-browser-journey.mjs";
import { reviewerRace } from "./reviewer-race.mjs";
import { publicBrowserStorageCheck } from "./browser-storage-policy.mjs";
import { administrationDetailsBrowserJourney } from "./administration-details-browser-journey.mjs";
import { inlineAttachmentsBrowserJourney } from "./inline-attachments-browser-journey.mjs";
import { formDesignerBrowserJourney } from "./form-designer-browser-journey.mjs";
import { agentEditorBrowserJourney } from "./agent-editor-browser-journey.mjs";
import { receiptBrowserJourney } from "./receipt-browser-journey.mjs";
import { nodeAuthoringBrowserJourney } from "./node-authoring-browser-journey.mjs";
import { formLayoutBrowserJourney } from "./form-layout-browser-journey.mjs";
import { analyticsBrowserJourney } from "./analytics-browser-journey.mjs";
import { calendarBrowserJourney } from "./calendar-browser-journey.mjs";
import { createHash } from "node:crypto";
import { supportBrowserJourney } from "./support-browser-journey.mjs";
import { readinessBrowserJourney } from "./readiness-browser-journey.mjs";
import { helpBrowserJourney } from "./help-browser-journey.mjs";
import { collectionsBrowserJourney } from "./collections-browser-journey.mjs";
import { foundationsBrowserJourney } from "./foundations-browser-journey.mjs";
import {
  notificationBrowserJourney,
  liveObservationScript,
} from "./notification-browser-journey.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  browserDiagnosticsScript,
  assertBrowserDiagnostics,
} from "./browser-diagnostics.mjs";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  readFile,
  mkdtemp,
  rm,
  writeFile,
  mkdir,
  readdir,
} from "node:fs/promises";
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
// The optional requester uses only the guarded owned fixture's existing actor.
if (
  process.env.RECEIPT_BROWSER_CHECKS === "1" &&
  process.env.RECEIPT_BACKEND_ROOT
) {
  const target = join(profile, "requester.json");
  await promisify(execFile)(
    process.env.RECEIPT_BACKEND_PYTHON,
    [
      join(process.cwd(), "scripts/receipt-paired-requester.py"),
      process.env.BACKEND_BROWSER_ACCOUNTS,
      target,
    ],
    {
      cwd: process.env.RECEIPT_BACKEND_ROOT,
      env: process.env,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  credentials.requester = JSON.parse(await readFile(target, "utf8")).username;
}
let resolveResult;
const result = new Promise((resolve) => {
  resolveResult = resolve;
});
let boundary;
const calls = [];
const streams = new Set();
let offline = false;
let maxStreams = 0;
const notifications = process.env.NOTIFICATION_BROWSER_CHECKS === "1";
let receiptDrop =
  process.env.RECEIPT_BROWSER_CHECKS === "1" &&
  process.env.RECEIPT_DROP_APPROVAL_RESPONSE === "1";
let receiptDrops = 0;
const foundations = process.env.FOUNDATIONS_BROWSER_CHECKS === "1";
const foundationTask = process.env.FOUNDATION_TASK || null;
const formDesignerScope = process.env.FORM_DESIGNER_SCOPE || "core";
assert.ok(
  ["core", "repairs", "kinds", "presentation"].includes(formDesignerScope) &&
    (formDesignerScope === "core" || (foundations && foundationTask === "016")),
  "Unsupported form designer dataset",
);
assert.ok(
  !foundationTask ||
    (foundations &&
      [
        "009",
        "010",
        "011",
        "013",
        "014",
        "015",
        "016",
        "021",
        "028",
        "029",
        "030",
        "031",
      ].includes(foundationTask)),
  "Unsupported task scope",
);
if (foundations) {
  await mkdir(join(profile, "downloads"));
  await writeFile(
    join(profile, "user.js"),
    [
      ...(["009", "015", "016"].includes(foundationTask)
        ? ['user_pref("dom.disable_open_during_load", false);']
        : []),
      ...(["015", "016"].includes(foundationTask)
        ? ['user_pref("dom.disable_window_move_resize", false);']
        : []),
      'user_pref("browser.download.folderList", 2);',
      'user_pref("browser.download.useDownloadDir", true);',
      'user_pref("browser.download.alwaysOpenPanel", false);',
      'user_pref("browser.helperApps.neverAsk.saveToDisk", "image/png,image/jpeg,image/webp,application/octet-stream,text/plain");',
      'user_pref("browser.download.always_ask_before_handling_new_types", false);',
      'user_pref("browser.download.dir", ' +
        JSON.stringify(join(profile, "downloads")) +
        ");",
    ].join("\n"),
  );
}
let inlineDropReceipt = false;
let inlineDropAvatarReceipt = false;
const inlineTransferEvidence = {
  fileUploads: 0,
  imageUploads: 0,
  attachmentPosts: 0,
  replacements: 0,
  avatarPatches: 0,
  droppedAttachmentReceipts: 0,
  droppedAvatarReceipts: 0,
  validationFailures: [],
};
let reviewerDropCompletion = false;
const reviewerCommands = [];
let calendarDropResponses = false;
const calendarCommands = [];
let supportNetworkFault = false;
const supportEvidence = [];
let typedViewApplied = false;
let progress = { scenarios: [], diagnostics: [] };
const calendarEvidence = [];

const script =
  process.env.RECEIPT_BROWSER_CHECKS === "1"
    ? receiptBrowserJourney(credentials)
    : foundations
      ? foundationTask === "009"
        ? collectionsBrowserJourney(credentials)
        : foundationTask === "010"
          ? helpBrowserJourney(credentials)
          : foundationTask === "011"
            ? readinessBrowserJourney(credentials)
            : foundationTask === "013"
              ? supportBrowserJourney(credentials)
              : foundationTask === "014"
                ? calendarBrowserJourney(credentials)
                : foundationTask === "015"
                  ? analyticsBrowserJourney(credentials)
                  : foundationTask === "029"
                    ? reviewerBrowserJourney(credentials)
                    : foundationTask === "028"
                      ? inlineAttachmentsBrowserJourney(credentials)
                      : foundationTask === "021"
                        ? nodeAuthoringBrowserJourney(credentials)
                        : foundationTask === "030"
                          ? agentEditorBrowserJourney(credentials)
                          : foundationTask === "031"
                            ? administrationDetailsBrowserJourney(credentials)
                            : foundationTask === "016"
                              ? formDesignerScope === "core"
                                ? formLayoutBrowserJourney(credentials)
                                : formDesignerBrowserJourney(
                                    credentials,
                                    formDesignerScope,
                                  )
                              : foundationsBrowserJourney(credentials)
      : notifications
        ? notificationBrowserJourney(credentials)
        : `
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
  await click('Sign out'); await login(1); await wait(()=>location.pathname!=='/login'&&!document.getElementById('username')&&document.querySelector('details.account-menu summary')?.textContent.includes(accounts.users[1]),'Reviewer authenticated landing'); await wait(()=>document.querySelector('a[href="/operations/tasks"]'),'Task navigation'); document.querySelector('a[href="/operations/tasks"]').click();
  await wait(()=>document.querySelector('app-task-inbox a[href*="/operations/tasks/"]'),'Available task'); document.querySelector('app-task-inbox a[href*="/operations/tasks/"]').click();
  await click('Claim'); await wait(()=>document.getElementById(field('/amount'))?.tagName==='INPUT' && !document.getElementById(field('/amount')).disabled,'Claimed form');
  check(!document.getElementById(field('/private_note')) && !document.querySelector('main').textContent.includes('hidden-default'),'Hidden field disclosed');
  fill(field('/amount'),'200.000'); await click('Save'); await wait(()=>document.querySelector('app-case-detail')?.textContent.includes('Saved') && !document.querySelector('app-case-detail')?.textContent.includes('Loading…'),'Reviewer save');
  await click('Approve'); await confirm(); await wait(()=>document.querySelector('app-case-detail')?.textContent.includes('COMPLETED'),'Completed task');
  check(!document.getElementById(field('/private_note')),'Hidden field disclosed after completion');
  check(${publicBrowserStorageCheck},'Private state persisted in browser storage');
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true,diagnostics:window.fixtureDiagnostics})});
 } catch(error) { await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,error:error.message+"; "+[...document.querySelectorAll("app-case-detail [role=alert]")].map(el=>el.textContent).join("; "),diagnostics:window.fixtureDiagnostics})}); }
})();`;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const parts = [];
    for await (const part of req) parts.push(part);
    if (
      foundationTask === "009" &&
      url.pathname === "/__collection-query-evidence"
    ) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ typedViewApplied }));
      return;
    }
    if (
      foundationTask === "009" &&
      url.pathname === "/api/v1/business-requests/search" &&
      req.method === "POST"
    ) {
      const query = JSON.parse(Buffer.concat(parts).toString("utf8"));
      typedViewApplied ||=
        query.page === 1 &&
        query.size === 35 &&
        query.scope === "mine" &&
        query.filters?.length === 1 &&
        query.filters[0].field_name === "priority" &&
        query.filters[0].operation === "gte" &&
        query.filters[0].value === 0 &&
        query.sort_orders?.length === 1 &&
        query.sort_orders[0].field_name === "created_at" &&
        query.sort_orders[0].operation === "desc";
    }
    if (
      foundations &&
      foundationTask === "029" &&
      url.pathname === "/__reviewer-evidence"
    ) {
      if (req.method === "POST")
        reviewerDropCompletion =
          JSON.parse(Buffer.concat(parts).toString("utf8")).dropCompletion ===
          true;
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify({ commands: reviewerCommands }));
      return;
    }
    if (
      foundations &&
      foundationTask === "029" &&
      url.pathname === "/__reviewer-race" &&
      req.method === "POST"
    ) {
      const body = JSON.parse(Buffer.concat(parts).toString("utf8"));
      const result = await reviewerRace(
        credentials,
        process.env.BACKEND_BROWSER_ORIGIN,
        body.ref,
      );
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(result));
      return;
    }
    if (
      foundations &&
      foundationTask === "029" &&
      [
        "/__reviewer-intake",
        "/__reviewer-finish",
        "/__reviewer-literal-finish",
      ].includes(url.pathname) &&
      req.method === "POST"
    ) {
      const result = await promisify(execFile)(
        process.env.FOUNDATION_BACKEND_PYTHON,
        [
          process.env.FOUNDATION_ACTION_SCRIPT,
          url.pathname === "/__reviewer-literal-finish"
            ? "literal_finish"
            : url.pathname.endsWith("finish")
              ? "reviewer_finish"
              : "reviewer_intake",
        ],
        {
          cwd: process.env.FOUNDATION_BACKEND_ROOT,
          env: process.env,
          timeout: 30000,
        },
      );
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(result.stdout.trim().split("\n").at(-1));
      return;
    }
    if (foundations && url.pathname === "/__foundation-progress") {
      progress = JSON.parse(Buffer.concat(parts).toString("utf8"));
      console.log("Foundation progress:", progress.scenarios.at(-1));
      res.end("ok");
      return;
    }
    if (
      foundations &&
      foundationTask === "015" &&
      url.pathname.startsWith("/__analytics-action/") &&
      req.method === "POST"
    ) {
      const action = url.pathname.split("/").at(-1);
      assert.ok(["deleted_history", "offline", "online"].includes(action));
      if (action === "deleted_history") {
        const result = await promisify(execFile)(
          process.env.FOUNDATION_BACKEND_PYTHON,
          [process.env.ANALYTICS_ACTION_SCRIPT],
          {
            cwd: process.env.FOUNDATION_BACKEND_ROOT,
            env: process.env,
            timeout: 30000,
          },
        );
        res.writeHead(200, {
          "content-type": "application/json",
          "cache-control": "no-store",
        });
        res.end(result.stdout.trim().split("\n").at(-1));
      } else {
        const pid = Number(process.env.OWNED_BACKEND_PID);
        assert.ok(Number.isSafeInteger(pid) && pid > 1);
        const { realpath } = await import("node:fs/promises");
        assert.equal(
          await realpath("/proc/" + pid + "/cwd"),
          await realpath(process.env.FOUNDATION_BACKEND_ROOT),
        );
        assert.ok(
          process.env.FOUNDATION_BACKEND_ROOT.includes(
            "app-fe-notification-backend-",
          ),
        );
        process.kill(pid, action === "offline" ? "SIGSTOP" : "SIGCONT");
        res.end("ok");
      }
      return;
    }
    if (
      foundations &&
      foundationTask === "014" &&
      url.pathname.startsWith("/__calendar-action/") &&
      req.method === "POST"
    ) {
      const action = url.pathname.split("/").at(-1);
      assert.ok(
        ["disconnect", "online", "cancelled", "deadline"].includes(action),
      );
      if (action === "cancelled" || action === "deadline") {
        const result = await promisify(execFile)(
          process.env.FOUNDATION_BACKEND_PYTHON,
          [process.env.CALENDAR_ACTION_SCRIPT, action],
          {
            cwd: process.env.FOUNDATION_BACKEND_ROOT,
            env: process.env,
            timeout: 30000,
          },
        );
        res.writeHead(200, {
          "content-type": "application/json",
          "cache-control": "no-store",
        });
        res.end(result.stdout.trim().split("\n").at(-1));
      } else {
        calendarDropResponses = action === "disconnect";
        res.end("ok");
      }
      return;
    }
    if (
      foundations &&
      foundationTask === "014" &&
      url.pathname === "/__calendar-evidence"
    ) {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(calendarCommands));
      return;
    }
    if (
      foundations &&
      foundationTask === "013" &&
      url.pathname.startsWith("/__support-action/") &&
      req.method === "POST"
    ) {
      const action = url.pathname.split("/").at(-1);
      assert.ok(
        [
          "sink_off",
          "sink_on",
          "business_fault",
          "cleanup",
          "network_once",
        ].includes(action),
      );
      if (action === "network_once") {
        supportNetworkFault = true;
        res.end("ok");
      } else {
        const result = await promisify(execFile)(
          process.env.FOUNDATION_BACKEND_PYTHON,
          [process.env.SUPPORT_ACTION_SCRIPT, action],
          {
            cwd: process.env.FOUNDATION_BACKEND_ROOT,
            env: process.env,
            timeout: 30000,
          },
        );
        res.writeHead(200, {
          "content-type": "application/json",
          "cache-control": "no-store",
        });
        res.end(result.stdout.trim().split("\n").at(-1));
      }
      return;
    }
    if (
      foundations &&
      foundationTask === "013" &&
      url.pathname === "/__support-evidence"
    ) {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(supportEvidence));
      return;
    }
    if (
      foundations &&
      foundationTask === "013" &&
      url.pathname === "/api/v1/support/client-failures"
    ) {
      const body = JSON.parse(Buffer.concat(parts).toString("utf8"));
      supportNetworkFault = false;
      supportEvidence.push({
        fields: Object.keys(body).sort(),
        screen: body.screen_key,
        code: body.error_code,
        requestId: body.request_id,
        privateDataAbsent:
          !JSON.stringify(body).includes(credentials.password) &&
          !JSON.stringify(body).includes("private-test"),
      });
    }
    if (supportNetworkFault && url.pathname === "/api/v1/forms/search") {
      req.socket.destroy();
      return;
    }
    if (
      foundations &&
      [
        "/__foundation-action/reminders",
        "/__foundation-action/subprocess",
        "/__foundation-action/workflow",
      ].includes(url.pathname) &&
      req.method === "POST"
    ) {
      const result = await promisify(execFile)(
        process.env.FOUNDATION_BACKEND_PYTHON,
        [
          process.env.FOUNDATION_ACTION_SCRIPT,
          ...(url.pathname.endsWith("/subprocess")
            ? ["subprocess"]
            : url.pathname.endsWith("/workflow")
              ? ["workflow"]
              : []),
        ],
        {
          cwd: process.env.FOUNDATION_BACKEND_ROOT,
          env: process.env,
          timeout: 30000,
        },
      );
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(result.stdout.trim().split("\n").at(-1));
      return;
    }
    if (notifications && url.pathname.startsWith("/__notification-action/")) {
      const action = url.pathname.split("/").at(-1);
      if (action === "disconnect" || action === "offline") {
        offline = action === "offline";
        for (const connection of streams) connection.destroy();
      } else if (action === "online") {
        offline = false;
      } else {
        if (!["account", "task", "duplicate", "cleanup"].includes(action))
          throw Error("Invalid owned action");
        console.log("Owned notification action:", action);
        try {
          await promisify(execFile)(
            process.env.NOTIFICATION_BACKEND_PYTHON,
            [process.env.NOTIFICATION_ACTION_SCRIPT, action],
            {
              cwd: process.env.NOTIFICATION_BACKEND_ROOT,
              env: process.env,
              timeout: 30000,
            },
          );
        } catch (error) {
          console.log(
            "Owned action failed:",
            error.code,
            error.stderr?.trim().split("\n").at(-1),
          );
          throw error;
        }
      }
      res.end("ok");
      return;
    }
    if (
      foundations &&
      foundationTask === "028" &&
      url.pathname === "/__inline-transfer-control" &&
      req.method === "POST"
    ) {
      const control = JSON.parse(Buffer.concat(parts).toString());
      inlineDropReceipt = control.dropAttachmentReceipt === true;
      inlineDropAvatarReceipt = control.dropAvatarReceipt === true;
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify({ enabled: inlineDropReceipt }));
      return;
    }
    if (
      foundations &&
      foundationTask === "028" &&
      url.pathname === "/__inline-transfer-evidence" &&
      req.method === "GET"
    ) {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(inlineTransferEvidence));
      return;
    }
    if (url.pathname === "/__result") {
      resolveResult(JSON.parse(Buffer.concat(parts)));
      res.end("ok");
      return;
    }
    if (
      url.pathname.startsWith("/session/") ||
      url.pathname.startsWith("/api/")
    ) {
      if (notifications && offline && url.pathname === "/api/v1/inbox/events") {
        res.writeHead(503, {
          "content-type": "application/json",
          "cache-control": "private, no-store",
        });
        res.end(JSON.stringify({ error: "owned_test_network_outage" }));
        return;
      }
      const abort = new AbortController();
      const disconnected = () => abort.abort();
      res.once("close", disconnected);
      const response = await boundary(
        new Request(origin + req.url, {
          method: req.method,
          headers: req.headers,
          signal: abort.signal,
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
      if (foundations && foundationTask === "028") {
        if (!response.ok && /\/(attachments|media)(\/|$)/.test(url.pathname)) {
          const failure = await response
            .clone()
            .json()
            .catch(() => null);
          const issues = Array.isArray(failure?.data?.issues)
            ? failure.data.issues
            : [];
          inlineTransferEvidence.validationFailures.push({
            method: req.method,
            status: response.status,
            applicationCode:
              typeof failure?.code === "number" ? failure.code : null,
            issues: issues.map((issue) =>
              typeof issue.code === "string" &&
              /^[a-z0-9._-]{1,80}$/.test(issue.code)
                ? issue.code
                : "unavailable",
            ),
          });
        }
        if (req.method === "POST" && url.pathname === "/api/v1/media/files")
          inlineTransferEvidence.fileUploads++;
        if (req.method === "POST" && url.pathname === "/api/v1/media/images")
          inlineTransferEvidence.imageUploads++;
        if (req.method === "PATCH" && url.pathname === "/api/v1/me/profile") {
          inlineTransferEvidence.avatarPatches++;
          if (inlineDropAvatarReceipt && response.ok) {
            await response.arrayBuffer();
            inlineDropAvatarReceipt = false;
            inlineTransferEvidence.droppedAvatarReceipts++;
            res.writeHead(200, {
              "content-type": "application/json",
              "cache-control": "private, no-store",
            });
            res.end(JSON.stringify({ success: true, data: {} }));
            return;
          }
        }
        const attachmentPath =
          /^\/api\/v1\/(business-requests|work-items)\/[^/]+\/attachments$/;
        if (req.method === "POST" && attachmentPath.test(url.pathname)) {
          inlineTransferEvidence.attachmentPosts++;
          if (inlineDropReceipt && response.ok) {
            // The real server committed. Only its successful link receipt is unusable.
            await response.arrayBuffer();
            inlineDropReceipt = false;
            inlineTransferEvidence.droppedAttachmentReceipts++;
            res.writeHead(200, {
              "content-type": "application/json",
              "cache-control": "private, no-store",
            });
            res.end(JSON.stringify({ success: true, data: {} }));
            return;
          }
        }
        if (req.method === "PUT" && /\/attachments\/[^/]+$/.test(url.pathname))
          inlineTransferEvidence.replacements++;
      }
      if (
        (receiptDrop ||
          (foundations &&
            foundationTask === "029" &&
            reviewerDropCompletion)) &&
        req.method === "POST" &&
        /^\/api\/v1\/work-items\/[^/]+\/complete$/.test(url.pathname) &&
        response.ok
      ) {
        await response.arrayBuffer();
        receiptDrop = false;
        if (foundations && foundationTask === "029") {
          reviewerDropCompletion = false;
          reviewerCommands.push({
            action: "complete",
            status: response.status,
            hash: createHash("sha256")
              .update(Buffer.concat(parts))
              .digest("hex"),
            dropped: true,
          });
        }
        receiptDrops += 1;
        res.off("close", disconnected);
        // Start the reply before dropping it so the browser cannot transparently
        // retry an HTTP request whose response never started.
        res.writeHead(response.status, {
          "content-type": "application/json",
          "content-length": "100",
          connection: "close",
        });
        res.write("{", () => res.destroy());
        return;
      }
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (
        response.headers.get("content-type")?.startsWith("text/event-stream")
      ) {
        streams.add(res);
        maxStreams = Math.max(maxStreams, streams.size);
        res.once("close", () => streams.delete(res));
        res.flushHeaders();
        try {
          await pipeline(Readable.fromWeb(response.body), res);
        } finally {
          res.off("close", disconnected);
        }
      } else {
        const bytes = Buffer.from(await response.arrayBuffer());
        if (
          foundations &&
          url.pathname === "/api/v1/calendar/events/search" &&
          response.ok
        ) {
          const body = JSON.parse(bytes.toString("utf8"));
          calendarEvidence.push({
            rows: body.result.items.length,
            expectedTitle: body.result.items.some(
              (row) => row.title === "Owned UTC+04 event",
            ),
            expectedStart: body.result.items.some(
              (row) => row.schedule.start_at === "2026-11-02T05:00:00Z",
            ),
          });
        }
        if (
          foundations &&
          foundationTask === "014" &&
          url.pathname === "/api/v1/calendar/events" &&
          req.method === "POST"
        ) {
          calendarCommands.push({
            hash: createHash("sha256")
              .update(Buffer.concat(parts))
              .digest("hex"),
            status: response.status,
            dropped: calendarDropResponses,
          });
          if (calendarDropResponses && response.ok) {
            res.off("close", disconnected);
            res.destroy();
            return;
          }
        }
        if (
          foundations &&
          foundationTask === "029" &&
          req.method === "POST" &&
          /^\/api\/v1\/(?:work-items|business-requests)\/[^/]+\/(claim|return|complete|submit|save)$/.test(
            url.pathname,
          )
        ) {
          const action = url.pathname.split("/").at(-1);
          reviewerCommands.push({
            action,
            status: response.status,
            hash: createHash("sha256")
              .update(Buffer.concat(parts))
              .digest("hex"),
            dropped: false,
          });
        }
        res.end(bytes);
        res.off("close", disconnected);
      }
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
    res.end(
      index
        .replace(
          "<head>",
          "<head><script>" +
            browserDiagnosticsScript +
            (notifications ? liveObservationScript : "") +
            "</script>",
        )
        .replace(
          "</body>",
          "<script>" +
            (url.searchParams.has("peer") ? "" : script) +
            "</script></body>",
        ),
    );
  } catch (error) {
    if (foundationTask === "029" && typeof error.code === "number") {
      const trace = String(error.stderr ?? "");
      const marker = trace.match(/AssertionError: (owned_[a-z_]+)/)?.[1];
      console.log("Owned reviewer evidence failure:", {
        marker: marker ?? error.name,
        code: error.code,
        killed: error.killed,
        signal: error.signal,
        assertion: trace.includes("AssertionError"),
        importFailure: trace.includes("ImportError"),
        attributeFailure: trace.includes("AttributeError"),
        tracebackLine: trace.match(
          /foundations-paired-action\.py", line (\d+)/,
        )?.[1],
      });
    }
    if (res.headersSent || res.destroyed) {
      res.destroy();
      return;
    }
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
        () =>
          resolve({ ...progress, ok: false, error: "Browser journey timeout" }),
        foundations ? 180000 : 90000,
      );
    }),
  ]);
  if (notifications) {
    assert.ok(maxStreams <= 1, "Components opened concurrent streams");
    assert.equal(
      calls.filter((call) =>
        /\/(claim|approve|reject|forward)$/.test(call.path),
      ).length,
      0,
      "Notification opening executed a business command",
    );
  }
  if (foundations && foundationTask === "016" && outcome.ok) {
    assert.equal(
      outcome.scenarios.length,
      { core: 13, repairs: 4, kinds: 1, presentation: 4 }[formDesignerScope],
      "Required form designer scenario count",
    );
  }
  let privateTransferEvidence;
  if (foundations && foundationTask === "021" && outcome.ok) {
    const bytes = await readFile(
      join(profile, "downloads", "owned-transfer-036.txt"),
    );
    const expected = Buffer.from(
      Uint8Array.from({ length: 256 * 1024 }, (_, index) => 65 + (index % 26)),
    );
    assert.deepEqual(
      bytes,
      expected,
      "Private boundary download bytes changed",
    );
    privateTransferEvidence = {
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      evidence: "actual owned browser download",
    };
  }
  if (foundations && foundationTask === "028" && outcome.ok) {
    const target = join(profile, "downloads", "owned-inline-036.txt");
    let bytes;
    for (const deadline = Date.now() + 5000; Date.now() < deadline;) {
      try {
        bytes = await readFile(target);
        break;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    assert.ok(bytes, "Actual private inline download must exist");
    const expected = Buffer.from(
      Uint8Array.from({ length: 256 * 1024 }, (_, index) => 65 + (index % 26)),
    );
    assert.deepEqual(bytes, expected, "Actual inline download bytes");
    assert.equal(
      outcome.scenarios.length,
      9,
      "All inline real-service scenarios must execute",
    );
    privateTransferEvidence = {
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      evidence: "actual owned inline browser download",
    };
  }
  if (process.env.BROWSER_REPORT_PATH) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname } = await import("node:path");
    await mkdir(dirname(process.env.BROWSER_REPORT_PATH), { recursive: true });
    await writeFile(
      process.env.BROWSER_REPORT_PATH,
      JSON.stringify(
        {
          engine: "Firefox",
          formDesignerScope:
            foundations && foundationTask === "016"
              ? formDesignerScope
              : undefined,
          evidence: "real-http",
          diagnostics: outcome.diagnostics,
          live: outcome.live,
          scenarios: outcome.scenarios,
          maxConcurrentStreams: maxStreams,
          receiptDrops,
          businessCommands: calls.filter((call) =>
            /\/(claim|approve|reject|forward|submit)$/.test(call.path),
          ),
          requests: calls.length,
          lastRequests: outcome.ok ? undefined : calls.slice(-12),
          ui: outcome.ok ? undefined : outcome.ui,
          evidenceRequests: outcome.ok
            ? undefined
            : calls
                .filter((call) =>
                  /\/api\/v1\/(processes|business-requests|work-items)\//.test(
                    call.path,
                  ),
                )
                .slice(-30)
                .map((call) => ({
                  method: call.method,
                  status: call.status,
                  path: call.path.replace(
                    /^(\/api\/v1\/(?:processes|business-requests|work-items)\/)[^/?]+/,
                    "$1{ref}",
                  ),
                })),
          calendarEvidence: foundations ? calendarEvidence : undefined,
          reviewerCommandEvidence:
            foundations && foundationTask === "029"
              ? reviewerCommands
              : undefined,
          reviewerUI:
            foundations && foundationTask === "029" ? outcome.ui : undefined,
          privateTransferEvidence,
          inlineTransferEvidence:
            foundations && foundationTask === "028"
              ? inlineTransferEvidence
              : undefined,
          status: outcome.ok ? "passed" : "failed",
          failure: outcome.ok ? null : outcome.error,
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (foundations && outcome.ok && !foundationTask) {
    const downloads = await readdir(join(profile, "downloads"));
    assert.ok(
      downloads.some((name) => /\.(png|webp)$/.test(name)),
      "Private avatar bytes were not downloaded",
    );
  }
  assertBrowserDiagnostics(outcome.diagnostics);
  assert.equal(
    outcome.ok,
    true,
    outcome.error +
      "\n" +
      JSON.stringify(outcome.scenarios ?? []) +
      "\n" +
      JSON.stringify(calls.slice(-10)),
  );
  console.log(
    notifications
      ? "Firefox actual worker/SSE notification journey passed."
      : foundations
        ? "Firefox actual foundation persistence/browser journey passed."
        : "Firefox real backend passed: ordinary requester/reviewer, exact decimal, stable row duplication, private policy, save, submit, timeline, claim and completion.",
  );
} finally {
  if (
    foundations &&
    foundationTask === "015" &&
    process.env.OWNED_BACKEND_PID
  ) {
    try {
      process.kill(Number(process.env.OWNED_BACKEND_PID), "SIGCONT");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
  clearTimeout(timeout);
  if (browser && browser.exitCode === null) {
    browser.kill("SIGTERM");
    await once(browser, "exit");
  }
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(profile, { recursive: true, force: true });
}
