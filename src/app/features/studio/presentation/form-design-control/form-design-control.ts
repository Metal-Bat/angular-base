import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../../shared/domain/json-value';
import { FormDesignDetail } from '../form-design-detail/form-design-detail';
import { textareaRows } from '../../../forms/domain/presentation-rows';
@Component({
  selector: 'app-form-design-control',
  imports: [LocalizePipe, FormDesignDetail],
  template: `
    <span
      aria-hidden="true"
      [attr.data-design-kind]="kind()"
      [class.compact]="presentation()['renderer'] === 'compact'"
    >
      @if (detailed()) {
        <app-form-design-detail
          [childLabels]="childLabels()"
          [kind]="kind()"
          [label]="label()"
          [options]="options()"
          [type]="type()"
        />
      } @else {
        <span
          class="field-shape"
          [class.multiline]="kind() === 'textarea'"
          [style.min-block-size]="
            kind() === 'textarea' ? rows() * 1.5 + 1 + 'rem' : null
          "
        >
          @if (kind() === 'boolean') {
            <span>{{ 'Not provided' | localize }}</span
            ><i class="pi pi-chevron-down"></i>
          } @else if (choice()) {
            <span>{{
              (kind() === 'choice' ? 'Choose a value' : 'Search') | localize
            }}</span
            ><i class="pi pi-chevron-down"></i>
          } @else if (numeric()) {
            <span class="design-number">{{
              kind() === 'integer' ? '0' : '0.00'
            }}</span
            ><i class="pi pi-sort-alt"></i>
          } @else if (temporal()) {
            <span>{{
              (kind() === 'date' ? 'Date' : 'Date and time') | localize
            }}</span
            ><i class="pi pi-calendar"></i>
          } @else {
            <span class="design-placeholder">{{
              options()['placeholder'] ?? ''
            }}</span>
          }
        </span>
        @if (kind() === 'boolean') {
          <span class="choice-labels"
            ><span>{{ 'Yes' | localize }}</span
            ><span>{{ 'No' | localize }}</span></span
          >
        }
        @if (choices().length) {
          <span class="choice-labels">
            @for (choice of choices().slice(0, 6); track $index) {
              <span>{{ choice }}</span>
            }
            @if (choices().length > 6) {
              <span>+{{ choices().length - 6 }}</span>
            }
          </span>
        }
      }
    </span>
  `,
  styles: `
    :host {
      display: block;
      pointer-events: none;
      min-inline-size: 0;
    }
    .field-shape {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.65rem;
      border: 1px solid var(--console-input-border);
      border-radius: 0.5rem;
      color: var(--console-muted);
      min-block-size: 2.5rem;
      justify-content: space-between;
    }
    .multiline {
      min-block-size: 7rem;
      align-items: start;
    }
    .compact .field-shape {
      padding: 0.4rem;
    }
    .design-number {
      margin-inline-end: auto;
    }
    .design-placeholder {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .choice-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding-block-start: 0.5rem;
    }
    .choice-labels > span {
      border: 1px solid var(--console-border);
      border-radius: 0.35rem;
      padding: 0.2rem 0.5rem;
      font-size: 0.875rem;
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDesignControl {
  readonly kind = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input.required<string>();
  readonly presentation = input<JsonObject>({});
  readonly schema = input<JsonObject>({});
  readonly childLabels = input<readonly string[]>([]);
  readonly options = computed(
    () => (this.presentation()['options'] ?? {}) as JsonObject,
  );
  readonly rows = computed(() => textareaRows(this.options()));
  readonly detailed = computed(() =>
    [
      'action',
      'attachment_collection',
      'calculated',
      'display',
      'grid',
      'horizontal',
      'media',
      'repeater',
      'table',
      'vertical',
    ].includes(this.kind()),
  );
  readonly choice = computed(() =>
    ['choice', 'user', 'group'].includes(this.kind()),
  );
  readonly numeric = computed(() =>
    ['integer', 'number'].includes(this.kind()),
  );
  readonly temporal = computed(() =>
    ['date', 'datetime'].includes(this.kind()),
  );
  readonly choices = computed(() => {
    if (this.kind() !== 'choice') {
      return [];
    }
    const display = this.presentation();
    const localized = (display['localized_options'] ?? []) as JsonObject[];
    const source = (display['source'] ?? {}) as JsonObject;
    const schema =
      this.options()['multiple'] === true
        ? ((this.schema()['items'] ?? {}) as JsonObject)
        : this.schema();
    const items =
      source['kind'] === 'custom'
        ? source['items']
        : (schema['enum'] ?? schema['oneOf']);
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => {
      const object =
        item && typeof item === 'object' && !Array.isArray(item)
          ? (item as JsonObject)
          : null;
      const key = object ? (object['key'] ?? object['const']) : item;
      const translated = localized.find((option) => option['value'] === key)?.[
        'label'
      ];
      return String(
        translated ??
          (object ? (object['value'] ?? object['title'] ?? key) : item),
      );
    });
  });
}
