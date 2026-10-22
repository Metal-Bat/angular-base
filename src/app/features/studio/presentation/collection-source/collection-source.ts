import { invalidCollectionIndex } from '../../domain/data-mappings';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { mappingFields } from '../../domain/mapping-fields';
import { editorSchema } from '../../domain/mapping-schema';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
@Component({
  selector: 'app-collection-source',
  imports: [FormsModule, InputText, LocalizePipe, SelectControl],
  templateUrl: './collection-source.html',
  styles: `
    :host {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.5rem;
      min-inline-size: 0;
    }
    input {
      inline-size: 100%;
      min-inline-size: 0;
      box-sizing: border-box;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSource {
  readonly controlId = input('mapping-item');
  readonly schema = input.required<JsonObject>();
  readonly disabled = input(false);
  readonly index = model<number | null>(null);
  readonly field = model('');
  readonly invalidIndex = computed(() => invalidCollectionIndex(this.index()));
  readonly fields = computed(() =>
    mappingFields((editorSchema(this.schema())['items'] ?? {}) as JsonObject),
  );
}
