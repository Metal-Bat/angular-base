import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

test(
  "release proxy FTP adapter retains directory-list fallback and downloads exact bytes",
  { timeout: 5000 },
  async () => {
    const root = process.cwd();
    const store = resolve(root, "node_modules/.pnpm");
    const entry = (await readdir(store)).find((name) =>
      name.startsWith("get-uri@"),
    );
    assert.ok(entry, "Release proxy get-uri dependency must be installed");
    const { getUri } = await import(
      pathToFileURL(resolve(store, entry, "node_modules/get-uri/dist/index.js"))
    );
    const commands = [];
    const sockets = new Set();
    let dataSocket;
    const track = (socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
    };
    const data = createServer((socket) => {
      track(socket);
      dataSocket = socket;
    });
    const listen = (server) =>
      new Promise((done, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", done);
      });
    await listen(data);
    const control = createServer((socket) => {
      track(socket);
      socket.write("220 Disposable FTP acceptance\r\n");
      let buffer = "";
      socket.on("data", (chunk) => {
        buffer += chunk.toString();
        let end;
        while ((end = buffer.indexOf("\r\n")) >= 0) {
          const line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const command = line.split(" ")[0];
          commands.push(command);
          const reply = (value) => socket.write(value + "\r\n");
          if (command === "USER") reply("331 Password required");
          else if (command === "PASS") reply("230 Logged in");
          else if (command === "FEAT")
            reply("211-Features\r\n MLST type*;size*;modify*;\r\n211 End");
          else if (command === "PWD") reply('257 "/"');
          else if (command === "CWD") reply("250 Directory changed");
          else if (command === "MDTM") reply("500 Use directory-list fallback");
          else if (command === "EPSV")
            reply(
              `229 Entering Extended Passive Mode (|||${data.address().port}|)`,
            );
          else if (command === "PASV") {
            const port = data.address().port;
            reply(
              `227 Entering Passive Mode (127,0,0,1,${port >> 8},${port & 255})`,
            );
          } else if (
            command === "LIST" ||
            command === "MLSD" ||
            command === "RETR"
          ) {
            reply("150 Opening data connection");
            const send = (connection) =>
              connection.end(
                command !== "RETR"
                  ? "type=file;size=5;modify=20261025000000; sample.txt\r\n"
                  : "hello",
                () => reply("226 Transfer complete"),
              );
            if (dataSocket) {
              send(dataSocket);
              dataSocket = undefined;
            } else data.once("connection", send);
          } else if (command === "QUIT") socket.end("221 Goodbye\r\n");
          else reply("200 Command accepted");
        }
      });
    });
    try {
      await listen(control);
      const stream = await getUri(
        new URL(`ftp://127.0.0.1:${control.address().port}/sample.txt`),
      );
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      assert.equal(Buffer.concat(chunks).toString(), "hello");
      assert.ok(stream.lastModified instanceof Date);
      for (const command of ["MDTM", "MLSD", "RETR"])
        assert.ok(commands.includes(command), command);
    } finally {
      for (const socket of sockets) socket.destroy();
      await Promise.all(
        [control, data].map(
          (server) => new Promise((done) => server.close(done)),
        ),
      );
    }
  },
);
