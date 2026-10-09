import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TableModule } from 'primeng/table';
import { PresentedCollection } from '../../domain/record-presentation';
import { LocalizePipe } from '../localize-pipe';
type CollectionView = Omit<PresentedCollection, 'columns'> & {
  label: string;
  columns: readonly { key: string; label: string; path: readonly string[] }[];
};
@Component({
  selector: 'app-record-collections',
  imports: [TableModule, LocalizePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (collection of items(); track collection.key) {
      <section class="mt-5" [attr.aria-label]="collection.label">
        <p-table
          [tableStyle]="{ 'min-width': '24rem' }"
          [value]="collection.rows"
        >
          <ng-template #caption>{{ collection.label }}</ng-template>
          <ng-template #header
            ><tr>
              @for (column of collection.columns; track column.key) {
                <th scope="col">{{ column.label }}</th>
              }
            </tr></ng-template
          >
          <ng-template #body let-row
            ><tr>
              @for (column of collection.columns; track column.key) {
                <td>
                  <bdi>{{
                    row[column.key]
                      ? format()(row[column.key].value)
                      : ('Not present' | localize)
                  }}</bdi>
                </td>
              }
            </tr></ng-template
          >
        </p-table>
      </section>
    }
  `,
})
export class RecordCollections {
  readonly collections = input.required<readonly CollectionView[]>();
  readonly format = input.required<(value: unknown) => string>();
  readonly items = computed(() =>
    this.collections().map((collection) => ({
      ...collection,
      rows: [...collection.rows],
    })),
  );
}
