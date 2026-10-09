import { Locale } from '../../../../core/localization/locale';
import { componentCategory, componentLabels } from './form-palette';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { RUNTIME_OPTIONS } from '../../../forms/bindings';
import { RuntimeOptionsPort } from '../../../forms/application/runtime-options-port';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { RuntimeForm } from '../../../forms/presentation/runtime-form/runtime-form';
import { parseDocument } from '../../domain/authoring';
import {
  addPrimitive,
  authoredNode,
  outline,
  palette,
  reorderAuthored,
  replaceAuthored,
} from '../../domain/form-authoring';
import { ActorState } from '../../../../core/auth/actor-state';
import { FormInspector } from '../form-inspector/form-inspector';
import { FormSettings } from '../form-settings/form-settings';
import {
  FormHistory,
  removePlacement,
  renderOf,
} from '../../domain/form-editing';
import { FormBuilderCommands } from './form-builder-commands';
@Component({
  host: { class: 'console-page' },
  selector: 'app-form-builder',
  providers: [
    {
      provide: RUNTIME_OPTIONS,
      useFactory: (): RuntimeOptionsPort => {
        const editor = inject(FormBuilder);
        return {
          query: (_document, pointer, input, generation, abortSignal) =>
            editor.api.options(
              editor.documents(),
              pointer,
              input,
              generation,
              abortSignal,
            ),
        };
      },
    },
  ],
  imports: [
    FormInspector,
    FormSettings,
    SelectControl,
    ButtonDirective,
    FormsModule,
    RouterLink,
    RuntimeForm,
    LocalizePipe,
  ],
  templateUrl: './form-builder.html',
  styleUrl: './form-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilder extends FormBuilderCommands {
  constructor() {
    super();
    this.initialize();
    const release = inject(ActorState).register(() => {
      this.history.clear();
      this.paletteSearch.set('');
      this.paletteCategory.set('');
      this.componentLabel = '';
      this.propertyName = 'field';
      this.primitive = 'text';
      this.purpose = 'edit';
      this.locale = 'en';
      this.error.set('');
    });
    inject(DestroyRef).onDestroy(release);
  }
  private readonly history = new FormHistory();
  readonly JSON = JSON;
  readonly palette = palette;
  readonly paletteSearch = signal('');
  componentLabel = '';
  protected override resetEditorHistory(): void {
    this.history.clear();
  }
  private readonly translation = inject(Locale);
  readonly componentLabels = componentLabels;
  readonly categories = [
    'Layouts',
    'Fields',
    'Collections and files',
    'Display and behavior',
  ];
  readonly paletteCategory = signal('');
  readonly filteredPalette = computed(() => {
    const search = this.paletteSearch().trim().toLowerCase();
    return palette.filter(
      (kind) =>
        (!this.paletteCategory() ||
          componentCategory(kind) === this.paletteCategory()) &&
        (
          kind +
          ' ' +
          componentLabels[kind] +
          ' ' +
          this.translation.text(componentLabels[kind])
        )
          .toLowerCase()
          .includes(search),
    );
  });
  private dragPath: readonly number[] | null = null;
  drag(event: DragEvent, path: readonly number[]): void {
    if (this.readonly() || this.pending().length) {
      event.preventDefault();
      return;
    }
    this.dragPath = [...path];
    event.dataTransfer?.setData('application/x-form-placement', 'same-parent');
  }
  drop(event: DragEvent, target: readonly number[]): void {
    event.preventDefault();
    const path = this.dragPath;
    this.dragPath = null;
    if (
      !path ||
      !path.length ||
      path.slice(0, -1).join('.') !== target.slice(0, -1).join('.')
    ) {
      return;
    }
    this.selected.set(path);
    this.move(target.at(-1)! - path.at(-1)!);
  }
  applyProperties(documents: JsonObject, panel = 'inspector'): void {
    this.editDocument(() => documents, panel);
  }
  undo(redo = false): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const next = this.history.take(
      { documents: this.documents(), selection: this.selected() },
      redo,
    );
    if (next) {
      this.documents.set(next.documents);
      this.selected.set(next.selection);
      this.refreshBuffers();
      this.dirty.set(true);
      this.preview.set(null);
    }
  }
  private refreshBuffers(): void {
    this.schemaJson = JSON.stringify(this.documents()['data_schema'], null, 2);
    this.selectedJson = JSON.stringify(
      authoredNode(renderOf(this.documents()), this.selected()),
      null,
      2,
    );
  }
  async removePlacement(): Promise<void> {
    if (this.readonly() || !this.selected().length || this.pending().length) {
      return;
    }
    const documents = this.documents();
    const path = this.selected();
    const generation = this.generation;
    if (
      await this.feedback.confirm(
        'Remove this placement? Canonical fields and bindings are retained.',
      )
    ) {
      if (generation !== this.generation || this.documents() !== documents) {
        return;
      }
      this.editDocument(() => removePlacement(documents, path));
      this.select(path.slice(0, -1));
    }
  }

  select(path: readonly number[]): void {
    if (
      this.pending().some((key) =>
        ['node', 'inspector', 'settings-ui'].includes(key),
      )
    ) {
      this.error.set(
        'Apply or reload component edits before selecting another component',
      );
      return;
    }
    this.selected.set(path);
    this.selectedJson = JSON.stringify(
      authoredNode(this.documents()['render_schema'] as JsonObject, path),
      null,
      2,
    );
  }
  add(): void {
    this.editDocument(() => {
      const next = addPrimitive(
        this.documents(),
        this.selected(),
        this.primitive,
        this.propertyName,
      );
      const parent = authoredNode(renderOf(next), this.selected());
      const child = (parent['children'] as JsonObject[]).at(-1)!;
      if (this.componentLabel.trim()) {
        (
          child as Record<
            string,
            import('../../../forms/domain/runtime-document').JsonValue
          >
        )['label'] = this.componentLabel;
      }
      return next;
    });
  }
  move(offset: number): void {
    if (this.readonly() || this.pending().length || !this.selected().length) {
      return;
    }
    const parent = authoredNode(
      renderOf(this.documents()),
      this.selected().slice(0, -1),
    );
    const target = this.selected().at(-1)! + offset;
    if (target < 0 || target >= (parent['children'] as JsonObject[]).length) {
      return;
    }
    this.editDocument(() => ({
      ...this.documents(),
      render_schema: reorderAuthored(
        this.documents()['render_schema'] as JsonObject,
        this.selected(),
        offset,
      ),
    }));
    const path = [...this.selected()];
    if (path.length) {
      path[path.length - 1] = Math.max(0, path[path.length - 1] + offset);
    }
    try {
      this.select(path);
    } catch {
      this.select([]);
    }
  }
  applyNode(): void {
    this.editDocument(
      () => ({
        ...this.documents(),
        render_schema: replaceAuthored(
          this.documents()['render_schema'] as JsonObject,
          this.selected(),
          parseDocument(this.selectedJson),
        ),
      }),
      'node',
    );
  }
  applySchema(): void {
    this.editDocument(
      () => ({
        ...this.documents(),
        data_schema: parseDocument(this.schemaJson),
      }),
      'schema',
    );
    this.diagnostics.set(
      'Schema changed. Validate affected bindings before saving.',
    );
  }
  applyBehavior(): void {
    this.editDocument(
      () => ({
        ...this.documents(),
        ...parseDocument(this.behaviorJson),
      }),
      'settings',
    );
  }
  private editDocument(change: () => JsonObject, applied?: string): void {
    if (this.pending().some((key) => key !== applied)) {
      this.error.set('Apply pending JSON editors first');
      return;
    }
    if (this.readonly()) {
      return;
    }
    try {
      const next = change();
      outline(next['render_schema'] as JsonObject);
      this.history.record({
        documents: this.documents(),
        selection: this.selected(),
      });
      this.documents.set(next);
      try {
        authoredNode(renderOf(next), this.selected());
      } catch {
        this.selected.set(this.selected().slice(0, -1));
      }
      this.refreshBuffers();
      this.pending.update((keys) => keys.filter((key) => key !== applied));
      this.dirty.set(true);
      this.preview.set(null);
      this.error.set('');
      this.schemaJson = JSON.stringify(next['data_schema'], null, 2);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid layout');
    }
  }
}
