import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { ListQueryEditor } from './list-query';
import { ListValues } from '../list-values/list-values';
import { SelectControl } from '../select-control/select-control';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ControlField } from '../control-field/control-field';
import { LocalizePipe } from '../localize-pipe';
import { ControlContainer } from '@angular/forms';

@Component({
  selector: 'app-query-filters',
  imports: [
    ListValues,
    SelectControl,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    ControlField,
    LocalizePipe,
  ],
  templateUrl: './query-filters.html',
  styleUrl: './list-query.scss',
  host: { style: 'display: contents' },
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: (): ControlContainer =>
        inject(ControlContainer, { skipSelf: true }),
    },
  ],
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class QueryFilters {
  readonly view =
    input.required<
      Pick<
        ListQueryEditor,
        | 'addFilter'
        | 'busy'
        | 'fieldType'
        | 'fields'
        | 'filterErrors'
        | 'filters'
        | 'operations'
        | 'operators'
        | 'sortFieldsId'
      >
    >();
}
