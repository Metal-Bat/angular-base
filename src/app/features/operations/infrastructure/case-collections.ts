import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiClient } from '../../../core/transport/api-client';
import { mutationReference } from './workspace-decoders';
import { readData } from '../../../core/transport/response-adapters';
import { MISSING } from '../../forms/domain/canonical-values';
import {
  fieldSchema,
  indicesFromPath,
  keysAt,
  rowValue,
} from '../../forms/domain/row-values';
import { JsonObject } from '../../forms/domain/runtime-document';
import { EditorPort } from '../application/workspace-ports';
export class CaseCollections {
  protected readonly api = inject(ApiClient);
  protected readonly actor = inject(ActorState);
  constructor(protected readonly editor: EditorPort) {}
  protected get task(): boolean {
    return this.editor.caseKind() === 'task';
  }
  protected get reference(): string {
    return this.editor.item()?.ref ?? '';
  }
  protected referenceFrom(value: unknown): string {
    return mutationReference(value);
  }
  protected async flush(): Promise<boolean> {
    return !this.editor.dirty() || (await this.editor.save());
  }
  async collection(
    scope: string,
    path: string,
    operation: 'add' | 'remove' | 'reorder' | 'duplicate',
    key?: string,
    index?: number,
  ): Promise<void> {
    if (!this.editor.canEdit()) {
      return;
    }
    const indices = indicesFromPath(scope, path);
    if (rowValue(this.editor.data(), scope, indices) === MISSING) {
      this.editor.edit({
        scope,
        value: [],
        indices,
        rowKeys: keysAt(this.editor.document()!, scope, indices),
      });
    }
    if (!(await this.flush())) {
      return;
    }
    const schema = fieldSchema(this.editor.document()!, scope)['items'];
    const itemValue =
      (schema as JsonObject | undefined)?.['type'] === 'string' ? '' : {};
    await this.editor.command(
      {
        path,
        operation,
        item_key: key ?? null,
        target_index: index ?? null,
        value: itemValue,
      },
      async (reference, body) => {
        const response = this.task
          ? await firstValueFrom(
              this.api.call(
                'edit_work_item_collection_api_v1_work_items__ref_id__collections_edit_post',
                { path: { ref_id: reference }, body },
              ),
            )
          : await firstValueFrom(
              this.api.call(
                'edit_request_collection_api_v1_business_requests__ref_id__collections_edit_post',
                { path: { ref_id: reference }, body },
              ),
            );
        return readData(response, (value) => this.referenceFrom(value));
      },
    );
  }
}
