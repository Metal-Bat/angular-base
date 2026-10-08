import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
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
  imports: [ButtonDirective, LocalizePipe],
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
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly error = signal('');
  readonly busy = signal(false);
  private generation = 0;
  constructor() {
    effect((cleanup) => {
      void this.reference();
      void this.kind();
      this.generation++;
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
    const generation = ++this.generation;
    this.busy.set(true);
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
