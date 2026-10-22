import { ContextAction } from '../../../../shared/ui/context-menu-control/context-menu-control';
import type { WorkflowCanvas } from './workflow-canvas';
/** Commands always target the reviewed item or its existing selection group. */
export function canvasContextActions(
  view: WorkflowCanvas,
  translate: (label: string) => string,
): ContextAction[] {
  const key = view.menuNode();
  const edge = view.menuEdge();
  const blocked = view.disabled() || view.readOnly();
  if (edge) {
    return [
      {
        label: translate('Inspect connection'),
        icon: 'pi pi-search',
        command: (): void => view.inspectEdge()?.(edge),
      },
      {
        label: translate('Remove connection'),
        icon: 'pi pi-trash',
        disabled: blocked || !view.deleteEdge(),
        command: (): void => {
          if (
            !view.disabled() &&
            !view.readOnly() &&
            view.edges().some((item) => item.id === edge)
          ) {
            view.deleteEdge()?.(edge);
          }
        },
      },
      {
        label: translate('Edit connection route'),
        disabled: blocked || !view.automaticRouting()[edge],
        command: (): void => view.editRoute(edge),
      },
      {
        label: translate('Insert step'),
        disabled:
          blocked ||
          !view.insertStep() ||
          !view
            .edges()
            .some((item) => item.id === edge && item.kind === 'control'),
        command: (): void => view.insertStep()?.(edge),
      },
    ];
  }
  if (
    key &&
    view.selectionKeys().includes(key) &&
    view.selectionKeys().length > 1
  ) {
    return [
      {
        label: translate('Duplicate selection'),
        command: (): void => view.groupAction()?.('duplicate'),
        disabled: blocked,
      },
      {
        label: translate('Align left'),
        command: (): void => view.groupAction()?.('left'),
        disabled: blocked,
      },
      {
        label: translate('Align top'),
        command: (): void => view.groupAction()?.('top'),
        disabled: blocked,
      },
      {
        label: translate('Remove selected steps'),
        command: (): void => view.groupAction()?.('remove'),
        disabled: blocked,
      },
    ];
  }
  return key
    ? [
        {
          label: translate('Inspect step'),
          icon: 'pi pi-search',
          command: (): void => view.selectNode()(key),
        },
        {
          label: translate('Connect to another step'),
          icon: 'pi pi-link',
          disabled: blocked,
          command: (): void => view.beginLink(key),
        },
        {
          label: translate('Add next'),
          disabled:
            blocked ||
            !view.addNext() ||
            !view.nodes().some((node) => node.key === key && node.canContinue),
          command: (): void => view.addNext()?.(key),
        },
        {
          label: translate('Duplicate step'),
          icon: 'pi pi-copy',
          disabled: blocked || !view.duplicateNode(),
          command: (): void => {
            if (
              !view.disabled() &&
              !view.readOnly() &&
              view.nodes().some((node) => node.key === key)
            ) {
              view.duplicateNode()?.(key);
            }
          },
        },
        {
          label: translate('Remove step'),
          disabled: blocked || !view.removeNode(),
          command: (): void => view.removeNode()?.(key),
        },
      ]
    : [
        {
          label: translate('Select all steps'),
          command: (): void =>
            view.selectNodes()?.(view.nodes().map((node) => node.key)),
        },
        {
          label: translate('Fit to view'),
          icon: 'pi pi-expand',
          command: (): void => view.fit(),
        },
        {
          label: translate('Reset view'),
          icon: 'pi pi-refresh',
          command: (): void => view.reset(),
        },
      ];
}
