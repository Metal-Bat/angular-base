export function formDraftStatus(view: {
  pending(): readonly string[];
  dirty(): boolean;
  error(): string;
  diagnostics(): string;
}): string {
  if (view.error()) {
    return 'Review operation status';
  }
  if (view.pending().length) {
    return 'Apply pending edits';
  }
  if (view.dirty()) {
    return 'Unsaved draft changes';
  }
  return view.diagnostics() === 'Saved' ? 'Saved' : 'No unsaved changes';
}
