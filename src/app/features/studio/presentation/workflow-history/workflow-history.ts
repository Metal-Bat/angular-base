import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import { emptyQuery } from '../../../../shared/domain/list-query';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { AuthorPage } from '../../application/studio-port';
import { STUDIO_API } from '../../bindings';

@Component({
  selector: 'app-workflow-history',
  imports: [
    DialogModule,
    ButtonDirective,
    LocalizePipe,
    RecordTable,
    RecordSummary,
  ],
  templateUrl: './workflow-history.html',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowHistory {
  readonly version = input.required<string>();
  readonly disabled = input(false);
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly rows = signal<readonly JsonObject[]>([]);
  readonly selected = signal<Record<string, unknown> | null>(null);
  readonly error = signal('');
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly query = signal(emptyQuery());
  readonly columns = [
    { key: 'operation', label: 'Operation' },
    { key: 'changed_at', label: 'Changed at' },
    { key: 'modifier_type', label: 'Actor type' },
    { key: 'reason', label: 'Reason' },
  ];
  private readonly api = inject(STUDIO_API);
  private generation = 0;
  constructor() {
    effect(() => {
      this.version();
      this.close();
    });
    const release = inject(ActorState).register(() => this.close());
    inject(DestroyRef).onDestroy(() => {
      this.close();
      release();
    });
  }
  show(): void {
    if (this.disabled() || !this.version()) {
      return;
    }
    this.open.set(true);
    void this.load();
  }
  close(): void {
    this.generation++;
    this.open.set(false);
    this.busy.set(false);
    this.rows.set([]);
    this.selected.set(null);
    this.error.set('');
    this.page.set(1);
    this.pages.set(0);
  }
  async load(page = 1, size = this.query().size): Promise<void> {
    if (this.busy() || !this.open() || !this.version()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = (await this.api.auxiliary(
        'workspaceHistory',
        { page, size },
        { ref_id: this.version() },
      )) as AuthorPage;
      if (generation !== this.generation) {
        return;
      }
      this.rows.set(result.items);
      this.page.set(result.page);
      this.pages.set(result.totalPages);
      this.query.update((query) => ({ ...query, page: result.page, size }));
      this.selected.set(null);
    } catch {
      if (generation === this.generation) {
        this.rows.set([]);
        this.selected.set(null);
        this.error.set(
          'Workspace history is unavailable. Your draft is retained.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
