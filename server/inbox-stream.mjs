// Dedicated long-lived policy. Ordinary JSON and binary limits remain unchanged.
export function createInboxStreamPolicy({ fetcher, upstream, now }) {
  let connections = 0;
  return async function forward(request, session, valid) {
    if (request.signal.aborted) {
      return Response.json({ error: "stream_cancelled" }, { status: 400 });
    }
    const cursor = request.headers.get("last-event-id");
    if (
      request.method !== "GET" ||
      new URL(request.url).search ||
      (cursor !== null && !/^[A-Za-z0-9_-]{1,256}$/.test(cursor))
    ) {
      return Response.json(
        { error: "invalid_stream_request" },
        { status: 400 },
      );
    }
    if (connections >= 100 || session.streams.size >= 2) {
      return Response.json(
        { error: "stream_capacity_reached" },
        { status: 429 },
      );
    }
    const abort = new AbortController();
    session.streams.add(abort);
    connections++;
    let reader, controller, idle, stalled, headerTimer, lifetime;
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      for (const timer of [idle, stalled, headerTimer, lifetime])
        clearTimeout(timer);
      request.signal.removeEventListener("abort", cancel);
      abort.signal.removeEventListener("abort", cancel);
      session.streams.delete(abort);
      connections--;
      void reader?.cancel().catch(() => {});
    };
    const cancel = () => {
      if (finished) return;
      cleanup();
      abort.abort();
      controller?.error(Error("Notification stream closed"));
    };
    request.signal.addEventListener("abort", cancel, { once: true });
    abort.signal.addEventListener("abort", cancel, { once: true });
    const timer = (ms) => {
      const value = setTimeout(cancel, ms);
      value.unref?.();
      return value;
    };
    headerTimer = timer(15000);
    try {
      const headers = new Headers({
        authorization: `Bearer ${session.accessToken}`,
        accept: "text/event-stream",
      });
      for (const name of ["accept-language", "last-event-id"])
        if (request.headers.has(name))
          headers.set(name, request.headers.get(name));
      const response = await fetcher(
        new URL("/api/v1/inbox/events", upstream),
        {
          method: "GET",
          headers,
          redirect: "error",
          cache: "no-store",
          signal: abort.signal,
        },
      );
      clearTimeout(headerTimer);
      if (!valid() || finished) {
        await response.body?.cancel();
        cleanup();
        return Response.json({ error: "session_expired" }, { status: 401 });
      }
      if (!response.ok) {
        cleanup();
        return response;
      }
      if (
        !response.headers
          .get("content-type")
          ?.startsWith("text/event-stream") ||
        !response.body
      ) {
        await response.body?.cancel();
        cleanup();
        return Response.json(
          { error: "invalid_stream_response" },
          { status: 502 },
        );
      }
      reader = response.body.getReader();
      lifetime = timer(
        Math.max(
          1,
          Math.min(
            310000,
            session.expiresAt - now(),
            session.accessExpiresAt - now(),
          ),
        ),
      );
      idle = timer(45000);
      // Scan only framing bytes, never parse or collect private SSE JSON. Memory is one
      // upstream chunk plus Node's byte-bounded pipeline; no cumulative body limit.
      let frameBytes = 0,
        frames = 0,
        previous = 0;
      const body = new ReadableStream(
        {
          start(value) {
            controller = value;
          },
          async pull(output) {
            clearTimeout(stalled);
            try {
              if (!valid()) throw Error("Session closed");
              const { done, value } = await reader.read();
              if (finished) return;
              if (done) {
                cleanup();
                output.close();
                return;
              }
              if (value.byteLength > 65536) throw Error("Stream chunk limit");
              for (const byte of value) {
                frameBytes++;
                if (frameBytes > 4096) throw Error("Stream event limit");
                if (byte === 10 && previous === 10) {
                  frameBytes = 0;
                  if (++frames > 1024)
                    throw Error("Stream connection event limit");
                }
                if (byte !== 13) previous = byte;
              }
              clearTimeout(idle);
              idle = timer(45000);
              output.enqueue(value);
              // Disconnect a blocked consumer rather than accumulating an event backlog.
              stalled = timer(5000);
            } catch {
              cancel();
            }
          },
          cancel() {
            cleanup();
            abort.abort();
          },
        },
        { highWaterMark: 0 },
      );
      const outgoing = new Headers({
        "content-type": "text/event-stream",
        "cache-control": "private, no-store, no-transform",
        "x-accel-buffering": "no",
        "x-content-type-options": "nosniff",
      });
      for (const name of ["x-request-id", "content-language"])
        if (response.headers.has(name))
          outgoing.set(name, response.headers.get(name));
      return new Response(body, { status: 200, headers: outgoing });
    } catch {
      cleanup();
      abort.abort();
      return Response.json({ error: "stream_unavailable" }, { status: 503 });
    }
  };
}
