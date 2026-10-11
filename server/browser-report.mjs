import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const diagnosticHints = {
  NG0956: "Review @for tracking keys: every rendered item was recreated.",
  NG0955: "Review @for tracking keys: duplicate keys were produced.",
  "runtime-error":
    "Inspect the recorded script location and failing test step.",
  "unhandled-rejection":
    "Review asynchronous error handling at the failing step.",
};
export async function writeBrowserReport(path, report, browser) {
  if (!path) return;
  await mkdir(dirname(path), { recursive: true });
  let screenshot;
  if (browser?.captureScreenshot) {
    const imagePath = path.replace(/\.json$/, "") + ".png";
    try {
      await browser.captureScreenshot(imagePath);
      screenshot = { status: "captured", path: imagePath };
    } catch {
      screenshot = {
        status: "failed",
        reason: "Browser screenshot capture failed",
      };
    }
  }
  await writeFile(
    path,
    JSON.stringify(
      {
        ...report,
        date: new Date().toISOString(),
        evidence: "fixture-only",
        screenshot,
        hints: [
          ...new Set(
            (report.diagnostics ?? [])
              .map((item) => diagnosticHints[item.code ?? item.kind])
              .filter(Boolean),
          ),
        ],
      },
      null,
      2,
    ) + "\n",
  );
}
