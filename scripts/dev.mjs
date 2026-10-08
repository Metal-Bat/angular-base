import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const statusUrl = "http://127.0.0.1:3000/session/status";
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
  const timeout = setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
  }, 5000);
  timeout.unref();
}

function start(args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: {
      ...process.env,
      NG_BUILD_MAX_WORKERS: process.env.NG_BUILD_MAX_WORKERS ?? "2",
    },
    stdio: "inherit",
  });
  children.add(child);
  child.on("error", () => {
    console.error("Unable to start a development server.");
    stop(1);
  });
  child.on("exit", (code) => {
    children.delete(child);
    if (!stopping) stop(code ?? 1);
  });
  return child;
}

async function boundaryReady() {
  try {
    const response = await fetch(statusUrl, {
      signal: AbortSignal.timeout(500),
      redirect: "error",
      cache: "no-store",
    });
    const status = await response.json();
    return (
      response.ok &&
      typeof status.authenticated === "boolean" &&
      ["public", "confidential"].includes(status.boundaryMode)
    );
  } catch {
    return false;
  }
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

try {
  if (process.env.BOUNDARY_PORT && process.env.BOUNDARY_PORT !== "3000") {
    throw Error("Development proxy requires BOUNDARY_PORT=3000.");
  }
  if (await boundaryReady()) {
    console.log("Using the session boundary already running on port 3000.");
  } else {
    const boundary = start(["server/main.mjs"]);
    const deadline = Date.now() + 10000;
    while (!(await boundaryReady())) {
      if (stopping || boundary.exitCode !== null) {
        throw Error("Session boundary stopped before becoming ready.");
      }
      if (Date.now() >= deadline) {
        throw Error("Session boundary did not become ready on port 3000.");
      }
      await delay(100);
    }
  }
  if (!stopping) {
    start([
      "node_modules/@angular/cli/bin/ng.js",
      "serve",
      ...process.argv.slice(2),
    ]);
  }
} catch (error) {
  if (!stopping) console.error(error.message);
  stop(1);
}
