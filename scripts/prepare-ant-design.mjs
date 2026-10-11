import { readFile, writeFile, mkdir } from "node:fs/promises";

// Keep vendor resets within an explicit Ant Design boundary. The optional
// stylesheet is requested by AntDesign rather than added to the initial bundle.
const light = await readFile(
  "node_modules/ng-zorro-antd/ng-zorro-antd.min.css",
  "utf8",
);
const dark = await readFile(
  "node_modules/ng-zorro-antd/ng-zorro-antd.dark.min.css",
  "utf8",
);
await mkdir("public/ui", { recursive: true });
await writeFile(
  "public/ui/ant-design.css",
  `@layer antd {
@scope (html:not(.app-dark) :is(.ant-design, .cdk-overlay-pane:has([class*="ant-"]))) { ${light} }
@scope (html.app-dark :is(.ant-design, .cdk-overlay-pane:has([class*="ant-"]))) { ${dark} }
.ant-design, .cdk-overlay-pane:has([class*="ant-"]) { font-family: var(--workspace-font-family); color: var(--console-text); }
.ant-design .ant-input, .ant-design .ant-btn,
.ant-design .ant-select:not(.ant-select-customize-input) .ant-select-selector {
  font-family: var(--workspace-font-family);
  border-radius: var(--workspace-radius);
  border-color: var(--console-input-border);
  background: var(--console-surface);
  color: var(--console-text);
}
.ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
  background: var(--console-accent-soft); color: var(--console-text);
}
.ant-design .ant-input:hover, .ant-design .ant-input:focus {
  border-color: var(--console-accent);
}
.ant-design .ant-btn-primary:not(:disabled) {
  background: var(--console-accent);
  border-color: var(--console-accent);
  color: var(--console-on-accent);
}
.ant-design .ant-btn-primary:not(:disabled):hover {
  background: var(--console-accent-hover);
  border-color: var(--console-accent-hover);
}
}
`,
);
