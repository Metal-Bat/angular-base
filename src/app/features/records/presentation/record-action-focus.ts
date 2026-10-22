/** Restore dialog focus to the persistent action trigger, not a removed popup item. */
export function focusRecordActions(host: HTMLElement): void {
  const page = host.closest('app-resource-page');
  if (host.isConnected) {
    page
      ?.querySelector<HTMLButtonElement>(
        'app-record-page-header button[aria-haspopup="menu"]:not(:disabled)',
      )
      ?.focus();
  }
}
