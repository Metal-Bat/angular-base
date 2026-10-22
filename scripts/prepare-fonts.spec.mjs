import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { prepareFonts } from "./prepare-fonts.mjs";

test("bundled font must exist and be WOFF2 before a build can succeed", async () => {
  const root = await mkdtemp(join(tmpdir(), "workspace-fonts-"));
  try {
    await assert.rejects(prepareFonts(root), /Required bundled font.*missing/);
    const directory = join(root, "public/fonts/vazirmatn");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "Vazirmatn-Variable.woff2"), "wOF2fixture");
    const css = await prepareFonts(root);
    assert.match(css, /font-weight: 100 900/);
    assert.match(css, /font-family: "Vazirmatn"/);
    await writeFile(join(directory, "Vazirmatn-Variable.woff2"), "not-a-font");
    await assert.rejects(prepareFonts(root), /real WOFF2/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
