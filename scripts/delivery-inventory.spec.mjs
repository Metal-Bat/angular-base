import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("coverage separates configured metadata from direct executable consumers", async () => {
  const { operations } = JSON.parse(
    await readFile("docs/delivery/api-ui-coverage.json", "utf8"),
  );
  const configured = operations.filter(
    (row) =>
      row.consumerDiscovery === "CONFIGURED_ACTION_REQUIRES_UI_VERIFICATION",
  );
  assert.ok(
    configured.length > 0,
    "Expected existing metadata-driven admin actions requiring domain verification",
  );
  for (const row of configured) {
    assert.equal(row.consumers.length, 0);
    assert.ok(row.metadataSources.length > 0);
    assert.equal(row.evidence, "NOT_RUN_INTEGRATED");
  }
  const direct = operations.filter(
    (row) => row.consumerDiscovery === "DIRECT_CODE_REFERENCE",
  );
  assert.ok(direct.length > 0);
  assert.ok(
    direct.every((row) =>
      row.consumers.every(
        (path) => path.endsWith(".ts") && !path.endsWith(".spec.ts"),
      ),
    ),
  );
});
