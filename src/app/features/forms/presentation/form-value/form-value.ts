import { localizedDateTime } from '../../../../shared/ui/localized-datetime-pipe';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Locale } from '../../../../core/localization/locale';
import { fieldLabel } from '../../../../shared/domain/field-label';
import { MISSING } from '../../domain/canonical-values';
import { JsonValue } from '../../domain/runtime-document';

type ValueNode = {
  label: string;
  translateLabel?: boolean;
  translate?: boolean;
  text: string;
  children: readonly ValueNode[];
};
@Component({
  selector: 'app-form-value',
  imports: [NgTemplateOutlet, LocalizePipe],
  templateUrl: './form-value.html',
  styleUrl: './form-value.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormValue {
  readonly value = input.required<JsonValue | typeof MISSING>();
  readonly scope = input('');
  readonly kinds = input<Readonly<Record<string, string>>>({});
  readonly labels = input<Readonly<Record<string, string>>>({});
  private readonly locale = inject(Locale);
  readonly tree = computed(() => this.present(this.value(), this.scope(), ''));
  private present(
    value: JsonValue | typeof MISSING,
    scope: string,
    label: string,
  ): ValueNode {
    const kind = this.kinds()[scope];
    if (
      value !== MISSING &&
      value !== null &&
      ['user', 'group', 'media', 'attachment_collection'].includes(kind)
    ) {
      return {
        label,
        translate: true,
        text:
          Array.isArray(value) && !value.length
            ? 'Empty list'
            : value === ''
              ? 'Empty text'
              : 'Selected resource',
        children: Array.isArray(value)
          ? value.map((_, index) => ({
              label: this.locale.number(index + 1),
              text:
                kind === 'attachment_collection'
                  ? 'Attachment'
                  : 'Selected resource',
              translate: true,
              children: [],
            }))
          : [],
      };
    }
    const temporal = this.temporal(value, kind);
    if (temporal !== null) {
      return { label, children: [], text: temporal };
    }
    if (value !== null && typeof value === 'object') {
      const array = Array.isArray(value);
      return {
        label,
        text: array ? 'Empty list' : 'Empty object',
        translate: true,
        children: Object.entries(value).map(([key, child]) => {
          const childScope =
            scope +
            (array
              ? '/items'
              : '/properties/' +
                key.replaceAll('~', '~0').replaceAll('/', '~1'));
          const presented = this.present(
            child,
            childScope,
            array
              ? this.locale.number(Number(key) + 1)
              : (this.labels()[childScope] ?? fieldLabel(key)),
          );
          return {
            ...presented,
            translateLabel: !array && !this.labels()[childScope],
          };
        }),
      };
    }
    return {
      label,
      children: [],
      translate:
        value === MISSING || value === null || typeof value === 'boolean',
      text:
        value === MISSING
          ? 'Not provided'
          : value === null
            ? 'Null'
            : value === true
              ? 'Yes'
              : value === false
                ? 'No'
                : String(value),
    };
  }
  private temporal(
    value: JsonValue | typeof MISSING,
    kind: string,
  ): string | null {
    if (typeof value !== 'string' || !['date', 'datetime'].includes(kind)) {
      return null;
    }
    const instant = new Date(kind === 'date' ? value + 'T00:00:00Z' : value);
    if (!Number.isFinite(instant.getTime())) {
      return null;
    }
    return kind === 'date'
      ? this.locale.date(instant, 'UTC')
      : localizedDateTime(this.locale, value);
  }
}
