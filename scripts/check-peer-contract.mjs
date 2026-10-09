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
  `Verified APP-BE-001 ${manifest.backend_commit}: exact English paths and 425 shared schemas match generated-client source; en/fa hashes verified. Live HTTP is separate.`,
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
