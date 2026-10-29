import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { AgentAuthoring } from './agent-authoring';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { AgentSampleInputs } from './agent-sample-inputs';
@Component({
  selector: 'app-agent-workflow-checks',
  imports: [
    LocalizePipe,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    ControlField,
    RecordTable,
    SelectControl,
    AgentSampleInputs,
  ],
  templateUrl: './agent-workflow-checks.html',
  styleUrl: './agent-workflow-checks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentWorkflowChecks {
  readonly view = input.required<AgentAuthoring>();
}
