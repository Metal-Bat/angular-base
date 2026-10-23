import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const root = "docs/reference/app-be-001/";
const manifest = JSON.parse(
  await readFile(root + "contract-manifest.json", "utf8"),
);
const bytes = await readFile(root + manifest.schemas.en.path);
const english = JSON.parse(bytes);
for (const [language, descriptor] of Object.entries(manifest.schemas)) {
  const source = await readFile(root + descriptor.path);
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    descriptor.sha256,
    `${language} producer hash drift`,
  );
  const localized = JSON.parse(source);
  assert.deepEqual(
    Object.keys(localized.paths).sort(),
    Object.keys(english.paths).sort(),
  );
}
const platform = JSON.parse(
  await readFile("docs/reference/platform-openapi.json", "utf8"),
);
assert.deepEqual(
  english.paths,
  platform.paths,
  "Producer operation contract changed; regenerate/reconcile before use",
);
assert.deepEqual(
  english.components.schemas,
  platform.components.schemas,
  "Producer schemas changed; regenerate/reconcile before use",
);
assert.equal(manifest.peer_commit, "afe4bbe5f566c80e7eb45f6ef9f12c041d60139d");
console.log(
  `Verified APP-BE-001 ${manifest.current_intake?.backend_commit ?? manifest.backend_commit}: exact English paths and ${Object.keys(platform.components.schemas).length} shared schemas match generated-client source; en/fa hashes verified. Live HTTP is separate.`,
);

const waveRoot = "docs/reference/app-be-wave-four/";
const wave = JSON.parse(await readFile(waveRoot + "manifest.json", "utf8"));
for (const artifact of ["inspector-en.json", "metric-dictionary.json"]) {
  const content = await readFile(waveRoot + artifact);
  assert.equal(
    createHash("sha256").update(content).digest("hex"),
    wave.artifacts[artifact],
    artifact + " producer hash drift",
  );
}
const inspector = JSON.parse(
  await readFile(waveRoot + "inspector-en.json", "utf8"),
);
const options = JSON.parse(
  await readFile("src/app/features/studio/domain/form-options.json", "utf8"),
);
assert.equal(inspector.fields.length, 20);
assert.deepEqual(
  options,
  Object.fromEntries(
    inspector.fields.map((field) => [field.key, field.options_schema]),
  ),
);
assert.deepEqual(
  JSON.parse(
    await readFile(
      "src/app/features/analytics/domain/metric-catalog.json",
      "utf8",
    ),
  ),
  JSON.parse(await readFile(waveRoot + "metric-dictionary.json", "utf8")),
);
console.log(
  "Verified 20 copied field option schemas and the metric dictionary against frozen producer hashes; no new transport/integration claim.",
);

const inboxBytes = await readFile("docs/reference/inbox.openapi.json");
assert.equal(
  createHash("sha256").update(inboxBytes).digest("hex"),
  manifest.notification_intake.sha256,
  "Unified inbox intake hash drift",
);
const inbox = JSON.parse(inboxBytes);
for (const [path, operations] of Object.entries(inbox.paths))
  assert.deepEqual(
    platform.paths[path],
    operations,
    "Unified inbox operation differs from main generated transport",
  );
for (const [name, schema] of Object.entries(inbox.components.schemas))
  assert.deepEqual(
    platform.components.schemas[name],
    schema,
    "Unified inbox schema differs from main generated transport",
  );
console.log(
  "Verified current inbox/SSE intake and the main client share one producer manifest.",
);

// The main producer manifest also governs its reviewed inspector metadata slice.
const primitiveIntake =
  manifest.reviewed_metadata_intakes?.workflow_primitives_2026_10_22;
assert.ok(primitiveIntake, "Reviewed workflow primitive intake is missing");
for (const language of ["en", "fa", "ar"]) {
  const name = `inspector-${language}.json`;
  const content = await readFile(waveRoot + name);
  const fingerprint = createHash("sha256").update(content).digest("hex");
  assert.equal(fingerprint, wave.artifacts[name], name + " slice hash drift");
  assert.equal(
    fingerprint,
    primitiveIntake.inspector_sha256[name],
    name + " main producer drift",
  );
}
assert.equal(inspector.handlers.length, 23);
console.log(
  "Verified 23 reviewed workflow handlers across en/fa/ar under the main producer manifest.",
);
