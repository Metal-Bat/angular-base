import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { AdminConsole } from './admin-console';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-admin-command-result',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './admin-command-result.html',
  styleUrl: './admin-console.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminCommandResult {
  readonly view =
    input.required<
      Pick<
        AdminConsole,
        'busy' | 'execute' | 'json' | 'result' | 'rows' | 'use'
      >
    >();
}
