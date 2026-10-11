import { JsonObject, jsonObject } from '../../domain/json-value';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../core/auth/actor-state';
import { Feedback } from '../../../core/feedback/feedback';
import {
  PersonalCollections,
  SavedView,
  ViewInput,
} from '../../../core/resources/personal-collections';
import { LocalizePipe } from '../localize-pipe';
import {
  ApiFailure,
  knownRejection,
} from '../../../core/transport/api-failure';
import { SavedViewRepair } from '../saved-view-repair/saved-view-repair';
import { SelectControl } from '../select-control/select-control';
type Query = JsonObject;
@Component({
  selector: 'app-saved-views',
  imports: [
    SavedViewRepair,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './saved-views.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedViews {
  readonly kind = input.required<ViewInput['resource_kind']>();
  readonly query = input<Query | null>(null);
  readonly columns = input<readonly string[]>([]);
  readonly columnOptions = input<readonly { key: string; label: string }[]>([]);
  readonly columnsChanged = output<string[]>();
  readonly applied = output<{ query: Query; columns: string[] }>();
  readonly views = signal<readonly SavedView[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly selected = signal('');
  name = '';
  private readonly api = inject(PersonalCollections);
  private readonly actor = inject(ActorState);
  private readonly feedback = inject(Feedback);
  private generation = 0;
  private originalName = '';
  private pendingWrite: number | null = null;
  async canLeave(): Promise<boolean> {
    if (this.pendingWrite !== null) {
      return false;
    }
    return (
      (!this.uncertain() && this.name === this.originalName) ||
      this.feedback.confirm('Discard unsaved saved-view changes?')
    );
  }
  readonly repairOpen = signal(false);
  original(): SavedView | null {
    return this.views().find((view) => view.ref_id === this.selected()) ?? null;
  }
  readonly uncertain = signal(false);
  readonly reconcileRequired = signal(false);
  private pending: { body: ViewInput; ref?: string } | null = null;
  constructor() {
    const release = this.actor.register(() => {
      this.generation++;
      this.repairOpen.set(false);
      this.pendingWrite = null;
      this.pending = null;
      this.uncertain.set(false);
      this.reconcileRequired.set(false);
      this.views.set([]);
      this.selected.set('');
      this.name = '';
      this.originalName = '';
      this.error.set('');
      this.busy.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    effect(() => {
      this.kind();
      untracked(() => void this.load());
    });
  }
  async load(): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    try {
      const views: SavedView[] = [];
      for (let page = 1; page <= 4; page++) {
        const result = await this.api.views(page);
        views.push(
          ...result.items.filter((row) => row.resource_kind === this.kind()),
        );
        if (page >= result.totalPages) {
          break;
        }
        if (page === 4) {
          throw Error('Incomplete saved views');
        }
      }
      let current: SavedView | null = null;
      if (
        this.selected() &&
        !views.some((view) => view.ref_id === this.selected())
      ) {
        current = await this.api.view(this.selected());
      }
      if (generation === this.generation) {
        if (current?.resource_kind === this.kind()) {
          this.selected.set(current.ref_id);
        }
        this.views.set(views);
        this.reconcileRequired.set(false);
        if (!this.uncertain()) {
          this.error.set('');
        }
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('The service is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async run(
    action: 'save' | 'update' | 'apply' | 'remove' | 'default',
    repairApproved = false,
  ): Promise<void> {
    if (this.busy() || this.reconcileRequired()) {
      return;
    }
    const generation = this.generation;
    const ref = this.selected();
    const query = this.query();
    if (
      action === 'update' &&
      this.original()?.compatible === false &&
      !repairApproved &&
      !this.pending
    ) {
      this.repairOpen.set(true);
      return;
    }
    if (
      action === 'remove' &&
      !(await this.feedback.confirm('Remove this saved view?'))
    ) {
      return;
    }
    if (generation !== this.generation) {
      return;
    }
    if (this.pending && action !== 'save' && action !== 'update') {
      return;
    }
    this.pendingWrite = generation;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.execute(action, ref, query, generation);
      if (generation === this.generation) {
        await this.load();
      }
    } catch (error) {
      if (generation === this.generation) {
        this.rejectWrite(error);
      }
    } finally {
      if (this.pendingWrite === generation) {
        this.pendingWrite = null;
      }
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  private rejectWrite(error: unknown): void {
    if (knownRejection(error)) {
      this.pending = null;
      this.uncertain.set(false);
      this.reconcileRequired.set(
        error instanceof ApiFailure && error.httpStatus === 409,
      );
    }
    this.error.set(
      'Your edits have been kept. Check the latest revision before continuing.',
    );
  }
  private async execute(
    action: 'save' | 'update' | 'apply' | 'remove' | 'default',
    ref: string,
    query: Query | null,
    generation: number,
  ): Promise<void> {
    if (action === 'save' || action === 'update') {
      await this.store(action, ref, query, generation);
      return;
    }
    if (!ref) {
      return;
    }
    if (action === 'apply') {
      const result = await this.api.apply(ref);
      if (
        generation === this.generation &&
        result.resource_kind === this.kind() &&
        result.query
      ) {
        this.applied.emit({
          query: jsonObject(result.query),
          columns: result.column_keys ?? [],
        });
      }
    } else if (action === 'remove') {
      await this.api.remove(ref);
      if (generation === this.generation) {
        this.selected.set('');
        this.name = this.originalName = '';
      }
    } else {
      const value = await this.api.default(ref);
      if (generation === this.generation) {
        this.selected.set(value.ref_id);
        this.name = value.name;
        this.originalName = value.name;
      }
    }
  }
  private async store(
    action: 'save' | 'update',
    ref: string,
    query: Query | null,
    generation: number,
  ): Promise<void> {
    if (
      !this.pending &&
      (!query || !this.name.trim() || (action === 'update' && !ref))
    ) {
      throw Error('Missing saved-view input');
    }
    if (!this.pending) {
      const current = query!;
      this.pending = {
        body: {
          schema_version: 1,
          resource_kind: this.kind(),
          name: this.name.trim(),
          query: Object.fromEntries(
            Object.entries(current).filter(
              ([key]) => key !== 'page' && key !== 'size',
            ),
          ),
          column_keys: [...this.columns()],
          page_size: typeof current['size'] === 'number' ? current['size'] : 20,
          command_key: crypto.randomUUID(),
        },
        ref: action === 'update' ? ref : undefined,
      };
    }
    this.uncertain.set(true);
    const value = await this.api.save(this.pending.body, this.pending.ref);
    if (generation === this.generation) {
      this.pending = null;
      this.uncertain.set(false);
      this.selected.set(value.ref_id);
      this.name = value.name;
      this.originalName = value.name;
    }
  }
  selectColumns(value: unknown): void {
    if (
      !Array.isArray(value) ||
      !value.every(
        (key) =>
          typeof key === 'string' &&
          this.columnOptions().some((option) => option.key === key),
      )
    ) {
      return;
    }
    this.columnsChanged.emit(value);
  }
  compatible(): boolean {
    return (
      this.views().find((view) => view.ref_id === this.selected())
        ?.compatible === true
    );
  }
  choose(value: unknown): void {
    if (this.uncertain() || this.reconcileRequired()) {
      return;
    }
    if (typeof value !== 'string') {
      return;
    }
    this.selected.set(value);
    this.name = this.views().find((row) => row.ref_id === value)?.name ?? '';
    this.originalName = this.name;
  }
}
