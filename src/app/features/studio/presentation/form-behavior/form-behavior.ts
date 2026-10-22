import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FormChoiceRows } from '../form-choice-rows/form-choice-rows';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { FormInspector } from '../form-inspector/form-inspector';
@Component({
  selector: 'app-form-behavior',
  imports: [
    FormChoiceRows,
    FormsModule,
    ButtonModule,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './form-behavior.html',
  styleUrl: './form-behavior.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FormBehavior {
  readonly mode = input<'all' | 'choices' | 'calculation'>('all');
  readonly view =
    input.required<
      Pick<
        FormInspector,
        | 'hasChoices'
        | 'source'
        | 'sourceKind'
        | 'sourcePatch'
        | 'constraints'
        | 'choiceValid'
        | 'changed'
        | 'path'
        | 'node'
        | 'disabled'
        | 'setExpression'
        | 'expression'
        | 'expressionAvailable'
        | 'calculationResult'
        | 'calculationFunction'
        | 'calculationScopes'
        | 'calculationScope'
        | 'setFunction'
        | 'dependencies'
        | 'dependencyName'
        | 'dependencyScope'
        | 'fields'
        | 'addDependency'
        | 'removeDependency'
      >
    >();
}
