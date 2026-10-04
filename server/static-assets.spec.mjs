import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import { once } from "node:events";
import { createStaticAssets } from "./static-assets.mjs";
test("local release switch and rollback preserve SPA/cache policy and API separation", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "release-rehearsal-"));
  let server;
  try {
    for (const release of ["A", "B"]) {
      const directory = join(temporary, release);
      await mkdir(directory);
      await writeFile(
        join(directory, "index.html"),
        `<h1>Release ${release}</h1>`,
      );
      await writeFile(
        join(directory, "runtime-config.json"),
        JSON.stringify({ locale: release === "A" ? "en" : "fa" }),
      );
      await writeFile(
        join(directory, "main-ABCDEFGH.js"),
        `const release = '${release}';`,
      );
    }
    let assets = await createStaticAssets(join(temporary, "A"));
    server = createServer(async (req, res) => {
      const response = await assets(
        new Request("http://localhost" + req.url, { method: req.method }),
      );
      if (!response) {
        res.writeHead(418);
        res.end("boundary-owned");
        return;
      }
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = `http://127.0.0.1:${server.address().port}`;
    const load = (path) => fetch(origin + path);
    let page = await load("/studio/workflow-versions/opaque%2Fpin/edit");
    assert.equal(page.headers.get("cache-control"), "no-store");
    assert.match(await page.text(), /Release A/);
    assert.equal(
      (await load("/main-ABCDEFGH.js")).headers.get("cache-control"),
      "public, max-age=31536000, immutable",
    );
    assert.equal(
      (await load("/runtime-config.json")).headers.get("cache-control"),
      "no-store",
    );
    assets = await createStaticAssets(join(temporary, "B"));
    assert.match(
      await (await load("/operations/cases/pinned-old-version")).text(),
      /Release B/,
    );
    assets = await createStaticAssets(join(temporary, "A"));
    assert.match(
      await (await load("/operations/cases/pinned-old-version")).text(),
      /Release A/,
    );
    assert.equal((await load("/api/v1/processes/pin")).status, 418);
    assert.equal((await load("/session/status")).status, 418);
    assert.equal((await load("/health")).status, 418);
    assert.equal((await load("/ready")).status, 418);
    assert.equal((await load("/api%2fv1/processes/pin")).status, 418);
    assert.equal((await load("/session%2fstatus")).status, 418);
    assert.equal((await load("/missing.js")).status, 404);
    assert.equal((await load("/main-ABCDEFGH.js.map")).status, 404);
    assert.equal(
      (await fetch(origin + "/studio", { method: "POST" })).status,
      405,
    );
    assert.equal(
      (await fetch(origin + "/studio", { method: "HEAD" })).headers.get(
        "content-type",
      ),
      "text/html; charset=utf-8",
    );
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  }
});
test("encoded traversal, malformed paths, hidden files and symlink escapes are denied", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "release-assets-"));
  try {
    const directory = join(temporary, "public");
    await mkdir(directory);
    await writeFile(join(directory, "index.html"), "safe");
    await writeFile(join(temporary, "private.json"), "private");
    await symlink(
      join(temporary, "private.json"),
      join(directory, "escaped.json"),
    );
    const assets = await createStaticAssets(directory);
    for (const path of [
      "/escaped.json",
      "/%2e%2e%2fprivate.json",
      "/%5cprivate.json",
      "/.env",
      "/%00.json",
    ])
      assert.equal(
        (await assets(new Request("http://localhost" + path))).status,
        404,
      );
    assert.equal(
      (await assets(new Request("http://localhost/%ZZ"))).status,
      400,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
