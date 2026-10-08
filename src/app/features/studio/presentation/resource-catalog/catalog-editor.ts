import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FieldSpec } from '../../domain/authoring';
import type { ResourceCatalog } from './resource-catalog';
import { SelectModule } from 'primeng/select';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-catalog-editor',
  imports: [
    SelectModule,
    ControlField,
    FormsModule,
    ButtonDirective,
    DialogModule,
    LocalizePipe,
  ],
  templateUrl: './catalog-editor.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogEditor {
  hints(field: FieldSpec): { label: string; value: string }[] {
    const hints: { label: string; value: string }[] = [];
    for (const [key, label] of [
      ['minLength', 'Minimum characters'],
      ['maxLength', 'Maximum characters'],
    ]) {
      if (field.schema[key]) {
        hints.push({ label, value: ': ' + field.schema[key] });
      }
    }
    if (field.type === 'json') {
      hints.push({ label: 'JSON document', value: '' });
    }
    if (field.key === 'code') {
      hints.push({
        label: 'Use letters, numbers, dots, underscores or hyphens.',
        value: '',
      });
    }
    return hints;
  }

  readonly view =
    input.required<
      Pick<
        ResourceCatalog,
        | 'busy'
        | 'canSave'
        | 'change'
        | 'closeForm'
        | 'controlsDisabled'
        | 'display'
        | 'enumChoices'
        | 'error'
        | 'fields'
        | 'formOpen'
        | 'invalid'
        | 'save'
        | 'selected'
        | 'values'
      >
    >();
}
