import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const output = await mkdtemp(join(tmpdir(), "workspace-ui-"));
function run(args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(new Error(`Check failed: ${code ?? signal}`)),
    );
  });
}
try {
  await run([
    "node_modules/@angular/cli/bin/ng.js",
    "build",
    "--configuration",
    "development",
    "--output-path",
    output,
  ]);
  await run(["server/browser-auth.spec.mjs"], {
    ...process.env,
    UI_BROWSER_CHECKS: "1",
    BROWSER_APP_DIR: join(output, "browser"),
  });
} finally {
  await rm(output, { recursive: true, force: true });
}
