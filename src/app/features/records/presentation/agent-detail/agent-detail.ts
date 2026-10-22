import { AgentDecisionSummary } from '../agent-decision-summary/agent-decision-summary';
import { AgentInstructions } from '../agent-instructions/agent-instructions';
import { AgentLimits } from '../agent-limits/agent-limits';
import { AgentOverview } from '../agent-overview/agent-overview';
import { AgentPolicySummary } from '../agent-policy-summary/agent-policy-summary';
import { AgentCapabilities } from '../agent-capabilities/agent-capabilities';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { agentSections } from '../agent-sections';
@Component({
  selector: 'app-agent-detail',
  imports: [
    AgentDecisionSummary,
    TabsModule,
    LocalizePipe,
    RecordSummary,
    AgentInstructions,
    AgentLimits,
    AgentOverview,
    AgentPolicySummary,
    AgentCapabilities,
  ],
  templateUrl: './agent-detail.html',
  styleUrl: './agent-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDetail {
  readonly record = input.required<JsonObject>();
  readonly config = computed(() => (this.record()['spec'] ?? {}) as JsonObject);
  readonly effectiveLimits = computed(
    () =>
      ((this.record()['spec'] ?? {}) as JsonObject)['effective_limits'] as
        JsonObject | undefined,
  );
  readonly tab = signal<string | number>('identity');
  readonly sections = computed(() => {
    const spec = (this.record()['spec'] ?? {}) as JsonObject;
    const sections = agentSections.map((section) => ({
      ...section,
      record: Object.fromEntries(
        section.keys
          .filter((key) => Object.hasOwn(spec, key))
          .map((key) => [key, spec[key]]),
      ),
    }));
    return sections;
  });
  withoutDecision(record: JsonObject): JsonObject {
    return Object.fromEntries(
      Object.entries(record).filter(([key]) => key !== 'decision'),
    );
  }
  readonly identity = computed(() =>
    Object.fromEntries(
      ['code', 'number', 'status', 'created_at', 'published_at']
        .filter((key) => Object.hasOwn(this.record(), key))
        .map((key) => [key, this.record()[key]]),
    ),
  );
}
