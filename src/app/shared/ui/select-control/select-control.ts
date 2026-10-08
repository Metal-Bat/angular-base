import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Select, SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';

/** Shares PrimeNG dropdown behavior while preserving projected, translated options. */
@Component({
  selector: 'app-select-control',
  imports: [FormsModule, SelectModule, MultiSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectControl),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex; min-width:0; max-width:100%' },
  template: `
    <select #source aria-hidden="true" hidden tabindex="-1">
      <ng-content />
    </select>
    @if (multiple()) {
      <p-multiselect
        appendTo="body"
        optionDisabled="disabled"
        optionLabel="label"
        optionValue="value"
        scrollHeight="20rem"
        [ariaLabel]="label()"
        [disabled]="disabled() || formDisabled()"
        [inputId]="inputId()"
        [invalid]="invalid() === true || invalid() === 'true'"
        [ngModel]="value() === undefined ? model() : value()"
        [ngModelOptions]="{ standalone: true }"
        [options]="options()"
        [required]="required()"
        [style]="{
          width: '100%',
          minHeight: 'var(--workspace-control-height, 2.5rem)',
          height: 'var(--workspace-control-height, 2.5rem)',
        }"
        (ngModelChange)="choose($event)"
        (onBlur)="touched()"
      />
    } @else {
      <p-select
        #dropdown
        appendTo="body"
        optionDisabled="disabled"
        optionLabel="label"
        optionValue="value"
        scrollHeight="20rem"
        [ariaLabel]="label()"
        [checkmark]="true"
        [disabled]="disabled() || formDisabled()"
        [inputId]="inputId()"
        [invalid]="invalid() === true || invalid() === 'true'"
        [ngModel]="value() === undefined ? model() : value()"
        [ngModelOptions]="{ standalone: true }"
        [options]="options()"
        [pt]="{ label: { 'aria-describedby': describedBy() } }"
        [required]="required()"
        [style]="{
          width: '100%',
          minHeight: 'var(--workspace-control-height, 2.5rem)',
          height: 'var(--workspace-control-height, 2.5rem)',
        }"
        (ngModelChange)="choose($event)"
        (onBlur)="touched()"
      />
    }
  `,
})
export class SelectControl implements ControlValueAccessor {
  readonly inputId = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly value = input<unknown>(undefined);
  readonly invalid = input<boolean | string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly selectionChanged = output<{ target: { value: unknown } }>();
  readonly options = signal<
    { label: string; value: string; disabled: boolean }[]
  >([]);
  readonly model = signal<unknown>('');
  readonly formDisabled = signal(false);
  private readonly sourceLabel = signal('');
  readonly label = computed(() => this.ariaLabel() ?? this.sourceLabel());
  private readonly source =
    viewChild.required<ElementRef<HTMLSelectElement>>('source');
  private readonly dropdown = viewChild(Select);
  private onChange: (value: unknown) => void = () => undefined;
  touched: () => void = () => undefined;
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const source = this.source().nativeElement;
      const refresh = (): void => {
        this.options.set(
          Array.from(source.options, (option) => ({
            label: option.textContent?.trim() ?? '',
            value: option.value,
            disabled: option.disabled,
          })),
        );
        const label = source.ownerDocument.querySelector<HTMLLabelElement>(
          'label[for="' + this.inputId() + '"]',
        );
        this.sourceLabel.set(label?.textContent?.trim() ?? this.inputId());
      };
      refresh();
      const observer = new MutationObserver(refresh);
      observer.observe(source, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
      destroy.onDestroy(() => observer.disconnect());
    });
  }
  focus(): void {
    this.dropdown()?.focus();
  }
  writeValue(value: unknown): void {
    this.model.set(value);
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
  choose(value: unknown): void {
    this.model.set(value);
    this.onChange(value);
    this.selectionChanged.emit({ target: { value } });
  }
}
