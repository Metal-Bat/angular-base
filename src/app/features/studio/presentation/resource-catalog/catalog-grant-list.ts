import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { GrantRow } from '../../domain/catalog-access';

@Component({
  selector: 'app-catalog-grant-list',
  imports: [ButtonDirective, TableModule, LocalizePipe],
  templateUrl: './catalog-grant-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogGrantList {
  readonly rows = input.required<readonly GrantRow[]>();
  readonly data = computed(() => [...this.rows()]);
  readonly workflow = input(false);
  readonly busy = input(false);
  readonly revoked = output<GrantRow>();
}
