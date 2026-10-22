import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Locale } from '../../../../core/localization/locale';
import { ListNavigation } from '../../../../core/resources/list-navigation';
import { JsonObject } from '../../../../shared/domain/json-value';
import { fieldLabel } from '../../../../shared/domain/field-label';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { CaseKind, CaseRecord } from '../../domain/workspace-models';
@Component({
  selector: 'app-case-list',
  imports: [TableModule, RouterLink, LocalizePipe],
  templateUrl: './case-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseList {
  readonly kind = input.required<CaseKind>();
  readonly items = input.required<readonly CaseRecord[]>();
  readonly columns = input<readonly string[]>([]);
  readonly query = input<JsonObject | null>(null);
  private readonly locale = inject(Locale);
  private readonly navigation = inject(ListNavigation);
  readonly rows = computed(() => [...this.items()]);
  readonly visible = computed(() =>
    this.columns().length
      ? this.columns()
      : ['status', 'created_at', 'priority'],
  );
  label(key: string): string {
    return fieldLabel(key);
  }
  value(item: CaseRecord, column: string): string | number | null {
    if (column === 'status') {
      return this.locale.text(item.status);
    }
    if (column === 'kind') {
      return this.locale.text(item.kind);
    }
    const value = item.summary?.[column] ?? null;
    if (column.endsWith('_at') && typeof value === 'string') {
      const date = new Date(value);
      if (Number.isFinite(date.getTime())) {
        return new Intl.DateTimeFormat(this.locale.language(), {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: this.locale.timezone(),
          calendar: this.locale.calendar(),
          numberingSystem: this.locale.numbering(),
        }).format(date);
      }
    }
    return value;
  }
  title(item: CaseRecord): string {
    return [
      this.locale.text(this.kind() === 'request' ? 'Request' : 'Task'),
      this.value(item, 'status'),
      this.value(item, 'created_at'),
    ]
      .filter((value) => value !== null && value !== '')
      .join(' · ');
  }
  remember(): void {
    const query = this.query();
    if (query) {
      this.navigation.set({
        route_key: this.kind() === 'request' ? 'requests' : 'work_items',
        query,
      });
    }
  }
}
