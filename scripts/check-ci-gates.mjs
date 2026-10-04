import { cp, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const sandbox = await mkdtemp(join(tmpdir(), "frontend-ci-gates-"));
try {
  for (const entry of [
    "src",
    "public",
    "angular.json",
    "vitest.config.ts",
    "package.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.spec.json",
    "eslint.config.js",
    ".postcssrc.json",
  ]) {
    await cp(entry, join(sandbox, entry), { recursive: true });
  }
  await symlink(resolve("node_modules"), join(sandbox, "node_modules"), "dir");
  const run = (args) =>
    spawnSync(
      process.execPath,
      [resolve("node_modules/@angular/cli/bin/ng.js"), ...args],
      {
        cwd: sandbox,
        encoding: "utf8",
        env: {
          ...process.env,
          CI: "true",
          NG_CLI_ANALYTICS: "false",
          NG_BUILD_MAX_WORKERS: "2",
        },
        timeout: 60000,
      },
    );
  const expectFailure = (label, args, expected) => {
    const result = run(args);
    if (
      result.error ||
      result.status === 0 ||
      !`${result.stdout}${result.stderr}`.includes(expected)
    ) {
      throw new Error(
        `${label} did not reject the intended defect. status=${result.status}; ${result.error?.message ?? ""}; ${`${result.stdout}${result.stderr}`.slice(0, 1500)}`,
      );
    }
    console.log(`${label} rejected the deliberately failing change.`);
  };
  await writeFile(
    join(sandbox, "src/app/ci-gate-probe.ts"),
    'export const probe = eval("1");\n',
  );
  expectFailure("Lint", ["lint"], "no-eval");
  await rm(join(sandbox, "src/app/ci-gate-probe.ts"));
  await writeFile(
    join(sandbox, "src/app/app.spec.ts"),
    'describe("CI gate", () => { it("rejects failure", () => { expect(true).toBe(false); }); });\n',
  );
  expectFailure(
    "Tests",
    ["test", "--watch=false", "--include=src/app/app.spec.ts"],
    "AssertionError",
  );
  await writeFile(
    join(sandbox, "src/main.ts"),
    "const invalid: string = 1; console.log(invalid);\n",
  );
  expectFailure("Build", ["build"], "TS2322");
} finally {
  await rm(sandbox, { recursive: true, force: true });
}
