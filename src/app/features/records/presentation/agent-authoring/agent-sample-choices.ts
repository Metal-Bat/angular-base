import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { AgentAuthoring } from './agent-authoring';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
@Component({
  selector: 'app-agent-sample-choices',
  imports: [
    LocalizePipe,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    TextareaModule,
    ControlField,
  ],
  templateUrl: './agent-sample-choices.html',
  styleUrl: './agent-sample-choices.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentSampleChoices {
  readonly view = input.required<AgentAuthoring>();
}
