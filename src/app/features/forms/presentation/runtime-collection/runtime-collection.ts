import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { RuntimeNode } from '../runtime-node/runtime-node';
import type { RenderNode } from '../../domain/runtime-document';
import { RuntimeCollectionActions } from '../runtime-collection-actions/runtime-collection-actions';
export type CollectionView = Pick<
  RuntimeNode,
  | 'accessibleLabel'
  | 'description'
  | 'validRows'
  | 'node'
  | 'tableRows'
  | 'writable'
  | 'childVisible'
  | 'childLabel'
  | 'rowKeys'
  | 'rows'
  | 'canAddRow'
  | 'canRemoveRow'
  | 'rowCommand'
  | 'collectionBusy'
  | 'collections'
  | 'locale'
>;
@Component({
  selector: 'app-runtime-collection',
  imports: [
    NgTemplateOutlet,
    TableModule,
    ButtonDirective,
    LocalizePipe,
    RuntimeCollectionActions,
  ],
  templateUrl: './runtime-collection.html',
  styleUrl: './runtime-collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuntimeCollection {
  readonly view = input.required<CollectionView>();
  readonly childTemplate =
    input.required<
      TemplateRef<{ $implicit: RenderNode; index: number; childIndex: number }>
    >();
}
