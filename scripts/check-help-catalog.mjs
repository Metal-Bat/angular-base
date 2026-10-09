import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { format } from "prettier";
import { readFile, writeFile } from "node:fs/promises";
const handoff = JSON.parse(
  await readFile("docs/reference/app-be-wave-four/manifest.json", "utf8"),
);
const schema = await readFile(
  "docs/reference/app-be-wave-four/help-release.schema.json",
);
assert.equal(
  createHash("sha256").update(schema).digest("hex"),
  handoff.artifacts["help-release.schema.json"],
);
const producerSchema = JSON.parse(schema.toString());
assert.equal(
  producerSchema.$defs.HelpReleaseItem.properties.help_key.pattern,
  "^[a-z][a-z0-9_.-]*$",
);
assert.deepEqual(
  producerSchema.$defs.HelpReleaseItem.properties.locales.items.enum,
  ["en", "fa"],
);
const rows = JSON.parse(
  await readFile("src/app/features/help/domain/help-catalog.json", "utf8"),
);
assert.ok(rows.length > 0 && rows.length <= 128);
const keys = new Set();
const orders = new Set();
const routes = new Set(["requests", "tasks", "studio", "notifications"]);
for (const topic of rows) {
  assert.match(topic.help_key, /^[a-z][a-z0-9_.-]{0,63}$/);
  assert.match(topic.revision, /^[A-Za-z0-9_.-]{1,64}$/);
  assert.ok(!keys.has(topic.help_key));
  keys.add(topic.help_key);
  assert.ok(
    Number.isInteger(topic.order) &&
      topic.order > 0 &&
      !orders.has(topic.order),
  );
  orders.add(topic.order);
  assert.ok(topic.route_key === null || routes.has(topic.route_key));
  assert.ok(
    Array.isArray(topic.permissions) &&
      topic.permissions.every(
        (permission) =>
          typeof permission === "string" &&
          /^[a-z][a-z0-9_.]+$/.test(permission),
      ),
  );
  for (const locale of ["en", "fa"]) {
    for (const key of ["title", "body"]) {
      assert.equal(typeof topic[key][locale], "string");
      assert.ok(
        topic[key][locale].trim().length > 0 &&
          topic[key][locale].length <= 4096,
      );
      assert.ok(!/[<>]/.test(topic[key][locale]), "Help is plain text");
    }
  }
}
const metadata = {
  schema_version: 1,
  release_key: "app-fe-help-1",
  items: rows.map((topic) => ({
    help_key: topic.help_key,
    revision: topic.revision,
    locales: ["en", "fa"],
  })),
};
const expected = await format(JSON.stringify(metadata), { parser: "json" });
const path = "docs/delivery/help-release-metadata.json";
if (process.argv.includes("--write")) await writeFile(path, expected);
else
  assert.equal(
    await readFile(path, "utf8"),
    expected,
    "Help metadata drift; run node scripts/check-help-catalog.mjs --write",
  );
console.log(
  `Verified ${rows.length} bilingual plain-text help topics and metadata-only release handoff.`,
);
