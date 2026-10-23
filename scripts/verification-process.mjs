import { spawn } from "node:child_process";

export function verificationCancellation() {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  return {
    signal: controller.signal,
    dispose() {
      process.removeListener("SIGINT", interrupt);
      process.removeListener("SIGTERM", interrupt);
    },
  };
}

// Each verification child owns a process group. Deadlines and cancellation clean
// up that group, including descendants which ignore their parent's termination.
export function runVerificationProcess(
  command,
  args,
  {
    cwd,
    env = process.env,
    timeoutMs,
    signal,
    onOutput,
    killGraceMs = 1000,
  } = {},
) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw Error("Verification requires a positive bounded deadline");
  if (signal?.aborted)
    return Promise.resolve({ exitCode: 1, timedOut: false, cancelled: true });
  return new Promise((resolve) => {
    const grouped = process.platform !== "win32";
    const child = spawn(command, args, {
      cwd,
      env,
      detached: grouped,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let timedOut = false;
    let cancelled = false;
    let errorCode;
    let killTimer;
    const kill = (name) => {
      if (!child.pid) return;
      try {
        if (grouped) process.kill(-child.pid, name);
        else child.kill(name);
      } catch (error) {
        if (error.code !== "ESRCH") errorCode = error.code;
      }
    };
    const stop = () => {
      kill("SIGTERM");
      killTimer ??= setTimeout(() => kill("SIGKILL"), killGraceMs);
    };
    const cancel = () => {
      cancelled = true;
      stop();
    };
    const deadline = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);
    signal?.addEventListener("abort", cancel, { once: true });
    for (const [stream, name] of [
      [child.stdout, "stdout"],
      [child.stderr, "stderr"],
    ])
      stream.on("data", (chunk) => onOutput?.(chunk, name));
    child.on("error", (error) => {
      errorCode = error.code;
    });
    child.on("close", (code, exitSignal) => {
      clearTimeout(deadline);
      clearTimeout(killTimer);
      signal?.removeEventListener("abort", cancel);
      // Descendants can outlive a leader which exits before its kill grace ends.
      if (grouped) kill("SIGKILL");
      resolve({
        exitCode: timedOut || cancelled || errorCode ? 1 : (code ?? 1),
        signal: exitSignal,
        timedOut,
        cancelled,
        ...(errorCode ? { errorCode } : {}),
      });
    });
    if (signal?.aborted) cancel();
  });
}
