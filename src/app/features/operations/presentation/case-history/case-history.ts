import { LocalizedDateTimePipe } from '../../../../shared/ui/localized-datetime-pipe';
import { DialogModule } from 'primeng/dialog';
import { ActorState } from '../../../../core/auth/actor-state';
import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { PERSONAL_SERVICES } from '../../bindings';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-case-history',
  imports: [LocalizedDateTimePipe, ButtonDirective, LocalizePipe, DialogModule],
  templateUrl: './case-history.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseHistory {
  readonly reference = input.required<string>();
  readonly kind = input.required<'request' | 'task' | 'report'>();
  private readonly api = inject(PERSONAL_SERVICES);
  readonly items = signal<
    readonly { revision: string; date: string; action: string }[]
  >([]);
  readonly available = signal(true);
  readonly visible = signal(false);
  open(): void {
    if (!this.available()) {
      return;
    }
    this.visible.set(true);
    void this.load(1);
  }
  close(trigger: HTMLButtonElement): void {
    this.visible.set(false);
    this.generation++;
    this.busy.set(false);
    if (trigger.isConnected) {
      trigger.focus();
    }
  }
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly error = signal('');
  readonly busy = signal(false);
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.available.set(false);
      this.visible.set(false);
      this.items.set([]);
      this.busy.set(false);
      this.error.set('');
      this.page.set(1);
      this.totalPages.set(0);
    });
    inject(DestroyRef).onDestroy(() => {
      release();
      this.available.set(false);
      this.generation++;
    });
    effect((cleanup) => {
      void this.reference();
      void this.kind();
      this.generation++;
      this.visible.set(false);
      this.items.set([]);
      this.busy.set(false);
      this.page.set(1);
      this.totalPages.set(0);
      this.error.set('');
      cleanup(() => {
        this.generation++;
        this.items.set([]);
      });
    });
  }
  async load(page = 1): Promise<void> {
    if (!this.available()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.history(
        this.kind(),
        this.reference(),
        page,
      );
      if (generation === this.generation) {
        this.items.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.error.set('');
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('History is unavailable');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
