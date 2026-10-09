import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { FormInspector } from '../../../studio/presentation/form-inspector/form-inspector';
import { FormSettings } from '../../../studio/presentation/form-settings/form-settings';
import { loadWorkflowCanvas } from '../../../studio/presentation/workflow-diagram.routes';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { MetricCard } from '../../../analytics/presentation/metric-card/metric-card';
import { readMetric } from '../../../analytics/domain/metrics';
import { CalendarViews } from '../calendar-views/calendar-views';
import { CalendarProjection } from '../../domain/calendar-events';
import { ReadinessPanel } from '../../../readiness/presentation/readiness-panel/readiness-panel';
import { ReadinessCheck } from '../../../readiness/domain/readiness';
/** Development-only component, excluded by the production route replacement. */
@Component({
  selector: 'app-foundation-preview',
  imports: [
    CalendarViews,
    ReadinessPanel,
    FormInspector,
    FormSettings,
    MetricCard,
    NgComponentOutlet,
  ],
  host: { class: 'console-page' },
  template: `
    <h1 tabindex="-1">Delivery preview</h1>
    <p>Development fixtures for calendar and readiness presentation.</p>
    <app-readiness-panel [checks]="checks" [stale]="true" />
    <app-calendar-views
      anchor="2026-10-08"
      timezone="America/New_York"
      [projection]="projection()"
      (selected)="selection.set($event.title)"
    />
    <p role="status">{{ selection() }}</p>
    <app-metric-card
      end="2026-10-09"
      start="2026-10-08"
      state="ready"
      title="Total"
      [result]="metric"
    />
    <section aria-label="Form authoring fixture">
      <app-form-inspector
        [documents]="documents()"
        [path]="[0]"
        (applied)="documents.set($event)"
      />
      <app-form-settings
        [documents]="documents()"
        [pageAuthoring]="true"
        (applied)="documents.set($event)"
      />
    </section>
    <section aria-label="Canvas measurement fixture">
      @if (canvas(); as component) {
        <ng-container *ngComponentOutlet="component; inputs: canvasInputs()" />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationPreview {
  readonly canvas = signal<Type<unknown> | null>(null);
  readonly canvasSize = signal(25);
  readonly viewport = signal({ x: 0, y: 0, zoom: 1 });
  readonly canvasSelected = signal('');
  readonly benchmarkNodes = computed(() =>
    Array.from({ length: this.canvasSize() }, (_, index) => ({
      key: 'measure_' + index,
      title: 'Fixture step ' + index,
      position: { x: (index % 10) * 280, y: Math.floor(index / 10) * 240 },
      ports: [],
    })),
  );
  readonly canvasInputs = computed(() => ({
    nodes: this.benchmarkNodes(),
    edges: [],
    viewport: this.viewport(),
    readOnly: true,
    selected: this.canvasSelected(),
    selectNode: (key: string): void => this.canvasSelected.set(key),
    transform: (value: { x: number; y: number; zoom: number }): void =>
      this.viewport.set(value),
    moveNode: (): void => {
      throw Error('Read-only canvas mutated');
    },
    routeEdge: (): void => {
      throw Error('Read-only canvas mutated');
    },
    connect: (): void => {
      throw Error('Read-only canvas mutated');
    },
  }));
  constructor() {
    void loadWorkflowCanvas().then((value) => this.canvas.set(value));
  }
  readonly documents = signal<JsonObject>({
    data_schema: {
      type: 'object',
      properties: {
        amount: { type: 'integer', minimum: 0 },
        flag: { type: 'boolean' },
      },
    },
    render_schema: {
      dialect: 'bpms.render/1',
      root: {
        component: 'vertical',
        children: [
          {
            component: 'integer',
            node_key: 'amount_node',
            scope: '/properties/amount',
            label: 'Amount',
            options: { read_only: false },
          },
          {
            component: 'boolean',
            node_key: 'flag_node',
            scope: '/properties/flag',
            label: 'Flag',
          },
        ],
      },
    },
    reuse_instances: { retained: true },
  });
  readonly metric = readMetric({
    metric_key: 'submitted_requests',
    version: 1,
    unit: 'count',
    availability: 'available',
    timezone: 'UTC',
    generated_at: '2026-10-08T08:00:00Z',
    as_of: '2026-10-08T08:00:00Z',
    total_value: 0,
    unknown_count: 1,
    series: [
      {
        key: 'all',
        buckets: [
          {
            date: '2026-10-08',
            value: 0,
            sample_count: 0,
            population_count: 0,
            unknown_count: 0,
          },
        ],
      },
    ],
  });
  readonly selection = signal('');
  readonly checks: readonly ReadinessCheck[] = [
    {
      key: 'graph',
      label: 'Graph structure',
      category: 'definition',
      required: true,
      status: 'ready',
      reason: 'Graph validation passed.',
    },
    {
      key: 'provider',
      label: 'Provider',
      category: 'installation',
      required: true,
      status: 'unknown',
      reason: 'Readiness has not been checked.',
    },
  ];
  readonly projection = signal<CalendarProjection>({
    status: 'ready',
    stale: false,
    events: [
      {
        key: 'personal',
        title: 'Calendar fixture holiday',
        source: 'personal',
        kind: 'all_day',
        start: '2026-10-08',
        end: '2026-10-09',
      },
      {
        key: 'due',
        title: 'Calendar fixture deadline',
        source: 'workflow',
        kind: 'timed',
        start: '2026-10-08T18:00:00Z',
        end: '2026-10-08T19:00:00Z',
        timezone: 'America/New_York',
      },
    ],
  });
}
