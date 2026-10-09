import { format } from "prettier";
import { readFile, writeFile } from "node:fs/promises";
const inspector = JSON.parse(
  await readFile("docs/reference/app-be-wave-four/inspector-en.json", "utf8"),
);
const api = JSON.parse(
  await readFile("docs/reference/platform-openapi.json", "utf8"),
);
function expand(value, root) {
  if (Array.isArray(value)) return value.map((item) => expand(item, root));
  if (!value || typeof value !== "object") return value;
  if (value.$ref) {
    const target = value.$ref
      .split("/")
      .slice(1)
      .reduce((item, key) => item[key], root);
    return expand(target, root);
  }
  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "$defs")
      .map(([key, item]) => [key, expand(item, root)]),
  );
  if (result.const !== undefined) result.enum = [result.const];
  return result;
}
const data = {
  handlers: inspector.handlers.map((handler) => ({
    ...handler,
    config_schema: expand(handler.config_schema, handler.config_schema),
  })),
  task: expand(api.components.schemas.HumanTaskContract, api),
  flow: expand(api.components.schemas.GraphFlow, api),
};
const path = "src/app/features/studio/domain/node-inspectors.json";
const output = await format(JSON.stringify(data), { parser: "json" });
if (process.argv.includes("--check")) {
  if ((await readFile(path, "utf8")) !== output)
    throw Error("Node inspector contract drift");
} else await writeFile(path, output);
console.log(
  "Verified frozen handler, human-task and flow inspector contracts.",
);
