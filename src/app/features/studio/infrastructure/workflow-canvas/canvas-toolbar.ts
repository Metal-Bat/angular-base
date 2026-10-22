import {
  CommandMenuItem,
  MenuButton,
} from '../../../../shared/ui/menu-button/menu-button';
import { Locale } from '../../../../core/localization/locale';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { WorkflowCanvas } from './workflow-canvas';
import { FormsModule } from '@angular/forms';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-canvas-toolbar',
  imports: [MenuButton, LocalizePipe, SelectControl, FormsModule],
  templateUrl: './canvas-toolbar.html',
  styleUrl: './canvas-toolbar.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CanvasToolbar {
  readonly findOpen = signal(false);
  readonly view =
    input.required<
      Pick<
        WorkflowCanvas,
        | 'arrange'
        | 'arrangeNodes'
        | 'readOnly'
        | 'disabled'
        | 'edges'
        | 'fit'
        | 'nodes'
        | 'reset'
        | 'viewport'
        | 'zoom'
        | 'zoomPercent'
        | 'find'
        | 'rendered'
      >
    >();
  private readonly locale = inject(Locale);
  readonly viewActions = computed<CommandMenuItem[]>(() => {
    this.locale.language();
    const vm = this.view();
    return [
      {
        label: this.locale.text('Zoom out'),
        disabled: !vm.rendered() || vm.viewport().zoom <= 0.1,
        command: (): void => vm.zoom(-0.1),
      },
      {
        label: this.locale.text('Zoom in'),
        disabled: !vm.rendered() || vm.viewport().zoom >= 4,
        command: (): void => vm.zoom(0.1),
      },
      {
        label: this.locale.text('Reset view'),
        disabled: !vm.rendered(),
        command: (): void => vm.reset(),
      },
    ];
  });
  readonly arrangements = computed<CommandMenuItem[]>(() => {
    this.locale.language();
    return (['right', 'down'] as const).map((direction) => ({
      label: this.locale.text(
        direction === 'right' ? 'Left to right' : 'Top to bottom',
      ),
      command: (): void => {
        const vm = this.view();
        if (!vm.readOnly() && !vm.disabled()) {
          vm.arrangeNodes(direction);
        }
      },
    }));
  });
}
