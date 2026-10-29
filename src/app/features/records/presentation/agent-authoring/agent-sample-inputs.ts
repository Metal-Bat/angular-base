import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { AgentAuthoring } from './agent-authoring';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { AgentSampleChoices } from './agent-sample-choices';
@Component({
  selector: 'app-agent-sample-inputs',
  imports: [
    LocalizePipe,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    CheckboxModule,
    ControlField,
    AgentSampleChoices,
  ],
  templateUrl: './agent-sample-inputs.html',
  styleUrl: './agent-sample-inputs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentSampleInputs {
  readonly view = input.required<AgentAuthoring>();
}
