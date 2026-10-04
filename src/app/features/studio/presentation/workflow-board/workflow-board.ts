import { readWorkspace } from '../../domain/workspace-document';
import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { parseDocument, Point, Workspace } from '../../domain/authoring';
import {
  canvasEdges,
  CanvasNode,
  connectWorkspace,
  graphSteps,
} from '../../domain/workflow-authoring';
import { WorkflowBoardState } from './workflow-board-state';
@Component({
  selector: 'app-workflow-board',
  imports: [FormsModule, RouterLink, NgComponentOutlet, LocalizePipe],
  templateUrl: './workflow-board.html',
  styleUrl: './workflow-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowBoard extends WorkflowBoardState {
  readonly nodes = computed(() => this.nodeModels());
  readonly inputs = computed(() => ({
    nodes: this.nodes(),
    edges: canvasEdges(this.document().graph, this.nodes()),
    viewport: this.document().viewport,
    disabled: this.readonly(),
    routing: this.document().routing,
    collapsed: this.document().collapsed,
    routeEdge: (key: string, points: Point[]): void =>
      this.routeEdge(key, points),
    selectNode: (key: string): void => this.select(key),
    moveNode: (key: string, point: Point): void => this.move(key, point),
    connect: (source: string, target: string): void =>
      this.connect(source, target),
    transform: (viewport: Point & { zoom: number }): void =>
      this.viewport(viewport),
  }));
  markPending(key: string): void {
    this.pending.update((keys) => [...new Set([...keys, key])]);
    this.dirty.set(true);
  }
  private nodeModels(): CanvasNode[] {
    let steps: readonly JsonObject[];
    try {
      steps = graphSteps(this.document().graph);
    } catch {
      return [];
    }
    return steps.map((step, index) => {
      const catalog = this.catalogEntries().find(
        (row) =>
          (row['metadata'] as JsonObject | undefined)?.['ref_id'] ===
          step['type_version_ref'],
      );
      const metadata = catalog?.['metadata'] as JsonObject | undefined;
      const ports = Array.isArray(metadata?.['ports'])
        ? (metadata!['ports'] as JsonObject[]).map((port) => ({
            key: String(port['port_key']),
            direction: String(port['direction']),
            schema: (port['value_schema'] ?? {}) as JsonObject,
          }))
        : [];
      return {
        key: String(step['key']),
        title: String(step['type_code']),
        position: this.document().positions[String(step['key'])] ?? {
          x: 40 + (index % 4) * 230,
          y: 40 + Math.floor(index / 4) * 170,
        },
        ports,
      };
    });
  }
  select(key: string): void {
    if (this.pending().includes('node')) {
      this.error.set(
        'Apply or reload component edits before selecting another step',
      );
      return;
    }
    const node = graphSteps(this.document().graph).find(
      (step) => step['key'] === key,
    );
    if (node) {
      this.selected = key;
      this.selectedJson = JSON.stringify(node, null, 2);
    }
  }
  private change(next: Workspace): void {
    if (this.pending().length) {
      this.error.set('Apply or reload pending JSON edits first');
      return;
    }
    if (this.readonly()) {
      return;
    }
    graphSteps(next.graph);
    this.history.record(this.document());
    this.document.set(next);
    this.graphJson = JSON.stringify(next.graph, null, 2);
    this.dirty.set(true);
    this.error.set('');
  }
  add(): void {
    try {
      const entry = this.catalog().find((row) => row['key'] === this.typeKey);
      const metadata = entry?.['metadata'] as JsonObject | undefined;
      if (!metadata || entry?.['category'] !== 'step_type') {
        throw Error('Select a registered step type');
      }
      const next = structuredClone(this.document());
      const graph = next.graph as Record<string, JsonValue>;
      graph['steps'] = [
        ...graphSteps(graph),
        {
          key: this.stepKey,
          type_code: String(metadata['code']),
          type_version_ref: String(metadata['ref_id']),
          config: {},
        },
      ];
      next.positions[this.stepKey] = { x: 40, y: 40 };
      this.change(next);
      this.select(this.stepKey);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid step');
    }
  }
  applyNode(): void {
    if (this.pending().some((key) => key !== 'node')) {
      this.error.set('Apply other edited panels first');
      return;
    }
    const pending = this.pending();
    this.pending.set([]);
    try {
      const replacement = parseDocument(this.selectedJson);
      if (replacement['key'] !== this.selected) {
        throw Error('Stable step keys cannot be renamed; create a new step');
      }
      this.change({
        ...this.document(),
        graph: {
          ...this.document().graph,
          steps: graphSteps(this.document().graph).map((step) =>
            step['key'] === this.selected ? replacement : step,
          ),
        },
      });
      this.pending.set(pending.filter((key) => key !== 'node'));
    } catch {
      this.pending.set(pending);
      this.error.set('Invalid step configuration');
    }
  }
  remove(): void {
    if (!this.selected) {
      return;
    }
    const key = this.selected;
    const next = structuredClone(this.document());
    next.graph = {
      ...next.graph,
      steps: graphSteps(next.graph).filter((step) => step['key'] !== key),
      transitions: ((next.graph['transitions'] as JsonObject[]) ?? []).filter(
        (edge) => edge['source'] !== key && edge['target'] !== key,
      ),
      bindings: ((next.graph['bindings'] as JsonObject[]) ?? []).filter(
        (edge) => edge['step'] !== key && edge['source_step'] !== key,
      ),
      targets: ((next.graph['targets'] as JsonObject[]) ?? []).filter(
        (target) => target['step'] !== key,
      ),
    };
    delete next.positions[key];
    this.change(next);
    this.selected = '';
  }
  routeEdge(key: string, points: Point[]): void {
    if (
      JSON.stringify(this.document().routing[key] ?? []) !==
      JSON.stringify(points)
    ) {
      this.change({
        ...this.document(),
        routing: { ...this.document().routing, [key]: points },
      });
    }
  }
  move(key: string, point: Point): void {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return;
    }
    const old = this.document().positions[key];
    if (old?.x === point.x && old.y === point.y) {
      return;
    }
    this.change({
      ...this.document(),
      positions: { ...this.document().positions, [key]: point },
    });
  }
  viewport(viewport: Point & { zoom: number }): void {
    if (JSON.stringify(viewport) === JSON.stringify(this.document().viewport)) {
      return;
    }
    this.change({ ...this.document(), viewport });
  }
  connect(source = this.source, target = this.target): void {
    try {
      this.change(
        connectWorkspace(
          this.document(),
          source,
          target,
          this.outcome,
          this.nodes(),
        ),
      );
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid connection',
      );
    }
  }
  undo(redo = false): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const value = redo
      ? this.history.redo(this.document())
      : this.history.undo(this.document());
    if (value) {
      this.document.set(value);
      this.graphJson = JSON.stringify(value.graph, null, 2);
      this.dirty.set(true);
    }
  }
  applyGraph(): void {
    if (this.pending().some((key) => key !== 'graph')) {
      this.error.set('Apply other edited panels first');
      return;
    }
    const pending = this.pending();
    this.pending.set([]);
    try {
      const graph = parseDocument(this.graphJson);
      this.change({ ...this.document(), graph });
      this.pending.set(pending.filter((key) => key !== 'graph'));
    } catch {
      this.pending.set(pending);
      this.error.set(
        'Invalid graph document. Keep incomplete typed configurations in the workspace; step keys must be valid.',
      );
    }
  }
  applyLayout(): void {
    if (this.pending().some((key) => key !== 'layout')) {
      this.error.set('Apply other edited panels first');
      return;
    }
    const pending = this.pending();
    this.pending.set([]);
    try {
      const value = parseDocument(
        '{"collapsed":' +
          this.collapsedJson +
          ',"routing":' +
          this.routingJson +
          '}',
      );
      this.change(
        readWorkspace({
          ...this.document(),
          collapsed: value['collapsed'] as string[],
          routing: value['routing'] as unknown as Record<string, Point[]>,
        }),
      );
      this.pending.set(pending.filter((key) => key !== 'layout'));
    } catch {
      this.pending.set(pending);
      this.error.set('Invalid layout settings');
    }
  }
}
