import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
import { FormBuilderCommands } from './form-builder-commands';
@Component({
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
  imports: [FormsModule, RouterLink, RuntimeForm, LocalizePipe],
  templateUrl: './form-builder.html',
  styleUrl: './form-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilder extends FormBuilderCommands {
  constructor() {
    super();
    this.initialize();
  }
  readonly palette = palette;
  select(path: readonly number[]): void {
    if (this.pending().includes('node')) {
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
    this.editDocument(() =>
      addPrimitive(
        this.documents(),
        this.selected(),
        this.primitive,
        this.propertyName,
      ),
    );
  }
  move(offset: number): void {
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
      this.documents.set(next);
      this.selectedJson = JSON.stringify(
        authoredNode(next['render_schema'] as JsonObject, this.selected()),
        null,
        2,
      );
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
