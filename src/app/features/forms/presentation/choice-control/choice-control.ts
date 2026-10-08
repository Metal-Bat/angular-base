import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import { fieldSchema, keysAt, rowValue } from '../../domain/row-values';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { RUNTIME_OPTIONS } from '../../bindings';
import { OptionCoordinator, OptionPage } from '../../domain/option-coordinator';
import {
  decodeChoice,
  displayValue,
  encodeChoice,
  FieldEdit,
  MISSING,
} from '../../domain/canonical-values';
import {
  JsonObject,
  JsonValue,
  RenderNode,
  RuntimeDocument,
} from '../../domain/runtime-document';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-choice-control',
  imports: [SelectControl, ButtonDirective, FormsModule, LocalizePipe],
  templateUrl: './choice-control.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceControl {
  readonly node = input.required<RenderNode>();
  readonly document = input.required<RuntimeDocument>();
  readonly data = input.required<JsonObject>();
  readonly path = input.required<string>();
  readonly controlId = input.required<string>();
  readonly describedBy = input<string | null>(null);
  readonly indices = input<readonly number[]>([]);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly edit = output<FieldEdit>();
  readonly locale = inject(Locale);
  private readonly optionsApi = inject(RUNTIME_OPTIONS);
  readonly value = computed(() =>
    this.node().scope
      ? rowValue(this.data(), this.node().scope!, this.indices())
      : MISSING,
  );
  readonly text = computed(() => displayValue(this.value()));
  readonly schema = computed(() =>
    this.node().scope ? fieldSchema(this.document(), this.node().scope!) : {},
  );
  set(value: JsonValue): void {
    if (!this.disabled() && this.node().scope) {
      this.edit.emit({
        scope: this.node().scope!,
        value,
        ...(this.indices().length
          ? {
              indices: this.indices(),
              rowKeys: keysAt(
                this.document(),
                this.node().scope!,
                this.indices(),
              ),
            }
          : {}),
      });
    }
  }
  readonly optionState = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
  readonly options = signal<OptionPage | null>(null);
  readonly search = signal('');
  readonly page = signal(1);
  private readonly reload = signal(0);
  readonly multiple = computed(
    () =>
      this.schema()['type'] === 'array' ||
      (this.node().display['options'] as JsonObject | undefined)?.[
        'multiple'
      ] === true,
  );
  readonly selectedKeys = computed(() => {
    const value = this.value();
    if (value === MISSING || value === null) {
      return [];
    }
    return (Array.isArray(value) ? value : [value]).map(
      (item) =>
        this.options()?.items.find(
          (option) =>
            JSON.stringify(decodeChoice(option.key)) === JSON.stringify(item),
        )?.key ?? encodeChoice(item),
    );
  });
  readonly selected = computed(() => this.selectedKeys()[0] ?? '');
  readonly missingOptions = computed(() =>
    this.selectedKeys().filter(
      (key) => !this.options()?.items.some((option) => option.key === key),
    ),
  );
  choose(value: string | string[]): void {
    if (Array.isArray(value)) {
      this.set(value.map(decodeChoice));
    } else if (value) {
      this.set(decodeChoice(value));
    }
  }
  private readonly coordinator = new OptionCoordinator(
    (queryInput, generation, abortSignal) =>
      this.optionsApi.query(
        this.document(),
        this.path(),
        queryInput,
        generation,
        abortSignal,
      ),
  );
  constructor() {
    effect((onCleanup) => {
      if (this.disabled()) {
        return;
      }
      this.reload();
      const value = this.value();
      const queryInput = {
        data: this.data(),
        indices: this.indices(),
        locale: this.locale.contentLanguage(),
        search: this.search(),
        page: this.page(),
        selected:
          value === MISSING || value === null
            ? []
            : (Array.isArray(value) ? value : [value]).map(encodeChoice),
      };
      this.optionState.set('loading');
      this.options.set(null);
      let active = true;
      const timer = setTimeout((): void => {
        void this.coordinator
          .load(queryInput)
          .then((result) => {
            if (active && result) {
              this.options.set(result);
              this.optionState.set('ready');
            }
          })
          .catch((): void => {
            if (active) {
              this.optionState.set('error');
            }
          });
      }, 200);
      onCleanup((): void => {
        active = false;
        clearTimeout(timer);
        this.coordinator.close();
      });
    });
  }
  reloadOptions(): void {
    this.coordinator.reset();
    this.reload.update((value) => value + 1);
  }
}
