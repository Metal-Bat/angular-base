import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import { PagesPort } from '../../application/workspace-ports';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Cartable, cartables } from '../../domain/workspace-models';
import { WORKSPACE_PAGES, WORKSPACE_PAGES_FACTORY } from '../../bindings';
@Component({
  providers: [
    BoundedPolling,
    {
      provide: WORKSPACE_PAGES,
      useFactory: (): PagesPort => inject(WORKSPACE_PAGES_FACTORY)(),
    },
  ],
  selector: 'app-task-inbox',

  imports: [LocalizePipe, RouterLink],
  templateUrl: './task-inbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskInbox {
  readonly polling = inject(BoundedPolling);
  readonly pages = inject(WORKSPACE_PAGES);
  readonly kinds = cartables;
  readonly cartable = signal<Cartable>('available');
  constructor() {
    void this.pages.load('task');
    this.polling.start(
      (abort) =>
        this.pages.load('task', this.pages.page(), this.cartable(), abort),
      () => this.pages.state() !== 'loading',
    );
  }
  select(kind: Cartable): void {
    this.cartable.set(kind);
    void this.pages.load('task', 1, kind);
  }
}
