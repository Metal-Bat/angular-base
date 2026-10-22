import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../localize-pipe';

@Component({
  selector: 'app-transfer-progress',
  imports: [LocalizePipe],
  template: `
    <p role="status">{{ label() | localize }}</p>
    <progress
      max="100"
      [attr.aria-label]="label() | localize"
      [attr.value]="value()"
    ></progress>
    @if (value() !== null) {
      <span aria-hidden="true">{{ value() }}%</span>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
    }
    p {
      margin: 0;
      font-size: 0.875rem;
    }
    progress {
      inline-size: 100%;
      accent-color: var(--console-accent);
    }
    span {
      font-size: 0.8125rem;
      color: var(--console-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferProgress {
  // Native exception: pinned PrimeNG 21 adds unsupported aria-level to its
  // progressbar, including indeterminate output. See APP-FE-036.UX01 evidence.
  readonly label = input('Transfer in progress');
  readonly value = input<number | null>(null);
}
