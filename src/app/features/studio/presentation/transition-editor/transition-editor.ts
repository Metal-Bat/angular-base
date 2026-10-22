import { interfaceExpressionCompletions } from '../../domain/interface-sources';
import { expressionValues } from '../../domain/expression-values';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ActorState } from '../../../../core/auth/actor-state';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { patchTransition } from '../../domain/graph-controls';
import { connectionKey, graphSteps } from '../../domain/workflow-authoring';
@Component({
  selector: 'app-transition-editor',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './transition-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransitionEditor {
  readonly graph = input.required<JsonObject>();
  readonly completions = input<readonly JsonObject[]>([]);
  readonly conditionRows = computed(() =>
    interfaceExpressionCompletions(
      this.completions(),
      this.graph(),
      this.selected(),
    ),
  );
  readonly values = computed(() =>
    expressionValues(this.conditionRows(), this.graph(), this.selected()),
  );
  readonly blockedValues = computed(() =>
    this.conditionRows()
      .filter(
        (row) =>
          row['source'] === 'request' &&
          !this.values().includes(String(row['path'])),
      )
      .map((row) => String(row['path'])),
  );
  readonly inspected = input('');
  readonly parallel = computed(
    () =>
      (
        graphSteps(this.graph()).find(
          (step) => step['key'] === this.selected(),
        )?.['flow'] as JsonObject | undefined
      )?.['split'] === 'ALL',
  );
  readonly selected = input.required<string>();
  readonly disabled = input(false);
  readonly applied = output<JsonObject>();
  readonly changed = output<void>();
  readonly discarded = output<void>();
  readonly rows = computed(() =>
    ((this.graph()['transitions'] ?? []) as JsonObject[])
      .map((edge, index) => ({
        edge,
        index,
        id: connectionKey('control', edge),
      }))
      .filter((item) => item.edge['source'] === this.selected()),
  );
  readonly id = linkedSignal<
    {
      rows: readonly { edge: JsonObject; index: number; id: string }[];
      inspected: string;
    },
    string
  >({
    source: () => ({ rows: this.rows(), inspected: this.inspected() }),
    computation: ({ rows, inspected }, previous) => {
      const incoming = rows.find(
        (item) => connectionKey('transition', item.edge) === inspected,
      );
      if (incoming && inspected !== previous?.source.inspected) {
        return incoming.id;
      }
      const unchanged = rows.find((item) => item.id === previous?.value);
      const oldIndex = previous?.source.rows.find(
        (item) => item.id === previous.value,
      )?.index;
      return (
        unchanged?.id ??
        rows.find((item) => item.index === oldIndex)?.id ??
        rows[0]?.id ??
        ''
      );
    },
  });
  readonly current = computed(() =>
    this.rows().find((item) => item.id === this.id()),
  );
  readonly valuePath = linkedSignal(() => {
    this.current();
    return '';
  });
  insertPath(): void {
    if (!this.values().includes(this.valuePath())) {
      return;
    }
    this.update(
      'condition',
      [this.draft()['condition'], this.valuePath()].filter(Boolean).join(' '),
    );
  }
  readonly draft = linkedSignal<JsonObject>(() => this.initial());
  readonly dirty = linkedSignal(() => {
    this.current();
    return false;
  });
  readonly error = signal('');
  constructor() {
    const release = inject(ActorState).register(() => {
      this.id.set('');
      this.valuePath.set('');
      this.draft.set({});
      this.dirty.set(false);
      this.error.set('');
    });
    inject(DestroyRef).onDestroy(release);
  }
  private initial(): JsonObject {
    const edge = this.current()?.edge;
    return {
      priority: edge?.['priority'] ?? 0,
      is_default: edge?.['is_default'] ?? false,
      condition: edge?.['condition'] ?? null,
    };
  }
  update(key: string, value: JsonValue): void {
    if (this.disabled() || !this.current()) {
      return;
    }
    this.draft.update((draft) => ({ ...draft, [key]: value }));
    this.dirty.set(true);
    this.error.set('');
    this.changed.emit();
  }
  apply(): void {
    if (this.disabled() || !this.current()) {
      return;
    }
    try {
      const graph = patchTransition(
        this.graph(),
        this.current()!.index,
        this.draft(),
      );
      this.dirty.set(false);
      this.error.set('');
      this.applied.emit(graph);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid connection',
      );
    }
  }
  discard(): void {
    if (this.disabled()) {
      return;
    }
    this.draft.set(this.initial());
    this.dirty.set(false);
    this.error.set('');
    this.discarded.emit();
  }
}
