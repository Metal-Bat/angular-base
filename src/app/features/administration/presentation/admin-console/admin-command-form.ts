import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { AdminConsole } from './admin-console';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-admin-command-form',
  imports: [SelectControl, ButtonDirective, FormsModule, LocalizePipe],
  templateUrl: './admin-command-form.html',
  styleUrl: './admin-command-form.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminCommandForm {
  readonly view =
    input.required<
      Pick<
        AdminConsole,
        | 'busy'
        | 'change'
        | 'display'
        | 'execute'
        | 'input'
        | 'invalid'
        | 'locationLabels'
        | 'locations'
        | 'secret'
        | 'selected'
      >
    >();
}
