import { QueryFilters } from './query-filters';
import { SelectControl } from '../select-control/select-control';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
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
import { ControlField } from '../control-field/control-field';
import { LocalizePipe } from '../localize-pipe';
import {
  compileQuery,
  FilterDraft,
  ListQuery,
  operationsFor,
  QueryField,
  QueryValue,
  SortDraft,
} from '../../domain/list-query';
@Component({
  selector: 'app-list-query',
  imports: [
    QueryFilters,
    SelectControl,
    PanelModule,
    TagModule,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    ControlField,
    LocalizePipe,
  ],
  templateUrl: './list-query.html',
  styleUrl: './list-query.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListQueryEditor {
  private static nextId = 0;
  readonly sortFieldsId = 'sort-fields-' + ++ListQueryEditor.nextId;
  collapsed = true;
  readonly query = input<ListQuery | null>(null);
  constructor() {
    effect(() => this.hydrate(this.query()));
  }
  private hydrate(query: ListQuery | null): void {
    if (!query) {
      return;
    }
    this.size = query.size;
    this.extras = structuredClone(query.extras);
    this.filters = query.filters.map((filter) => ({
      field: filter.field_name,
      operation: filter.operation,
      value:
        filter.operation === 'between'
          ? String((filter.value as QueryValue[])[0])
          : Array.isArray(filter.value)
            ? filter.value.join('\n')
            : filter.value === null
              ? ''
              : String(filter.value),
      end:
        filter.operation === 'between'
          ? String((filter.value as QueryValue[])[1])
          : '',
    }));
    this.sorts = query.sort_orders.map((sort) => ({
      fields: sort.field_name ?? sort.multi_field?.join(', ') ?? '',
      operation: sort.operation,
    }));
  }
  readonly fields = input.required<readonly QueryField[]>();
  readonly extraFields = input<readonly { key: string; label: string }[]>([]);
  readonly busy = input(false);
  readonly applied = output<ListQuery>();
  filters: FilterDraft[] = [];
  sorts: SortDraft[] = [];
  size = 20;
  extras: Record<string, QueryValue> = {};
  filterErrors: Record<number, string> = {};
  sortErrors: Record<number, string> = {};
  error = '';
  readonly operators: Record<string, string> = {
    equal: 'Equals',
    notEqual: 'Does not equal',
    contains: 'Contains',
    notContains: 'Does not contain',
    startWith: 'Starts with',
    endsWith: 'Ends with',
    between: 'Between',
    isNull: 'Is empty',
    isNotNull: 'Is not empty',
    gt: 'Greater than',
    gte: 'At least',
    lt: 'Less than',
    lte: 'At most',
    in: 'Is one of',
    nin: 'Is not one of',
  };
  operations(key: string): readonly string[] {
    const field = this.fields().find((f) => f.key === key);
    return field ? operationsFor(field) : [];
  }
  fieldType(key: string): string {
    return this.fields().find((f) => f.key === key)?.type ?? 'text';
  }
  addFilter(): void {
    this.filters = [
      ...this.filters,
      {
        field: this.fields()[0]?.key ?? '',
        operation: 'equal',
        value: '',
        end: '',
      },
    ];
  }
  addSort(): void {
    this.sorts = [
      ...this.sorts,
      { fields: this.fields()[0]?.key ?? '', operation: 'asc' },
    ];
  }
  apply(): void {
    this.filterErrors = {};
    this.sortErrors = {};
    this.filters.forEach((filter, index) => {
      try {
        compileQuery(this.fields(), [filter], [], this.size, {}, []);
      } catch (error) {
        this.filterErrors[index] =
          error instanceof Error ? error.message : 'Invalid query';
      }
    });
    this.sorts.forEach((sort, index) => {
      try {
        compileQuery(this.fields(), [], [sort], this.size, {}, []);
      } catch (error) {
        this.sortErrors[index] =
          error instanceof Error ? error.message : 'Invalid query';
      }
    });
    try {
      const query = compileQuery(
        this.fields(),
        this.filters,
        this.sorts,
        this.size,
        this.extras,
        this.extraFields().map((f) => f.key),
      );
      this.error = '';
      this.applied.emit(query);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Invalid query';
    }
  }
  reset(): void {
    this.filters = [];
    this.sorts = [];
    this.extras = {};
    this.size = 20;
    this.apply();
  }
}
