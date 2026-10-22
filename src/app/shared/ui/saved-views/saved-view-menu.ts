import type { MenuItem } from 'primeng/api';
export type ViewAction =
  'save' | 'rename' | 'update' | 'default' | 'remove' | 'reload';
export function savedViewMenu(
  state: { busy: boolean; blocked: boolean; selected: boolean; query: boolean },
  text: (label: string) => string,
  execute: (action: ViewAction) => void,
): MenuItem[] {
  const actions: { action: ViewAction; label: string; disabled: boolean }[] = [
    {
      action: 'save',
      label: 'Save current view',
      disabled: state.blocked || !state.query,
    },
    {
      action: 'rename',
      label: 'Rename',
      disabled: state.blocked || !state.selected,
    },
    {
      action: 'update',
      label: 'Update',
      disabled: state.blocked || !state.selected || !state.query,
    },
    {
      action: 'default',
      label: 'Make default',
      disabled: state.blocked || !state.selected,
    },
    {
      action: 'remove',
      label: 'Remove',
      disabled: state.blocked || !state.selected,
    },
    { action: 'reload', label: 'Reload', disabled: state.busy },
  ];
  return actions.map(({ action, label, disabled }) => ({
    label: text(label),
    disabled,
    command: (): void => execute(action),
  }));
}
