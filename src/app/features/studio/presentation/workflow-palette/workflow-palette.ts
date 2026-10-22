import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { WorkflowPaletteEntry } from '../../domain/workflow-labels';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-workflow-palette',
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    InputTextModule,
    LocalizePipe,
  ],
  host: { style: 'display:block; min-inline-size:0' },
  templateUrl: './workflow-palette.html',
  styleUrl: './workflow-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowPalette {
  readonly entries = input.required<readonly WorkflowPaletteEntry[]>();
  readonly groupedEntries = computed(() => {
    const groups = new Map<string, WorkflowPaletteEntry[]>();
    for (const entry of this.entries()) {
      const group = groups.get(entry.category);
      if (group) {
        group.push(entry);
      } else {
        groups.set(entry.category, [entry]);
      }
    }
    return [...groups.values()].flat();
  });
  readonly disabled = input(false);
  readonly selectedKey = input('');
  readonly search = model('');
  readonly selected = output<string>();
  readonly added = output<string>();
  readonly dragFinished = output<void>();
  readonly dragged = output<{ event: DragEvent; key: string }>();
}
