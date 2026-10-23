import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Identity follows the working files, independently of staging or commit history.
// Artifacts and the generated graph are outputs; all other maintained inputs count.
export async function sourceIdentity(root = ".") {
  const git = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  );
  if (git.status !== 0) throw Error("Cannot record repository identity");
  const names = [...new Set(git.stdout.split("\0").filter(Boolean))].sort();
  const files = [];
  for (const name of names) {
    if (name.startsWith("artifacts/") || name.startsWith("graphify-out/"))
      continue;
    let bytes;
    try {
      bytes = await readFile(resolve(root, name));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    files.push([name, createHash("sha256").update(bytes).digest("hex")]);
  }
  return {
    version: "working-files-v1",
    files,
    sha256: createHash("sha256").update(JSON.stringify(files)).digest("hex"),
  };
}
