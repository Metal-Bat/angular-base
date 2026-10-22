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
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormMessageCatalog } from '../form-message-catalog/form-message-catalog';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  JsonObject,
  JsonValue,
  RenderNode,
} from '../../../forms/domain/runtime-document';
import { ActorState } from '../../../../core/auth/actor-state';
import { FormPages } from '../form-pages/form-pages';
import { presentationOutline } from '../form-selection-label';
import { renderOf } from '../../domain/form-editing';
import { translateMessage } from '../../domain/form-localization';
import {
  MessageSummary,
  summarizeMessages,
} from '../../domain/form-message-summary';
import { changeFormOutcome } from '../../domain/form-outcomes';
@Component({
  selector: 'app-form-settings',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    FormMessageCatalog,
    FormPages,
    LocalizePipe,
  ],
  templateUrl: './form-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSettings {
  readonly documents = input.required<JsonObject>();
  private readonly pageEditor = viewChild(FormPages);
  editPage(key: string): void {
    const editor = this.pageEditor();
    const page = editor?.pages()?.find((candidate) => candidate.key === key);
    if (page) {
      editor!.edit(page);
    }
  }
  readonly disabled = input(false);
  readonly blocked = input(false);
  readonly context = input(0);
  readonly mode = input<'languages' | 'settings'>('languages');
  /** Existing producer page_settings.pages contract; see the scoped form-pages handoff. */
  readonly pageAuthoring = input(true);
  readonly resolvedRender = input<RenderNode | null>(null);
  readonly pagePending = signal(false);
  readonly applied = output<JsonObject>();
  readonly changed = output<void>();
  readonly discarded = output<void>();
  readonly sample = output<JsonObject>();
  readonly synthetic = signal<JsonObject>({});
  readonly schema = computed(
    () => this.documents()['data_schema'] as JsonObject,
  );
  readonly fields = computed(() =>
    presentationOutline(
      renderOf(this.documents()),
      this.resolvedRender(),
    ).filter((item) => item.scope),
  );
  readonly messages = signal<MessageSummary[]>([]);
  readonly outcomes = computed(() => {
    const values = renderOf(this.documents())['outcomes'];
    return Array.isArray(values)
      ? values.filter((value): value is string => typeof value === 'string')
      : [];
  });
  outcome = '';
  key = '';
  en = '';
  fa = '';
  ar = '';
  readonly error = signal('');
  readonly busy = signal(false);
  private generation = 0;
  private editedKey = '';
  translationPending(): boolean {
    const catalogs = ((this.documents()['localization'] ?? {}) as JsonObject)[
      'catalogs'
    ] as JsonObject | undefined;
    return (
      this.key !== this.editedKey ||
      (['en', 'fa', 'ar'] as const).some((locale) => {
        const entry = (catalogs?.[locale] as JsonObject | undefined)?.[
          this.editedKey
        ] as JsonObject | undefined;
        return this[locale] !== (entry?.['text'] ?? '');
      })
    );
  }
  discardTranslation(): void {
    if (this.disabled() || this.blocked() || this.busy()) {
      return;
    }
    this.key = this.en = this.fa = this.ar = this.editedKey = '';
    this.error.set('');
    if (!this.outcome && !this.pagePending()) {
      this.discarded.emit();
    }
  }
  constructor() {
    effect(() => {
      this.context();
      untracked(() => this.clearEditorBuffers());
    });
    effect((onCleanup) => {
      this.context();
      const documents = this.documents();
      const generation = this.generation;
      let active = true;
      this.messages.set([]);
      void summarizeMessages(documents)
        .then((messages) => {
          if (active && generation === this.generation) {
            this.messages.set(messages);
          }
        })
        .catch((): void => {
          if (active && generation === this.generation) {
            this.error.set('The service is unavailable.');
          }
        });
      onCleanup((): void => {
        active = false;
      });
    });
    const release = inject(ActorState).register(() => {
      this.clearEditorBuffers();
      this.messages.set([]);
      this.synthetic.set({});
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
  }
  private clearEditorBuffers(): void {
    this.generation++;
    this.editedKey = this.key = this.en = this.fa = this.ar = this.outcome = '';
    this.pagePending.set(false);
    this.error.set('');
    this.busy.set(false);
  }
  applyOutcome(value = this.outcome, remove = false): void {
    if (
      this.disabled() ||
      this.blocked() ||
      this.busy() ||
      this.translationPending() ||
      this.pagePending()
    ) {
      return;
    }
    try {
      this.applied.emit(changeFormOutcome(this.documents(), value, remove));
      this.outcome = '';
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
    }
  }
  discardOutcome(): void {
    if (this.disabled() || this.blocked() || this.busy()) {
      return;
    }
    this.outcome = '';
    if (!this.translationPending() && !this.pagePending()) {
      this.discarded.emit();
    }
  }
  editMessage(key: string): void {
    if (this.disabled() || this.blocked() || this.busy()) {
      return;
    }
    if (this.translationPending()) {
      this.error.set(
        'Apply or discard translation edits before opening another translation.',
      );
      return;
    }
    const catalogs = ((this.documents()['localization'] ?? {}) as JsonObject)[
      'catalogs'
    ] as JsonObject | undefined;
    const english = (catalogs?.['en'] as JsonObject | undefined)?.[key] as
      JsonObject | undefined;
    const persian = (catalogs?.['fa'] as JsonObject | undefined)?.[key] as
      JsonObject | undefined;
    const arabic = (catalogs?.['ar'] as JsonObject | undefined)?.[key] as
      JsonObject | undefined;
    const message = {
      en: english?.['text'],
      fa: persian?.['text'],
      ar: arabic?.['text'],
    };
    if (
      [english, persian, arabic].some(
        (entry) =>
          entry &&
          (typeof entry['text'] !== 'string' ||
            Object.keys((entry['parameters'] ?? {}) as JsonObject).length > 0),
      )
    ) {
      this.error.set(
        'Parameterized messages require their existing contract editor',
      );
      return;
    }
    this.key = key;
    this.editedKey = key;
    this.en = typeof message.en === 'string' ? message.en : '';
    this.fa = typeof message.fa === 'string' ? message.fa : '';
    this.ar = typeof message.ar === 'string' ? message.ar : '';
    this.error.set('');
  }
  async applyTranslation(): Promise<void> {
    if (
      this.disabled() ||
      this.blocked() ||
      this.busy() ||
      this.outcome ||
      this.pagePending()
    ) {
      return;
    }
    const generation = this.generation;
    const document = this.documents();
    const translationDraft = {
      key: this.key,
      en: this.en,
      fa: this.fa,
      ar: this.ar,
    };
    this.busy.set(true);
    try {
      const next = await translateMessage(
        document,
        translationDraft.key,
        translationDraft.en,
        translationDraft.fa,
        translationDraft.ar || undefined,
      );
      if (
        generation === this.generation &&
        this.documents() === document &&
        this.key === translationDraft.key &&
        this.en === translationDraft.en &&
        this.fa === translationDraft.fa &&
        this.ar === translationDraft.ar &&
        !this.disabled() &&
        !this.blocked()
      ) {
        this.applied.emit(next);
        this.editedKey = translationDraft.key;
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
  discardPages(): void {
    this.pagePending.set(false);
    if (!this.translationPending() && !this.outcome) {
      this.discarded.emit();
    }
  }
  setSample(value: JsonValue | undefined): void {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      this.synthetic.set(value as JsonObject);
      this.sample.emit(value as JsonObject);
    }
  }
}
