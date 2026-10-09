import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  ReadinessCheck,
  readinessLabels,
  readinessStatus,
  ReadinessStatus,
} from '../../domain/readiness';
@Component({
  selector: 'app-readiness-panel',
  imports: [TableModule, ButtonModule, LocalizePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="my-4 rounded-lg border border-console-border p-4"
      [attr.aria-label]="caption() | localize"
    >
      <h2>{{ caption() | localize }}</h2>
      <p role="status">
        {{ 'Overall status' | localize }}: {{ labels[status()] | localize }}
      </p>
      @if (receivedAt()) {
        <p>
          {{ 'Received at' | localize }}:
          <time [attr.datetime]="receivedAt()">{{ receivedAt() }}</time>
        </p>
      }
      @if (stale()) {
        <p role="status">
          {{
            'Results may be out of date. Recheck before continuing.' | localize
          }}
        </p>
      }
      @if (note()) {
        <p>{{ note() | localize }}</p>
      }
      <p-table [value]="rows()">
        <ng-template #header
          ><tr>
            <th scope="col">{{ 'Check' | localize }}</th>
            <th scope="col">{{ 'Required' | localize }}</th>
            <th scope="col">{{ 'Status' | localize }}</th>
            <th scope="col">{{ 'Reason' | localize }}</th>
          </tr></ng-template
        >
        <ng-template #body let-check
          ><tr>
            <td>{{ check.label | localize }}</td>
            <td>{{ (check.required ? 'Yes' : 'No') | localize }}</td>
            <td>{{ label(check.status) | localize }}</td>
            <td>{{ check.reason | localize }}</td>
          </tr></ng-template
        >
      </p-table>
      @if (canRecheck()) {
        <button
          class="mt-3"
          pButton
          severity="secondary"
          type="button"
          [outlined]="true"
          (click)="recheck.emit()"
        >
          {{ 'Recheck' | localize }}
        </button>
      }
    </section>
  `,
})
export class ReadinessPanel {
  readonly caption = input('Readiness');
  readonly checks = input.required<readonly ReadinessCheck[]>();
  readonly note = input('');
  readonly receivedAt = input<string | null>(null);
  readonly stale = input(false);
  readonly canRecheck = input(false);
  readonly recheck = output<void>();
  readonly rows = computed(() => [...this.checks()]);
  readonly status = computed(() => readinessStatus(this.checks()));
  readonly labels = readinessLabels;
  label(status: ReadinessStatus): string {
    return readinessLabels[status] ?? readinessLabels.unknown;
  }
}
