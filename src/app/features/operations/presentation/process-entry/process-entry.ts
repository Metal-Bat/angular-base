import { TableModule } from 'primeng/table';
import { Locale } from '../../../../core/localization/locale';
import { ExecutionPath } from '../execution-path/execution-path';
import { ProcessEvidence } from '../process-evidence/process-evidence';
import { ButtonDirective } from 'primeng/button';
import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import { ProcessSnapshot } from '../../domain/process-tracking';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ActorState } from '../../../../core/auth/actor-state';
import { PROCESS_READER } from '../../bindings';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
@Component({
  host: { class: 'console-page' },
  selector: 'app-process-entry',
  providers: [BoundedPolling],
  imports: [
    TableModule,
    ExecutionPath,
    ProcessEvidence,
    ButtonDirective,
    LocalizePipe,
    RouterLink,
  ],
  templateUrl: './process-entry.html',
  styleUrl: './process-entry.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessEntry {
  private readonly evidence = viewChild(ProcessEvidence);
  async canLeave(): Promise<boolean> {
    return (await this.evidence()?.canLeave()) ?? true;
  }
  private readonly read = inject(PROCESS_READER);
  private reference = '';
  private readonly route = inject(ActivatedRoute);
  private controller?: AbortController;
  private readonly actor = inject(ActorState);
  private readonly session = inject(SessionContext);
  readonly canOpenControls = computed(() => {
    const actor = this.session.snapshot();
    return (
      actor.status === 'authenticated' &&
      (hasPermissions(actor.permissions, ['requests.start']) ||
        hasPermissions(actor.permissions, ['processes.recover']))
    );
  });
  private readonly locale = inject(Locale);
  date(value: string): string {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(this.locale.language(), {
          calendar: this.locale.calendar(),
          numberingSystem: this.locale.numbering(),
          timeZone: this.locale.timezone(),
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date)
      : this.locale.text('Unavailable');
  }
  readonly polling = inject(BoundedPolling);
  readonly status = signal('');
  readonly snapshot = signal<ProcessSnapshot | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  private generation = 0;
  private routeGeneration = 0;
  constructor() {
    const unregister = this.actor.register((): void => {
      this.generation++;
      this.routeGeneration++;
      this.controller?.abort();
      this.busy.set(false);
      this.status.set('');
      this.snapshot.set(null);
      this.error.set('Access changed. Reload this page.');
    });
    inject(DestroyRef).onDestroy((): void => {
      this.generation++;
      this.routeGeneration++;
      this.controller?.abort();
      unregister();
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      void this.selectRoute(params.get('ref') ?? '');
    });
    this.polling.start(
      (abort) => this.load(this.snapshot()?.page ?? 1, false, abort),
      () =>
        !this.busy() &&
        !this.evidence()?.pending() &&
        ['RUNNING', 'WAITING', 'PAUSED', 'COMPENSATING'].includes(
          this.status(),
        ),
    );
  }
  private async selectRoute(reference: string): Promise<void> {
    const route = ++this.routeGeneration;
    const epoch = this.actor.epoch;
    if (this.snapshot() && !(await this.canLeave())) {
      return;
    }
    if (route !== this.routeGeneration || epoch !== this.actor.epoch) {
      return;
    }
    this.controller?.abort();
    this.generation++;
    this.reference = reference;
    this.snapshot.set(null);
    this.status.set('');
    await this.load(1);
  }
  async load(
    page = this.snapshot()?.page ?? 1,
    report = false,
    abort?: AbortSignal,
  ): Promise<void> {
    const generation = ++this.generation;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const cancel = (): void => controller.abort();
    abort?.addEventListener('abort', cancel, { once: true });
    if (abort?.aborted) {
      controller.abort();
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.read(
        this.reference,
        page,
        report,
        controller.signal,
      );
      if (generation === this.generation && !controller.signal.aborted) {
        this.reference = result.reference;
        this.status.set(result.status);
        this.snapshot.set(result);
      }
    } catch (error) {
      if (generation === this.generation && !controller.signal.aborted) {
        if (
          error instanceof ApiFailure &&
          [401, 403, 404].includes(error.httpStatus)
        ) {
          this.snapshot.set(null);
          this.status.set('');
        }
        this.error.set(
          error instanceof ApiFailure
            ? error.message
            : 'The service is unavailable. Your current view has been retained.',
        );
        if (abort) {
          throw Error('Tracking poll failed', { cause: error });
        }
      }
    } finally {
      abort?.removeEventListener('abort', cancel);
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
