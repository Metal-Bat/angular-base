import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { CanvasEdge, CanvasNode } from '../../domain/workflow-authoring';
import { selectablePorts } from '../../domain/canvas-ports';
@Component({
  selector: 'app-canvas-connections',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './canvas-connections.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasConnections {
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly edges = input.required<readonly CanvasEdge[]>();
  readonly disabled = input(false);
  readonly inspectedEdge = input('');
  readonly connectRequested = output<{
    source: string;
    target: string;
    outcome: string;
  }>();
  readonly reconnectRequested = output<{
    id: string;
    source: string;
    target: string;
  }>();
  readonly sources = computed(() => selectablePorts(this.nodes(), 'OUTPUT'));
  readonly inputs = computed(() => selectablePorts(this.nodes(), 'INPUT'));
  readonly edgeId = linkedSignal<
    { edges: readonly CanvasEdge[]; disabled: boolean; inspected: string },
    string
  >({
    source: () => ({
      edges: this.edges(),
      disabled: this.disabled(),
      inspected: this.inspectedEdge(),
    }),
    computation: (state, previous) => {
      if (
        state.inspected !== previous?.source.inspected &&
        state.edges.some((edge) => edge.id === state.inspected)
      ) {
        return state.inspected;
      }
      return !state.disabled &&
        state.edges.some((edge) => edge.id === previous?.value)
        ? previous!.value
        : '';
    },
  });
  readonly edge = computed(() =>
    this.edges().find((edge) => edge.id === this.edgeId()),
  );
  readonly source = linkedSignal<
    {
      ports: { value: string; label: string }[];
      edge: CanvasEdge | undefined;
      disabled: boolean;
    },
    string
  >({
    source: () => ({
      ports: this.sources(),
      edge: this.edge(),
      disabled: this.disabled(),
    }),
    computation: (state, previous) => {
      if (state.disabled) {
        return '';
      }
      if (state.edge?.id !== previous?.source.edge?.id) {
        return state.edge?.source ?? '';
      }
      return state.ports.some((port) => port.value === previous?.value)
        ? previous!.value
        : '';
    },
  });
  readonly target = linkedSignal<
    {
      ports: { value: string; label: string }[];
      edge: CanvasEdge | undefined;
      disabled: boolean;
    },
    string
  >({
    source: () => ({
      ports: this.inputs(),
      edge: this.edge(),
      disabled: this.disabled(),
    }),
    computation: (state, previous) => {
      if (state.disabled) {
        return '';
      }
      if (state.edge?.id !== previous?.source.edge?.id) {
        return state.edge?.target ?? '';
      }
      return state.ports.some((port) => port.value === previous?.value)
        ? previous!.value
        : '';
    },
  });
  readonly outcome = linkedSignal(() => this.edge()?.label ?? 'next');
  readonly targets = computed(() =>
    this.inputs().filter(
      (port) => port.value.split(':')[0] === this.source().split(':')[0],
    ),
  );
  readonly valid = computed(
    () =>
      this.sources().some((port) => port.value === this.source()) &&
      this.targets().some((port) => port.value === this.target()) &&
      (!this.edge() || this.source().startsWith(this.edge()!.kind + ':')),
  );
  submit(): void {
    if (this.disabled() || !this.valid()) {
      return;
    }
    const source = this.source();
    const target = this.target();
    const edge = this.edge();
    if (edge) {
      this.reconnectRequested.emit({ id: edge.id, source, target });
    } else if (source.startsWith('data:') || this.outcome().trim()) {
      this.connectRequested.emit({ source, target, outcome: this.outcome() });
    }
  }
}
