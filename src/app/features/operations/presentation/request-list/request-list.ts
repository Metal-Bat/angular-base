import { ButtonDirective } from 'primeng/button';
import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import { PagesPort } from '../../application/workspace-ports';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { WORKSPACE_PAGES, WORKSPACE_PAGES_FACTORY } from '../../bindings';
@Component({
  host: { class: 'console-page' },
  providers: [
    BoundedPolling,
    {
      provide: WORKSPACE_PAGES,
      useFactory: (): PagesPort => inject(WORKSPACE_PAGES_FACTORY)(),
    },
  ],
  selector: 'app-request-list',

  imports: [ButtonDirective, LocalizePipe, RouterLink],
  templateUrl: './request-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestList {
  readonly polling = inject(BoundedPolling);
  readonly pages = inject(WORKSPACE_PAGES);
  constructor() {
    void this.pages.load('request');
    this.polling.start(
      (abort) =>
        this.pages.load('request', this.pages.page(), 'available', abort),
      () => this.pages.state() !== 'loading',
    );
  }
}
