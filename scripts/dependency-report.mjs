import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const packages = Object.entries(lock.packages)
  .filter(([path]) => path !== "")
  .map(([path, item]) => ({
    path,
    version: item.version,
    license: item.license ?? "UNSPECIFIED",
    developmentOnly: item.dev === true,
  }));
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/licenses.json",
  JSON.stringify({ lockfileVersion: lock.lockfileVersion, packages }, null, 2) +
    "\n",
);
let failed = false;
for (const [name, args] of [
  ["all", []],
  ["production", ["--omit=dev"]],
]) {
  const result = spawnSync("npm", ["audit", "--json", ...args], {
    encoding: "utf8",
  });
  let audit;
  try {
    audit = JSON.parse(result.stdout);
  } catch {
    throw new Error("npm audit did not return a JSON report.");
  }
  await writeFile(
    `artifacts/audit-${name}.json`,
    JSON.stringify(audit, null, 2) + "\n",
  );
  if (audit.error || !audit.metadata?.vulnerabilities) {
    throw new Error("The audit service failed; reports are incomplete.");
  }
  const counts = audit.metadata.vulnerabilities;
  console.log(
    `${name}: ${counts.high} high, ${counts.critical} critical findings`,
  );
  // Release tooling findings remain visible in the full report; production high/critical findings fail the check.
  if (name === "production" && (counts.high > 0 || counts.critical > 0)) {
    failed = true;
  }
}
console.log(
  `Recorded ${packages.length} lockfile license declarations; these are inventory, not legal approval.`,
);
if (failed) {
  process.exitCode = 1;
}
