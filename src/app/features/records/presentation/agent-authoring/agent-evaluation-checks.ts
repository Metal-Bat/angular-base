import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { AgentAuthoring } from './agent-authoring';
import { ButtonDirective } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
@Component({
  selector: 'app-agent-evaluation-checks',
  imports: [LocalizePipe, ButtonDirective, RouterLink, RecordTable],
  templateUrl: './agent-evaluation-checks.html',
  styleUrl: './agent-evaluation-checks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentEvaluationChecks {
  readonly view = input.required<AgentAuthoring>();
}
