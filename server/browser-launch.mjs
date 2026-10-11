import { spawn } from "node:child_process";
import { observeScreenshotEndpoint } from "./browser-screenshot.mjs";
export function browserName() {
  return process.env.BROWSER_ENGINE === "chromium" ? "Chromium" : "Firefox";
}
export function spawnBrowser(
  url,
  profile,
  { width = 390, height = 844, insecureTestTls = false } = {},
) {
  const engine = process.env.BROWSER_ENGINE ?? "firefox";
  if (!["firefox", "chromium"].includes(engine))
    throw Error("Unknown browser engine");
  const binary =
    process.env.BROWSER_BINARY ??
    (engine === "firefox"
      ? (process.env.FIREFOX_BINARY ?? "firefox")
      : "chromium");
  const screenshots = process.env.BROWSER_SANDBOX_DIAGNOSTICS === "1";
  const args =
    engine === "firefox"
      ? [
          "--headless",
          "--no-remote",
          "--width",
          String(width),
          "--height",
          String(height),
          "--profile",
          profile,
          ...(screenshots ? ["--remote-debugging-port=0"] : []),
          url,
        ]
      : [
          "--headless",
          "--disable-background-networking",
          "--disable-component-update",
          "--disable-sync",
          "--no-first-run",
          "--disable-dev-shm-usage",
          `--window-size=${width},${height}`,
          `--user-data-dir=${profile}`,
          ...(process.env.BROWSER_NO_SANDBOX === "1" ? ["--no-sandbox"] : []),
          ...(insecureTestTls ? ["--ignore-certificate-errors"] : []),
          ...(screenshots ? ["--remote-debugging-port=0"] : []),
          url,
        ];
  const browser = spawn(binary, args, {
    stdio: screenshots ? ["ignore", "ignore", "pipe"] : "ignore",
  });
  if (screenshots)
    browser.captureScreenshot = observeScreenshotEndpoint(browser, engine);
  return browser;
}
