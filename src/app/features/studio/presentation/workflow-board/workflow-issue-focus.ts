/** Focus a known typed setting; unknown diagnostics retain a readable node target. */
export function focusWorkflowIssue(host: HTMLElement, pointer: string): void {
  const tokens = pointer.split('/');
  const config = tokens.indexOf('config');
  const field = config >= 0 ? tokens[config + 1] : '';
  const control = field
    ? host.querySelector<HTMLElement>('#' + CSS.escape('node-' + field))
    : null;
  const target =
    control &&
    control.getAttribute('aria-disabled') !== 'true' &&
    !control.hasAttribute('disabled')
      ? control
      : host.querySelector<HTMLElement>('.step-inspector h2');
  if (!target) {
    return;
  }
  for (
    let parent = target.parentElement;
    parent && host.contains(parent);
    parent = parent.parentElement
  ) {
    if (parent instanceof HTMLDetailsElement) {
      parent.open = true;
    }
  }
  if (!control || target !== control) {
    target.tabIndex = -1;
  }
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest' });
}
