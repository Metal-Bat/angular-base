import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
// Bundle only checked-in pure domain code. Author JSON is never evaluated.
const bundle = await build({
  entryPoints: ["src/app/features/studio/domain/form-authoring.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { addPrimitive, palette } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const base = {
  data_schema: { type: "object", properties: {} },
  render_schema: { root: { component: "vertical", children: [] } },
};
const output =
  JSON.stringify(
    palette.map((kind) => ({
      kind,
      documents: addPrimitive(base, [], kind, "field"),
    })),
    null,
    2,
  ) + "\n";
const target = "docs/reference/studio-primitives.json";
if (process.argv.includes("--check"))
  assert.equal(
    await readFile(target, "utf8"),
    output,
    "Regenerate studio primitive fixtures",
  );
else await writeFile(target, output);
console.log(
  "Verified " + palette.length + " studio primitive conformance fixtures.",
);
