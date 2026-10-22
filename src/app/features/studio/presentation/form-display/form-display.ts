import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { RuntimeOptionsPort } from '../../../forms/application/runtime-options-port';
import { FormCollectionEditor } from '../../../forms/application/form-resources';
import { FORM_COLLECTIONS, RUNTIME_OPTIONS } from '../../../forms/bindings';
import { FieldEdit } from '../../../forms/domain/canonical-values';
import { indicesFor, replaceRow } from '../../../forms/domain/row-values';
import {
  JsonObject,
  RuntimeDocument,
} from '../../../forms/domain/runtime-document';
import { RuntimeForm } from '../../../forms/presentation/runtime-form/runtime-form';
import { STUDIO_API } from '../../bindings';
import { formDocuments } from '../../domain/form-documents';
import { editSampleCollection } from '../../domain/sample-collections';

@Component({
  selector: 'app-form-display',
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    LocalizePipe,
    SelectControl,
    RuntimeForm,
  ],
  providers: [
    {
      provide: FORM_COLLECTIONS,
      useFactory: (): FormCollectionEditor => {
        const view = inject(FormDisplay);
        return {
          busy: () => view.busy(),
          collection: (...args) => view.editCollection(...args),
        };
      },
    },
    {
      provide: RUNTIME_OPTIONS,
      useFactory: (): RuntimeOptionsPort => {
        const view = inject(FormDisplay);
        return {
          query: (_document, pointer, query, generation, abort) =>
            view.api.options(
              formDocuments(view.current() ?? {}),
              pointer,
              query,
              generation,
              abort,
            ),
        };
      },
    },
  ],
  templateUrl: './form-display.html',
  styleUrl: './form-display.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDisplay {
  private readonly api = inject(STUDIO_API);
  readonly form = input('');
  readonly version = input('');
  readonly versions = signal<readonly JsonObject[]>([]);
  readonly current = signal<JsonObject | null>(null);
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly purpose = signal('edit');
  readonly locale = signal(inject(Locale).language());
  readonly runtime = signal<RuntimeDocument | null>(null);
  readonly data = signal<JsonObject>({});
  private identity: Record<string, readonly string[]> = {};
  readonly states = [
    { value: 'edit', label: 'Entry form' },
    { value: 'summary', label: 'Summary' },
    { value: 'print', label: 'Print view' },
    { value: 'correction', label: 'Correction' },
  ];
  readonly stateLabel = computed(
    () => this.states.find((state) => state.value === this.purpose())!.label,
  );
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    effect(() => {
      const form = this.form();
      const version = this.version();
      this.clear();
      if (version) {
        void this.show(version);
      } else if (form) {
        void this.loadVersions();
      }
    });
  }
  private clear(): void {
    this.identity = {};
    this.generation++;
    this.versions.set([]);
    this.current.set(null);
    this.runtime.set(null);
    this.data.set({});
    this.error.set('');
    this.busy.set(false);
    this.page.set(1);
    this.pages.set(0);
    this.purpose.set('edit');
  }
  async loadVersions(page = 1): Promise<void> {
    this.identity = {};
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.current.set(null);
    this.runtime.set(null);
    this.data.set({});
    try {
      const result = await this.api.search('form-versions', page, {
        form_ref_id: this.form(),
        size: 20,
        filters: [],
        sort_orders: [{ field_name: 'number', operation: 'desc' }],
      });
      if (generation !== this.generation) {
        return;
      }
      this.versions.set(result.items);
      this.page.set(result.page);
      this.pages.set(result.totalPages);
      if (result.items.length) {
        await this.show(String(result.items[0]['ref_id']));
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('Form versions are unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async show(reference: string): Promise<void> {
    this.identity = {};
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.current.set(null);
    this.runtime.set(null);
    this.data.set({});
    try {
      const row = await this.api.get('form-versions', reference);
      if (generation !== this.generation) {
        return;
      }
      this.current.set(row);
      this.versions.update((rows) =>
        rows.map((item) =>
          item['ref_id'] === reference ? { ...item, ...row } : item,
        ),
      );
      await this.refresh();
    } catch {
      if (generation === this.generation) {
        this.error.set('The form display is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async refresh(reset = false): Promise<void> {
    const row = this.current();
    if (!row) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.runtime.set(null);
    if (reset) {
      this.data.set({});
      this.identity = {};
    }
    try {
      const result = await this.api.preview(
        formDocuments(row),
        this.data(),
        this.purpose(),
        this.locale(),
        { item_identity: this.identity },
      );
      if (generation !== this.generation) {
        return;
      }
      if (result.status === 'ready') {
        this.runtime.set(result.document);
        this.data.set(result.document.canonical);
        this.identity = { ...result.document.rowIdentity };
      } else {
        this.error.set('Preview is incompatible');
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('The form display is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  editSample(change: FieldEdit): void {
    const document = this.runtime();
    if (
      this.busy() ||
      !document ||
      !['edit', 'correction'].includes(document.purpose)
    ) {
      return;
    }
    if (change.error) {
      this.error.set(change.error);
      return;
    }
    try {
      const indices = change.rowKeys
        ? indicesFor(document, change.scope, change.rowKeys)
        : (change.indices ?? []);
      if (indices === null) {
        return;
      }
      this.data.set(
        replaceRow(this.data(), change.scope, indices, change.value),
      );
    } catch {
      this.error.set('Sample change is unavailable');
    }
  }
  async editCollection(
    ...args: Parameters<FormCollectionEditor['collection']>
  ): Promise<void> {
    const document = this.runtime();
    const row = this.current();
    if (this.busy() || !document || !row) {
      return;
    }
    try {
      const result = editSampleCollection(
        document,
        this.data(),
        row['data_schema'] as JsonObject,
        ...args,
      );
      this.identity = result.identity;
      this.data.set(result.data);
      this.runtime.set({
        ...document,
        canonical: result.data,
        rowIdentity: result.identity,
      });
      await this.refresh();
    } catch {
      this.error.set('Sample change is unavailable');
    }
  }
}
