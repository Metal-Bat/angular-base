import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ProcessSnapshot } from '../../domain/process-tracking';

@Component({
  selector: 'app-execution-path',
  imports: [LocalizePipe, RouterLink],
  templateUrl: './execution-path.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionPath {
  readonly process = input.required<ProcessSnapshot>();
}
