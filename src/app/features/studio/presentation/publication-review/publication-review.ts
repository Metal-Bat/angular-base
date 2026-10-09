import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { WorkspaceState } from '../../domain/authoring';
@Component({
  selector: 'app-publication-review',
  imports: [LocalizePipe],
  templateUrl: './publication-review.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicationReview {
  readonly state = input<WorkspaceState | null>(null);
  readonly status = input.required<string>();
  readonly dirty = input.required<boolean>();
  readonly pending = input.required<number>();
}
