import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { seedValue } from '../../../../shared/domain/schema-form';
import { SchemaInput } from '../../../../shared/ui/schema-input/schema-input';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { StudioChoice } from '../studio-choice/studio-choice';
@Component({
  selector: 'app-mapping-constant',
  imports: [ButtonDirective, SchemaInput, LocalizePipe, StudioChoice],
  templateUrl: './mapping-constant.html',
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      min-inline-size: 0;
    }
    .reference-value {
      display: grid;
      gap: 0.5rem;
      border: 1px solid var(--console-border);
      padding: 0.75rem;
      border-radius: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MappingConstant {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly controlId = input('mapping-constant');
  readonly schema = input.required<JsonObject>();
  readonly value = input<JsonValue | undefined>();
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly disabled = input(false);
  readonly readyChange = output<boolean>();
  readonly choices = viewChildren(StudioChoice);
  readonly busy = computed(() =>
    this.choices().some((choice) => choice.busy()),
  );
  readonly pickerRevision = signal(0);
  readonly valueChange = output<JsonValue | undefined>();
  readonly nullable = computed(
    () =>
      !Object.keys(this.schema()).length ||
      this.schema()['type'] === 'null' ||
      ((this.schema()['anyOf'] ?? []) as JsonObject[]).some(
        (branch) => branch['type'] === 'null',
      ),
  );
  nullChanged(event: Event): void {
    if (!this.disabled() && !this.busy()) {
      this.valueChange.emit(
        (event.target as HTMLInputElement).checked
          ? null
          : seedValue(this.schema()),
      );
    }
  }
  readonly users = computed(() => this.schema()['x-reference-kind'] === 'user');
  readonly values = computed(() =>
    Array.isArray(this.value()) ? (this.value() as readonly JsonValue[]) : [],
  );
  readonly String = String;
  constructor() {
    effect(() => this.readyChange.emit(!this.busy()));
  }
  setUser(value: string, index?: number): void {
    if (this.disabled()) {
      return;
    }
    if (!value) {
      if (index !== undefined) {
        this.remove(index);
      }
      return;
    }
    const values = [...this.values()];
    if (index === undefined) {
      if (!values.includes(value)) {
        values.push(value);
      }
    } else {
      values[index] = value;
    }
    this.valueChange.emit(values);
    this.pickerRevision.update((revision) => revision + 1);
    if (index === undefined) {
      afterNextRender(
        () => {
          if (!this.disabled() && this.users()) {
            Array.from(
              this.host.nativeElement.querySelectorAll<HTMLInputElement>(
                'input',
              ),
            )
              .find(
                (control) =>
                  control.id === this.controlId() + '-add-user-search',
              )
              ?.focus();
          }
        },
        { injector: this.injector },
      );
    }
  }
  otherBusy(index: number): boolean {
    return this.choices().some(
      (choice, position) => position !== index && choice.busy(),
    );
  }
  remove(index: number): void {
    if (!this.disabled() && !this.busy()) {
      this.valueChange.emit(
        this.values().filter((_, position) => position !== index),
      );
    }
  }
}
