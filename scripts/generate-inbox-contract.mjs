import { readFile, writeFile } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";
import { format } from "prettier";
const schema = JSON.parse(
  await readFile("docs/reference/inbox.openapi.json", "utf8"),
);
const target = "src/app/core/transport/generated/inbox-contract.d.ts";
const output = await format(astToString(await openapiTS(schema)), {
  parser: "typescript",
  singleQuote: true,
});
if (process.argv.includes("--check")) {
  if ((await readFile(target, "utf8")) !== output)
    throw Error("Inbox generated client differs from producer");
  console.log("Verified frozen unified inbox and SSE contract.");
} else await writeFile(target, output);
