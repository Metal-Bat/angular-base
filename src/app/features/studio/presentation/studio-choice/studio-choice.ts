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
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { STUDIO_API } from '../../bindings';
import {
  referenceChoice,
  ReferenceChoice,
} from '../../../../shared/domain/reference-choice';
import { JsonObject } from '../../../forms/domain/runtime-document';
@Component({
  selector: 'app-studio-choice',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './studio-choice.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioChoice {
  readonly kind = input.required<string>();
  readonly controlId = input.required<string>();
  readonly value = input<string>('');
  readonly disabled = input(false);
  readonly context = input<JsonObject>({});
  readonly picked = output<string>();
  readonly fallback = computed(
    () => this.value() && !this.rows().some((row) => row.key === this.value()),
  );
  readonly selected = signal<{ key: string; label: string } | null>(null);
  private selectionGeneration = 0;
  readonly rows = signal<readonly ReferenceChoice[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly search = signal('');
  readonly connectionKind = signal('');
  readonly page = signal(1);
  readonly pages = signal(0);
  private generation = 0;
  private abort = new AbortController();
  private summaryAbort = new AbortController();
  private searchTimer?: ReturnType<typeof setTimeout>;
  private applied: {
    query: JsonObject;
    context: JsonObject;
    kind: string;
  } | null = null;
  private readonly api = inject(STUDIO_API);
  private readonly locale = inject(Locale);
  constructor() {
    effect(() => {
      this.kind();
      this.context();
      this.connectionKind();
      this.locale.language();
      this.disabled();
      this.reset();
    });
    effect(() => {
      const value = this.value();
      const kind = this.kind();
      this.context();
      this.locale.language();
      untracked(() => void this.restore(value, kind));
    });
    const release = inject(ActorState).register(() => {
      this.selectionGeneration++;
      this.summaryAbort.abort();
      this.selected.set(null);
      this.reset();
    });
    inject(DestroyRef).onDestroy(() => {
      this.selectionGeneration++;
      this.summaryAbort.abort();
      this.selected.set(null);
      this.reset();
      release();
    });
  }
  reset(): void {
    this.generation++;
    this.abort.abort();
    this.abort = new AbortController();
    clearTimeout(this.searchTimer);
    this.applied = null;
    this.rows.set([]);
    this.error.set('');
    this.search.set('');
    this.page.set(1);
    this.pages.set(0);
    this.busy.set(false);
  }
  scheduleSearch(value: string): void {
    this.search.set(value.slice(0, 100));
    this.generation++;
    this.abort.abort();
    this.rows.set([]);
    this.applied = null;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.load(), 250);
  }
  async load(page = 1): Promise<void> {
    if (this.disabled()) {
      return;
    }
    const generation = ++this.generation;
    this.abort.abort();
    this.abort = new AbortController();
    clearTimeout(this.searchTimer);
    const request = {
      kind: this.kind(),
      query: { page, size: 20, search: this.search().trim() || null },
      context: {
        ...this.context(),
        ...(this.kind() === 'connections'
          ? { kind: this.context()['kind'] ?? this.connectionKind() }
          : {}),
        locale: this.locale.contentLanguage(),
      },
    };
    this.busy.set(true);
    this.error.set('');
    this.rows.set([]);
    this.applied = null;
    try {
      const response = await this.api.choices(
        request.kind,
        request.query,
        request.context,
        this.abort.signal,
      );
      if (generation !== this.generation || this.disabled()) {
        return;
      }
      this.rows.set(response.items.map(referenceChoice));
      this.applied = request;
      this.page.set(page);
      this.pages.set(response.totalPages);
    } catch {
      if (generation === this.generation) {
        this.error.set('Reference search failed. Retry or reload.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  private async summary(
    value: string,
    kind: string,
    abort: AbortSignal,
  ): Promise<{ key: string; label: string }> {
    const response = await this.api.auxiliary(
      'selected',
      {
        resources: [{ kind, ref_id: value }],
      },
      undefined,
      abort,
    );
    if (!Array.isArray(response) || response.length !== 1) {
      throw Error('Unavailable selection');
    }
    const row = response[0] as Record<string, unknown>;
    if (
      row['available'] !== true ||
      typeof row['ref_id'] !== 'string' ||
      typeof row['label'] !== 'string' ||
      row['kind'] !== kind
    ) {
      throw Error('Unavailable selection');
    }
    return {
      key: row['ref_id'],
      label:
        row['label'] +
        (typeof row['number'] === 'number' ? ' · ' + row['number'] : ''),
    };
  }
  private async restore(value: string, kind: string): Promise<void> {
    const generation = ++this.selectionGeneration;
    this.summaryAbort.abort();
    this.summaryAbort = new AbortController();
    this.selected.set(null);
    if (!value) {
      return;
    }
    try {
      const row = await this.summary(value, kind, this.summaryAbort.signal);
      if (generation === this.selectionGeneration) {
        this.selected.set(row);
      }
    } catch {
      if (generation === this.selectionGeneration) {
        this.error.set('The selected resource is unavailable. Choose again.');
      }
    }
  }
  async choose(value: string): Promise<void> {
    if (this.disabled()) {
      return;
    }
    if (!value) {
      this.reset();
      this.selectionGeneration++;
      this.summaryAbort.abort();
      this.selected.set(null);
      this.picked.emit('');
      return;
    }
    const request = this.applied;
    if (
      this.busy() ||
      !request ||
      !this.rows().some((row) => row.key === value)
    ) {
      return;
    }
    const generation = ++this.generation;
    this.abort.abort();
    this.abort = new AbortController();
    this.busy.set(true);
    this.error.set('');
    try {
      // Recheck the exact query and parent constraints before refreshing its key.
      const page = await this.api.choices(
        request.kind,
        structuredClone(request.query),
        structuredClone(request.context),
        this.abort.signal,
      );
      if (generation !== this.generation || this.disabled()) {
        return;
      }
      if (!page.items.map(referenceChoice).some((row) => row.key === value)) {
        throw Error('Selection changed');
      }
      const current = await this.summary(
        value,
        request.kind,
        this.abort.signal,
      );
      if (generation === this.generation && !this.disabled()) {
        this.picked.emit(current.key);
      }
    } catch {
      if (generation === this.generation) {
        this.rows.set([]);
        this.selected.set(null);
        this.error.set('The selected resource is unavailable. Choose again.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
