import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
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
      return item.status;
    }
    if (column === 'kind') {
      return item.kind;
    }
    return item.summary?.[column] ?? null;
  }
}
