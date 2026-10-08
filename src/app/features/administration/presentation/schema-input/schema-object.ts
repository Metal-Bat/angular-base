import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';
import { SchemaInput } from './schema-input';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-schema-object',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    ControlField,
    LocalizePipe,
    forwardRef(() => SchemaInput),
  ],
  templateUrl: './schema-object.html',
  styleUrl: './schema-input.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SchemaObject {
  readonly view =
    input.required<
      Pick<
        SchemaInput,
        | 'addProperty'
        | 'childId'
        | 'childPath'
        | 'controlId'
        | 'disabled'
        | 'errors'
        | 'extraSchema'
        | 'extras'
        | 'newKey'
        | 'object'
        | 'path'
        | 'properties'
        | 'referenceRequested'
        | 'required'
        | 'setChild'
        | 'shape'
        | 'title'
      >
    >();
}
