import { spawn } from "node:child_process";
import { resolve } from "node:path";
if (!process.env.BACKEND_ROOT || process.env.DISPOSABLE_BACKEND !== "1")
  throw Error(
    "Set BACKEND_ROOT and DISPOSABLE_BACKEND=1 for a migrated disposable database.",
  );
const root = resolve(process.env.BACKEND_ROOT);
const python = process.env.BACKEND_PYTHON ?? resolve(root, ".venv/bin/python");
const pytest = process.env.BACKEND_PYTEST ?? resolve(root, ".venv/bin/pytest");
const env = {
  ...process.env,
  PYTHONDONTWRITEBYTECODE: "1",
  PYTHONPATH: "src:.",
  RUN_INTEGRATION: "1",
  RUN_CELERY_INTEGRATION: "1",
};
function run(binary, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(binary, args, { cwd: root, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolveRun()
        : reject(Error(`Backend check failed (${code})`)),
    );
  });
}
await run(pytest, ["-q", "tests/integration/test_celery.py"]);
await run(python, [resolve("scripts/check-backend-admin.py")]);
// Existing integration modules have per-test event loops and a shared connection pool.
// Separate processes prevent stale pooled connections crossing those module loops.
for (const file of [
  "test_work_groups.py",
  "test_connections.py",
  "test_platform_foundation.py",
  "test_bpms_recovery.py",
])
  await run(pytest, ["-q", "tests/integration/" + file]);
