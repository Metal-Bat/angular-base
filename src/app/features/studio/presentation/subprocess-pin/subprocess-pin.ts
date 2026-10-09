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
import { ButtonDirective } from 'primeng/button';
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';
import { StudioChoice } from '../studio-choice/studio-choice';
import { ActorState } from '../../../../core/auth/actor-state';
import { FormsModule } from '@angular/forms';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { chooseSubprocess, setChildInput } from '../../domain/subprocess-pin';
@Component({
  selector: 'app-subprocess-pin',
  imports: [
    FormsModule,
    LocalizePipe,
    SelectControl,
    ButtonDirective,
    SchemaInput,
    StudioChoice,
  ],
  templateUrl: './subprocess-pin.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubprocessPin {
  readonly value = input<JsonObject | undefined>();
  readonly catalog = input.required<readonly JsonObject[]>();
  readonly disabled = input(false);
  readonly draftChanged = output<void>();
  readonly validity = output<boolean>();
  readonly pinnedWithInputs = computed(
    () =>
      Array.isArray(this.value()?.['inputs']) &&
      (this.value()!['inputs'] as JsonObject[]).length > 0,
  );
  constructor() {
    const release = inject(ActorState).register(() => this.error.set(''));
    inject(DestroyRef).onDestroy(release);
  }
  readonly changed = output<JsonObject>();
  readonly error = signal('');
  readonly selected = computed(() =>
    String(this.value()?.['workflow_version_ref'] ?? ''),
  );
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
  readonly fallback = computed(
    () =>
      this.selected() &&
      !this.calls().some((call) => call.reference === this.selected()),
  );
  readonly ports = computed<readonly JsonObject[]>(() => {
    const contract = this.calls().find(
      (call) => call.reference === this.selected(),
    )?.interface;
    return [
      ...((contract?.['inputs'] ?? []) as JsonObject[]).map((port) => ({
        ...port,
        direction: 'INPUT',
      })),
      ...((contract?.['outputs'] ?? []) as JsonObject[]).map((port) => ({
        ...port,
        direction: 'OUTPUT',
      })),
    ];
  });
  readonly inputs = computed(() =>
    this.ports().filter((port) => port['direction'] === 'INPUT'),
  );
  mapping(name: string): JsonObject | undefined {
    return ((this.value()?.['inputs'] ?? []) as JsonObject[]).find(
      (item) => item['name'] === name,
    );
  }
  editable(port: JsonObject): boolean {
    return ['string', 'integer', 'number', 'boolean'].includes(
      String((port['value_schema'] as JsonObject)['type']),
    );
  }
  setInput(name: string, value: JsonValue | undefined): void {
    if (this.disabled() || !this.value()) {
      return;
    }
    this.draftChanged.emit();
    try {
      this.changed.emit(
        setChildInput(this.value()!, name, value, this.catalog()),
      );
      this.error.set('');
      this.validity.emit(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
      this.validity.emit(false);
    }
  }
  readonly String = String;
  choose(reference: string): void {
    if (this.disabled()) {
      return;
    }
    try {
      this.changed.emit(
        chooseSubprocess(this.value(), reference, this.catalog()),
      );
      this.error.set('');
      this.validity.emit(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
      this.validity.emit(false);
    }
  }
}
