import { LocalizedDateTimePipe } from '../../../../shared/ui/localized-datetime-pipe';
import { TransferProgress } from '../../../../shared/ui/transfer-progress/transfer-progress';
import { InboxReadControl } from '../../../../core/notifications/inbox-read-control/inbox-read-control';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthSession } from '../../../../core/auth/auth-session';
import { PersonalServiceDetail } from './personal-service-detail';
import { FormsModule } from '@angular/forms';
import { NotificationPreview } from '../../../../core/notifications/notification-preview';
import { InputTextModule } from 'primeng/inputtext';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { BinaryTransfer } from '../../../../core/transport/binary-transfer';
import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  NotificationOptions,
  ServiceItem,
  ServiceKind,
} from '../../application/personal-services-port';
import { PERSONAL_SERVICES } from '../../bindings';
@Component({
  host: { class: 'console-page' },
  selector: 'app-personal-services',
  providers: [BinaryTransfer, BoundedPolling],
  imports: [
    LocalizedDateTimePipe,
    TransferProgress,
    InboxReadControl,
    FormsModule,
    InputTextModule,
    SelectControl,
    PersonalServiceDetail,
    ButtonDirective,
    RouterLink,
    LocalizePipe,
  ],
  templateUrl: './personal-services.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalServices {
  private readonly auth = inject(AuthSession);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PERSONAL_SERVICES);
  private readonly preview = inject(NotificationPreview);
  private abort = new AbortController();
  readFilter: NotificationOptions['read'] = 'all';
  search = '';
  private applied: NotificationOptions = { read: 'all', search: '' };
  readonly total = signal<number | null>(null);
  readonly transfer = inject(BinaryTransfer);
  readonly polling = inject(BoundedPolling);
  private readonly feedback = inject(Feedback);
  readonly kind: ServiceKind =
    inject(ActivatedRoute).snapshot.data['serviceKind'] === 'reports'
      ? 'reports'
      : 'notifications';
  readonly notifications = this.kind === 'notifications';
  readonly readyReport = computed(() => this.detail()?.status === 'READY');
  readonly previousDisabled = computed(() => this.busy() || this.page() <= 1);
  readonly nextDisabled = computed(
    () => this.busy() || this.page() >= this.totalPages(),
  );
  readonly items = signal<readonly ServiceItem[]>([]);
  readonly detail = signal<ServiceItem | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  private generation = 0;
  private readonly pendingRef = signal<string | null>(null);
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.abort.abort();
      this.busy.set(false);
      this.error.set('');
      this.total.set(null);
      this.readFilter = 'all';
      this.search = '';
      this.pendingRef.set(null);
      this.applied = { read: 'all', search: '' };
      this.items.set([]);
      this.detail.set(null);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      this.abort.abort();
      this.detail.set(null);
      release();
    });
    let applied = this.preview.revision();
    effect(() => {
      const revision = this.preview.revision();
      const idle = !this.busy();
      if (this.notifications && revision !== applied && idle) {
        applied = revision;
        untracked(() => void this.load(this.page()));
      }
    });
    void this.load();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.pendingRef.set(
        params.get(this.notifications ? 'notification' : 'report'),
      );
    });
    effect(() => {
      const ref = this.pendingRef();
      const idle = !this.busy();
      if (ref && idle) {
        untracked(() => {
          this.pendingRef.set(null);
          void this.open(ref);
        });
      }
    });
    this.polling.start(
      (abort) => this.poll(abort),
      () =>
        !this.notifications &&
        !this.busy() &&
        !this.transfer.busy() &&
        (!this.detail() ||
          ['PENDING', 'PROCESSING'].includes(this.detail()!.status)),
    );
  }
  private async poll(abort: AbortSignal): Promise<void> {
    const item = this.detail();
    if (!item) {
      return this.load(this.page(), false, abort);
    }
    const generation = this.generation;
    const updated = await this.service.detail(this.kind, item.ref, abort);
    if (
      generation === this.generation &&
      !abort.aborted &&
      this.detail()?.ref === item.ref
    ) {
      this.detail.set(updated);
    }
  }
  async load(page = 1, report = false, abort?: AbortSignal): Promise<void> {
    this.abort.abort();
    this.abort = new AbortController();
    const requestAbort = abort
      ? AbortSignal.any([abort, this.abort.signal])
      : this.abort.signal;
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.service.list(
        this.kind,
        page,
        report,
        requestAbort,
        this.applied,
      );
      if (generation === this.generation && !requestAbort.aborted) {
        this.total.set(result.total ?? null);
        this.items.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
      }
    } catch {
      if (generation === this.generation && !requestAbort.aborted) {
        this.error.set('The service is unavailable.');
        if (abort) {
          throw Error('Polling failed');
        }
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async apply(): Promise<void> {
    if (!['all', 'unread', 'read'].includes(this.readFilter)) {
      return;
    }
    if (this.search.length > 256) {
      this.error.set('Search must be 256 characters or fewer.');
      return;
    }
    this.applied = { read: this.readFilter, search: this.search.trim() };
    this.detail.set(null);
    await this.load();
  }
  async open(ref: string, read = false): Promise<void> {
    this.abort.abort();
    this.abort = new AbortController();
    const abort = this.abort.signal;
    const generation = ++this.generation;
    this.detail.set(null);
    this.busy.set(true);
    this.error.set('');
    try {
      const current = await this.service.detail(this.kind, ref, abort);
      if (generation !== this.generation || abort.aborted) {
        return;
      }
      const item = read ? await this.service.read(current.ref) : current;
      if (read && generation === this.generation) {
        this.items.update((items) =>
          items.map((row) => (row.ref === ref ? item : row)),
        );
        void this.preview.load();
      }
      if (generation === this.generation) {
        this.detail.set(item);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async destination(): Promise<void> {
    const item = this.detail();
    if (!item || !this.notifications || this.busy()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    try {
      await this.auth.revalidate();
      const current = await this.service.detail(
        'notifications',
        item.ref,
        this.abort.signal,
      );
      if (generation !== this.generation || !this.auth.profile()) {
        return;
      }
      this.detail.set(current);
      const target = current.target;
      if (!target?.available || !target.ref_id) {
        throw Error('Unavailable');
      }
      const ref = target.ref_id;
      if (target.kind === 'case') {
        await this.router.navigate(['/operations/requests', ref]);
      } else if (target.kind === 'work_item' || target.kind === 'ai_approval') {
        await this.router.navigate(['/operations/tasks', ref]);
      } else if (target.kind === 'operation') {
        await this.router.navigate(['/operations/processes', ref]);
      } else if (target.kind === 'report') {
        await this.router.navigate(['/operations/reports'], {
          queryParams: { report: ref },
        });
      } else if (target.kind === 'calendar') {
        await this.router.navigate(['/operations/calendar'], {
          queryParams: { event: ref },
        });
      } else if (target.kind === 'support') {
        await this.router.navigate(['/operations/support'], {
          queryParams: { incident: ref },
        });
      } else if (target.kind === 'account') {
        await this.router.navigate(['/account']);
      } else {
        throw Error('Unavailable');
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async remove(): Promise<void> {
    const item = this.detail();
    if (!item || !(await this.feedback.confirm('Delete this report?'))) {
      return;
    }
    try {
      await this.service.remove(item.ref);
      this.detail.set(null);
      await this.load(this.page());
    } catch {
      this.error.set('Check current state before trying again');
    }
  }
  async download(): Promise<void> {
    const item = this.detail();
    if (!item || item.status !== 'READY') {
      return;
    }
    try {
      this.transfer.download(
        await this.transfer.run(
          'download_report_api_v1_reports__ref_id__download_get',
          { path: { ref_id: item.ref } },
        ),
      );
    } catch {
      this.error.set('Private content is unavailable');
    }
  }
}
