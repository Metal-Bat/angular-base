import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { CalendarGroupPage } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
@Component({
  selector: 'app-calendar-group-choice',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    ControlField,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './calendar-group-choice.html',
  styleUrl: './calendar-group-choice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGroupChoice {
  readonly value = input<string | null>(null);
  readonly disabled = input(false);
  readonly picked = output<string | null>();
  readonly sharingChanged = output<boolean>();
  readonly shared = signal(false);
  readonly page = signal<CalendarGroupPage | null>(null);
  readonly busy = signal(false);
  readonly error = signal(false);
  readonly active = signal(true);
  search = '';
  private appliedSearch = '';
  private abort = new AbortController();
  private generation = 0;
  private readonly api = inject(CALENDAR);
  constructor() {
    effect(() => {
      const reference = this.value();
      untracked(() => {
        this.shared.set(!!reference);
        if (reference && this.active() && !this.page() && !this.busy()) {
          void this.load();
        }
      });
    });
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
  }
  private clear(): void {
    this.generation++;
    this.abort.abort();
    this.active.set(false);
    this.shared.set(false);
    this.page.set(null);
    this.busy.set(false);
    this.error.set(false);
    this.search = this.appliedSearch = '';
  }
  scope(value: string): void {
    if (this.disabled() || !this.active()) {
      return;
    }
    this.shared.set(value === 'group');
    this.sharingChanged.emit(value === 'group');
    if (value === 'personal') {
      this.picked.emit(null);
    } else if (!this.page()) {
      void this.load();
    }
  }
  choose(value: string): void {
    if (
      !this.disabled() &&
      this.active() &&
      this.page()?.items.some((item) => item.key === value)
    ) {
      this.picked.emit(value);
    }
  }
  known(): boolean {
    return !!this.page()?.items.some((item) => item.key === this.value());
  }
  async load(number = 1, apply = false): Promise<void> {
    if (!this.active()) {
      return;
    }
    const query = apply ? this.search.trim() : this.appliedSearch;
    this.abort.abort();
    this.abort = new AbortController();
    const abort = this.abort;
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set(false);
    try {
      const page = await this.api.groups(query, number, abort.signal);
      if (generation === this.generation && !abort.signal.aborted) {
        this.page.set(page);
        this.appliedSearch = query;
      }
    } catch {
      if (generation === this.generation && !abort.signal.aborted) {
        this.page.set(null);
        this.error.set(true);
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
