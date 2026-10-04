import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";

const generatorPackage = JSON.parse(
  await readFile("node_modules/openapi-typescript/package.json", "utf8"),
);
if (generatorPackage.version !== "7.13.0") {
  throw Error("Install the pinned API generator with npm ci.");
}
const input = "docs/reference/platform-openapi.json";
const bytes = await readFile(input);
const schema = JSON.parse(bytes);
const hash = createHash("sha256").update(bytes).digest("hex");
const ast = await openapiTS(schema, {
  alphabetize: true,
  transform(node) {
    if (
      node.format === "binary" ||
      node.contentMediaType === "application/octet-stream"
    )
      return ts.factory.createTypeReferenceNode("Blob");
  },
});
const descriptors = {};
const methods = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);
for (const [path, item] of Object.entries(schema.paths)) {
  for (const [method, operation] of Object.entries(item)) {
    if (!methods.has(method)) continue;
    const responses = Object.entries(operation.responses).filter(([status]) =>
      /^2\d\d$/.test(status),
    );
    const content = responses.flatMap(([, response]) =>
      Object.keys(response.content ?? {}),
    );
    const binary = responses.some(([, response]) =>
      Object.values(response.content ?? {}).some(
        (entry) =>
          entry.schema?.format === "binary" ||
          entry.schema?.contentMediaType === "application/octet-stream",
      ),
    );
    descriptors[operation.operationId] = {
      path,
      method: method.toUpperCase(),
      area: operation.tags?.[0] ?? "health",
      scope: path.startsWith("/api/v1/") ? "api" : "root",
      requestMedia:
        Object.keys(operation.requestBody?.content ?? {})[0] ?? null,
      responseType: binary
        ? "blob"
        : content.some((type) => type === "application/json")
          ? "json"
          : content.length
            ? "blob"
            : "text",
    };
  }
}
const settings = {
  generator: "openapi-typescript",
  version: "7.13.0",
  input,
  sha256: hash,
  alphabetize: true,
  binaryType: "Blob",
  binaryFormats: ["format:binary", "contentMediaType:application/octet-stream"],
  operationCount: Object.keys(descriptors).length,
};
const outputs = {
  "src/app/core/transport/generated/schema.ts":
    "// Generated; do not edit. Input SHA256: " +
    hash +
    "\n" +
    astToString(ast),
  "src/app/core/transport/generated/operations.ts":
    "// Generated; do not edit.\nexport const endpoints = " +
    JSON.stringify(descriptors, null, 2) +
    " as const;\n",
  "docs/reference/client-generation.json":
    JSON.stringify(settings, null, 2) + "\n",
};
for (const [path, value] of Object.entries(outputs)) {
  if (process.argv.includes("--check")) {
    if ((await readFile(path, "utf8").catch(() => null)) !== value)
      throw Error(
        "Generated API drift: " + path + "; run npm run api:generate",
      );
  } else {
    await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
    await writeFile(path, value);
  }
}
console.log(
  "Verified/generated " +
    settings.operationCount +
    " typed operations from " +
    hash.slice(0, 12),
);
