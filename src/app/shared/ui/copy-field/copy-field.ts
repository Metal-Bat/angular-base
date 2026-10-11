import { Clipboard } from '@angular/cdk/clipboard';
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
import { InputTextModule } from 'primeng/inputtext';
import { LocalizePipe } from '../localize-pipe';
import { ActorState } from '../../../core/auth/actor-state';
@Component({
  selector: 'app-copy-field',
  imports: [ButtonDirective, InputTextModule, LocalizePipe],
  templateUrl: './copy-field.html',
  styleUrl: './copy-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyField {
  private readonly clipboard = inject(Clipboard);
  private generation = 0;
  private destroyed = false;
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly status = signal('');
  readonly copying = signal(false);
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.copying.set(false);
      this.status.set('');
    });
    effect(() => {
      this.value();
      this.generation++;
      this.copying.set(false);
      this.status.set('');
    });
    inject(DestroyRef).onDestroy(() => {
      release();
      this.destroyed = true;
      this.generation++;
    });
  }
  async copy(): Promise<void> {
    const value = this.value();
    if (this.destroyed || !value || this.copying()) {
      return;
    }
    const generation = this.generation;
    this.copying.set(true);
    let success = false;
    try {
      if (typeof globalThis.navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(value);
        success = true;
      }
    } catch {
      /* Try the clipboard fallback. */
    }
    if (
      this.destroyed ||
      generation !== this.generation ||
      this.value() !== value
    ) {
      return;
    }
    if (!success) {
      try {
        success = this.clipboard.copy(value);
      } catch {
        /* Keep the value selectable for manual copying. */
      }
    }
    this.copying.set(false);
    if (this.value() === value) {
      this.status.set(
        success
          ? 'Copied to clipboard'
          : 'Could not copy. Select the password and copy it manually.',
      );
    }
  }
}
