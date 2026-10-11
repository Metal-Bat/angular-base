import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../core/auth/actor-state';
import { PersonalCollections } from '../../../core/resources/personal-collections';
import type { components } from '../../../core/transport/generated/schema';
import { LocalizePipe } from '../localize-pipe';
@Component({
  selector: 'app-favorite-action',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './favorite-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteAction {
  readonly kind = input.required<components['schemas']['ResourceKind']>();
  readonly reference = input.required<string>();
  readonly disabled = input(false);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  private readonly api = inject(PersonalCollections);
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.saved.set(false);
      this.error.set('');
      this.busy.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    effect(() => {
      this.reference();
      this.kind();
      this.generation++;
      this.saved.set(false);
      this.error.set('');
      this.busy.set(false);
    });
  }
  async add(): Promise<void> {
    if (this.busy() || this.disabled() || !this.reference()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.favorite({ kind: this.kind(), ref_id: this.reference() });
      if (generation === this.generation) {
        this.saved.set(true);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'The command could not be confirmed. Refresh current state before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
