import { writeFile } from "node:fs/promises";

// Uses the browser's own protocol; no extra browser, profile or dependency.
function connect(endpoint) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(endpoint);
    let id = 0;
    const pending = new Map();
    const timer = setTimeout(() => {
      socket.close();
      reject(Error("Screenshot protocol connection timed out"));
    }, 3000);
    socket.addEventListener("error", () => {
      clearTimeout(timer);
      reject(Error("Screenshot protocol connection failed"));
    });
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error || message.type === "error")
        request.reject(Error("Screenshot protocol command failed"));
      else request.resolve(message.result);
    });
    socket.addEventListener("open", () => {
      clearTimeout(timer);
      resolve({
        close: () => socket.close(),
        command: (method, params = {}, sessionId) =>
          new Promise((resolve, reject) => {
            const current = ++id;
            const timer = setTimeout(() => {
              pending.delete(current);
              reject(Error("Screenshot protocol command timed out"));
            }, 3000);
            pending.set(current, { resolve, reject, timer });
            socket.send(
              JSON.stringify({ id: current, method, params, sessionId }),
            );
          }),
      });
    });
  });
}

export function observeScreenshotEndpoint(browser, engine) {
  let endpoint;
  let stderr = "";
  browser.stderr.on("data", (chunk) => {
    // Keep only enough to find the loopback automation endpoint, never report stderr.
    stderr = (stderr + chunk.toString()).slice(-4096);
    const match = stderr.match(
      /(?:WebDriver BiDi|DevTools) listening on (ws:\/\/[^\s]+)/,
    );
    if (match) {
      const url = new URL(match[1]);
      if (["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
        endpoint = engine === "firefox" ? match[1] + "/session" : match[1];
    }
  });
  return async (path) => {
    if (!endpoint) throw Error("Screenshot protocol endpoint unavailable");
    const protocol = await connect(endpoint);
    try {
      let result;
      if (engine === "firefox") {
        await protocol.command("session.new", { capabilities: {} });
        const tree = await protocol.command("browsingContext.getTree", {
          maxDepth: 0,
        });
        const context = tree.contexts.find((item) =>
          item.url.startsWith("http"),
        )?.context;
        if (!context) throw Error("Screenshot page unavailable");
        result = await protocol.command("browsingContext.captureScreenshot", {
          context,
          origin: "viewport",
        });
      } else {
        const { targetInfos } = await protocol.command("Target.getTargets");
        const targetId = targetInfos.find(
          (item) => item.type === "page",
        )?.targetId;
        if (!targetId) throw Error("Screenshot page unavailable");
        const { sessionId } = await protocol.command("Target.attachToTarget", {
          targetId,
          flatten: true,
        });
        result = await protocol.command(
          "Page.captureScreenshot",
          { format: "png" },
          sessionId,
        );
      }
      await writeFile(path, Buffer.from(result.data, "base64"));
    } finally {
      protocol.close();
    }
  };
}
