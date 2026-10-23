import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBrowserQualityChecks } from "./browser-quality-check.mjs";

for (const mode of ["timeout", "cancel"]) {
  test(`browser ${mode} preserves failed scope evidence and releases owned temporary files`, async () => {
    const root = await mkdtemp(join(tmpdir(), "frontend-browser-lifecycle-"));
    const fixture = join(root, "blocked.mjs");
    const probe = join(root, "probe.json");
    let cancelPoll;
    try {
      await writeFile(
        fixture,
        `
        import {writeFileSync} from 'node:fs';
        import {tmpdir} from 'node:os';
        process.on('SIGTERM',()=>{});
        writeFileSync(${JSON.stringify(probe)}, JSON.stringify({directory:tmpdir()}));
        setInterval(()=>{},1000);
      `,
      );
      if (mode === "cancel") {
        cancelPoll = setInterval(async () => {
          if (
            await stat(probe).then(
              () => true,
              () => false,
            )
          ) {
            clearInterval(cancelPoll);
            process.emit("SIGTERM");
          }
        }, 20);
      }
      await assert.rejects(
        runBrowserQualityChecks({
          engine: "firefox",
          scopes: [
            ["blocked", fixture, {}],
            ["unstarted", fixture, {}],
          ],
          directory: root,
          deadlineMs: 1500,
          sandbox: false,
        }),
        /blocked failed/,
      );
      const summary = JSON.parse(
        await readFile(join(root, "browser-summary.json"), "utf8"),
      );
      assert.equal(summary.status, "failed");
      assert.equal(summary.plannedScopes, 2);
      assert.equal(summary.results.length, 1);
      assert.equal(summary.results[0].exitCode, 1);
      assert.equal(summary.results[0].temporaryFilesReleased, true);
      assert.equal(summary.results[0].timedOut, mode === "timeout");
      assert.equal(summary.results[0].cancelled, mode === "cancel");
      assert.equal(summary.cancelled, mode === "cancel");
      assert.ok(summary.results[0].durationMs < 5000);
      const owned = JSON.parse(await readFile(probe, "utf8"));
      assert.notEqual(owned.directory, tmpdir());
      await assert.rejects(stat(owned.directory), { code: "ENOENT" });
      assert.equal(await readFile(summary.results[0].log, "utf8"), "");
    } finally {
      clearInterval(cancelPoll);
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("browser scopes cannot increase the production deadline or select an unknown scope", async () => {
  await assert.rejects(
    runBrowserQualityChecks({ deadlineMs: 180001 }),
    /deadline/,
  );
  await assert.rejects(
    runBrowserQualityChecks({ selected: "missing", sandbox: true }),
    /scope/,
  );
});
