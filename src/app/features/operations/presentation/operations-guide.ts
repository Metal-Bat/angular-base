import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { OperationsHome } from './operations-home';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-operations-guide',
  imports: [RouterLink, LocalizePipe],
  templateUrl: './operations-guide.html',
  styleUrl: './operations-guide.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class OperationsGuide {
  readonly view = input.required<Pick<OperationsHome, 'steps'>>();
}
