import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { createHttpBoundary } from "./http-boundary.mjs";

async function serverFor(t, handle) {
  const server = createServer(
    createHttpBoundary({ browserOrigin: "http://127.0.0.1", handle }),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test("HTTP adapter starts sending a private download before upstream completion", async (t) => {
  let finish;
  const source = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("first"));
      finish = () => {
        controller.enqueue(new TextEncoder().encode("last"));
        controller.close();
      };
    },
  });
  const origin = await serverFor(
    t,
    async () =>
      new Response(source, {
        headers: { "cache-control": "private, no-store" },
      }),
  );
  const response = await fetch(origin);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const reader = response.body.getReader();
  assert.equal(new TextDecoder().decode((await reader.read()).value), "first");
  finish();
  assert.equal(new TextDecoder().decode((await reader.read()).value), "last");
  assert.equal((await reader.read()).done, true);
});

test("HTTP disconnect aborts owned upstream work and cancels response consumption", async (t) => {
  let cancelled;
  const cancellation = new Promise((resolve) => {
    cancelled = resolve;
  });
  let signal;
  const origin = await serverFor(t, async (request) => {
    signal = request.signal;
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1]));
        },
        cancel() {
          cancelled();
        },
      }),
    );
  });
  const controller = new AbortController();
  const response = await fetch(origin, { signal: controller.signal });
  await response.body.getReader().read();
  controller.abort();
  await Promise.race([
    cancellation,
    new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(Error("Cancellation missing")),
        2000,
      );
      timer.unref();
    }),
  ]);
  assert.equal(signal.aborted, true);
});

test("HTTP adapter closes a failed body after headers without replacing it with a success", async (t) => {
  let fail;
  const origin = await serverFor(
    t,
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([1]));
            fail = () => controller.error(Error("private diagnostic"));
          },
        }),
      ),
  );
  const response = await fetch(origin);
  const reader = response.body.getReader();
  await reader.read();
  fail();
  await assert.rejects(reader.read());
});

test("HTTP adapter returns a safe rejection when an upload exceeds the read limit", async (t) => {
  const { readBoundedBody } = await import("./private-transfer.mjs");
  const origin = await serverFor(t, async (request) => {
    try {
      await readBoundedBody(request, 1024);
      return new Response("unexpected");
    } catch {
      return Response.json(
        { error: "invalid_request_body", uncertain: false },
        { status: 413 },
      );
    }
  });
  const response = await fetch(origin, {
    method: "POST",
    body: new Uint8Array(1025),
  });
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), {
    error: "invalid_request_body",
    uncertain: false,
  });
});
