import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { prepareFonts } from "./prepare-fonts.mjs";

test("optional font assets generate only available faces", async () => {
  const root = await mkdtemp(join(tmpdir(), "workspace-fonts-"));
  try {
    assert.doesNotMatch(await prepareFonts(root), /@font-face|url\(/);
    const directory = join(root, "public/fonts/yekan-bakh");
    await writeFile(join(directory, "YekanBakh-Regular.woff2"), "wOF2fixture");
    assert.match(await prepareFonts(root), /font-weight: 400/);
    await writeFile(join(directory, "YekanBakh-Bold.woff2"), "wOF2fixture");
    assert.match(await prepareFonts(root), /font-weight: 700/);
    await writeFile(join(directory, "YekanBakh-Variable.woff2"), "wOF2fixture");
    const css = await prepareFonts(root);
    assert.match(css, /font-weight: 100 900/);
    assert.doesNotMatch(css, /Regular|Bold/);
    await writeFile(join(directory, "YekanBakh-Variable.woff2"), "not-a-font");
    await assert.rejects(prepareFonts(root), /real WOFF2/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
