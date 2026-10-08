import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResourceCatalog } from './resource-catalog';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-catalog-header',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './catalog-header.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogHeader {
  readonly view =
    input.required<
      Pick<
        ResourceCatalog,
        | 'appliedQuery'
        | 'busy'
        | 'canScope'
        | 'create'
        | 'edit'
        | 'history'
        | 'immutable'
        | 'load'
        | 'page'
        | 'selected'
        | 'spec'
      >
    >();
}
