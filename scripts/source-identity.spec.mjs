import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sourceIdentity } from "./source-identity.mjs";

const git = (cwd, ...args) => {
  const result = spawnSync(
    "git",
    [
      "-c",
      "user.name=Identity test",
      "-c",
      "user.email=identity@example.invalid",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
};

test("source identity survives staging and committing deletions but detects real source changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "frontend-source-identity-"));
  try {
    git(root, "init", "--quiet");
    await writeFile(join(root, "runtime.ts"), "original\n");
    await writeFile(join(root, "removed.ts"), "old\n");
    await writeFile(join(root, "empty.ts"), "");
    git(root, "add", ".");
    git(root, "commit", "--quiet", "-m", "baseline");
    const original = await sourceIdentity(root);
    await unlink(join(root, "removed.ts"));
    const deleted = await sourceIdentity(root);
    assert.notEqual(deleted.sha256, original.sha256);
    assert.ok(deleted.files.some(([name]) => name === "empty.ts"));
    git(root, "add", "-u");
    assert.equal((await sourceIdentity(root)).sha256, deleted.sha256);
    git(root, "commit", "--quiet", "-m", "remove old source");
    assert.equal((await sourceIdentity(root)).sha256, deleted.sha256);
    await writeFile(join(root, "new.ts"), "new\n");
    const added = await sourceIdentity(root);
    assert.notEqual(added.sha256, deleted.sha256);
    git(root, "add", "new.ts");
    assert.equal((await sourceIdentity(root)).sha256, added.sha256);
    await mkdir(join(root, "artifacts"));
    await writeFile(join(root, "artifacts/result.json"), "output");
    await mkdir(join(root, "graphify-out"));
    await writeFile(join(root, "graphify-out/graph.json"), "output");
    assert.equal((await sourceIdentity(root)).sha256, added.sha256);
    await writeFile(join(root, "runtime.ts"), "changed\n");
    assert.notEqual((await sourceIdentity(root)).sha256, added.sha256);
    await writeFile(join(root, "removed.ts"), "old\n");
    assert.ok(
      (await sourceIdentity(root)).files.some(
        ([name]) => name === "removed.ts",
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("source paths with newlines remain distinct and are included exactly once", async () => {
  const root = await mkdtemp(join(tmpdir(), "frontend-source-path-"));
  try {
    git(root, "init", "--quiet");
    await writeFile(join(root, "line\nbreak.ts"), "content");
    const before = await sourceIdentity(root);
    assert.deepEqual(
      before.files.map(([name]) => name),
      ["line\nbreak.ts"],
    );
    git(root, "add", ".");
    assert.equal((await sourceIdentity(root)).sha256, before.sha256);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
