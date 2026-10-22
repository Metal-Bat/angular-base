import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { CollectionView } from '../runtime-collection/runtime-collection';
@Component({
  selector: 'app-runtime-collection-actions',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './runtime-collection-actions.html',
  styleUrl: './runtime-collection-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuntimeCollectionActions {
  readonly view = input.required<CollectionView>();
  readonly key = input.required<string>();
  readonly index = input.required<number>();
  readonly compact = input(false);
}
