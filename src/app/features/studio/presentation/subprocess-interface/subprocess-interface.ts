import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Locale } from '../../../../core/localization/locale';
import { translatedSchemaSummary } from '../schema-summary';
@Component({
  selector: 'app-subprocess-interface',
  imports: [LocalizePipe],
  templateUrl: './subprocess-interface.html',
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    li {
      overflow-wrap: anywhere;
    }
    ul {
      padding-inline-start: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubprocessInterface {
  readonly value = input<JsonObject>();
  readonly outputs = computed(
    () => (this.value()?.['outputs'] ?? []) as JsonObject[],
  );
  readonly outcomes = computed(() =>
    Object.keys((this.value()?.['outcomes'] ?? {}) as JsonObject),
  );
  readonly capabilities = computed(
    () => (this.value()?.['required_capabilities'] ?? []) as string[],
  );
  private readonly locale = inject(Locale);
  summary(schema: JsonObject): string {
    return translatedSchemaSummary(schema, (value) => this.locale.text(value));
  }
}
