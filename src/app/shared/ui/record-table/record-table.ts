import { SelectModule } from 'primeng/select';
import { ListValues } from '../list-values/list-values';
import { SelectControl } from '../select-control/select-control';
import { ControlField } from '../control-field/control-field';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PopoverModule } from 'primeng/popover';
import { InputTextModule } from 'primeng/inputtext';
import {
  compileQuery,
  emptyQuery,
  FilterDraft,
  ListQuery,
  operationsFor,
  QueryField,
  Sort,
} from '../../domain/list-query';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { Locale } from '../../../core/localization/locale';
import { LocalizePipe } from '../localize-pipe';
export type RowAction = {
  key: string;
  label: string;
  icon: string;
  disabled?: boolean;
};
export type RowActionEvent = { key: string; row: Record<string, unknown> };
@Component({
  selector: 'app-record-table',
  imports: [
    SelectModule,
    ListValues,
    SelectControl,
    ControlField,
    TableModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    LocalizePipe,
    FormsModule,
    PopoverModule,
    InputTextModule,
  ],
  templateUrl: './record-table.html',
  styleUrl: './record-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordTable {
  readonly actionButtonStyles = {
    fontSize: '1rem',
    lineHeight: '1',
    inlineSize: '2.5rem',
    blockSize: '2.5rem',
    minBlockSize: '2.5rem',
    padding: '0',
    margin: '0',
  };

  private static nextId = 0;
  readonly filterValueId = `column-filter-value-${++RecordTable.nextId}`;
  private readonly locale = inject(Locale);
  readonly rows = input.required<readonly Record<string, unknown>[]>();
  readonly columns =
    input.required<readonly { key: string; label: string }[]>();
  readonly busy = input(false);
  readonly actionLabel = input('Open');
  readonly opened = output<Record<string, unknown>>();
  readonly canEdit = input<(row: Record<string, unknown>) => boolean>(
    () => false,
  );
  readonly edited = output<Record<string, unknown>>();
  readonly moreActions = input<
    (row: Record<string, unknown>) => readonly RowAction[]
  >(() => []);
  readonly actionRequested = output<RowActionEvent>();
  readonly menuRow = signal<Record<string, unknown> | null>(null);
  readonly menuId = `row-actions-${this.filterValueId}`;
  menuItems: MenuItem[] = [];
  showActions(event: Event, row: Record<string, unknown>, menu: Menu): void {
    if (this.busy()) {
      return;
    }
    this.menuRow.set(row);
    this.menuItems = this.moreActions()(row).map((action) => ({
      label: this.locale.text(action.label),
      icon: action.icon,
      disabled: action.disabled,
      command: (): void => {
        const current = this.moreActions()(row).find(
          (item) => item.key === action.key,
        );
        if (
          !this.busy() &&
          this.rows().includes(row) &&
          current &&
          !current.disabled
        ) {
          this.actionRequested.emit({ key: action.key, row });
        }
      },
    }));
    menu.toggle(event);
  }
  closeActions(): void {
    this.menuRow.set(null);
    this.menuItems = [];
  }
  readonly page = input(1);
  readonly pages = input<number | null>(null);
  readonly pageChanged = output<number>();
  readonly fields = input<readonly QueryField[]>([]);
  readonly query = input<ListQuery>(emptyQuery());
  readonly queried = output<ListQuery>();
  draft: FilterDraft = { field: '', operation: 'equal', value: '', end: '' };
  error = '';
  readonly operationsFor = operationsFor;
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
  field(key: string): QueryField | undefined {
    return this.fields().find(
      (f) => f.key === key || (key === 'value' && f.key === 'username'),
    );
  }
  startFilter(field: QueryField): void {
    const current = this.query().filters.find(
      (f) => f.field_name === field.key,
    );
    this.draft = {
      field: field.key,
      operation:
        current?.operation ?? (field.type === 'text' ? 'contains' : 'equal'),
      value:
        current?.value === null || current?.value === undefined
          ? ''
          : Array.isArray(current.value)
            ? current.value.join(current.operation === 'between' ? '' : '\n')
            : String(current.value),
      end: '',
    };
    if (current?.operation === 'between' && Array.isArray(current.value)) {
      this.draft.value = String(current.value[0]);
      this.draft.end = String(current.value[1]);
    }
    this.error = '';
  }
  filtered(key: string): boolean {
    return this.query().filters.some(
      (f) => f.field_name === this.field(key)?.key,
    );
  }
  applyFilter(clear = false): boolean {
    try {
      const filters = clear
        ? []
        : compileQuery(
            this.fields(),
            [this.draft],
            [],
            this.query().size,
            {},
            [],
          ).filters;
      this.queried.emit({
        ...structuredClone(this.query()),
        page: 1,
        filters: [
          ...this.query().filters.filter(
            (f) => f.field_name !== this.draft.field,
          ),
          ...filters,
        ],
      });
      this.error = '';
      return true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Invalid query';
      return false;
    }
  }
  direction(key: string): string | undefined {
    return this.query().sort_orders.find(
      (s) =>
        s.field_name === this.field(key)?.key ||
        s.multi_field?.includes(this.field(key)?.key ?? ''),
    )?.operation;
  }
  sort(key: string): void {
    const field = this.field(key);
    if (!field) {
      return;
    }
    const direction = this.direction(key);
    const sorts: Sort[] = this.query().sort_orders.flatMap((sort) => {
      if (sort.field_name === field.key) {
        return [];
      }
      if (!sort.multi_field?.includes(field.key)) {
        return [sort];
      }
      const fields = sort.multi_field.filter((name) => name !== field.key);
      return fields.length > 1
        ? [{ multi_field: fields, operation: sort.operation }]
        : fields.length
          ? [{ field_name: fields[0], operation: sort.operation }]
          : [];
    });
    if (direction !== 'desc') {
      sorts.push({
        field_name: field.key,
        operation: direction === 'asc' ? 'desc' : 'asc',
      });
    }
    this.queried.emit({
      ...structuredClone(this.query()),
      page: 1,
      sort_orders: sorts,
    });
  }
  resize(size: number): void {
    if (
      !this.busy() &&
      Number.isInteger(size) &&
      size >= 1 &&
      size <= 100 &&
      size !== this.query().size
    ) {
      this.queried.emit({ ...structuredClone(this.query()), page: 1, size });
    }
  }
  go(value: string | number): void {
    const page = Number(value);
    if (
      this.busy() ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > Math.max(1, this.pages() ?? 1) ||
      page === this.page()
    ) {
      return;
    }
    this.pageChanged.emit(page);
  }
  value(value: unknown, key = ''): string {
    if (
      key.endsWith('_at') &&
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(value)
    ) {
      const date = new Date(value);
      if (Number.isFinite(date.getTime())) {
        return new Intl.DateTimeFormat(this.locale.language(), {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
          timeZoneName: 'short',
          calendar: 'gregory',
        }).format(date);
      }
    }
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return typeof value === 'object' ? 'Details' : String(value);
  }
}
