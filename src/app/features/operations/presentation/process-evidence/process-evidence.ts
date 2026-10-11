import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { PROCESS_EVIDENCE } from '../../bindings';
import { ProcessEvidenceSnapshot } from '../../domain/process-evidence';
import { OrderRecovery } from '../order-recovery/order-recovery';

@Component({
  selector: 'app-process-evidence',
  imports: [ButtonDirective, LocalizePipe, OrderRecovery],
  templateUrl: './process-evidence.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessEvidence {
  private readonly recovery = viewChild(OrderRecovery);
  async canLeave(): Promise<boolean> {
    return (await this.recovery()?.canLeave()) ?? true;
  }
  readonly reference = input.required<string>();
  private readonly reader = inject(PROCESS_EVIDENCE);
  private readonly actor = inject(ActorState);
  readonly snapshot = signal<ProcessEvidenceSnapshot | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  private controller = new AbortController();
  private generation = 0;
  private active = true;
  constructor() {
    effect(() => {
      const reference = this.reference();
      untracked(() => {
        this.snapshot.set(null);
        void this.load(reference);
      });
    });
    const unregister = this.actor.register(() => {
      this.active = false;
      this.clear();
    });
    inject(DestroyRef).onDestroy(() => {
      this.active = false;
      this.clear();
      unregister();
    });
  }
  private clear(): void {
    this.generation++;
    this.controller.abort();
    this.snapshot.set(null);
    this.busy.set(false);
    this.error.set('');
  }
  refresh(
    ordersPage = this.snapshot()?.orders.page ?? 1,
    aiPage = this.snapshot()?.ai.page ?? 1,
  ): Promise<void> {
    return this.load(this.reference(), ordersPage, aiPage);
  }
  private async load(
    reference: string,
    ordersPage = 1,
    aiPage = 1,
  ): Promise<void> {
    if (!this.active) {
      return;
    }
    this.controller.abort();
    this.controller = new AbortController();
    const abort = this.controller.signal;
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.reader.read(
        reference,
        ordersPage,
        aiPage,
        abort,
      );
      if (generation === this.generation && !abort.aborted) {
        this.snapshot.set(result);
      }
    } catch {
      if (generation === this.generation && !abort.aborted) {
        this.snapshot.set(null);
        this.error.set(
          'Process evidence is unavailable. Refresh to check current access.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
