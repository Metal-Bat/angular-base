import { CaseList } from '../case-list/case-list';
import { SavedViews } from '../../../../shared/ui/saved-views/saved-views';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { NotificationPreview } from '../../../../core/notifications/notification-preview';
import { effect, signal, untracked, viewChild } from '@angular/core';
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

  imports: [CaseList, SavedViews, ButtonDirective, LocalizePipe, RouterLink],
  templateUrl: './request-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestList {
  private readonly savedViews = viewChild(SavedViews);
  async canLeave(): Promise<boolean> {
    return this.savedViews()?.canLeave() ?? true;
  }
  readonly columns = signal<readonly string[]>([]);
  readonly columnOptions = [
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'created_at', label: 'Created At' },
    { key: 'closed_at', label: 'Closed At' },
    { key: 'submitted_at', label: 'Submitted At' },
  ];
  readonly polling = inject(BoundedPolling);
  readonly pages = inject(WORKSPACE_PAGES);
  applyView(event: { query: JsonObject; columns: string[] }): void {
    this.columns.set(event.columns);
    void this.pages.load('request', 1, 'available', undefined, event.query);
  }
  constructor() {
    const notifications = inject(NotificationPreview);
    let applied = notifications.revision();
    effect(() => {
      const revision = notifications.revision();
      const idle = this.pages.state() !== 'loading';
      if (revision !== applied && idle) {
        applied = revision;
        untracked(
          () => void this.pages.load('request', this.pages.page(), 'available'),
        );
      }
    });
    void this.pages.load('request');
    this.polling.start(
      (abort) =>
        this.pages.load('request', this.pages.page(), 'available', abort),
      () => this.pages.state() !== 'loading',
    );
  }
}
