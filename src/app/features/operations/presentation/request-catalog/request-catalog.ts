import { ButtonDirective } from 'primeng/button';
import { PagesPort } from '../../application/workspace-ports';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { WORKSPACE_PAGES, WORKSPACE_PAGES_FACTORY } from '../../bindings';
import { REQUEST_CREATION } from '../../bindings';
@Component({
  host: { class: 'console-page' },
  providers: [
    {
      provide: WORKSPACE_PAGES,
      useFactory: (): PagesPort => inject(WORKSPACE_PAGES_FACTORY)(),
    },
  ],
  selector: 'app-request-catalog',

  imports: [ButtonDirective, LocalizePipe, RouterLink],
  templateUrl: './request-catalog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestCatalog {
  readonly pages = inject(WORKSPACE_PAGES);
  readonly creation = inject(REQUEST_CREATION);
  private readonly router = inject(Router);
  constructor() {
    void this.pages.load('catalog');
  }
  async create(reference: string): Promise<void> {
    const item = await this.creation.create(reference);
    if (item) {
      await this.router.navigate(['/operations/requests', item.ref]);
    }
  }
}
