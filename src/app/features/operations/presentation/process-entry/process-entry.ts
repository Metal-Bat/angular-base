import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import { ProcessSnapshot } from '../../domain/process-tracking';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ActorState } from '../../../../core/auth/actor-state';
import { PROCESS_READER } from '../../bindings';
@Component({
  selector: 'app-process-entry',
  providers: [BoundedPolling],
  imports: [LocalizePipe, RouterLink],
  templateUrl: './process-entry.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessEntry {
  private readonly read = inject(PROCESS_READER);
  private readonly reference =
    inject(ActivatedRoute).snapshot.paramMap.get('ref') ?? '';
  private readonly actor = inject(ActorState);
  readonly polling = inject(BoundedPolling);
  readonly status = signal('');
  readonly snapshot = signal<ProcessSnapshot | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  private generation = 0;
  constructor() {
    const unregister = this.actor.register((): void => {
      this.generation++;
      this.status.set('');
      this.snapshot.set(null);
      this.error.set('Access changed. Reload this page.');
    });
    inject(DestroyRef).onDestroy((): void => {
      this.generation++;
      unregister();
    });
    void this.load();
    this.polling.start(
      (abort) => this.load(this.snapshot()?.page ?? 1, false, abort),
      () =>
        !this.busy() &&
        ['RUNNING', 'WAITING', 'PAUSED', 'COMPENSATING'].includes(
          this.status(),
        ),
    );
  }
  async load(page = 1, report = false, abort?: AbortSignal): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.read(this.reference, page, report, abort);
      if (generation === this.generation && !abort?.aborted) {
        this.status.set(result.status);
        this.snapshot.set(result);
      }
    } catch {
      if (generation === this.generation && !abort?.aborted) {
        this.error.set('The service is unavailable.');
        if (abort) {
          throw Error('Tracking poll failed');
        }
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
