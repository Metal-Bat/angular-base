import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import type { FormRules } from '../form-rules/form-rules';
import { FormRuleResource } from '../form-rule-resource/form-rule-resource';

@Component({
  selector: 'app-form-rule-value',
  imports: [
    FormsModule,
    InputTextModule,
    LocalizePipe,
    SelectControl,
    FormRuleResource,
  ],
  templateUrl: './form-rule-value.html',
  styleUrl: './form-rule-value.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRuleValue {
  readonly view =
    input.required<
      Pick<
        FormRules,
        | 'field'
        | 'draft'
        | 'presenceOnly'
        | 'choices'
        | 'types'
        | 'disabled'
        | 'parsed'
        | 'update'
        | 'resourceField'
        | 'documents'
        | 'data'
        | 'locale'
        | 'resourceCurrent'
        | 'resourcePicked'
      >
    >();
}
