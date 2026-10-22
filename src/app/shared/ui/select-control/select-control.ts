import { LocalizePipe } from '../localize-pipe';
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
import { MultiSelectEscape } from '../multiselect-escape';
import { SelectEscape } from '../select-escape';

/** Shares PrimeNG dropdown behavior while preserving projected, translated options. */
@Component({
  selector: 'app-select-control',
  imports: [
    LocalizePipe,
    FormsModule,
    SelectModule,
    MultiSelectModule,
    MultiSelectEscape,
    SelectEscape,
  ],
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
        #escape="appMultiSelectEscape"
        appMultiSelectEscape
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
        [overlayOptions]="escape.overlayOptions"
        [placeholder]="'Choose a value' | localize"
        [pt]="{
          option: optionAccessibility,
        }"
        [readonly]="escape.closing()"
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
        #escape="appSelectEscape"
        appSelectEscape
        appendTo="body"
        optionDisabled="disabled"
        optionLabel="label"
        optionValue="value"
        scrollHeight="20rem"
        [ariaFilterLabel]="filterLabel()"
        [ariaLabel]="label()"
        [checkmark]="true"
        [disabled]="disabled() || formDisabled() || escape.closing()"
        [emptyFilterMessage]="emptyFilterMessage()"
        [filter]="filter()"
        [filterPlaceholder]="filterLabel()"
        [inputId]="inputId()"
        [invalid]="invalid() === true || invalid() === 'true'"
        [ngModel]="value() === undefined ? model() : value()"
        [ngModelOptions]="{ standalone: true }"
        [options]="options()"
        [overlayOptions]="escape.overlayOptions"
        [pt]="{
          label: { 'aria-describedby': describedBy() },
          option: optionAccessibility,
        }"
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
  // PrimeNG 21 supplies item context at runtime, outside its generic PT declaration.
  readonly optionAccessibility = (
    options: unknown,
  ): { 'aria-disabled': boolean } => ({
    'aria-disabled':
      (options as { context?: { disabled?: boolean } }).context?.disabled ===
      true,
  });
  readonly inputId = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly filter = input(false, { transform: booleanAttribute });
  readonly filterLabel = input('');
  readonly emptyFilterMessage = input('');
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
      const refreshOptions = (): void => {
        this.options.set(
          Array.from(source.options, (option) => ({
            label: option.textContent?.trim() ?? '',
            value: option.value,
            disabled: option.disabled,
          })),
        );
      };
      const refreshLabel = (): void => {
        const label = source.ownerDocument.querySelector<HTMLLabelElement>(
          'label[for="' + this.inputId() + '"]',
        );
        const accessible = label?.cloneNode(true) as HTMLElement | undefined;
        accessible
          ?.querySelectorAll('[aria-hidden="true"]')
          .forEach((element) => element.remove());
        this.sourceLabel.set(
          accessible
            ? Array.from(accessible.childNodes)
                .filter((node) => node.nodeType === 1 || node.nodeType === 3)
                .map((node) => node.textContent?.trim())
                .filter(Boolean)
                .join(' ')
            : this.inputId(),
        );
      };
      refreshOptions();
      refreshLabel();
      const observer = new MutationObserver((records) => {
        if (records.some((record) => source.contains(record.target))) {
          refreshOptions();
        }
        refreshLabel();
      });
      const config = {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      };
      observer.observe(source, config);
      const label = source.ownerDocument.querySelector(
        'label[for="' + this.inputId() + '"]',
      );
      if (label) {
        observer.observe(label, config);
      }
      destroy.onDestroy(() => observer.disconnect());
    });
  }
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  focus(): void {
    if (this.multiple()) {
      this.host.nativeElement
        .querySelector<HTMLElement>('p-multiselect [role="combobox"]')
        ?.focus();
    } else {
      this.dropdown()?.focus();
    }
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
