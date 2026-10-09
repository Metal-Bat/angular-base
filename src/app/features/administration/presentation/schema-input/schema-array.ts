import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';
import { SchemaInput } from './schema-input';
import { ButtonModule } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-schema-array',
  imports: [ButtonModule, LocalizePipe, forwardRef(() => SchemaInput)],
  templateUrl: './schema-array.html',
  styleUrl: './schema-input.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SchemaArray {
  readonly view =
    input.required<
      Pick<
        SchemaInput,
        | 'addItem'
        | 'childId'
        | 'childPath'
        | 'controlId'
        | 'disabled'
        | 'errors'
        | 'items'
        | 'path'
        | 'removeItem'
        | 'required'
        | 'referenceLabels'
        | 'referenceRequested'
        | 'setItem'
        | 'shape'
        | 'title'
      >
    >();
}
