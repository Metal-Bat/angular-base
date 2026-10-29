import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../../shared/domain/json-value';
import { STUDIO_API } from '../../bindings';
import { BindingPreview, sampleIdentity } from '../../domain/binding-preview';
import { schemaAt } from '../../domain/mapping-fields';
import {
  objectBindings,
  objectDestination,
} from '../../domain/object-field-mappings';
import { MappingConstant } from '../mapping-constant/mapping-constant';

@Component({
  selector: 'app-object-binding-preview',
  imports: [ButtonDirective, LocalizePipe, MappingConstant],
  templateUrl: './object-binding-preview.html',
  styleUrl: './object-binding-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectBindingPreview {
  readonly graph = input.required<JsonObject>();
  readonly step = input.required<string>();
  readonly port = input.required<string>();
  readonly version = input.required<string>();
  readonly disabled = input(false);
  readonly rows = computed(() =>
    objectBindings(this.graph(), this.step(), this.port()).filter(
      (row) => !!row['target_projection'],
    ),
  );
  readonly samples = signal<Readonly<Record<string, JsonValue | undefined>>>(
    {},
  );
  readonly result = signal<BindingPreview | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly identity = sampleIdentity;
  readonly destination = objectDestination;
  private readonly api = inject(STUDIO_API);
  private readonly actor = inject(ActorState);
  private generation = 0;
  private controller: AbortController | null = null;
  constructor() {
    effect(() => {
      this.graph();
      this.step();
      this.port();
      this.version();
      untracked(() => {
        this.invalidate();
        const keys = new Set(this.rows().map(sampleIdentity));
        this.samples.update((values) =>
          Object.fromEntries(
            Object.entries(values).filter(([key]) => keys.has(key)),
          ),
        );
      });
    });
    const release = this.actor.register(() => this.reset());
    inject(DestroyRef).onDestroy(() => {
      this.reset();
      release();
    });
  }
  private invalidate(): void {
    this.generation++;
    this.controller?.abort();
    this.controller = null;
    this.busy.set(false);
    this.result.set(null);
    this.error.set('');
  }
  reset(): void {
    this.invalidate();
    this.samples.set({});
  }
  included(row: JsonObject): boolean {
    return Object.hasOwn(this.samples(), sampleIdentity(row));
  }
  schema(row: JsonObject): JsonObject {
    const root = (row['source_schema'] ?? {}) as JsonObject;
    return typeof row['source_path'] === 'string'
      ? (schemaAt(root, row['source_path']) ?? {})
      : root;
  }
  include(row: JsonObject, event: Event): void {
    this.invalidate();
    const key = sampleIdentity(row);
    if ((event.target as HTMLInputElement).checked) {
      this.samples.update((values) => ({
        ...values,
        [key]: sampleSeed(this.schema(row)),
      }));
    } else {
      this.samples.update((values) =>
        Object.fromEntries(
          Object.entries(values).filter(([item]) => item !== key),
        ),
      );
    }
  }
  value(row: JsonObject, value: JsonValue | undefined): void {
    this.invalidate();
    this.samples.update((values) => ({
      ...values,
      [sampleIdentity(row)]: value,
    }));
  }
  async preview(): Promise<void> {
    if (this.disabled() || this.busy()) {
      return;
    }
    this.invalidate();
    if (Object.values(this.samples()).some((value) => value === undefined)) {
      this.error.set('Complete the required fields.');
      return;
    }
    const generation = this.generation;
    const epoch = this.actor.epoch;
    this.controller = new AbortController();
    this.busy.set(true);
    const body: JsonObject = {
      graph: this.graph(),
      target_step: this.step(),
      target_port: this.port(),
      samples: this.rows()
        .filter(
          (row) => row['source_kind'] !== 'CONSTANT' && this.included(row),
        )
        .map((row) => ({
          ordinal: row['ordinal'],
          value: this.samples()[sampleIdentity(row)] ?? null,
        })),
    };
    try {
      const result = (await this.api.auxiliary(
        'bindingPreview',
        body,
        { ref_id: this.version() },
        this.controller.signal,
      )) as BindingPreview;
      if (
        generation === this.generation &&
        epoch === this.actor.epoch &&
        !this.disabled()
      ) {
        this.result.set(result);
      }
    } catch {
      if (generation === this.generation && epoch === this.actor.epoch) {
        this.error.set(
          'Mapping preview failed. Retry or reload the current workflow version.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}

function sampleSeed(schema: JsonObject): JsonValue {
  switch (schema['type']) {
    case 'boolean':
      return false;
    case 'integer':
    case 'number':
      return 0;
    case 'array':
      return [];
    case 'object':
      return {};
    case 'null':
      return null;
    default:
      return '';
  }
}
