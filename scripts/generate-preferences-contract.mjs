import { readFile, writeFile } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";
import { format } from "prettier";
const source = "docs/reference/me-preferences.openapi.json";
const target = "src/app/core/transport/generated/preferences-contract.d.ts";
const schema = JSON.parse(await readFile(source, "utf8"));
const output = await format(astToString(await openapiTS(schema)), {
  parser: "typescript",
  singleQuote: true,
});
if (process.argv.includes("--check")) {
  if ((await readFile(target, "utf8")) !== output)
    throw Error("Preferences contract differs from frozen subset");
  console.log("Verified frozen self-preferences contract.");
} else await writeFile(target, output);
