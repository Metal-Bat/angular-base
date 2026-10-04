import { spawn } from "node:child_process";

// One engine and one browser process at a time; real-backend/Studio checks have
// separate fixture requirements and remain outside this local quality batch.
const engine = process.env.BROWSER_ENGINE ?? "firefox";
if (!["firefox", "chromium"].includes(engine))
  throw Error("Unknown browser engine");
for (const [scope, file, flags] of [
  ["boundary", "server/browser-boundary.spec.mjs", {}],
  ["auth", "server/browser-auth.spec.mjs", {}],
  ["ui", "server/browser-ui.spec.mjs", { ACCESSIBILITY_CHECKS: "1" }],
  [
    "workspace",
    "server/browser-auth.spec.mjs",
    { WORKSPACE_BROWSER_CHECKS: "1" },
  ],
  [
    "admin",
    "server/browser-auth.spec.mjs",
    { ADMIN_BROWSER_CHECKS: "1", ACCESSIBILITY_CHECKS: "1" },
  ],
  [
    "runtime",
    "server/browser-auth.spec.mjs",
    { PERFORMANCE_BROWSER_CHECKS: "1", ACCESSIBILITY_CHECKS: "1" },
  ],
  ...(engine === "chromium"
    ? [
        [
          "https",
          "server/browser-boundary.spec.mjs",
          { TLS_BROWSER_CHECKS: "1" },
        ],
      ]
    : []),
]) {
  const env = { ...process.env };
  for (const key of [
    "ACCESSIBILITY_CHECKS",
    "UI_BROWSER_CHECKS",
    "WORKSPACE_BROWSER_CHECKS",
    "ADMIN_BROWSER_CHECKS",
    "PERFORMANCE_BROWSER_CHECKS",
    "TLS_BROWSER_CHECKS",
    "BROWSER_REPORT_PATH",
  ])
    delete env[key];
  Object.assign(env, flags, {
    BROWSER_ENGINE: engine,
    NG_BUILD_MAX_WORKERS: "2",
    BROWSER_REPORT_PATH: `artifacts/${engine}-${scope}-quality.json`,
  });
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(Error(`${engine} ${scope} failed (${code ?? signal})`)),
    );
  });
  console.log(`Quality check passed: ${engine} ${scope}`);
}
