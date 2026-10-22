import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { fieldSchema, keysAt, rowValue } from '../../domain/row-values';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
  imports: [
    SelectControl,
    ButtonDirective,
    InputTextModule,
    FormsModule,
    LocalizePipe,
  ],
  templateUrl: './choice-control.html',
  styleUrl: './choice-control.scss',
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
  readonly required = input(false);
  readonly edit = output<FieldEdit>();
  readonly locale = inject(Locale);
  private readonly optionsApi = inject(RUNTIME_OPTIONS);
  private definitionIdentity: object | undefined;
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
  readonly searchOpen = signal(false);
  readonly statusMessage = computed(() => {
    if (this.optionState() === 'loading') {
      return 'Loading…';
    }
    if (this.optionState() === 'error') {
      return 'The service is unavailable.';
    }
    const state = this.options()?.state;
    return state === 'BLOCKED'
      ? 'Complete the dependent fields first'
      : state === 'EMPTY'
        ? 'No options'
        : state === 'CLIENT_FETCH'
          ? 'This option source is not supported'
          : '';
  });
  readonly page = signal(1);
  private readonly reload = signal(0);
  readonly multiple = computed(
    () =>
      (Array.isArray(this.schema()['type'])
        ? (this.schema()['type'] as readonly string[]).includes('array')
        : this.schema()['type'] === 'array') ||
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
  readonly membershipChecked = computed(
    () =>
      this.optionState() === 'ready' &&
      ['READY', 'EMPTY'].includes(this.options()?.state ?? ''),
  );
  choose(value: string | string[]): void {
    if (this.optionState() !== 'ready') {
      return;
    }
    const available =
      this.options()?.state === 'READY'
        ? this.options()!.items.map((option) => option.key)
        : [];
    const allowed = new Set([
      ...available,
      ...(this.multiple() ? this.selectedKeys() : []),
    ]);
    const keys = Array.isArray(value) ? value : [value];
    if (keys.some((key) => !allowed.has(key))) {
      return;
    }
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
    inject(DestroyRef).onDestroy(() => {
      this.coordinator.close();
      this.options.set(null);
    });
    effect((onCleanup) => {
      const definition = this.optionsApi.definitionIdentity?.();
      if (definition !== this.definitionIdentity) {
        this.definitionIdentity = definition;
        this.coordinator.reset();
      }
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
              this.options.set(null);
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
  missingLabel(key: string): string {
    const value = decodeChoice(key);
    if (
      typeof value === 'string' &&
      ['user', 'group'].includes(this.node().component)
    ) {
      return this.locale.text('Selection unavailable');
    }
    return typeof value === 'boolean'
      ? this.locale.text(value ? 'Yes' : 'No')
      : typeof value === 'number'
        ? this.locale.number(value)
        : String(value);
  }
  reloadOptions(): void {
    this.coordinator.reset();
    this.reload.update((value) => value + 1);
  }
}
