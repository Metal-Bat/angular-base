import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { AgentAuthoring } from './agent-authoring';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
@Component({
  selector: 'app-agent-retrieval-checks',
  imports: [
    LocalizePipe,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    ControlField,
    RecordTable,
  ],
  templateUrl: './agent-retrieval-checks.html',
  styleUrl: './agent-retrieval-checks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentRetrievalChecks {
  readonly view = input.required<AgentAuthoring>();
}
