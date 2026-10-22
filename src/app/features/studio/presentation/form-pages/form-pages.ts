import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { OutlineItem } from '../../domain/form-authoring';
import {
  AuthoredPage,
  authoredPages,
  removePage,
  reorderPage,
  savePage,
} from '../../domain/form-pages';
import { scopeRowCount } from '../../domain/form-inspection';
@Component({
  selector: 'app-form-pages',
  imports: [
    FormsModule,
    ButtonDirective,
    CheckboxModule,
    InputTextModule,
    LocalizePipe,
  ],
  templateUrl: './form-pages.html',
  styleUrl: './form-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPages {
  readonly documents = input.required<JsonObject>();
  readonly fields = input.required<readonly OutlineItem[]>();
  readonly disabled = input(false);
  readonly blocked = input(false);
  readonly context = input(0);
  readonly applied = output<JsonObject>();
  readonly changed = output<void>();
  readonly discarded = output<void>();
  readonly pendingChange = output<boolean>();
  readonly locale = inject(Locale);
  readonly pages = computed(() => authoredPages(this.documents()));
  readonly assignable = computed(() => [
    ...new Map(
      this.fields()
        .filter((field) => field.scope && scopeRowCount(field.scope) === 0)
        .map((field) => [field.scope!, field]),
    ).values(),
  ]);
  readonly editing = signal<string | null>(null);
  readonly title = signal('');
  readonly titleLength = computed(() => Array.from(this.title()).length);
  readonly selected = signal<readonly string[]>([]);
  readonly error = signal('');
  private base: JsonObject | null = null;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly fieldSearch = signal('');
  readonly filteredFields = computed(() =>
    this.assignable().filter((field) =>
      field.label
        .toLocaleLowerCase()
        .includes(this.fieldSearch().toLocaleLowerCase()),
    ),
  );
  private focusTitle(): void {
    const context = this.context();
    afterNextRender(
      () => {
        if (this.disabled() || this.blocked() || context !== this.context()) {
          return;
        }
        const target =
          this.host.nativeElement.querySelector<HTMLInputElement>(
            '#form-page-title',
          );
        target?.focus({ preventScroll: true });
        target?.scrollIntoView?.({ block: 'nearest' });
      },
      { injector: this.injector },
    );
  }
  readonly pending = computed(() => {
    const page = this.pages()?.find(
      (candidate) => candidate.key === this.editing(),
    );
    return page
      ? this.title() !== page.title ||
          JSON.stringify(this.selected()) !== JSON.stringify(page.scopes)
      : !!this.title() || this.selected().length > 0;
  });
  readonly unavailable = computed(() =>
    this.selected().filter(
      (scope) => !this.assignable().some((field) => field.scope === scope),
    ),
  );
  readonly canApply = computed(
    () =>
      !this.disabled() &&
      !this.blocked() &&
      this.pending() &&
      !!this.pages() &&
      !!this.title().trim() &&
      this.titleLength() <= 256 &&
      this.selected().length > 0 &&
      (this.editing() !== null || this.pages()!.length < 32),
  );
  constructor() {
    effect(() => {
      this.context();
      this.documents();
      untracked(() => this.clear(false));
    });
    effect(() => this.pendingChange.emit(this.pending()));
    const release = inject(ActorState).register(() => this.clear(false));
    inject(DestroyRef).onDestroy(release);
  }
  private clear(discard: boolean): void {
    this.fieldSearch.set('');
    this.editing.set(null);
    this.title.set('');
    this.selected.set([]);
    this.base = null;
    this.error.set('');
    if (discard) {
      this.discarded.emit();
    }
  }
  edit(page: AuthoredPage): void {
    if (this.disabled() || this.blocked()) {
      return;
    }
    if (this.pending()) {
      this.error.set('Apply or discard page edits first.');
      return;
    }
    this.base = this.documents();
    this.editing.set(page.key);
    this.title.set(page.title);
    this.selected.set(page.scopes);
    this.focusTitle();
  }
  changeTitle(value: string): void {
    if (this.disabled() || this.blocked()) {
      return;
    }
    this.base ??= this.documents();
    this.title.set(value);
    this.changed.emit();
  }
  toggle(scope: string, checked: boolean): void {
    if (
      this.disabled() ||
      this.blocked() ||
      (!this.assignable().some((field) => field.scope === scope) &&
        !this.selected().includes(scope))
    ) {
      return;
    }
    this.base ??= this.documents();
    this.selected.update((scopes) =>
      checked
        ? [...new Set([...scopes, scope])]
        : scopes.filter((item) => item !== scope),
    );
    this.changed.emit();
  }
  apply(): void {
    if (!this.canApply()) {
      return;
    }
    if (this.base !== this.documents()) {
      this.error.set('Page settings changed. Discard page edits and reload.');
      return;
    }
    try {
      const next = savePage(
        this.documents(),
        this.editing(),
        this.title(),
        this.selected(),
        this.assignable().map((field) => field.scope!),
      );
      this.clear(false);
      this.applied.emit(next);
      this.focusTitle();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
    }
  }
  discard(): void {
    if (!this.disabled()) {
      this.clear(true);
      this.focusTitle();
    }
  }
  move(key: string, direction: -1 | 1): void {
    this.command(() => reorderPage(this.documents(), key, direction));
  }
  remove(key: string): void {
    this.command(() => removePage(this.documents(), key));
  }
  private command(work: () => JsonObject): void {
    if (this.disabled() || this.blocked() || this.pending()) {
      return;
    }
    try {
      this.applied.emit(work());
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
    }
  }
  fieldLabel(scope: string): string {
    return (
      this.fields().find((field) => field.scope === scope)?.label ??
      'Field unavailable'
    );
  }
}
