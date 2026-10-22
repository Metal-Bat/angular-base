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
import { ActorState } from '../../../core/auth/actor-state';
import { Locale } from '../../../core/localization/locale';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { JsonObject } from '../../forms/domain/runtime-document';
import { STUDIO_API } from '../bindings';

@Component({
  selector: 'app-catalog-relations',
  imports: [LocalizePipe],
  templateUrl: './catalog-relations.html',
  styleUrl: './catalog-relations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogRelations {
  readonly record = input.required<JsonObject>();
  readonly relations = computed(() => {
    const row = this.record();
    const roots = [
      ['form_ref_id', 'forms', 'Form'],
      ['workflow_ref_id', 'workflows', 'Workflow'],
      ['client_ref_id', 'clients', 'Client'],
    ].flatMap(([key, kind, title]) =>
      typeof row[key] === 'string' && row[key]
        ? [{ kind, ref: String(row[key]), title, minimum: '', maximum: '' }]
        : [],
    );
    const targets = Array.isArray(row['client_targets'])
      ? (row['client_targets'] as JsonObject[])
      : [];
    return [
      ...roots,
      ...targets.map((target) => ({
        kind: 'clients',
        ref: String(target['client_ref_id'] ?? ''),
        title: 'Client restriction',
        minimum: String(target['minimum_release'] ?? ''),
        maximum: String(target['maximum_release_exclusive'] ?? ''),
      })),
    ];
  });
  readonly labels = signal<readonly string[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  private readonly api = inject(STUDIO_API);
  private readonly locale = inject(Locale);
  private controller = new AbortController();
  private generation = 0;
  constructor() {
    effect(() => {
      this.locale.language();
      void this.load(this.relations());
    });
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
  }
  private clear(): void {
    this.generation++;
    this.controller.abort();
    this.labels.set([]);
    this.busy.set(false);
    this.error.set('');
  }
  private async load(
    rows: readonly { kind: string; ref: string }[],
  ): Promise<void> {
    this.clear();
    if (!rows.length) {
      return;
    }
    const generation = this.generation;
    this.controller = new AbortController();
    this.busy.set(true);
    try {
      const response = await this.api.auxiliary(
        'selected',
        { resources: rows.map((row) => ({ kind: row.kind, ref_id: row.ref })) },
        undefined,
        this.controller.signal,
      );
      if (generation !== this.generation) {
        return;
      }
      if (!Array.isArray(response) || response.length !== rows.length) {
        throw Error('Incomplete selected resources');
      }
      this.labels.set(
        response.map((value, index) => {
          const row = value as JsonObject;
          return row['kind'] === rows[index].kind &&
            row['available'] === true &&
            typeof row['label'] === 'string'
            ? row['label']
            : this.locale.text('Unavailable');
        }),
      );
    } catch {
      if (generation === this.generation) {
        this.error.set('The selected resource is unavailable. Choose again.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
