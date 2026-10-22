import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
@Component({
  selector: 'app-agent-policy-summary',
  imports: [LocalizePipe],
  templateUrl: './agent-policy-summary.html',
  styleUrl: './agent-policy-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentPolicySummary {
  readonly value = input<JsonObject>({});
  readonly classifications = input<JsonObject>({});
  strings(key: string): string[] {
    const values = this.value()[key];
    return Array.isArray(values)
      ? values.filter((value): value is string => typeof value === 'string')
      : [];
  }
  readonly sourceKeys = computed(() =>
    this.strings('allowed_retrieval_sources'),
  );
  readonly otherTools = computed(() =>
    this.strings('allowed_tools').filter(
      (key) => key !== 'lookup_saved_report',
    ),
  );
}
