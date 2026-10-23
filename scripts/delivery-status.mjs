import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { sourceIdentity } from "./source-identity.mjs";
import { localCheckIssues, pairedEvidence } from "./delivery-evidence.mjs";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const read = (path) => readFile(path, "utf8");
const backlog = await read("docs/delivery/FRONTEND-BACKLOG.md");
const pointer = await read("docs/FRONTEND-BACKLOG.md");
if (
  backlog !== pointer &&
  (!pointer.includes("[delivery backlog](delivery/FRONTEND-BACKLOG.md)") ||
    /^## APP-FE-/m.test(pointer))
)
  throw Error(
    "Backlog entry point must link to the canonical authority without duplicate tasks",
  );
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
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw Error(`Cannot read delivery evidence ${path}: ${error.message}`);
  }
};
const gate = await optionalJson("artifacts/check/manifest.json");
const identity = await sourceIdentity();
const tree = identity.files;
const currentSha = identity.sha256;
const localIssues = localCheckIssues(gate, currentSha);
const currentGate = localIssues.length === 0;
// Match paired-smoke.py's functional-source identity (Python's ASCII JSON with spaces).
const asciiJson = (value) =>
  JSON.stringify(value).replace(
    /[\u007f-\uffff]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
const functionalTree = tree.filter(
  ([path, digest]) =>
    digest !== "deleted" && /^(src|server|scripts)\//.test(path),
);
const functionalSha = sha(
  `[${functionalTree
    .map(([path, digest]) => `[${asciiJson(path)}, ${asciiJson(digest)}]`)
    .join(", ")}]`,
);
const profiles = (
  await readdir("artifacts", { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  })
).filter(
  (entry) => entry.isDirectory() && /^paired(?:-[a-z0-9-]+)?$/.test(entry.name),
);
const pairedProfiles = await Promise.all(
  profiles
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(async (entry) => {
      const path = `artifacts/${entry.name}`;
      const manifest = await optionalJson(`${path}/manifest.json`);
      const browser = await optionalJson(`${path}/browser.json`);
      return {
        profile: entry.name,
        manifest: `${path}/manifest.json`,
        ...pairedEvidence(manifest, browser, functionalSha),
        currentBackendSource: "NOT_CHECKED_BY_FRONTEND_STATUS",
      };
    }),
);
const paired = await optionalJson("artifacts/paired-smoke/manifest.json");
const pending = tasks.filter((task) => task.status !== "DONE");
const report = {
  sourceSha256: currentSha,
  localCheck: currentGate
    ? "VERIFIED_LOCAL"
    : "NOT_VERIFIED_FOR_CURRENT_SOURCE",
  functionalSourceSha256: functionalSha,
  localCheckIssues: localIssues,
  pairedProfiles,
  localCheckManifest: "artifacts/check/manifest.json",
  tasks: {
    total: tasks.length,
    done: tasks.length - pending.length,
    remaining: pending.length,
  },
  pending,
  pairedSmoke: paired
    ? {
        status:
          pairedProfiles.find((profile) => profile.profile === "paired-smoke")
            ?.status ?? "NOT_RECORDED",
        exitCode: paired.exit_code,
        contractMatch: paired.actual_http_contract_match ?? null,
        blockedAt: paired.blocked_at ?? null,
        manifest: "artifacts/paired-smoke/manifest.json",
        limits: paired.limits,
      }
    : null,
  product: pending.length
    ? "BLOCKED"
    : "TASKS_RECORDED_DONE_ACCEPTANCE_EVIDENCE_REQUIRES_REVIEW",
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
  (pending.length ||
    !currentGate ||
    !pairedProfiles.some(
      (profile) => profile.status === "VERIFIED_SCOPED_PAIR",
    ))
)
  process.exitCode = 1;
