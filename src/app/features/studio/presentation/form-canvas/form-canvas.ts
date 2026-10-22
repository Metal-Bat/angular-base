import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';
import { Locale } from '../../../../core/localization/locale';
import { canDuplicateLayout } from '../../domain/form-placement';
import { FormsModule } from '@angular/forms';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { authoredPages } from '../../domain/form-pages';
import { pageIncludesScope } from '../../../forms/domain/form-pages';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { NgTemplateOutlet } from '@angular/common';
import { layoutColumns } from '../../../forms/domain/layout-columns';
import { gridPlacement } from '../../../forms/domain/grid-placement';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FormDesignControl } from '../form-design-control/form-design-control';
import { placementLabel } from '../form-selection-label';
import { nodeDescription } from '../../../forms/domain/node-description';
import { RenderNode } from '../../../forms/domain/runtime-document';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { authoredNode, outline } from '../../domain/form-authoring';
import { fieldRequired, renderOf, schemaAt } from '../../domain/form-editing';
import { componentLabels } from '../form-builder/form-palette';

@Component({
  selector: 'app-form-canvas',
  imports: [
    ButtonDirective,
    LocalizePipe,
    FormDesignControl,
    NgTemplateOutlet,
    FormsModule,
    SelectControl,
    MenuModule,
  ],
  templateUrl: './form-canvas.html',
  styleUrl: './form-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCanvas {
  readonly disabled = input(false);
  readonly duplicateRequested = output<readonly number[]>();
  readonly removeRequested = output<readonly number[]>();
  readonly moveToRequested = output<readonly number[]>();
  private readonly locale = inject(Locale);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly context = input(0);
  readonly pages = computed(() => authoredPages(this.documents()) ?? []);
  readonly pageKey = linkedSignal({
    source: () => ({
      context: this.context(),
      pages: this.pages(),
      selected: this.selected(),
    }),
    computation: (source, previous) => {
      const page = source.pages.find(
        (candidate) => candidate.key === previous?.value,
      );
      if (!previous || source.context !== previous.source.context || !page) {
        return '';
      }
      if (
        source.selected !== previous.source.selected &&
        source.selected.length
      ) {
        try {
          const scope = authoredNode(
            renderOf(this.documents()),
            source.selected,
          )['scope'];
          if (
            typeof scope === 'string' &&
            !pageIncludesScope(scope, page.scopes)
          ) {
            return '';
          }
        } catch {
          return '';
        }
      }
      return page.key;
    },
  });
  readonly currentPage = computed(() =>
    this.pages().find((page) => page.key === this.pageKey()),
  );
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
      event.dataTransfer.dropEffect = event.dataTransfer.types.includes(
        'application/x-form-palette',
      )
        ? 'copy'
        : 'move';
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
  readonly componentLabels = componentLabels;
  readonly documents = input.required<JsonObject>();
  readonly resolvedRender = input<RenderNode | null>(null);
  readonly dragging = input(false);
  readonly selected = input.required<readonly number[]>();
  readonly selectedChange = output<readonly number[]>();
  readonly cards = computed(() => {
    const documents = this.documents();
    this.locale.language();
    const render = renderOf(documents);
    const resolved = new Map<string, RenderNode>();
    const visit = (node: RenderNode): void => {
      if (node.key) {
        resolved.set(node.key, node);
      }
      for (const child of node.children) {
        visit(child);
      }
    };
    if (this.resolvedRender()) {
      visit(this.resolvedRender()!);
    }
    return outline(render)
      .filter((item) => item.path.length)
      .map((item) => {
        const node = authoredNode(render, item.path);
        const parent = authoredNode(render, item.path.slice(0, -1));
        const placement =
          parent['component'] === 'grid'
            ? gridPlacement({ display: node }, this.columns(parent))
            : { column: 'auto', row: 'auto' };
        const kind = String(node['component']);
        return {
          ...item,
          menu: this.placementMenu(documents, item.path),
          columns: this.columns(node),
          placement,
          label: placementLabel(node, resolved.get(item.identity)),
          help: resolved.has(item.identity)
            ? nodeDescription(resolved.get(item.identity)!)
            : '',
          presentation: { ...node, ...resolved.get(item.identity)?.display },
          childLabels: (Array.isArray(node['children'])
            ? (node['children'] as JsonObject[])
            : []
          ).map(
            (child) =>
              resolved.get(String(child['node_key']))?.label ||
              String(
                child['label'] ??
                  componentLabels[String(child['component'])] ??
                  '',
              ),
          ),
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
  private openMove(path: readonly number[]): void {
    const documents = this.documents();
    this.moveToRequested.emit(path);
    afterNextRender(
      () => {
        if (documents !== this.documents()) {
          return;
        }
        const target = this.host.nativeElement
          .closest('app-form-builder')
          ?.querySelector<HTMLElement>('#placement-destination');
        if (target?.getClientRects().length) {
          target.focus({ preventScroll: true });
          target.scrollIntoView?.({ block: 'nearest' });
        }
      },
      { injector: this.injector },
    );
  }
  private placementMenu(
    documents: JsonObject,
    path: readonly number[],
  ): MenuItem[] {
    const command =
      (emit: () => void): (() => void) =>
      () => {
        if (!this.disabled() && this.documents() === documents) {
          emit();
        }
      };
    return [
      {
        label: this.locale.text('Edit properties'),
        command: command(() => this.selectedChange.emit(path)),
      },
      {
        label: this.locale.text('Move to layout'),
        command: command(() => this.openMove(path)),
      },
      ...(canDuplicateLayout(documents, path)
        ? [
            {
              label: this.locale.text('Duplicate layout placement'),
              command: command(() => this.duplicateRequested.emit(path)),
            },
          ]
        : []),
      {
        label: this.locale.text('Remove placement'),
        command: command(() => this.removeRequested.emit(path)),
      },
    ];
  }
  children(path: readonly number[]): ReturnType<typeof this.cards> {
    return this.cards().filter(
      (card) =>
        (!this.currentPage() ||
          !card.scope ||
          pageIncludesScope(card.scope, this.currentPage()!.scopes)) &&
        card.path.length === path.length + 1 &&
        path.every((index, depth) => card.path[depth] === index),
    );
  }
  columns(node: JsonObject): number {
    return layoutColumns({
      component: node['component'] as RenderNode['component'],
      display: node,
    });
  }
  rootColumns(): number {
    return this.columns(authoredNode(renderOf(this.documents()), []));
  }
  private fieldFlags(
    documents: JsonObject,
    scope: string | null,
  ): { required: boolean; invalidBinding: boolean; schema: JsonObject } {
    try {
      const schema = scope ? schemaAt(documents, scope) : {};
      return {
        schema,
        required: scope ? fieldRequired(documents, scope) : false,
        invalidBinding: false,
      };
    } catch {
      return { required: false, invalidBinding: true, schema: {} };
    }
  }
}
