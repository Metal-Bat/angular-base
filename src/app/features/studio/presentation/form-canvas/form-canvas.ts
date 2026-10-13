import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { authoredNode, outline, palette } from '../../domain/form-authoring';
import { fieldRequired, renderOf, schemaAt } from '../../domain/form-editing';
import { componentLabels } from '../form-builder/form-palette';

@Component({
  selector: 'app-form-canvas',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './form-canvas.html',
  styleUrl: './form-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCanvas {
  readonly disabled = input(false);
  readonly dragStarted = output<{
    event: DragEvent;
    path: readonly number[];
  }>();
  readonly dragEnded = output<void>();
  readonly dropRequested = output<{
    event: DragEvent;
    target: readonly number[];
    position: 'before' | 'after' | 'inside';
  }>();
  dragOver(event: DragEvent): void {
    if (
      !this.disabled() &&
      event.dataTransfer?.types.includes('application/x-form-placement')
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }
  drop(
    event: DragEvent,
    target: readonly number[],
    position: 'before' | 'after' | 'inside',
  ): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dropRequested.emit({ event, target, position });
  }
  readonly addRequested = output<(typeof palette)[number]>();
  readonly quickTypes = [
    'text',
    'textarea',
    'choice',
    'boolean',
    'integer',
    'date',
  ] as const;
  readonly componentLabels = componentLabels;
  readonly documents = input.required<JsonObject>();
  readonly selected = input.required<readonly number[]>();
  readonly selectedChange = output<readonly number[]>();
  readonly cards = computed(() => {
    const documents = this.documents();
    const render = renderOf(documents);
    return outline(render)
      .filter((item) => item.path.length)
      .map((item) => {
        const node = authoredNode(render, item.path);
        const kind = String(node['component']);
        return {
          ...item,
          icon:
            (
              {
                boolean: 'pi pi-stop',
                choice: 'pi pi-circle',
                date: 'pi pi-calendar',
                datetime: 'pi pi-calendar',
                vertical: 'pi pi-bars',
                horizontal: 'pi pi-objects-column',
                grid: 'pi pi-th-large',
                table: 'pi pi-table',
                attachment_collection: 'pi pi-paperclip',
                media: 'pi pi-image',
              } as Record<string, string>
            )[kind] ?? 'pi pi-pencil',

          container: [
            'vertical',
            'horizontal',
            'grid',
            'repeater',
            'table',
          ].includes(kind),
          empty: !Array.isArray(node['children']) || !node['children'].length,
          kind,
          type: componentLabels[kind] ?? kind,
          active: item.path.join('.') === this.selected().join('.'),
          ...this.fieldFlags(documents, item.scope),
        };
      });
  });
  private fieldFlags(
    documents: JsonObject,
    scope: string | null,
  ): { required: boolean; invalidBinding: boolean } {
    try {
      if (scope) {
        schemaAt(documents, scope);
      }
      return {
        required: scope ? fieldRequired(documents, scope) : false,
        invalidBinding: false,
      };
    } catch {
      return { required: false, invalidBinding: true };
    }
  }
}
