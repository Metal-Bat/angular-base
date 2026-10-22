import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Locale } from '../../../../core/localization/locale';
import { JsonObject } from '../../../forms/domain/runtime-document';

@Component({
  selector: 'app-agent-overview',
  imports: [LocalizePipe],
  templateUrl: './agent-overview.html',
  styleUrl: './agent-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentOverview {
  readonly headingId = 'agent-summary-' + crypto.randomUUID();
  readonly config = input.required<JsonObject>();
  readonly record = input<JsonObject>({});
  readonly locale = inject(Locale);
  readonly policy = computed(
    () => (this.config()['data_policy'] ?? {}) as JsonObject,
  );
  readonly decision = computed(
    () => (this.config()['decision'] ?? {}) as JsonObject,
  );
  readonly limits = computed(
    () => (this.config()['user_limits'] ?? {}) as JsonObject,
  );
  count(key: string): number {
    const value = this.policy()[key];
    return Array.isArray(value) ? value.length : 0;
  }
}
