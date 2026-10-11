import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { BusinessOperation } from '../../domain/business-operation';
import { STUDIO_API } from '../../bindings';
type Operation = BusinessOperation;
@Component({
  selector: 'app-operation-choice',
  imports: [FormsModule, ButtonDirective, LocalizePipe, SelectControl],
  templateUrl: './operation-choice.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationChoice {
  readonly handler = input.required<string>();
  readonly version = input.required<string>();
  readonly compensation = input(false);
  readonly value = input('');
  readonly disabled = input(false);
  readonly picked = output<string>();
  readonly rows = signal<readonly Operation[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly selected = computed(() =>
    this.rows().find((row) => row.key === this.value()),
  );
  private readonly api = inject(STUDIO_API);
  private generation = 0;
  private abort = new AbortController();
  constructor() {
    effect(() => {
      this.handler();
      this.version();
      this.compensation();
      void this.load();
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
    this.rows.set([]);
    this.busy.set(false);
    this.error.set('');
  }
  async load(): Promise<void> {
    this.clear();
    this.abort = new AbortController();
    const generation = this.generation;
    const handler = this.handler();
    const version = this.version();
    const scope = this.compensation() ? 'COMPENSATION' : 'NORMAL';
    this.busy.set(true);
    try {
      const response = await this.api.auxiliary(
        'operations',
        undefined,
        undefined,
        this.abort.signal,
      );
      if (generation !== this.generation) {
        return;
      }
      if (!Array.isArray(response) || response.length > 100) {
        throw Error('Invalid catalog');
      }
      this.rows.set(
        (response as Operation[]).filter(
          (row) =>
            row.handler === handler &&
            row.version === version &&
            Array.isArray(row.scopes) &&
            row.scopes.includes(scope),
        ),
      );
    } catch {
      if (generation === this.generation) {
        this.error.set('Reference search failed. Retry or reload.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  choose(value: string): void {
    if (
      !this.disabled() &&
      !this.busy() &&
      this.rows().some((row) => row.key === value)
    ) {
      this.picked.emit(value);
    }
  }
}
