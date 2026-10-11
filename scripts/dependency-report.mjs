import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const licenseResult = spawnSync("pnpm", ["licenses", "list", "--json"], {
  encoding: "utf8",
});
if (licenseResult.error || licenseResult.status !== 0)
  throw Error("pnpm license inventory failed");
const licenses = JSON.parse(licenseResult.stdout);
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/licenses.json",
  JSON.stringify({ packageManager: "pnpm", licenses }, null, 2) + "\n",
);
let failed = false;
for (const [name, args] of [
  ["all", []],
  ["production", ["--prod"]],
]) {
  const result = spawnSync("pnpm", ["audit", "--json", ...args], {
    encoding: "utf8",
  });
  let audit;
  try {
    audit = JSON.parse(result.stdout);
  } catch {
    throw new Error("pnpm audit did not return a JSON report.");
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
  "Recorded installed pnpm dependency license declarations; these are inventory, not legal approval.",
);
if (failed) {
  process.exitCode = 1;
}
