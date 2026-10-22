import { Locale } from '../../../core/localization/locale';
import { QuerySorts } from './query-sorts';
import { QueryFilters } from './query-filters';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
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
    QuerySorts,
    PanelModule,
    TagModule,
    FormsModule,
    ButtonDirective,
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
  readonly editing = output<boolean>();
  toggle(): void {
    this.collapsed = !this.collapsed;
    this.editing.emit(!this.collapsed);
  }
  readonly locale = inject(Locale);
  readonly query = input<ListQuery | null>(null);
  constructor() {
    let confirmed = '';
    effect(() => {
      const query = this.query();
      const identity = JSON.stringify(query && { ...query, page: 1 });
      if (identity !== confirmed) {
        confirmed = identity;
        this.hydrate(query);
      }
    });
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
  appliedSummary(): string[] {
    const query = this.query();
    if (!query) {
      return [];
    }
    const label = (key: string): string => {
      const field = this.fields().find((candidate) => candidate.key === key);
      return this.locale.text(field?.label ?? 'Unavailable');
    };
    const value = (item: QueryValue): string =>
      Array.isArray(item)
        ? item.map(value).join(', ')
        : typeof item === 'boolean'
          ? this.locale.text(item ? 'Yes' : 'No')
          : typeof item === 'number'
            ? String(item)
            : item === null
              ? ''
              : item;
    return [
      ...query.filters.map((filter) =>
        [
          label(filter.field_name),
          this.locale.text(this.operators[filter.operation]),
          value(filter.value),
        ]
          .filter(Boolean)
          .join(' '),
      ),
      ...query.sort_orders.map((sort, index) => {
        const keys = sort.field_name
          ? [sort.field_name]
          : (sort.multi_field ?? []);
        const direction = this.locale.text(
          sort.operation === 'asc' ? 'Ascending' : 'Descending',
        );
        return (
          `${this.locale.text('Sort')} ${this.locale.number(index + 1)}: ` +
          keys.map(label).join(', ') +
          ' · ' +
          direction
        );
      }),
    ];
  }
  cancel(): void {
    this.hydrate(this.query());
    this.filterErrors = {};
    this.sortErrors = {};
    this.error = '';
  }
  reset(): void {
    this.filters = [];
    this.sorts = [];
    this.extras = {};
    this.apply();
  }
}
