import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const read = (path) => readFile(path, "utf8");
const backlog = await read("docs/delivery/FRONTEND-BACKLOG.md");
if (backlog !== (await read("docs/FRONTEND-BACKLOG.md")))
  throw Error("Backlog copies differ");
const tasks = [
  ...backlog.matchAll(
    /^## (APP-FE-\d{3}) — ([^\n]+)\n([\s\S]*?)(?=^## APP-FE-|^---$)/gm,
  ),
].map((match) => {
  const field = (name) =>
    match[3].match(new RegExp(`^${name}: (.+)$`, "m"))?.[1].trim() ?? null;
  return {
    id: match[1],
    title: match[2],
    status: field("Status"),
    verification: field("Verification"),
    changeRecord: field("Change-Record"),
  };
});
if (tasks.length !== 38 || new Set(tasks.map((task) => task.id)).size !== 38)
  throw Error("Expected all 38 unique delivery tasks");
for (let index = 0; index < tasks.length; index++) {
  const task = tasks[index];
  if (task.id !== `APP-FE-${String(index + 1).padStart(3, "0")}`)
    throw Error("Delivery sequence is incomplete");
  if (task.changeRecord && task.changeRecord !== "None") {
    const link = task.changeRecord.match(/^\[[^\]]+\]\(([^)]+)\)$/);
    await read(
      link
        ? resolve("docs/delivery", link[1])
        : task.changeRecord.startsWith("../")
          ? resolve("docs/delivery", task.changeRecord)
          : task.changeRecord,
    );
  }
}
const optionalJson = async (path) => {
  try {
    return JSON.parse(await read(path));
  } catch {
    return null;
  }
};
const gate = await optionalJson("artifacts/check/manifest.json");
const git = spawnSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
);
if (git.status !== 0) throw Error("Cannot read source identity");
const paths = git.stdout
  .trim()
  .split("\n")
  .filter(
    (path) =>
      path &&
      !path.startsWith("artifacts/") &&
      !path.startsWith("graphify-out/"),
  )
  .sort();
const tree = [];
for (const path of paths) {
  const bytes = await readFile(path).catch(() => null);
  tree.push([path, bytes ? sha(bytes) : "deleted"]);
}
const currentSha = sha(JSON.stringify(tree));
const currentGate =
  gate?.exitCode === 0 &&
  gate.treeSha256 === currentSha &&
  gate.finalTreeSha256 === currentSha &&
  gate.sourceChangedDuringCheck === false &&
  gate.commands?.length >= 12 &&
  gate.commands.every(
    (command) => command.exitCode === 0 && command.diagnosticCount === 0,
  );
const paired = await optionalJson("artifacts/paired-smoke/manifest.json");
const pending = tasks.filter((task) => task.status !== "DONE");
const report = {
  sourceSha256: currentSha,
  localCheck: currentGate
    ? "VERIFIED_LOCAL"
    : "NOT_VERIFIED_FOR_CURRENT_SOURCE",
  localCheckManifest: "artifacts/check/manifest.json",
  tasks: {
    total: tasks.length,
    done: tasks.length - pending.length,
    remaining: pending.length,
  },
  pending,
  pairedSmoke: paired
    ? {
        exitCode: paired.exit_code,
        contractMatch: paired.actual_http_contract_match ?? null,
        blockedAt: paired.blocked_at ?? null,
        manifest: "artifacts/paired-smoke/manifest.json",
        limits: paired.limits,
      }
    : null,
  product: pending.length ? "BLOCKED" : tasks.at(-1).verification,
  deployed: "NOT_RECORDED",
  userAccepted:
    tasks.at(-1).verification === "USER_ACCEPTED"
      ? "RECORDED_IN_TASK"
      : "NOT_RECORDED",
};
await mkdir("artifacts/delivery", { recursive: true });
await writeFile(
  "artifacts/delivery/status.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `Delivery: ${report.tasks.done}/${report.tasks.total} tasks done; ${report.tasks.remaining} remain. Local check: ${report.localCheck}. Product: ${report.product}.`,
);
if (
  process.argv.includes("--require-complete") &&
  (pending.length || !currentGate)
)
  process.exitCode = 1;
