import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { runVerificationProcess } from "./verification-process.mjs";

const run = (source, options = {}) =>
  runVerificationProcess(
    process.execPath,
    ["--input-type=module", "-e", source],
    { timeoutMs: 5000, ...options },
  );

test("verification preserves both output streams and nonzero exits", async () => {
  const output = [];
  const result = await run(
    "process.stdout.write('out');process.stderr.write('err');process.exitCode=7",
    { onOutput: (chunk, stream) => output.push([stream, chunk.toString()]) },
  );
  assert.equal(result.exitCode, 7);
  assert.equal(result.timedOut, false);
  assert.equal(result.cancelled, false);
  assert.ok(
    output.some(([stream, value]) => stream === "stdout" && value === "out"),
  );
  assert.ok(
    output.some(([stream, value]) => stream === "stderr" && value === "err"),
  );
});

test("verification cannot run with an unbounded deadline or an already-cancelled signal", async () => {
  assert.throws(() => run("", { timeoutMs: Infinity }), /bounded deadline/);
  const controller = new AbortController();
  controller.abort();
  const result = await run("process.exit(0)", { signal: controller.signal });
  assert.equal(result.cancelled, true);
  assert.equal(result.exitCode, 1);
});

test("a process which exits zero on cancellation still fails verification", async () => {
  const controller = new AbortController();
  const result = await run(
    "process.on('SIGTERM',()=>process.exit(0));console.log('ready');setInterval(()=>{},1000)",
    {
      signal: controller.signal,
      onOutput: () => controller.abort(),
    },
  );
  assert.equal(result.cancelled, true);
  assert.equal(result.exitCode, 1);
});

test("a hung descendant is terminated and releases its owned loopback port", async () => {
  let port;
  const descendant = `
    import {createServer} from 'node:net';
    process.on('SIGTERM',()=>{});
    const server=createServer();
    server.listen(0,'127.0.0.1',()=>console.log(server.address().port));
  `;
  const result = await run(
    `import {spawn} from 'node:child_process';
     process.on('SIGTERM',()=>process.exit(0));
     spawn(process.execPath,['--input-type=module','-e',${JSON.stringify(descendant)}],{stdio:['ignore','inherit','inherit']});
     setInterval(()=>{},1000);`,
    {
      timeoutMs: 1500,
      killGraceMs: 100,
      onOutput: (chunk) => {
        port = Number(chunk.toString().trim());
      },
    },
  );
  assert.equal(result.exitCode, 1);
  assert.equal(result.timedOut, true);
  assert.ok(Number.isInteger(port) && port > 0);
  const probe = createServer();
  try {
    await new Promise((resolve, reject) => {
      probe.once("error", reject);
      probe.listen(port, "127.0.0.1", resolve);
    });
  } finally {
    await new Promise((resolve) => probe.close(resolve));
  }
});

test("spawn failures become failed verification results", async () => {
  const result = await runVerificationProcess(
    "/missing/frontend-verification-command",
    [],
    { timeoutMs: 1000 },
  );
  assert.equal(result.exitCode, 1);
  assert.equal(result.errorCode, "ENOENT");
});
