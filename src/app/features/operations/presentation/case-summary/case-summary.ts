import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { PROCESS_DESTINATION } from '../../bindings';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { CaseKind, CaseRecord } from '../../domain/workspace-models';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-case-summary',
  imports: [RouterLink, LocalizePipe, RecordSummary, ButtonDirective],
  templateUrl: './case-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseSummary {
  readonly item = input.required<CaseRecord>();
  readonly kind = input.required<CaseKind>();
  readonly disabled = input(false);
  private readonly destination = inject(PROCESS_DESTINATION);
  private readonly actor = inject(ActorState);
  private readonly router = inject(Router);
  readonly opening = signal(false);
  readonly destinationError = signal('');
  private controller = new AbortController();
  private active = true;
  constructor() {
    effect(() => {
      this.item();
      this.cancel();
    });
    const unregister = this.actor.register(() => {
      this.active = false;
      this.cancel();
    });
    inject(DestroyRef).onDestroy(() => {
      this.active = false;
      this.cancel();
      unregister();
    });
  }
  private cancel(): void {
    this.controller.abort();
    this.opening.set(false);
    this.destinationError.set('');
  }
  async openProcess(): Promise<void> {
    const request = this.item().request;
    if (
      !this.active ||
      this.disabled() ||
      !request ||
      this.kind() !== 'task' ||
      this.opening()
    ) {
      return;
    }
    this.controller = new AbortController();
    const abort = this.controller.signal;
    const epoch = this.actor.epoch;
    this.opening.set(true);
    this.destinationError.set('');
    try {
      const reference = await this.destination(request, abort);
      if (
        abort.aborted ||
        epoch !== this.actor.epoch ||
        request !== this.item().request
      ) {
        return;
      }
      if (!reference) {
        throw Error('Process unavailable');
      }
      await this.router.navigate(['/operations/processes', reference]);
    } catch {
      if (!abort.aborted && epoch === this.actor.epoch) {
        this.destinationError.set(
          'The destination is unavailable. Refresh to check current access.',
        );
      }
    } finally {
      if (!abort.aborted && epoch === this.actor.epoch) {
        this.opening.set(false);
      }
    }
  }
}
