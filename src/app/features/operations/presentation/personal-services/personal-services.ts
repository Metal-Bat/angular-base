import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { BinaryTransfer } from '../../../../core/transport/binary-transfer';
import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  ServiceItem,
  ServiceKind,
} from '../../application/personal-services-port';
import { PERSONAL_SERVICES } from '../../bindings';
import { CaseHistory } from '../case-history/case-history';
@Component({
  selector: 'app-personal-services',
  providers: [BinaryTransfer, BoundedPolling],
  imports: [RouterLink, LocalizePipe, CaseHistory],
  templateUrl: './personal-services.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalServices {
  private readonly service = inject(PERSONAL_SERVICES);
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
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.items.set([]);
      this.detail.set(null);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      this.detail.set(null);
      release();
    });
    void this.load();
    this.polling.start(
      (abort) => this.poll(abort),
      () =>
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
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.service.list(this.kind, page, report, abort);
      if (generation === this.generation && !abort?.aborted) {
        this.items.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
      }
    } catch {
      if (generation === this.generation && !abort?.aborted) {
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
  async open(ref: string, read = false): Promise<void> {
    const generation = ++this.generation;
    this.detail.set(null);
    this.busy.set(true);
    try {
      const item = read
        ? await this.service.read(ref)
        : await this.service.detail(this.kind, ref);
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
