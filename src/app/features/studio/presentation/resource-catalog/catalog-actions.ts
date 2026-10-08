import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResourceCatalog } from './resource-catalog';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-catalog-actions',
  imports: [FormsModule, RouterLink, ButtonDirective, LocalizePipe],
  templateUrl: './catalog-actions.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogActions {
  readonly view =
    input.required<
      Pick<
        ResourceCatalog,
        | 'act'
        | 'busy'
        | 'dirty'
        | 'grant'
        | 'grantBody'
        | 'grantPage'
        | 'grantPages'
        | 'grantTarget'
        | 'grants'
        | 'key'
        | 'loadGrants'
        | 'reference'
        | 'selected'
        | 'spec'
        | 'versionCatalog'
      >
    >();
}
