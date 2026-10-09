import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { ActorState } from '../../../../core/auth/actor-state';
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';
import { outline } from '../../domain/form-authoring';
import { renderOf } from '../../domain/form-editing';
import { translateMessage } from '../../domain/form-localization';
@Component({
  selector: 'app-form-settings',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    LocalizePipe,
    SchemaInput,
  ],
  templateUrl: './form-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSettings {
  readonly documents = input.required<JsonObject>();
  readonly disabled = input(false);
  /** Enabled only for development fixtures until page-settings semantics are frozen. */
  readonly pageAuthoring = input(false);
  readonly applied = output<JsonObject>();
  readonly changed = output<void>();
  readonly sample = output<JsonObject>();
  readonly synthetic = signal<JsonObject>({});
  readonly schema = computed(
    () => this.documents()['data_schema'] as JsonObject,
  );
  readonly fields = computed(() =>
    outline(renderOf(this.documents())).filter((item) => item.scope),
  );
  readonly pages = computed(
    () =>
      (((this.documents()['page_settings'] ?? {}) as JsonObject)['pages'] ??
        []) as JsonObject[],
  );
  readonly messages = computed(() => {
    const catalogs = (((this.documents()['localization'] ?? {}) as JsonObject)[
      'catalogs'
    ] ?? {}) as JsonObject;
    const en = (catalogs['en'] ?? {}) as JsonObject;
    const fa = (catalogs['fa'] ?? {}) as JsonObject;
    return [...new Set([...Object.keys(en), ...Object.keys(fa)])].map(
      (key) => ({
        key,
        en:
          typeof (en[key] as JsonObject | undefined)?.['text'] === 'string'
            ? (en[key] as JsonObject)['text']
            : 'Contract editor required',
        fa:
          typeof (fa[key] as JsonObject | undefined)?.['text'] === 'string'
            ? (fa[key] as JsonObject)['text']
            : 'Contract editor required',
      }),
    );
  });
  key = '';
  en = '';
  fa = '';
  pageKey = '';
  pageTitle = '';
  selectedScopes: string[] = [];
  readonly error = signal('');
  readonly busy = signal(false);
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.key = '';
      this.en = '';
      this.fa = '';
      this.selectedScopes = [];
      this.pageKey = '';
      this.pageTitle = '';
      this.synthetic.set({});
      this.error.set('');
      this.busy.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
  }
  editMessage(key: string): void {
    if (this.disabled()) {
      return;
    }
    const catalogs = ((this.documents()['localization'] ?? {}) as JsonObject)[
      'catalogs'
    ] as JsonObject | undefined;
    const english = (catalogs?.['en'] as JsonObject | undefined)?.[key] as
      JsonObject | undefined;
    const persian = (catalogs?.['fa'] as JsonObject | undefined)?.[key] as
      JsonObject | undefined;
    const message = { en: english?.['text'], fa: persian?.['text'] };
    if (typeof message?.en !== 'string' || typeof message.fa !== 'string') {
      this.error.set(
        'Parameterized messages require their existing contract editor',
      );
      return;
    }
    this.key = key;
    this.en = message.en;
    this.fa = message.fa;
  }
  async applyTranslation(): Promise<void> {
    if (this.disabled() || this.busy()) {
      return;
    }
    const generation = this.generation;
    const document = this.documents();
    this.busy.set(true);
    try {
      const next = await translateMessage(document, this.key, this.en, this.fa);
      if (generation === this.generation && this.documents() === document) {
        this.applied.emit(next);
        this.error.set('');
      }
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(
          error instanceof Error ? error.message : 'Invalid translation',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  toggle(scope: string, selected: boolean): void {
    if (
      this.disabled() ||
      !this.fields().some((item) => item.scope === scope)
    ) {
      return;
    }
    this.changed.emit();
    this.selectedScopes = selected
      ? [...new Set([...this.selectedScopes, scope])]
      : this.selectedScopes.filter((item) => item !== scope);
  }
  addPage(): void {
    if (
      this.disabled() ||
      !this.pageAuthoring() ||
      !/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(this.pageKey) ||
      !this.pageTitle.trim() ||
      this.pageTitle.length > 255 ||
      this.selectedScopes.some(
        (scope) => !this.fields().some((item) => item.scope === scope),
      ) ||
      this.pages().length >= 32 ||
      this.pages().some((page) => page['key'] === this.pageKey)
    ) {
      this.error.set('Use a unique page key and title');
      return;
    }
    const pages = [
      ...this.pages(),
      {
        key: this.pageKey,
        title: this.pageTitle,
        scopes: [...this.selectedScopes],
      },
    ];
    this.applied.emit({
      ...this.documents(),
      page_settings: {
        ...((this.documents()['page_settings'] ?? {}) as JsonObject),
        pages,
      },
    });
    this.error.set('');
    this.pageKey = '';
    this.pageTitle = '';
    this.selectedScopes = [];
  }
  setSample(value: JsonValue | undefined): void {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      this.synthetic.set(value as JsonObject);
      this.sample.emit(value as JsonObject);
    }
  }
}
