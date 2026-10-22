import { QueryChoice } from '../query-choice';
import { TemporalControl } from '../temporal-control/temporal-control';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import type { RecordTable } from './record-table';
import { ListValues } from '../list-values/list-values';
import { SelectControl } from '../select-control/select-control';
import { ControlField } from '../control-field/control-field';
import { FormsModule } from '@angular/forms';
import { PopoverModule } from 'primeng/popover';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { LocalizePipe } from '../localize-pipe';

@Component({
  selector: 'tr[app-record-table-header]',
  imports: [
    QueryChoice,
    TemporalControl,
    ListValues,
    SelectControl,
    ControlField,
    FormsModule,
    PopoverModule,
    InputTextModule,
    ButtonModule,
    LocalizePipe,
  ],
  templateUrl: './record-table-header.html',
  styleUrl: './record-table-header.scss',

  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordTableHeader {
  private readonly pendingFocus = signal<HTMLElement | null>(null);
  readonly filterClosed = signal(true);
  private readonly injector = inject(Injector);
  constructor() {
    effect(() => {
      const target = this.pendingFocus();
      if (target && this.filterClosed() && !this.view().busy()) {
        afterNextRender(
          () => {
            if (
              this.pendingFocus() === target &&
              this.filterClosed() &&
              !this.view().busy()
            ) {
              this.pendingFocus.set(null);
              if (target.isConnected) {
                target.focus();
              }
            }
          },
          { injector: this.injector },
        );
      }
    });
  }
  restoreFocus(target: HTMLElement): void {
    this.filterClosed.set(false);
    this.pendingFocus.set(target);
  }
  readonly view =
    input.required<
      Pick<
        RecordTable,
        | 'applyFilter'
        | 'busy'
        | 'columns'
        | 'direction'
        | 'draft'
        | 'error'
        | 'field'
        | 'filterValueId'
        | 'filtered'
        | 'operationsFor'
        | 'operators'
        | 'sort'
        | 'startFilter'
      >
    >();
}
