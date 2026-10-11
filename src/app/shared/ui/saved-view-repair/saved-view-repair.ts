import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SavedView } from '../../../core/resources/personal-collections';
import { JsonObject, JsonValue } from '../../domain/json-value';
import { fieldLabel } from '../../domain/field-label';
import { LocalizePipe } from '../localize-pipe';
function object(value: JsonValue | undefined): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}
function text(value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value !== 'object') {
    return String(value);
  }
  if (
    Array.isArray(value) &&
    value.every((item) => item === null || typeof item !== 'object')
  ) {
    return value.map(String).join(', ');
  }
  return 'Structured constraint retained.';
}
@Component({
  selector: 'app-saved-view-repair',
  imports: [DialogModule, ButtonDirective, TableModule, LocalizePipe],
  templateUrl: './saved-view-repair.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedViewRepair {
  readonly visible = input(false);
  readonly original = input<SavedView | null>(null);
  readonly replacement = input<JsonObject | null>(null);
  readonly replacementColumns = input<readonly string[]>([]);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly sections = computed(() => [
    this.section(
      'Original saved restrictions',
      this.original()?.query as JsonObject | undefined,
      this.original()?.page_size,
      this.original()?.column_keys ?? [],
    ),
    this.section(
      'Current applied restrictions',
      this.replacement() ?? undefined,
      this.replacement()?.['size'],
      this.replacementColumns(),
    ),
  ]);
  private section(
    title: string,
    query?: JsonObject,
    pageSize?: JsonValue,
    columns: readonly string[] = [],
  ): {
    title: string;
    scope: string;
    pageSize: string;
    columns: string[];
    filters: { field: string; operation: string; value: string }[];
    sorts: { field: string; direction: string }[];
  } {
    const filters = Array.isArray(query?.['filters']) ? query['filters'] : [];
    const sorts = Array.isArray(query?.['sort_orders'])
      ? query['sort_orders']
      : [];
    return {
      title,
      scope: text(query?.['scope']),
      pageSize: text(pageSize),
      columns: columns.map((key) => fieldLabel(key)),
      filters: filters.map((value) => {
        const row = object(value);
        return {
          field: text(row['field_name']),
          operation: text(row['operation']),
          value: text(row['value']),
        };
      }),
      sorts: sorts.map((value) => {
        const row = object(value);
        return {
          field: text(
            Array.isArray(row['multi_field']) && row['multi_field'].length
              ? row['multi_field']
              : row['field_name'],
          ),
          direction: text(row['operation']),
        };
      }),
    };
  }
}
