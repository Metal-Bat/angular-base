import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RuntimeNode } from './runtime-node';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import { ChoiceControl } from '../choice-control/choice-control';
import { ValueTextPipe } from '../value-text-pipe';
import { FieldWrapper } from '../../../../shared/ui/field-wrapper/field-wrapper';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-runtime-field',
  imports: [
    SelectControl,
    ButtonDirective,
    ChoiceControl,
    ValueTextPipe,
    FieldWrapper,
    LocalizePipe,
  ],
  templateUrl: './runtime-field.html',
  styleUrl: './runtime-node.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RuntimeField {
  readonly view =
    input.required<
      Pick<
        RuntimeNode,
        | 'bool'
        | 'choice'
        | 'clear'
        | 'data'
        | 'document'
        | 'edit'
        | 'errors'
        | 'indices'
        | 'inputValue'
        | 'node'
        | 'nullable'
        | 'path'
        | 'pointer'
        | 'set'
        | 'text'
        | 'value'
        | 'writable'
      >
    >();
}
