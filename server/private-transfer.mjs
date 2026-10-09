export class TransferLimit extends Error {}

export function byteLimit(value, fallback) {
  const limit = value ?? fallback;
  if (!Number.isSafeInteger(limit) || limit < 1024 || limit > 64 * 1024 * 1024)
    throw Error("Invalid transfer limit");
  return limit;
}

function declaredSize(headers, limit) {
  const length = headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit))
    throw new TransferLimit("Transfer exceeds limit");
}

export async function readBoundedBody(
  message,
  limit,
  signal = AbortSignal.any([
    AbortSignal.timeout(15000),
    ...(message.signal ? [message.signal] : []),
  ]),
) {
  declaredSize(message.headers, limit);
  if (!message.body) return new Uint8Array();
  const reader = message.body.getReader();
  const aborted = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", aborted, { once: true });
  if (signal.aborted) aborted();
  const parts = [];
  let size = 0;
  try {
    for (;;) {
      if (signal.aborted) throw Error("Private transfer interrupted");
      const { done, value } = await reader.read();
      if (signal.aborted) throw Error("Private transfer interrupted");
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new TransferLimit("Transfer exceeds limit");
      parts.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    signal.removeEventListener("abort", aborted);
    reader.releaseLock();
  }
  return Buffer.concat(parts, size);
}

export async function readBoundedJson(message, limit = 65536) {
  return JSON.parse(
    new TextDecoder().decode(await readBoundedBody(message, limit)),
  );
}

// One chunk is requested per consumer pull; upstream bytes are never accumulated.
export function boundedResponseBody(response, limit, valid, signal) {
  declaredSize(response.headers, limit);
  if (!response.body) return null;
  const reader = response.body.getReader();
  let size = 0;
  let stopped = false;
  const cancel = async () => {
    if (stopped) return;
    stopped = true;
    signal?.removeEventListener("abort", aborted);
    await reader.cancel().catch(() => {});
  };
  let streamController;
  const aborted = () => {
    streamController.error(Error("Private transfer interrupted"));
    void cancel();
  };
  return new ReadableStream(
    {
      start(controller) {
        streamController = controller;
        signal?.addEventListener("abort", aborted, { once: true });
        if (signal?.aborted) aborted();
      },
      async pull(controller) {
        try {
          if (!valid() || signal?.aborted)
            throw Error("Private transfer interrupted");
          const { done, value } = await reader.read();
          if (stopped) return;
          if (!valid() || signal?.aborted)
            throw Error("Private transfer interrupted");
          if (done) {
            stopped = true;
            signal?.removeEventListener("abort", aborted);
            reader.releaseLock();
            controller.close();
            return;
          }
          size += value.byteLength;
          if (size > limit) throw new TransferLimit("Transfer exceeds limit");
          controller.enqueue(value);
        } catch {
          if (!stopped) controller.error(Error("Private transfer interrupted"));
          await cancel();
        }
      },
      cancel,
    },
    { highWaterMark: 0 },
  );
}
