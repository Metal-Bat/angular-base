import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const escape = (text) =>
  String(text ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
export async function renderSandboxReport(directory, exitCode) {
  const summary = await readFile(
    join(directory, "browser-summary.json"),
    "utf8",
  )
    .then(JSON.parse)
    .catch(() => ({ results: [] }));
  const rows = [];
  for (const result of summary.results) {
    const report = await readFile(result.report, "utf8")
      .then(JSON.parse)
      .catch(() => null);
    const diagnosticText = (report?.diagnostics ?? [])
      .map((item) =>
        [
          item.kind,
          item.code,
          ...(item.locations ?? []).map(
            (location) =>
              `${location.file}:${location.line}:${location.column}`,
          ),
        ]
          .filter(Boolean)
          .join(" · "),
      )
      .join("; ");
    const hints = (report?.hints ?? []).join(" ");
    const links = [result.report, result.log, report?.screenshot?.path]
      .filter(Boolean)
      .map(
        (path) =>
          `<a href="${escape(basename(path))}">${escape(basename(path))}</a>`,
      )
      .join(" · ");
    rows.push(
      `<tr><td>${escape(result.scope)}</td><td>${result.exitCode === 0 ? "Passed" : "Failed"}</td><td>${escape(report?.stage)}<p>${escape(diagnosticText)}</p><p>${escape(hints)}</p></td><td>${escape(report?.failedRequests?.length ?? 0)}</td><td>${links}</td></tr>`,
    );
  }
  await writeFile(
    join(directory, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Browser sandbox report</title><style>body{font:16px system-ui;margin:2rem;color:#172554;background:#f8fafc}main{max-width:90rem;margin:auto}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:1rem;border-bottom:1px solid #cbd5e1;vertical-align:top;overflow-wrap:anywhere}a{color:#1d4ed8}p{margin:.5rem 0}.scroll{overflow:auto}h1{font-size:1.75rem}</style></head><body><main><h1>Browser sandbox: ${exitCode === 0 ? "passed" : "failed"}</h1><p>Disposable local fixtures. Reports describe tested symptoms; they do not prove live-backend or deployment readiness.</p><p><a href="build.log">Build log</a> · <a href="journey.log">Journey log</a> · <a href="run.json">Run metadata</a></p><div class="scroll"><table><thead><tr><th>Scope</th><th>Result</th><th>Last step and diagnostics</th><th>Rejected HTTP requests</th><th>Evidence</th></tr></thead><tbody>${rows.join("")}</tbody></table></div></main></body></html>`,
  );
}
