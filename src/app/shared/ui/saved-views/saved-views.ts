import { savedViewBody } from './saved-view-body';
import { savedViewMenu } from './saved-view-menu';
import { JsonObject, jsonObject } from '../../domain/json-value';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { Locale } from '../../../core/localization/locale';
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
    MenuModule,
    PopoverModule,
    DialogModule,
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
  readonly editor = signal<'save' | 'rename' | null>(null);
  private readonly locale = inject(Locale);
  readonly menuItems = computed(() => {
    this.locale.language();
    const blocked = this.busy() || this.uncertain() || this.reconcileRequired();
    return savedViewMenu(
      {
        busy: this.busy(),
        blocked,
        selected: !!this.selected(),
        query: !!this.query(),
      },
      (label) => this.locale.text(label),
      (action) => {
        if (action === 'save' || action === 'rename') {
          this.openEditor(action);
        } else if (action === 'reload') {
          void this.load();
        } else {
          void this.run(action);
        }
      },
    );
  });
  private openEditor(action: 'save' | 'rename'): void {
    this.name = this.originalName =
      action === 'save' ? '' : (this.original()?.name ?? '');
    this.editor.set(action);
  }

  async closeEditor(): Promise<void> {
    if (
      this.busy() ||
      this.uncertain() ||
      this.reconcileRequired() ||
      !(await this.canLeave())
    ) {
      return;
    }
    this.name = this.originalName = this.original()?.name ?? '';
    this.editor.set(null);
  }
  private readonly viewActions =
    viewChild<ElementRef<HTMLButtonElement>>('viewActions');
  restoreFocus(): void {
    this.viewActions()?.nativeElement.focus();
  }
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
      this.editor.set(null);
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
    action: 'save' | 'rename' | 'update' | 'apply' | 'remove' | 'default',
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
    if (this.pending && !['save', 'update', 'rename'].includes(action)) {
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
    action: 'save' | 'rename' | 'update' | 'apply' | 'remove' | 'default',
    ref: string,
    query: Query | null,
    generation: number,
  ): Promise<void> {
    if (action === 'save' || action === 'update' || action === 'rename') {
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
    action: 'save' | 'update' | 'rename',
    ref: string,
    query: Query | null,
    generation: number,
  ): Promise<void> {
    if (
      !this.pending &&
      (!(action === 'rename' ? this.original()?.query : query) ||
        !this.name.trim() ||
        (action !== 'save' && !ref))
    ) {
      throw Error('Missing saved-view input');
    }
    if (!this.pending) {
      this.pending = {
        body: savedViewBody(
          this.kind(),
          this.name,
          query!,
          this.columns(),
          action === 'rename' ? this.original() : null,
        ),
        ref: action !== 'save' ? ref : undefined,
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
      this.editor.set(null);
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
