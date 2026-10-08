import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LocalizePipe } from '../localize-pipe';
@Component({
  selector: 'app-copy-field',
  imports: [ButtonDirective, InputTextModule, LocalizePipe],
  templateUrl: './copy-field.html',
  styleUrl: './copy-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyField {
  private readonly clipboard = inject(Clipboard);
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly status = signal('');
  readonly copying = signal(false);
  constructor() {
    effect(() => {
      this.value();
      this.status.set('');
    });
  }
  async copy(): Promise<void> {
    const value = this.value();
    if (!value || this.copying()) {
      return;
    }
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
