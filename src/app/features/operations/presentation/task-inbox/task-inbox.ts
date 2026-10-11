import { CaseList } from '../case-list/case-list';
import { SavedViews } from '../../../../shared/ui/saved-views/saved-views';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { NotificationPreview } from '../../../../core/notifications/notification-preview';
import { effect, untracked } from '@angular/core';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import { PagesPort } from '../../application/workspace-ports';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Cartable, cartables } from '../../domain/workspace-models';
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
  selector: 'app-task-inbox',

  imports: [
    CaseList,
    SavedViews,
    ControlField,
    SelectControl,
    FormsModule,
    ButtonDirective,
    LocalizePipe,
  ],
  templateUrl: './task-inbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskInbox {
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
    { key: 'due_at', label: 'Due At' },
  ];
  readonly polling = inject(BoundedPolling);
  readonly pages = inject(WORKSPACE_PAGES);
  readonly kinds = cartables;
  readonly cartable = linkedSignal<Cartable>(() => {
    const cartable = this.pages.appliedQuery()?.['cartable'];
    return typeof cartable === 'string' &&
      cartables.some((value) => value === cartable)
      ? (cartable as Cartable)
      : 'available';
  });
  applyView(event: { query: JsonObject; columns: string[] }): void {
    this.columns.set(event.columns);
    void this.pages.load('task', 1, this.cartable(), undefined, event.query);
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
          () =>
            void this.pages.load('task', this.pages.page(), this.cartable()),
        );
      }
    });
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
