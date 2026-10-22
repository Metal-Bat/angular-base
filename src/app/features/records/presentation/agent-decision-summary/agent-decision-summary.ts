import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
@Component({
  selector: 'app-agent-decision-summary',
  imports: [LocalizePipe],
  templateUrl: './agent-decision-summary.html',
  styleUrl: './agent-decision-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDecisionSummary {
  readonly value = input<JsonObject>({});
  readonly locale = inject(Locale);
  readonly choices = computed(() =>
    ((this.value()['options'] ?? []) as JsonObject[]).map((choice) => {
      const labels = (choice['labels'] ?? {}) as JsonObject;
      return {
        key: String(choice['key'] ?? ''),
        description: String(choice['description'] ?? ''),
        title: String(
          labels[this.locale.language()] ??
            labels['en'] ??
            Object.values(labels)[0] ??
            this.locale.text('Label unavailable'),
        ),
      };
    }),
  );
}
