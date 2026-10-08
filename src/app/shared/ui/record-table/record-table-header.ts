import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
