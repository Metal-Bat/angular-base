import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { nodeLabel } from '../../../forms/domain/node-label';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-form-label-editor',
  imports: [FormsModule, ButtonModule, InputTextModule, LocalizePipe],
  templateUrl: './form-label-editor.html',
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
      min-inline-size: 0;
    }
    input {
      inline-size: 100%;
      min-inline-size: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLabelEditor {
  readonly node = input.required<JsonObject>();
  readonly resolvedLabel = input('');
  readonly disabled = input(false);
  readonly translationDisabled = input(false);
  readonly patched = output<{ key: string; value: string | JsonObject }>();
  readonly translationRequested = output<string>();
  readonly accessibility = computed(
    () => (this.node()['accessibility'] ?? {}) as JsonObject,
  );
  readonly message = computed(() => {
    const messages = (this.node()['messages'] ?? {}) as JsonObject;
    const accessibility = messages['accessibility_label'] as
      JsonObject | undefined;
    if (typeof accessibility?.['key'] === 'string') {
      return accessibility['key'];
    }
    if (
      typeof this.accessibility()['label'] === 'string' &&
      this.accessibility()['label']
    ) {
      return '';
    }
    const label = messages['label'] as JsonObject | undefined;
    return typeof label?.['key'] === 'string'
      ? label['key']
      : String(this.node()['localization_key'] ?? '');
  });
  readonly value = computed(
    () => this.accessibility()['label'] ?? this.node()['label'] ?? '',
  );
  readonly placeholder = computed(() =>
    nodeLabel({
      label: null,
      scope:
        typeof this.node()['scope'] === 'string'
          ? (this.node()['scope'] as string)
          : null,
      display: {},
    }),
  );
  change(value: string): void {
    if (this.disabled() || this.message()) {
      return;
    }
    this.patched.emit(
      typeof this.accessibility()['label'] === 'string'
        ? {
            key: 'accessibility',
            value: { ...this.accessibility(), label: value },
          }
        : { key: 'label', value },
    );
  }
}
