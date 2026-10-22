import { QueryChoice } from '../query-choice';
import { DOCUMENT } from '@angular/common';
import { FilterDraft } from '../../domain/list-query';
import { TemporalControl } from '../temporal-control/temporal-control';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
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
    QueryChoice,
    TemporalControl,
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
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly ids = new WeakMap<FilterDraft, string>();
  private nextId = 0;
  id(filter: FilterDraft): string {
    let id = this.ids.get(filter);
    if (!id) {
      id = `${this.view().sortFieldsId}-condition-${this.nextId++}`;
      this.ids.set(filter, id);
    }
    return id;
  }

  choices(key: string): readonly string[] {
    return (
      this.view()
        .fields()
        .find((field) => field.key === key)?.options ?? []
    );
  }
  remove(index: number): void {
    const vm = this.view();
    if (vm.busy() || index < 0 || index >= vm.filters.length) {
      return;
    }
    const errors = new Map(
      vm.filters.map((filter, position) => [filter, vm.filterErrors[position]]),
    );
    vm.filters = vm.filters.filter((_filter, position) => position !== index);
    vm.filterErrors = Object.fromEntries(
      vm.filters.flatMap((filter, position) =>
        errors.get(filter) ? [[position, errors.get(filter)!]] : [],
      ),
    );
    const next = vm.filters[Math.min(index, vm.filters.length - 1)];
    const target = next
      ? this.id(next) + '-field'
      : vm.sortFieldsId + '-add-filter';
    afterNextRender(() => this.document.getElementById(target)?.focus(), {
      injector: this.injector,
    });
  }
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
