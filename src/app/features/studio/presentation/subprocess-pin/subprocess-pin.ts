import type { ChildSourceSelection } from '../../domain/subprocess-pin';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import {
  chooseSubprocess,
  setChildInput,
  setChildSource,
  subprocessSources,
} from '../../domain/subprocess-pin';
import { schemaSummary } from '../../domain/mapping-schema';
import { SubprocessInterface } from '../subprocess-interface/subprocess-interface';
import { SubprocessInput } from '../subprocess-input/subprocess-input';
import { SubprocessSources } from '../subprocess-sources/subprocess-sources';
@Component({
  selector: 'app-subprocess-pin',
  imports: [
    FormsModule,
    RouterLink,
    LocalizePipe,
    SelectControl,
    ButtonDirective,
    SubprocessInput,
    SubprocessInterface,
    SubprocessSources,
  ],
  templateUrl: './subprocess-pin.html',
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      min-inline-size: 0;
    }
    fieldset {
      min-inline-size: 0;
      display: grid;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--console-border);
      border-radius: 0.5rem;
    }
    li,
    p,
    a {
      overflow-wrap: anywhere;
    }
    ul {
      padding-inline-start: 1.25rem;
    }
    .pin-link {
      display: inline-flex;
      padding: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubprocessPin {
  readonly value = input<JsonObject | undefined>();
  readonly working = linkedSignal(() => this.value());
  readonly catalog = input.required<readonly JsonObject[]>();
  readonly types = input<readonly JsonObject[]>([]);
  readonly graph = input<JsonObject>({});
  readonly step = input('');
  readonly version = input('');
  readonly disabled = input(false);
  readonly draftChanged = output<void>();
  readonly validity = output<boolean>();
  readonly changed = output<JsonObject>();
  readonly error = signal('');
  readonly rows = signal<readonly JsonObject[]>([]);
  readonly invalid = signal<ReadonlySet<string>>(new Set());
  readonly selected = computed(() =>
    String(this.working()?.['workflow_version_ref'] ?? ''),
  );
  readonly mapped = computed(
    () => (this.working()?.['inputs'] ?? []) as JsonObject[],
  );
  readonly pinnedWithInputs = computed(() => this.mapped().length > 0);
  readonly calls = computed(() =>
    this.catalog()
      .filter((row) => row['category'] === 'subprocess')
      .map((row) => ({
        reference: String(
          (row['metadata'] as JsonObject)['workflow_version_ref'],
        ),
        title: String(row['title']) + ' · ' + String(row['key']),
        interface: (row['metadata'] as JsonObject)['interface'] as JsonObject,
      })),
  );
  readonly contract = computed(
    () =>
      this.calls().find((call) => call.reference === this.selected())
        ?.interface,
  );
  readonly fallback = computed(() => this.selected() && !this.contract());
  readonly inputs = computed(
    () => (this.contract()?.['inputs'] ?? []) as JsonObject[],
  );
  readonly obsolete = computed(() =>
    this.mapped().filter(
      (row) => !this.inputs().some((port) => port['name'] === row['name']),
    ),
  );
  readonly sources = computed(() =>
    subprocessSources(this.rows(), this.graph(), this.step(), this.types()),
  );
  private readonly locale = inject(Locale);
  readonly String = String;
  constructor() {
    effect(() => this.reportValidity());
    effect(() => {
      this.selected();
      this.invalid.set(new Set());
      this.error.set('');
    });
    const release = inject(ActorState).register(() => {
      this.working.set(undefined);
      this.rows.set([]);
      this.error.set('');
      this.invalid.set(new Set());
    });
    inject(DestroyRef).onDestroy(release);
  }
  private reportValidity(): void {
    this.validity.emit(!this.error() && !this.invalid().size);
  }
  summary(schema: JsonObject): string {
    return schemaSummary(schema)
      .split(/( · | \/ )/)
      .map((part) => this.locale.text(part))
      .join('');
  }
  mapping(name: string): JsonObject | undefined {
    return this.mapped().find((item) => item['name'] === name);
  }
  setValid(name: string, valid: boolean): void {
    this.invalid.update((rows) => {
      const next = new Set(rows);
      if (valid) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
    this.reportValidity();
  }
  setInput(name: string, value: JsonValue | undefined): void {
    this.change(() =>
      setChildInput(this.working()!, name, value, this.catalog()),
    );
  }
  setSource(name: string, selection: string | ChildSourceSelection): void {
    const choice =
      typeof selection === 'string'
        ? { key: selection, index: null, field: '' }
        : selection;
    this.change(() =>
      setChildSource(
        this.working()!,
        name,
        choice.key,
        this.catalog(),
        this.sources(),
        choice.index ?? undefined,
        choice.field,
      ),
    );
  }
  private change(update: () => JsonObject): void {
    if (this.disabled() || !this.working()) {
      return;
    }
    this.draftChanged.emit();
    try {
      const next = update();
      this.working.set(next);
      this.changed.emit(next);
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
    }
    this.reportValidity();
  }
  choose(reference: string): void {
    if (this.disabled()) {
      return;
    }
    try {
      const next = chooseSubprocess(this.working(), reference, this.catalog());
      this.working.set(next);
      this.changed.emit(next);
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
    }
    this.reportValidity();
  }
}
