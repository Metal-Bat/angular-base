import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { JsonObject } from '../../../../shared/domain/json-value';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { TemporalControl } from '../../../../shared/ui/temporal-control/temporal-control';
import {
  CartableDraft,
  cartableQuery,
  taskStatuses,
} from '../../domain/cartable-query';

@Component({
  selector: 'app-task-list-query',
  imports: [
    FormsModule,
    ButtonDirective,
    InputTextModule,
    PanelModule,
    ControlField,
    LocalizePipe,
    SelectControl,
    TemporalControl,
  ],
  templateUrl: './task-list-query.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListQuery {
  readonly query = input<JsonObject | null>(null);
  readonly busy = input(false);
  readonly editing = output<boolean>();
  readonly applied = output<JsonObject>();
  readonly statuses = taskStatuses;
  draft: CartableDraft = {
    status: '',
    time: 'created_at',
    after: '',
    before: '',
    overdue: '',
    size: 20,
  };
  error = '';
  constructor() {
    let confirmed = '';
    effect(() => {
      const query = this.query();
      const identity = JSON.stringify(query && { ...query, page: 1 });
      if (identity !== confirmed) {
        confirmed = identity;
        this.cancel();
      }
    });
  }
  cancel(): void {
    const query = this.query();
    const text = (key: string): string =>
      typeof query?.[key] === 'string' ? query[key] : '';
    this.draft = {
      status: text('status'),
      time: text('time_field') || 'created_at',
      after: text('after'),
      before: text('before'),
      overdue: text('overdue_before'),
      size: Number(query?.['size'] ?? 20),
    };
    this.error = '';
  }
  clear(): void {
    this.draft = {
      status: '',
      time: 'created_at',
      after: '',
      before: '',
      overdue: '',
      size: this.draft.size,
    };
    this.apply();
  }
  apply(): void {
    if (this.busy()) {
      return;
    }
    try {
      const query = cartableQuery(this.query(), this.draft);
      this.error = '';
      this.applied.emit(query);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Invalid query';
    }
  }
}
