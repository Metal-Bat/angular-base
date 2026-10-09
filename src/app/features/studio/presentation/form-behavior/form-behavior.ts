import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { FormInspector } from '../form-inspector/form-inspector';
@Component({
  selector: 'app-form-behavior',
  imports: [
    FormsModule,
    ButtonModule,
    SchemaInput,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './form-behavior.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FormBehavior {
  readonly view =
    input.required<
      Pick<
        FormInspector,
        | 'hasChoices'
        | 'source'
        | 'sourceKind'
        | 'sourcePatch'
        | 'choicesSchema'
        | 'node'
        | 'disabled'
        | 'setExpression'
        | 'expression'
        | 'dependencies'
        | 'dependencyName'
        | 'dependencyScope'
        | 'fields'
        | 'addDependency'
        | 'removeDependency'
      >
    >();
}
