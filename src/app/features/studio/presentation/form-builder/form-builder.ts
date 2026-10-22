import { reconcileChoiceAnswers } from '../form-preview-sample';
import { FormPalette } from '../form-palette/form-palette';
import { formPreviewProviders } from '../form-preview-providers';
import { authoredPages } from '../../domain/form-pages';
import { FormRuleOverview } from '../form-rule-overview/form-rule-overview';
import { fieldLabel } from '../../../../shared/domain/field-label';
import { selectionLabel } from '../form-selection-label';
import { formDraftStatus } from '../form-draft-status';
import { FormDiagnostics } from '../form-diagnostics/form-diagnostics';
import { EditorViewport } from '../../../../shared/ui/editor-viewport';
import { TabsModule } from 'primeng/tabs';
import { FormFieldPlacement } from '../form-field-placement/form-field-placement';
import { FormCanvas } from '../form-canvas/form-canvas';
import { addQuickField } from '../../domain/quick-fields';
import { Locale } from '../../../../core/localization/locale';
import { filterFormPalette, paletteCategories } from './form-palette';
import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { FormLivePreview } from '../form-live-preview/form-live-preview';
import {
  addPrimitive,
  authoredNode,
  outline,
  palette,
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
import { FormPlacementControls } from '../form-placement-controls/form-placement-controls';
import {
  duplicateLayout,
  reorderPlacement,
  reparentPlacement,
} from '../../domain/form-placement';
import { FormEditState } from '../../domain/form-editing';
@Component({
  host: { class: 'console-page' },
  hostDirectives: [EditorViewport],
  selector: 'app-form-builder',
  providers: formPreviewProviders(() => inject(FormBuilder)),
  imports: [
    FormPalette,
    FormDiagnostics,
    FormRuleOverview,
    TabsModule,
    FormFieldPlacement,
    FormCanvas,
    FormPlacementControls,
    FormInspector,
    FormSettings,
    ButtonDirective,
    FormsModule,
    RouterLink,
    FormLivePreview,
    LocalizePipe,
  ],
  templateUrl: './form-builder.html',
  styleUrl: './form-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilder extends FormBuilderCommands {
  readonly pageList = computed(() => authoredPages(this.documents()) ?? []);
  readonly settingsBlocked = computed(() =>
    this.pending().some((key) => key !== 'settings-ui'),
  );
  readonly selectedLabel = computed(() => selectionLabel(this));
  readonly draftStatus = computed(() => formDraftStatus(this));
  readonly fieldLabel = fieldLabel;
  constructor() {
    super();
    this.initialize();
    const release = inject(ActorState).register(() => {
      this.history.clear();
      this.cancelDrag();
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
  readonly canUndo = computed(() => {
    this.documents();
    return this.history.canUndo;
  });
  readonly canRedo = computed(() => {
    this.documents();
    return this.history.canRedo;
  });
  readonly palette = palette;
  protected override resetEditorHistory(): void {
    this.history.clear();
    this.cancelDrag();
  }
  private readonly translation = inject(Locale);
  readonly categories = paletteCategories;
  readonly filteredPalette = computed(() => {
    return filterFormPalette(
      this.paletteSearch(),
      this.paletteCategory(),
      (key) => this.translation.text(key),
    );
  });
  private dragKind: (typeof palette)[number] | null = null;
  private dragPath: readonly number[] | null = null;
  private dragDocuments: JsonObject | null = null;
  cancelDrag(): void {
    this.dragging.set(false);
    this.dragPath = null;
    this.dragKind = null;
    this.dragDocuments = null;
  }
  drag(event: DragEvent, path: readonly number[]): void {
    this.cancelDrag();
    if (this.readonly() || this.pending().length) {
      event.preventDefault();
      return;
    }
    this.dragging.set(true);
    this.dragPath = [...path];
    this.dragDocuments = this.documents();
    event.dataTransfer?.setData('application/x-form-placement', 'placement');
  }
  dragPalette(event: DragEvent, kind: (typeof palette)[number]): void {
    this.drag(event, []);
    if (this.dragging()) {
      this.dragKind = kind;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('application/x-form-palette', kind);
      }
    }
  }
  drop(
    event: DragEvent,
    target: readonly number[],
    position: 'before' | 'after' | 'inside' = 'inside',
  ): void {
    event.preventDefault();
    const path = this.dragPath;
    const kind = this.dragKind;
    const documents = this.dragDocuments;
    this.cancelDrag();
    if (documents !== this.documents()) {
      return;
    }
    if (
      !path ||
      (!kind && !path.length) ||
      this.readonly() ||
      this.pending().length
    ) {
      return;
    }
    const destination = position === 'inside' ? target : target.slice(0, -1);
    const index =
      position === 'inside'
        ? undefined
        : target.at(-1)! + (position === 'after' ? 1 : 0);
    this.placementEdit(() => {
      const added = kind
        ? addQuickField(
            this.documents(),
            destination,
            kind,
            this.translation.text(this.componentLabels[kind]),
          )
        : null;
      return reparentPlacement(
        added?.documents ?? this.documents(),
        added?.selection ?? path,
        destination,
        index,
      );
    });
    this.select(this.selected());
    this.requireCalculation();
  }

  reparent(destination: readonly number[]): void {
    this.placementEdit(() =>
      reparentPlacement(this.documents(), this.selected(), destination),
    );
  }
  duplicate(): void {
    this.placementEdit(() =>
      duplicateLayout(this.documents(), this.selected()),
    );
  }
  private placementEdit(change: () => FormEditState): void {
    let selection = this.selected();
    this.editDocument(
      () => {
        const result = change();
        selection = result.selection;
        return result.documents;
      },
      undefined,
      () => selection,
    );
  }
  applyProperties(documents: JsonObject, panel = 'inspector'): void {
    const previous = this.documents();
    this.editDocument(() => documents, panel);
    if (this.documents() === documents) {
      reconcileChoiceAnswers(this, previous);
    }
  }

  undo(redo = false): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const previous = this.documents();
    const next = this.history.take(
      { documents: this.documents(), selection: this.selected() },
      redo,
    );
    if (next) {
      this.documents.set(next.documents);
      this.selected.set(next.selection);
      this.reconcileDirty();
      this.requireCalculation();
      reconcileChoiceAnswers(this, previous);
    }
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

  select(path: readonly number[]): boolean {
    if (
      this.pending().some((key) =>
        ['node', 'inspector', 'settings-ui'].includes(key),
      )
    ) {
      this.error.set(
        'Apply or reload component edits before selecting another component',
      );
      return false;
    }
    const editing = this.workspaceTab() === 'rules' || path.length > 0;
    this.toolsTab.set(editing ? 'properties' : 'components');
    this.toolsOpen.set(editing);
    this.selected.set([...path]);
    return true;
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
  quickAdd(kind: (typeof palette)[number]): void {
    const previous = this.documents();
    this.placementEdit(() =>
      addQuickField(
        this.documents(),
        this.selected(),
        kind,
        this.translation.text(this.componentLabels[kind]),
      ),
    );
    if (this.documents() !== previous) {
      this.select(this.selected());
      this.requireCalculation();
    }
  }
  private requireCalculation(): void {
    const node = authoredNode(renderOf(this.documents()), this.selected());
    if (node['component'] === 'calculated' && !node['calculation']) {
      this.markPending('inspector');
    }
  }
  readonly calculationPending = computed(() => {
    const node = authoredNode(renderOf(this.documents()), this.selected());
    return (
      this.pending().includes('inspector') &&
      node['component'] === 'calculated' &&
      !node['calculation']
    );
  });
  cancelCalculation(): void {
    if (this.calculationPending()) {
      this.pending.update((keys) => keys.filter((key) => key !== 'inspector'));
      this.undo();
    }
  }
  move(offset: number): void {
    if (this.readonly() || this.pending().length || !this.selected().length) {
      return;
    }
    const next = reorderPlacement(this.documents(), this.selected(), offset);
    if (next) {
      this.editDocument(
        () => next.documents,
        undefined,
        () => next.selection,
      );
      this.select(next.selection);
    }
  }

  discardSettings(): void {
    this.pending.update((keys) => keys.filter((key) => key !== 'settings-ui'));
    this.reconcileDirty();
  }
  private editDocument(
    change: () => JsonObject,
    applied?: string,
    selection?: () => readonly number[],
  ): void {
    if (this.pending().some((key) => key !== applied)) {
      this.error.set('Apply pending field edits first');
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
      if (selection) {
        this.selected.set([...selection()]);
      }
      try {
        authoredNode(renderOf(next), this.selected());
      } catch {
        this.selected.set(this.selected().slice(0, -1));
      }
      this.pending.update((keys) => keys.filter((key) => key !== applied));
      this.reconcileDirty();
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid layout');
    }
  }
}
